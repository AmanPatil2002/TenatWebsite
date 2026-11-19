const assert = require("node:assert/strict");
const test = require("node:test");
const { provisionSite } = require("../utils/provision");

test("provisionSite creates a site-admin login from the client's account", async () => {
  const queries = [];
  const connection = {
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (sql.includes("INSERT INTO sites")) return [{ insertId: 27 }, []];
      if (sql.includes("FROM users")) {
        return [
          [{ email: "client@example.com", passwordHash: "$2b$stored-hash" }],
          [],
        ];
      }
      if (sql.includes("SELECT color, background FROM theme")) {
        return [[{ color: "#123456", background: "#ffffff" }], []];
      }
      return [{ insertId: 1, affectedRows: 1 }, []];
    },
  };

  await provisionSite(connection, {
    id: 8,
    userId: 3,
    userName: "Client",
    templateId: 2,
    templateName: "Template",
    themeId: 4,
    amount: 99,
    validityDays: 365,
  });

  const adminInsert = queries.find(({ sql }) =>
    sql.includes("INSERT INTO `admin`"),
  );
  assert.ok(adminInsert);
  assert.deepEqual(adminInsert.params, [
    27,
    3,
    "client@example.com",
    "$2b$stored-hash",
  ]);
  assert.ok(
    queries.some(({ sql }) => sql.includes("FOR UPDATE")),
    "locks the source account while its credentials are copied",
  );
});
