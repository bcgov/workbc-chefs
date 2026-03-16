exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.table('file_storage', (table) => {
      table.string('questionName', 128);
    })
  );
};

exports.down = function (knex) {
  return knex.schema.table('file_storage', (table) => {
    table.dropColumn('questionName');
  });
};
