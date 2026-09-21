const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormSubmissionCFMSLookup extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission_cfms_lookup';
  }

  static get modifiers() {
    return {
      filterFormSubmissionId(query, value) {
        if (value) {
          query.where('formSubmissionId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formSubmissionId', 'cfmsId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formSubmissionId: { type: 'string', pattern: Regex.UUID },
        cfmsId: { type: 'integer' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FormSubmissionCFMSLookup;
