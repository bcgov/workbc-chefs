const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FileStorageCFMSLookup extends Timestamps(Model) {
  static get tableName() {
    return 'file_storage_cfms_lookup';
  }

  static get modifiers() {
    return {
      filterFileId(query, value) {
        if (value) {
          query.where('fileId', value);
        }
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['fileId', 'cfmsFileId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        fileId: { type: 'string', pattern: Regex.UUID },
        cfmsFileId: { type: 'integer' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = FileStorageCFMSLookup;
