const service = require('./service');
const storageService = require('./storage/storageService');
const json2html = require('json2html');
const { encodeURI } = require('../common/utils');
const submissionService = require('../submission/service');
const { FileStorage } = require('../common/models');

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
      const attachments = await FileStorage.query().where('formSubmissionId', req.params.submissionId).throwIfNotFound();
      // SELECT taapat_id, file_nam, mime_type_cd, attach_size_num, question_nam, file_ext_nam "
      console.log('attachments: ', attachments);
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
      // HTML attempt //
      const submission = await (await submissionService._fetchSubmissionData(req.params.submissionId)).submission.submission.data;
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
        },
      };

      res.status(200).send(json2html.render(applicationJSON));
    } catch (error) {
      next(error);
    }
  },
};
