const assert = require("node:assert/strict");
const test = require("node:test");

const dbPath = require.resolve("../config/db");
let reservedDbName = null;
let provisionStatus = "pending";
let databaseCreated = false;
let presentTables = new Set();
let registeredTables = new Set();
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
        result = [{ dbName: reservedDbName, provisionStatus }];
      } else if (sql.startsWith("UPDATE sites SET dbName = COALESCE")) {
        reservedDbName = params[0];
        result = { affectedRows: 1 };
      } else if (sql.startsWith("CREATE DATABASE IF NOT EXISTS")) {
        databaseCreated = true;
        result = { affectedRows: 1 };
      } else if (sql.includes("information_schema.TABLES")) {
        const names = Array.isArray(params[1]) ? params[1] : [params[1]];
        result = names
          .filter((name) => databaseCreated && presentTables.has(name))
          .map((TABLE_NAME) => ({ TABLE_NAME }));
      } else if (sql.includes("information_schema.SCHEMATA")) {
        result = databaseCreated
          ? [{ SCHEMA_NAME: String(params[0]).toLowerCase() }]
          : [];
      } else if (sql.includes("SELECT baseName FROM sitetables")) {
        const names = Array.isArray(params[1]) ? params[1] : [params[1]];
        result = names
          .filter((name) => registeredTables.has(name))
          .map((baseName) => ({ baseName }));
      } else if (sql.includes("SELECT id FROM sites WHERE dbName = ?")) {
        result = [];
      } else if (sql.startsWith("CREATE TABLE IF NOT EXISTS")) {
        const match = sql.match(/\.`([a-z][a-z0-9_]*)`/i);
        if (match) presentTables.add(match[1]);
        result = { affectedRows: 0 };
      } else if (sql.startsWith("INSERT IGNORE INTO sitetables")) {
        registeredTables.add(params[1]);
        result = { affectedRows: 1 };
      } else {
        if (sql.includes("provisionStatus='ready'")) provisionStatus = "ready";
        result = { affectedRows: 1 };
      }

      callback(null, result);
    },
  },
};

const { ensureSiteDatabase, provisionSiteDatabase } = require("../config/provisionSite");
const packs = require("../config/packs");

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

test("ensureSiteDatabase recreates missing pack tables and registry entries", async () => {
  reservedDbName = "Tenant28";
  provisionStatus = "ready";
  databaseCreated = true;
  presentTables = new Set(packs.common().map(([name]) => name));
  registeredTables = new Set([...presentTables]);
  presentTables.delete("pages");
  registeredTables.delete("sitethemes");

  const dbName = await ensureSiteDatabase(28, reservedDbName, null, "ready");

  assert.equal(dbName, reservedDbName.toLowerCase());
  assert.equal(presentTables.has("pages"), true);
  assert.equal(registeredTables.has("sitethemes"), true);
  assert.ok(
    queries.some(({ sql }) => sql.startsWith("CREATE TABLE IF NOT EXISTS")),
  );
  assert.ok(
    queries.some(({ sql, params }) =>
      sql.startsWith("INSERT IGNORE INTO sitetables") &&
      params[1] === "sitethemes",
    ),
  );
});
