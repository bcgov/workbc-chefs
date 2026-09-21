const CREATED_BY = 'elmsd-02';

exports.up = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider')
      .insert([
        {
          createdBy: CREATED_BY,
          code: 'bceid-catchment',
          display: 'Basic or Business BCeID (Catchment Protected)',
          active: true,
          idp: 'bceid',
        },
      ])
      .onConflict('code')
      .ignore();
  });
};

exports.down = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').where('createdBy', CREATED_BY).del();
  });
};
