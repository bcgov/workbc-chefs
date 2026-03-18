const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Statuses, SubscriptionEvent } = require('../common/constants');
const { Form, FormVersion, FormSubmission, FormSubmissionStatus, Note, SubmissionAudit, SubmissionMetadata, FormSubscription, FileStorage } = require('../common/models');
const log = require('../../components/log')(module.filename);
const emailService = require('../email/emailService');
const formService = require('../form/service');
const permissionService = require('../permission/service');
const cfmsService = require('../../components/cfmsService');
const FormSubmissionCFMSLookup = require('../common/models/tables/formSubmissionCFMSLookup');
const FileStorageCFMSLookup = require('../common/models/tables/fileStorageCFMSLookup');

const service = {
  // -------------------------------------------------------------------------------------------------------
  // Submissions
  // -------------------------------------------------------------------------------------------------------
  _fetchSubmissionData: async (formSubmissionId) => {
    const meta = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first().throwIfNotFound();

    return await Promise.all([
      FormSubmission.query().findById(meta.submissionId).throwIfNotFound(),
      FormVersion.query().findById(meta.formVersionId).throwIfNotFound(),
      Form.query().findById(meta.formId).allowGraph('identityProviders').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound(),
    ]).then((data) => {
      return {
        submission: data[0],
        version: data[1],
        form: data[2],
      };
    });
  },

  // -------------------------------------------------------------------------------------------------------
  // Submissions
  // -------------------------------------------------------------------------------------------------------
  _fetchSpecificSubmissionData: async (formSubmissionIds) => {
    const meta = await SubmissionMetadata.query().whereIn('submissionId', formSubmissionIds);

    if (meta.length > 0) {
      let submissionIds = meta.map((SubmissionMetadata) => SubmissionMetadata.submissionId);
      let formVersionId = [...new Set(meta.map((SubmissionMetadata) => SubmissionMetadata.formVersionId))].at(0);
      let formId = [...new Set(meta.map((SubmissionMetadata) => SubmissionMetadata.formId))].at(0);
      return await Promise.all([
        FormSubmission.query().findByIds(submissionIds).throwIfNotFound(),
        FormVersion.query().findByIds(formVersionId).throwIfNotFound(),
        Form.query().findByIds(formId).allowGraph('identityProviders').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound(),
      ]).then((data) => {
        return {
          submission: data[0],
          version: data[1],
          form: data[2],
        };
      });
    }
    return [];
  },

  read: (formSubmissionId) => service._fetchSubmissionData(formSubmissionId),

  readSubmissionData: (formSubmissionIds) => service._fetchSpecificSubmissionData(formSubmissionIds),

  // Get the current subscription settings for a form
  readFormSubscriptionDetails: (formId) => {
    return FormSubscription.query().modify('filterFormId', formId).first();
  },

  postSubscriptionEvent: async (subscribe, formVersion, submissionId, subscriptionEvent) => {
    try {
      // Check if there are endpoints subscribed for form submission event
      if (subscribe && subscribe.endpointUrl) {
        const axiosOptions = { timeout: 10000 };
        const axiosInstance = axios.create(axiosOptions);
        const jsonData = { formId: formVersion.formId, formVersion: formVersion.id, submissionId: submissionId, subscriptionEvent: subscriptionEvent };

        axiosInstance.interceptors.request.use(
          (cfg) => {
            cfg.headers = { [subscribe.key]: `${subscribe.endpointToken}` };
            return Promise.resolve(cfg);
          },
          (error) => {
            return Promise.reject(error);
          }
        );

        axiosInstance.post(subscribe.endpointUrl, jsonData);

        throw new Problem(401, jsonData);
      }
    } catch (err) {
      log.error(err.message, err, {
        function: 'postSubscriptionEvent',
      });
    }
  },

  update: async (formSubmissionId, data, currentUser, referrer, etrx = undefined) => {
    let trx;
    try {
      const formObj = await service.read(formSubmissionId);
      const { subscribe } = formObj.form;
      trx = etrx ? etrx : await FormSubmission.startTransaction();

      // If we're restoring a submission
      if (data['deleted'] !== undefined && typeof data.deleted == 'boolean') {
        await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { deleted: data.deleted, updatedBy: currentUser.usernameIdp });
      } else {
        const statuses = await FormSubmissionStatus.query().modify('filterSubmissionId', formSubmissionId).modify('orderDescending');
        if (!data.draft) {
          // Write a SUBMITTED status only if this is in REVISING state OR is a brand new submission
          if (!statuses || !statuses.length || statuses[0].code === Statuses.REVISING) {
            await service.changeStatusState(formSubmissionId, { code: Statuses.SUBMITTED }, currentUser, trx);
            // If finalizing submission, send the submission email (quiet fail if anything goes wrong)
            const submissionMetaData = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first();
            emailService.submissionReceived(submissionMetaData.formId, formSubmissionId, data, referrer).catch(() => {});
          }
        } else {
          if (statuses && statuses.length > 0 && (statuses[0].code === Statuses.SUBMITTED || statuses[0].code === Statuses.COMPLETED)) {
            return false;
          }
        }

        // Patch the submission record with the updated changes
        await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
          draft: data.draft,
          submission: data.submission,
          updatedBy: currentUser.usernameIdp,
        });
      }
      const formVersionId = formObj.version.id;
      const formVersion = await service.readVersion(formVersionId);
      const fileIds = service._findFileIds(formVersion.schema, data);
      for (const fileId of fileIds) {
        await FileStorage.query(trx).patchAndFetchById(fileId, { formSubmissionId: formSubmissionId, updatedBy: currentUser.usernameIdp });
      }

      if (!etrx) await trx.commit();

      //console.log('DATA: ', formObj);

      console.log('Form Version ID: ', formVersionId);
      // //TODO: version ID check
      // //if (formVersionId === '6a37475c-356f-4a75-8416-5a830da0506f') { // Quick CEP
      // if (formVersionId === '50c52528-356f-4384-b3fe-21f122c0bfe4') {
      // CEP
      if (formVersionId === 'ac6f9fe0-51b0-41fb-8ed7-5b78dec4eece') {
        // TODO: use .env
        console.log('===== CFMS Logic =====');
        const getRandomInt = (min, max) => {
          min = Math.ceil(min);
          max = Math.floor(max);
          return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        const cfmsId = getRandomInt(90000000, 100000000); // TODO: confirm ranges/stategy with Christine
        const xml = await cfmsService.prepareSubmission(cfmsId, currentUser, data.submission.data);
        const createdBy = currentUser.usernameIdp;
        try {
          const newCFMSLookup = {
            id: uuidv4(),
            formSubmissionId: formSubmissionId,
            cfmsId: cfmsId,
            createdBy: createdBy,
          };
          await FormSubmissionCFMSLookup.query().insert(newCFMSLookup, 'formSubmissionId');
          const attachments = await FileStorage.query().where('formSubmissionId', formSubmissionId).throwIfNotFound();
          attachments.forEach(async (a) => {
            const newCFMSFileLookup = {
              id: uuidv4(),
              fileId: a.id,
              cfmsFileId: getRandomInt(10000000, 100000000),
              createdBy: createdBy,
            };
            await FileStorageCFMSLookup.query().insert(newCFMSFileLookup, 'fileId');
          });
          const { response } = await cfmsService.submitApplication(xml);
          const { statusCode } = response;
          console.log('CFMS Response Status Code: ', statusCode);
          console.log('CFMS Response: ', response);
        } catch (err) {
          console.log('CFMS Error: ', err);
        }
        console.log('===== End CFMS Logic =====');
      }

      if (subscribe && subscribe.enabled) {
        const subscribeConfig = await service.readFormSubscriptionDetails(formObj.form?.id);
        const config = Object.assign({}, subscribe, subscribeConfig);
        const formVersion = formObj.version;
        service.postSubscriptionEvent(config, formVersion, formSubmissionId, SubscriptionEvent.FORM_SUBMITTED);
      }

      return service.read(formSubmissionId);
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function setDraftState
   * Changes the draft state of this submission
   * @param {string} submissionId The submission id
   * @param {boolean} draft Mark submission id as a draft or not
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns The new form submission object
   * @throws The error encountered upon db transaction failure
   */
  setDraftState: async (submissionId, draft, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmission.startTransaction();

      const result = await FormSubmission.query(trx).patchAndFetchById(submissionId, {
        draft: draft,
        updatedBy: currentUser.usernameIdp,
      });

      if (!etrx) await trx.commit();
      return result;
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  delete: async (formSubmissionId, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
        deleted: true,
        updatedBy: currentUser.usernameIdp,
      });
      await trx.commit();
      return await service.read(formSubmissionId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  deleteMutipleSubmissions: async (submissionIds, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patch({ deleted: true, updatedBy: currentUser.usernameIdp }).whereIn('id', submissionIds);
      await trx.commit();
      return await service.readSubmissionData(submissionIds);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  restoreMutipleSubmissions: async (submissionIds, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx)
        .patch({
          deleted: false,
          updatedBy: currentUser.usernameIdp,
        })
        .whereIn('id', submissionIds);
      await trx.commit();
      return await service.readSubmissionData(submissionIds);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  restore: async (formSubmissionId, data, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
        deleted: data.deleted,
        updatedBy: currentUser.usernameIdp,
      });
      await trx.commit();
      return await service.read(formSubmissionId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readOptions: async (formSubmissionId) => {
    const meta = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first().throwIfNotFound();

    const form = await formService.readFormOptions(meta.formId);

    return {
      submission: {
        id: meta.submissionId,
        formVersionId: meta.formId,
      },
      version: {
        id: meta.formVersionId,
        formId: meta.formId,
      },
      form: form,
    };
  },

  /** get the audit history metadata (nothing that edited a draft for now) */
  listEdits: (submissionId) => {
    return SubmissionAudit.query()
      .select('id', 'updatedByUsername', 'actionTimestamp', 'action')
      .modify('filterSubmissionId', submissionId)
      .modify('filterDraft', false)
      .modify('orderDefault');
  },
  // --------------------------------------------------------------------------------------------/Submissions

  // -------------------------------------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------------------------------------
  _createNote: async (submissionId, data, currentUser) => {
    let trx;
    try {
      trx = await Note.startTransaction();
      const result = await Note.query(trx).insertAndFetch({
        id: uuidv4(),
        submissionId: submissionId,
        submissionStatusId: data.submissionStatusId,
        note: data.note,
        userId: data.userId,
        createdBy: currentUser.usernameIdp,
      });
      await trx.commit();

      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /** Add a note for a specific submission */
  addNote: (formSubmissionId, data, currentUser) => {
    return service._createNote(formSubmissionId, data, currentUser);
  },

  /** Get notes for a specific submission */
  getNotes: (formSubmissionId) => {
    return Note.query().modify('filterSubmissionId', formSubmissionId).modify('orderDefault');
  },

  /** Get a specific note */
  getNote: (noteId) => {
    return Note.query().modify('filterId', noteId);
  },
  // -------------------------------------------------------------------------------------------------/Notes

  // -------------------------------------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------------------------------------
  /**
   * @function getStatus
   * Get status history for a specific submission
   * @param {string} The submission id
   * @returns The current status object
   */
  getStatus: (formSubmissionId) => {
    return FormSubmissionStatus.query().modify('filterSubmissionId', formSubmissionId).withGraphFetched('user').modify('orderDescending');
  },

  /**
   * @function changeStatusState
   * Changes the status state of this submission. This method serves as the 'state machine' for submission permissions.
   * @param {string} submissionId The submission id
   * @param {object} data The data to persist
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns The new current status object
   * @throws The error encountered upon db transaction failure
   */
  changeStatusState: async (submissionId, data, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmissionStatus.startTransaction();

      // Create a new status entry
      await service.createStatus(submissionId, data, currentUser, trx);

      // Determine draft flag state on submission - true if revising, false otherwise
      const draft = data.code === Statuses.REVISING;
      const formSubmission = await FormSubmission.query(trx).findById(submissionId);

      // Only change draft state and permissions if draft state is getting toggled
      if (formSubmission.draft !== draft) {
        await service.setDraftState(submissionId, draft, currentUser, trx);

        if (draft) {
          // Allow submitter users to edit the draft again if Revising status
          await permissionService.setUserEditable(submissionId, currentUser, trx);
        } else {
          // Prevent submitter users from editing the submission
          await permissionService.setUserReadOnly(submissionId, trx);
        }
      }

      if (!etrx) await trx.commit();
      return service.getStatus(submissionId);
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function createStatus
   * Adds a status history for a specific submission
   * @param {string} submissionId The submission id
   * @param {object} data The data to persist
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns The current status object
   * @throws The error encountered upon db transaction failure
   */
  createStatus: async (submissionId, data, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmissionStatus.startTransaction();

      await FormSubmissionStatus.query(trx).insert({
        id: uuidv4(),
        submissionId: submissionId,
        code: data.code,
        assignedToUserId: data.assignedToUserId,
        actionDate: data.actionDate,
        createdBy: currentUser.usernameIdp,
      });

      if (!etrx) await trx.commit();
      return service.getStatus(submissionId);
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },
  // -------------------------------------------------------------------------------------------------/Notes
};

module.exports = service;
