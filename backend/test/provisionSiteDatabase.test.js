const assert = require("node:assert/strict");
const test = require("node:test");

const dbPath = require.resolve("../config/db");
let reservedDbName = null;
const queries = [];
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    query(sql, params, callback) {
      queries.push({ sql, params });
      if (typeof params === "function") callback = params;

      let result = [];
      if (sql.includes("SELECT s.name AS siteName")) {
        result = [
          {
            siteName: "Test Site",
            userName: "Client",
            packKey: null,
            categoryName: "General",
          },
        ];
      } else if (
        sql.includes("SELECT dbName, provisionStatus FROM sites WHERE id = ?") ||
        sql.includes("SELECT dbName FROM sites WHERE id = ?")
      ) {
        result = [{ dbName: reservedDbName, provisionStatus: "pending" }];
      } else if (sql.startsWith("UPDATE sites SET dbName = COALESCE")) {
        reservedDbName = params[0];
        result = { affectedRows: 1 };
      } else if (sql.includes("information_schema.TABLES")) {
        result = [{ TABLE_NAME: params[1] }];
      } else if (
        sql.includes("information_schema.SCHEMATA") ||
        sql.includes("SELECT id FROM sites WHERE dbName = ?")
      ) {
        result = [];
      } else {
        result = { affectedRows: 1 };
      }

      callback(null, result);
    },
  },
};

const { provisionSiteDatabase } = require("../config/provisionSite");

test("provisioning seeds the pack sitethemes table, not the global table", async () => {
  await provisionSiteDatabase(28);

  const localThemeSeed = queries.find(({ sql }) =>
    sql.includes("INSERT IGNORE INTO") &&
    sql.includes("`sitethemes` (siteId)"),
  );
  assert.ok(localThemeSeed);
  assert.match(localThemeSeed.sql, /^INSERT IGNORE INTO `[^`]+`\.`sitethemes`/);
  assert.equal(
    queries.some(({ sql }) =>
      sql.includes("INSERT IGNORE INTO sitethemes (siteId, themeName"),
    ),
    false,
  );
  assert.ok(
    queries.some(({ sql }) =>
      sql.includes("UPDATE sites SET dbName=?, provisionStatus='ready'"),
    ),
  );
});
