const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('file_storage_cfms_lookup', (table) => {
      table.uuid('id').primary();
      table.uuid('fileId').references('id').inTable('file_storage').notNullable().index();
      table.bigInteger('cfmsFileId').notNullable().index();
      stamps(knex, table);
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('file_storage_cfms_lookup'));
};
