const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('form_submission_cfms_lookup', (table) => {
      table.uuid('id').primary();
      table.uuid('formSubmissionId').references('id').inTable('form_submission').notNullable().index();
      table.bigInteger('cfmsId').notNullable().index();
      stamps(knex, table);
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('form_submission_cfms_lookup'));
};
