const assert = require("node:assert/strict");
const test = require("node:test");

const dbPath = require.resolve("../config/db");
let queryHandler;
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    promise: () => ({ query: (...args) => queryHandler(...args) }),
    query(sql, params, callback) {
      let rows = [];
      if (sql.includes("information_schema.SCHEMATA")) {
        rows = [{ SCHEMA_NAME: "tenant7" }];
      } else if (sql.includes("information_schema.TABLES")) {
        const names = Array.isArray(params[1]) ? params[1] : [params[1]];
        rows = names.map((TABLE_NAME) => ({ TABLE_NAME }));
      } else if (sql.includes("SELECT baseName FROM sitetables")) {
        rows = require("../config/packs")
          .common()
          .map(([baseName]) => ({ baseName }));
      } else if (sql.includes("SELECT dbName, provisionStatus FROM sites")) {
        rows = [{ dbName: "tenant7", provisionStatus: "ready" }];
      }
      callback(null, rows);
    },
  },
};

const siteData = require("../controller/siteDataController");
const siteAccess = require("../controller/site/access");

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const ownedSite = [
  [{
    id: 7,
    userId: 3,
    status: "active",
    dbName: "tenant7",
    provisionStatus: "ready",
    packKey: null,
    paymentStatus: "captured",
    notExpired: 1,
  }],
  [],
];
const studentColumns = [
  {
    name: "id",
    dataType: "int",
    columnType: "int unsigned",
    isNullable: "NO",
    columnDefault: null,
    extra: "auto_increment",
    referencedTable: null,
    referencedColumn: null,
  },
  {
    name: "name",
    dataType: "varchar",
    columnType: "varchar(100)",
    isNullable: "NO",
    columnDefault: null,
    extra: "",
    referencedTable: null,
    referencedColumn: null,
  },
];

test("schema metadata reflects pack tables and rejects system fields in CRUD", async () => {
  const queries = [];
  queryHandler = async (sql) => {
    queries.push(sql);
    if (sql.includes("SELECT s.id, s.userId")) return ownedSite;
    if (sql.includes("SELECT s.id, s.dbName")) return ownedSite;
    if (sql.includes("SELECT st.baseName")) {
      return [
        [
          ...studentColumns.map((column) => ({ baseName: "students", ...column })),
          {
            baseName: "pages",
            name: "id",
            dataType: "int",
            columnType: "int unsigned",
            isNullable: "NO",
            columnDefault: null,
            extra: "auto_increment",
            referencedTable: null,
            referencedColumn: null,
          },
        ],
        [],
      ];
    }
    if (sql.includes("SELECT id FROM sitetables")) return [[{ id: 1 }], []];
    if (sql.includes("FROM information_schema.COLUMNS")) {
      return [studentColumns, []];
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const schemaResponse = response();
  await siteData.schema(
    { params: { siteId: "7" }, user: { userId: 3 } },
    schemaResponse,
  );

  assert.equal(schemaResponse.statusCode, 200);
  assert.equal(schemaResponse.body.resources.students.isCommon, false);
  assert.equal(schemaResponse.body.resources.pages.isCommon, true);
  assert.equal(schemaResponse.body.resources.students.columns[0].editable, false);
  assert.equal(schemaResponse.body.resources.students.columns[1].required, true);

  const updateResponse = response();
  await siteData.update(
    {
      params: { siteId: "7", resource: "students", id: "4" },
      user: { userId: 3 },
      body: { id: 99, name: "Updated" },
    },
    updateResponse,
  );

  assert.equal(updateResponse.statusCode, 400);
  assert.match(updateResponse.body.message, /Unsupported field\(s\): id/);
  assert.equal(queries.some((sql) => sql.startsWith("UPDATE ")), false);

  queryHandler = async (sql) => {
    if (sql.includes("SELECT s.id, s.userId")) return ownedSite;
    if (sql.includes("SELECT s.id, s.dbName")) return ownedSite;
    if (sql.includes("SELECT id FROM sitetables")) return [[{ id: 1 }], []];
    if (sql.includes("FROM information_schema.COLUMNS")) {
      return [studentColumns, []];
    }
    if (sql.startsWith("UPDATE ")) return [{ affectedRows: 0 }, []];
    if (sql.includes("WHERE id = ? LIMIT 1")) return [[{ id: 4 }], []];
    throw new Error(`Unexpected query: ${sql}`);
  };

  const unchangedUpdateResponse = response();
  await siteData.update(
    {
      params: { siteId: "7", resource: "students", id: "4" },
      user: { userId: 3 },
      body: { name: "Unchanged" },
    },
    unchangedUpdateResponse,
  );
  assert.equal(unchangedUpdateResponse.statusCode, 200);
});

test("page access waits for failed or pending site provisioning", async () => {
  queryHandler = async () => [
    [
      {
        id: 28,
        userId: 3,
        status: "active",
        paymentStatus: "captured",
        notExpired: 1,
        provisionStatus: "failed",
        dbName: null,
        packKey: null,
      },
    ],
    [],
  ];

  await assert.rejects(
    siteAccess.getActiveOwnedSite("28", 3),
    error => error.status === 503,
  );
});
