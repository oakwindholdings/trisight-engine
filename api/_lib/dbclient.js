// api/_lib/dbclient.js
// Drop-in replacement for the removed vendor client: same createClient(url, key) call shape the
// api/ handlers already use, backed by the server's Postgres helper. url/key args are ignored —
// there is one database and one trusted role, configured via DATABASE_URL.

const { db, rpc } = require('../../server/db');

function createClient(_url, _key) {
  return {
    from: (table) => db(table),
    rpc,
    storage: {
      from: (_bucket) => ({
        // report artifacts live in Postgres (reports.file_bytes) as of the Railway migration;
        // handlers that used bucket downloads read the column instead. This stub keeps any
        // stragglers failing loudly rather than silently.
        download: async () => ({ data: null, error: { message: 'storage buckets removed — report bytes live in the reports table' } }),
        upload: async () => ({ data: null, error: { message: 'storage buckets removed — write reports.file_bytes instead' } }),
      }),
    },
  };
}

module.exports = { createClient };
