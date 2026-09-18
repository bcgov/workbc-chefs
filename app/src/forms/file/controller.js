const service = require('./service');
const storageService = require('./storage/storageService');
const json2html = require('json2html');
const { encodeURI } = require('../common/utils');
const submissionService = require('../submission/service');
const { FileStorage } = require('../common/models');
const FormSubmissionCFMSLookup = require('../common/models/tables/formSubmissionCFMSLookup');
const FileStorageCFMSLookup = require('../common/models/tables/fileStorageCFMSLookup');
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
      const response = await service.create(req.file, req.currentUser, req.body.questionName);
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

  getAttachment: async (req, res, next) => {
    try {
      const storageLookupCFMS = await FileStorageCFMSLookup.query().where('cfmsFileId', req.params.cfmsFileId).select('fileId').throwIfNotFound();
      const fileId = storageLookupCFMS[0].fileId;
      const fileStorageLookup = await FileStorage.query().where('id', fileId).select('*').throwIfNotFound();
      const fileStorage = fileStorageLookup[0];
      const stream = await storageService.read(fileStorage);

      stream.on('error', function error(err) {
        throw err;
      });

      res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(fileStorage.originalName)}`);
      res.set('Content-Type', fileStorage.mimeType);
      res.set('Content-Length', fileStorage.size);
      res.set('Last-Modified', fileStorage.updatedAt);

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  getAttachmentsList: async (req, res, next) => {
    try {
      const lookup = await FormSubmissionCFMSLookup.query().where('cfmsId', req.params.cfmsId).select('formSubmissionId').throwIfNotFound();
      const submissionId = lookup[0].formSubmissionId;
      const attachments = await FileStorage.query().where('formSubmissionId', submissionId).throwIfNotFound();
      let response = [];
      for (const a of attachments) {
        const cfms_file_row = await FileStorageCFMSLookup.query().where('fileId', a.id).select('cfmsFileId').throwIfNotFound();
        //console.log('FOUND: ', cfms_file_row);
        // console.log(cfms_file_row[0]);
        // console.log(cfms_file_row.length);
        // console.log(cfms_file_row[0].cfmsFileId);
        response.push({
          TAAPAT_ID: cfms_file_row?.length > 0 ? cfms_file_row[0].cfmsFileId : null,
          FILE_NAM: a.originalName,
          MIME_TYPE_CD: a.mimeType,
          ATTACH_SIZE_NUM: a.size,
          QUESTION_NAM: a.questionName,
          FILE_EXT_NAM: a.originalName.split('.').pop(),
        });
      }
      //console.log('RESPONSE: ', response);
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
            'Funding Stream': submission.CEPProjectType,
            'Organization Category': submission.CEPOrgEligibleType,
            'Applicant (Organization) Legal Name': submission.CEPOrgLegalName,
            'Applicant (Organization) Email Address': submission.CEPOrgEmail,
          },
          'Primary Contact / Accounting': {
            'Primary Contact': submission.CEPContactName,
            'Primary Contact Title': submission.CEPContactTitle,
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
            ...(submission.CEPDisplacement && { Displacement: submission.CEPDisplacement }),
            ...(submission.CEPEPBCDelivery && { 'WorkBC Delivery': submission.CEPEPBCDelivery }),
            ...(submission.CEPOtherGovtFunding && { 'Other Government Funding': submission.CEPOtherGovtFunding }),
            ...(submission.CEPOrgMandate && { 'Organization Mandate': submission.CEPOrgMandate }),
            ...(submission.CEPUnfairCompPBLMT && { 'Project Activities Unfair Competition': submission.CEPUnfairCompPBLMT }),
            ...(submission.CEPUnfairCompJCP && { 'Project Activities Unfair Competition': submission.CEPUnfairCompJCP }),
            ...(submission.CEPUnfairCompLMP && { 'Project Activities Unfair Competition': submission.CEPUnfairCompLMP }),
            ...(submission.CEPUnfairCompRI && { 'Project Activities Unfair Competition': submission.CEPUnfairCompRI }),
            ...(submission.CEPDisputeInProgress && { 'Stoppage or Dispute in Progress': submission.CEPDisputeInProgress }),
            ...(submission.CEPHasParticipants && { 'Project Includes Participants': submission.CEPHasParticipants }),
          },
          'Project Information': {
            ...(submission.CEPProjectTitle && { Project: submission.CEPProjectTitle }),
            ...(submission.CEPProjectStartDate && { 'Start Date': moment(submission.CEPProjectStartDate).format('MM/DD/YYYY') }),
            ...(submission.CEPProjectEndDate && { 'End Date': moment(submission.CEPProjectEndDate).format('MM/DD/YYYY') }),
            ...(submission.CEPTargetAboriginalCount != null && { 'Target Group: Indigenous Peoples': submission.CEPTargetAboriginalCount }),
            ...(submission.CEPTargetFrancophoneCount != null && { 'Target Group: Francophone': submission.CEPTargetFrancophoneCount }),
            ...(submission.CEPTargetImmigrantCount != null && { 'Target Group: Immigrants': submission.CEPTargetImmigrantCount }),
            ...(submission.CEPTargetBarrieredCount != null && { 'Target Group: Multi-barriered': submission.CEPTargetBarrieredCount }),
            ...(submission.CEPTargetDisabilitiesCount != null && { 'Target Group: Persons with a Disability': submission.CEPTargetDisabilitiesCount }),
            ...(submission.CEPTargetYouthCount != null && { 'Target Group: Youth': submission.CEPTargetYouthCount }),
            ...(submission.CEPTargetSurvivorsOfViolenceCount != null && { 'Target Group: Survivors of Violence and/or Abuse': submission.CEPTargetSurvivorsOfViolenceCount }),
            ...(submission.CEPTargetWomenCount != null && { 'Target Group: Women': submission.CEPTargetWomenCount }),
            ...(submission.CEPTargetRacializedCount != null && { 'Target Group: Racialized People': submission.CEPTargetRacializedCount }),
            ...(submission.CEPTargetLGBTCount != null && { 'Target Group: 2SLGBTQIA+': submission.CEPTargetLGBTCount }),
            ...(submission.CEPTargetMatureWorkersCount != null && { 'Target Group: Mature Workers': submission.CEPTargetMatureWorkersCount }),
            ...(submission.CEPTargetOtherCount != null && { 'Target Group: Other': submission.CEPTargetOtherCount }),
            ...(submission.CEP_TargetOtherSpecify && { 'Other Priority Group': submission.CEP_TargetOtherSpecify }),
            ...(submission.CEPAlternateLocations && { 'Alternative Location': submission.CEPAlternateLocations }),
            ...(submission.CEPObj_PBLMT_Objectives && { 'Project Objectives': submission.CEPObj_PBLMT_Objectives }),
            ...(submission.CEPObj_JCP_Objectives && { 'Project Objectives': submission.CEPObj_JCP_Objectives }),
            ...(submission.CEPObj_LMP_Objectives && { 'Project Objectives': submission.CEPObj_LMP_Objectives }),
            ...(submission.CEPObj_RI_Qualifications && { 'Project Objectives': submission.CEPObj_RI_Qualifications }),
            ...(submission.CEP_TariffImpact && { 'Tariff Impact': submission.CEP_TariffImpact }),
            ...(submission.CEP_TariffExplain && { 'Tariff Explanation': submission.CEP_TariffExplain }),
          },
          'Project Activities': {
            ...(submission.CEPPBLMTTraining && { Training: submission.CEPPBLMTTraining }),
            ...(submission.CEPPBLMTClassPercent != null && { 'Classroom Percentage': submission.CEPPBLMTClassPercent }),
            ...(submission.CEPPBLMTWorkPercent != null && { 'Work Percentage': submission.CEPPBLMTWorkPercent }),
            ...(submission.CEPObj_PBLMT_Sessions != null && { 'Intake Dates': submission.CEPObj_PBLMT_Sessions }),
            ...(submission.CEPObj_PBLMT_SessionCount != null && { 'Number of Sessions': submission.CEPObj_PBLMT_SessionCount }),
            ...(submission.CEPObj_PBLMT_PartPerSessionCount != null && { 'Participants Per Intake': submission.CEPObj_PBLMT_PartPerSessionCount }),
            ...(submission.CEPObj_PBLMT_TrainingWeeks != null && { 'Weeks of Skills': submission.CEPObj_PBLMT_TrainingWeeks }),
            ...(submission.CEPObj_PBLMT_JobWeeks != null && { 'Weeks of Work': submission.CEPObj_PBLMT_JobWeeks }),
            ...(submission.CEPObj_PBLMT_FollowupWeeks != null && { 'Weeks of Support': submission.CEPObj_PBLMT_FollowupWeeks }),
            ...(submission.CEPExpectedResults_PBLMT && { 'Expected Results': submission.CEPExpectedResults_PBLMT }),
            ...(submission.CEPExpectedResults_JCP && { 'Expected Results': submission.CEPExpectedResults_JCP }),
            ...(submission.CEPExpectedResults_LMP && { 'Expected Results': submission.CEPExpectedResults_LMP }),
            ...(submission.CEPESC1 && { 'Location 1': submission.CEPESC1 }),
            ...(submission.CEPESC2 && { 'Location 2': submission.CEPESC2 }),
            ...(submission.CEPESC3 && { 'Location 3': submission.CEPESC3 }),
            ...(submission.CEPESC4 && { 'Location 4': submission.CEPESC4 }),
            ...(submission.CEPParticipantOversight && { 'Participant Oversight': submission.CEPParticipantOversight }),
            ...(submission.CEPJobDescriptions && { 'Can Provide Job Descriptions/Resumes': submission.CEPJobDescriptions }),
            ...(submission.CEP_LMP_ShareInformation && { 'Information Sharing': submission.CEP_LMP_ShareInformation }),
            ...(submission.CEP_RI_FinancialCapacity && { 'Financial Capacity': submission.CEP_RI_FinancialCapacity }),
            ...(submission.CEP_RI_CommunityBenefits && { 'Community Benefits': submission.CEP_RI_CommunityBenefits }),
            ...(submission.CEP_RI_EthicalSafety && { 'Ethical Safety': submission.CEP_RI_EthicalSafety }),
            ...(submission.CEP_DescribeSupports && { 'Supports Description': submission.CEP_DescribeSupports }),
            ...(submission.CEPSkilledTrainingExplanation && { 'Skilled Training': submission.CEPSkilledTrainingExplanation }),
          },
          Budget: {
            Budget: submission.CEPRequestedBudget,
          },
        },
      };

      //console.log('CEP applicationJSON: ', applicationJSON);

      const htmlString = json2html.render(applicationJSON, { plainHtml: false });
      //console.log('htmlString: ', htmlString);
      const utf16EncodedBuffer = Buffer.from(htmlString, 'utf16le');
      res.status(200).send(utf16EncodedBuffer);
    } catch (error) {
      next(error);
    }
  },
};
