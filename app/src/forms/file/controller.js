const service = require('./service');
const storageService = require('./storage/storageService');
const json2html = require('json2html');
const { encodeURI } = require('../common/utils');
const submissionService = require('../submission/service');
const { FileStorage } = require('../common/models');
const FormSubmissionCFMSLookup = require('../common/models/tables/formSubmissionCFMSLookup');
const moment = require('moment');

const _trim = (r) => {
  if (r) {
    // don't want storage information going over the wire...
    return {
      id: r.id,
      originalName: r.originalName,
      size: r.size,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
    };
  }
  return r;
};

module.exports = {
  create: async (req, res, next) => {
    try {
      const response = await service.create(req.file, req.currentUser);
      res.status(201).json(_trim(response));
    } catch (error) {
      next(error);
    }
  },
  read: async (req, res, next) => {
    try {
      // Permissions checked on this at the route level with middleware
      // On the request from the middleware
      const fileStorage = req.currentFileRecord;

      // ok, let's go get the binary...
      const stream = await storageService.read(fileStorage);

      stream.on('error', function error(err) {
        throw err;
      });

      res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(fileStorage.originalName)}`);
      res.set('Content-Type', fileStorage.mimeType);
      res.set('Content-Length', fileStorage.size);
      res.set('Last-Modified', fileStorage.updatedAt);

      // and stream it out...
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      // Permissions checked on this at the route level with middleware
      // ok, let's remove the file...
      await service.delete(req.params.id);
      res.sendStatus(202);
    } catch (error) {
      next(error);
    }
  },

  getAttachmentsList: async (req, res, next) => {
    try {
      const lookup = await FormSubmissionCFMSLookup.query().where('cfmsId', req.params.cfmsId).select('formSubmissionId').throwIfNotFound();
      const submissionId = lookup[0].formSubmissionId;
      const attachments = await FileStorage.query().where('formSubmissionId', submissionId).throwIfNotFound();
      const response = attachments.map((a) => {
        return {
          TAAPAT_ID: a.id,
          FILE_NAME: a.originalName,
          MIME_TYPE_CD: a.mimeType,
          ATTACH_SIZE_NUM: a.size,
          QUESTION_NAM: 'CATBudget', //TODO
          FILE_EXT_NAM: '.pdf', //TODO
        };
      });
      res.status(200).send(response);
    } catch (error) {
      next(error);
    }
  },

  getAttachmentAsBlob: async (req, res, next) => {
    try {
      const fileStorage = req.currentFileRecord;
      const stream = await storageService.read(fileStorage);

      // Helper function to convert a stream to a buffer
      const streamToBuffer = async (stream) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => {
            chunks.push(chunk);
          });
          stream.on('error', reject);
          stream.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
        });
      };
      const buffer = await streamToBuffer(stream);
      const blob = new Blob([buffer], { type: fileStorage.mimeType });
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(fileStorage.originalName)}`);
      res.set('Content-Type', fileStorage.mimeType); // might not be needed
      res.set('Content-Length', fileStorage.size);
      res.set('Last-Modified', fileStorage.updatedAt);

      res.status(200).send(blob);
    } catch (error) {
      next(error);
    }
  },

  getApplicationSummary: async (req, res, next) => {
    try {
      const lookup = await FormSubmissionCFMSLookup.query().where('cfmsId', req.params.cfmsId).select('formSubmissionId').throwIfNotFound();
      const submissionId = lookup[0].formSubmissionId;
      const submission = await (await submissionService._fetchSubmissionData(submissionId)).submission.submission.data;
      const applicationJSON = {
        'Community and Employer Partnerships Application': {
          Organization: {
            'Completed Self-Assessment Questionnaire': submission.CEPSelfAssessmentCompleted,
            'Funding Stream': submission.CEPProjectType,
            'Organization Category': submission.CEPOrgEligibleType,
            'Past CEP Agreement': submission.CEPPastProjects,
            'Applicant (Organization) Legal Name': submission.CEPOrgLegalName,
            'Applicant (Organization) Email Address': submission.CEPOrgEmail,
          },
          'Primary Contact / Accounting': {
            'Primary Contact': submission.CEPContactName,
            'Primary Telephone': submission.CEPContactPhone,
            Email: submission.CEPContactEmail,
            'Bookkeeper Name': submission.CEPBookkeeperName,
            'Bookkeeper Email': submission.CEPAccountingContactEmail,
            'Can Provide Bookkeeper Qualifications': submission.CEPBookkeeperQualifications,
            'Business Number': submission.CEPBusinessNumber,
            'GST Account, RT': submission.CEPTaxAccountSuffix,
            'GST Tax Rebate %': submission.CEPTaxRebate,
            'Owe to Government': submission.CEPOweGovt,
            'Liability Insurance': submission.CEPLiabilityInsurance,
            'Existing Policy Covers Project Activities': submission.CEPExistingPolicy,
            'WorkSafe Coverage': submission.CEPWorkSafeCoverage,
            Displacement: submission.CEPDisplacement,
            'EPBC Delivery': submission.CEPEPBCDelivery,
            'Other Government Funding': submission.CEPOtherGovtFunding,
            'Organization Mandate': submission.CEPOrgMandate,
            'Project Activities Unfair Competition': submission.CEPUnfairCompPBLMT,
            'Unionized Worksite': submission.CEPUnionized,
            'Stoppage or Dispute in Progress': submission.CEPDisputeInProgress,
            'Project Includes Participants': submission.CEPHasParticipants,
          },
          'Project Information': {
            Project: submission.CEPProjectTitle,
            'Start Date': submission.CEPProjectStartDate ? moment(submission.CEPProjectStartDate).format('MM/DD/YYYY') : '',
            'End Date': submission.CEPProjectEndDate ? moment(submission.CEPProjectEndDate).format('MM/DD/YYYY') : '',
            'Alternative Location': submission.CEPAlternateLocations,
            'Project Objectives': submission.CEPObj_PBLMT_Objectives,
          },
          'Project Activities': {
            'Key Activities': submission.CEPPTimelinesActivities_PBLMT,
            Training: submission.CEPPBLMTTraining,
            'Classroom Percentage': submission.CEPPBLMTClassPercent,
            'Work Percentage': submission.CEPPBLMTWorkPercent,
            'Intake Dates': submission.CEPObj_PBLMT_Sessions,
            'Number of Sessions': submission.CEPObj_PBLMT_SessionCount,
            'Participants Per Intake': submission.CEPObj_PBLMT_PartPerSessionCount,
            'Weeks of Skills': submission.CEPObj_PBLMT_TrainingWeeks,
            'Weeks of Work': submission.CEPObj_PBLMT_JobWeeks,
            'Weeks of Support': submission.CEPObj_PBLMT_FollowupWeeks,
            'Participant Benefit': submission.CEPPBLMT_PartBenefit,
            'Job Types': submission.CEPObj_PBLMT_JobTypes,
            'Expected Results': submission.CEPExpectedResults_PBLMT,
            'Location 1': submission.CEPESC1,
            'Participant Oversight': submission.CEPParticipantOversight ?? '', //TODO : question missing from form?
            'Follow-up Explanation': submission.CEPFollowUpExplanation,
            'Can Provide Job Descriptions/Resumes': submission.CEPJobDescriptions,
            'Stakeholder Partnerships': submission.CEPStakeholderPartnerships,
          },
          Budget: {
            Budget: submission.CEPRequestedBudget,
          },
        },
      };

      console.log('CEP applicationJSON: ', applicationJSON);

      const htmlString = json2html.render(applicationJSON, { plainHtml: false });
      //console.log('htmlString: ', htmlString);
      const utf16EncodedBuffer = Buffer.from(htmlString, 'utf16le');
      res.status(200).send(utf16EncodedBuffer);
    } catch (error) {
      next(error);
    }
  },
};
