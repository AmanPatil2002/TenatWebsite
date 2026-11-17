const db = require("./db");
const packs = require("./packs");

const q = (sql, params = []) =>
  new Promise((res, rej) =>
    db.query(sql, params, (e, r) => (e ? rej(e) : res(r))),
  );

const safeId = (siteId) => {
  const id = String(siteId ?? "").trim();
  if (!/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > 18446744073709551615n) {
    throw new Error("Invalid siteId");
  }
  return id;
};

// Convert string to camelCase: "My Site Name" -> "mySiteName"
const toCamelCase = (str) => {
  return String(str || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return "";
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
};

// Escape a value for safe use inside backtick-quoted MySQL identifiers
const escapeIdent = (name) => String(name).replace(/`/g, "``");

// Generate database name from client name and site name
// Example: "John Doe" + "My School Site" + 15 -> "johnDoeMySchoolSite15"
const generateDbName = (userName, siteName, siteId, suffix = "") => {
  const userPart = toCamelCase(userName);

  // Clean siteName: remove userName if present to avoid redundancy
  let cleanedSiteName = String(siteName || "");
  if (
    userName &&
    cleanedSiteName.toLowerCase().includes(String(userName).toLowerCase())
  ) {
    // Escape userName so it's treated as a literal in the RegExp
    const escaped = String(userName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleanedSiteName = cleanedSiteName
      .replace(new RegExp(escaped, "gi"), "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim();
  }

  const sitePart = toCamelCase(cleanedSiteName);
  const sitePartCapitalized = sitePart
    ? sitePart.charAt(0).toUpperCase() + sitePart.slice(1)
    : "";

  // Combine, sanitize, and truncate to MySQL's 64-char limit
  let dbname = `${userPart}${sitePartCapitalized}${siteId}${suffix}`;
  dbname = dbname.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);

  // MySQL database names can't start with a number
  if (/^[0-9]/.test(dbname) || !dbname) {
    dbname = `db${dbname}`;
  }

  // Final safety: still empty or only the "db" prefix
  if (!dbname || dbname === "db") {
    return `site${Date.now()}`;
  }

  return dbname.slice(0, 64);
};

// Check if database exists in MySQL
const databaseExists = async (dbName) => {
  const result = await q(
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
    [dbName],
  );
  return result.length > 0;
};

// Check if a database name is already assigned to another site
const isDbNameTaken = async (dbName, excludeSiteId = null) => {
  const params = [dbName];
  let sql = "SELECT id FROM sites WHERE dbName = ?";
  if (excludeSiteId !== null) {
    sql += " AND id != ?";
    params.push(excludeSiteId);
  }
  const result = await q(sql, params);
  return result.length > 0;
};

// Generate a unique database name by checking existing databases
const generateUniqueDbName = async (userName, siteName, siteId) => {
  let dbName = generateDbName(userName, siteName, siteId);

  if (
    !(await databaseExists(dbName)) &&
    !(await isDbNameTaken(dbName, siteId))
  ) {
    return dbName;
  }

  let attempt = 0;
  while (attempt < 100) {
    attempt++;
    dbName = generateDbName(userName, siteName, siteId, attempt.toString());

    if (
      !(await databaseExists(dbName)) &&
      !(await isDbNameTaken(dbName, siteId))
    ) {
      return dbName;
    }
  }

  // Fallback to timestamp-based name if all attempts fail
  return `site${Date.now()}`;
};

// Check if a table exists in a database
const tableExists = async (dbName, tableName) => {
  const result = await q(
    `SELECT TABLE_NAME
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, tableName],
  );
  return result.length > 0;
};

const dbName = (siteId, dbNameFromSite) => {
  // If dbName already exists in site record, use it (for lookups)
  if (dbNameFromSite) return dbNameFromSite;
  // Fallback for backward compatibility
  return `site_${safeId(siteId)}`;
};

const tn = (siteId, base, dbNameFromSite) =>
  `\`${escapeIdent(dbName(siteId, dbNameFromSite))}\`.\`${escapeIdent(base)}\``;

// Rewrite generic pack DDL to point at the site's specific database
const qualifyDdl = (siteId, base, ddl, dbNameFromSite) => {
  // 1) Replace the CREATE TABLE header (tolerates leading whitespace,
  //    digits in names, and optional backticks)
  let out = ddl.replace(
    /^(\s*)CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?[a-zA-Z0-9_]+`?/i,
    (_m, lead) =>
      `${lead}CREATE TABLE IF NOT EXISTS ${tn(siteId, base, dbNameFromSite)}`,
  );

  // 2) Replace foreign-key REFERENCES to other tables
  out = out.replace(
    /\bREFERENCES\s+`?([a-zA-Z0-9_]+)`?\s*\(/gi,
    (_m, refTable) =>
      `REFERENCES ${tn(siteId, refTable, dbNameFromSite)} (`,
  );

  return out;
};

async function provisionSiteDatabase(siteId) {
  const id = safeId(siteId);
  try {
    const rows = await q(
      `SELECT s.name AS siteName, u.name AS userName,
              c.packKey, c.name AS categoryName
         FROM sites s
         JOIN users u      ON u.userId = s.userId
         JOIN template t   ON t.templateId = s.templateId
         JOIN categories c ON c.categoryId = t.categoryId
        WHERE s.id = ?`,
      [id],
    );
    if (!rows || rows.length === 0) {
      throw new Error("Site or template category was not found");
    }
    const { siteName, userName, packKey } = rows[0];

    const existing = await q("SELECT dbName FROM sites WHERE id = ?", [id]);
    const generatedDbName =
      existing[0]?.dbName ||
      (await generateUniqueDbName(userName, siteName, id));

    // Safety: if the MySQL database already exists and belongs to a
    // different site, refuse to touch it
    if (await databaseExists(generatedDbName)) {
      const owners = await q("SELECT id FROM sites WHERE dbName = ?", [
        generatedDbName,
      ]);
      if (owners.length > 0 && String(owners[0].id) !== String(id)) {
        throw new Error(
          `Database name conflict: ${generatedDbName} is already in use by another site`,
        );
      }
    }

    await q(
      `CREATE DATABASE IF NOT EXISTS \`${escapeIdent(generatedDbName)}\`
         CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );

    // Build the table list: common + category-specific pack
    const tables = [...packs.common()];
    if (packKey && typeof packs[packKey] === "function") {
      tables.push(...packs[packKey]());
    }

    for (const [base, ddl] of tables) {
      if (!/^[a-z][a-z0-9_]*$/.test(base)) {
        throw new Error(`Bad table key: ${base}`);
      }
      if (!/^\s*CREATE\s+TABLE\b/i.test(ddl)) {
        throw new Error(`Invalid table definition: ${base}`);
      }

      if (!(await tableExists(generatedDbName, base))) {
        await q(qualifyDdl(id, base, ddl, generatedDbName));
      } else {
        console.log(
          `Table ${base} already exists in ${generatedDbName}, skipping creation`,
        );
      }

      await q(
        "INSERT IGNORE INTO sitetables (siteId, baseName) VALUES (?, ?)",
        [id, base],
      );
    }

    // Verify required tables exist
    if (!(await tableExists(generatedDbName, "pages"))) {
      throw new Error("Failed to create required table: pages");
    }
    if (!(await tableExists(generatedDbName, "headers"))) {
      throw new Error("Failed to create required table: headers");
    }

    // Seed purchased pages (snapshot) — idempotent
    await q(
      `INSERT IGNORE INTO ${tn(id, "pages", generatedDbName)}
              (sourcePagesId, title, page, sortOrder)
       SELECT p.pagesId, p.title, p.page, tp.sortOrder
         FROM sites s
         JOIN paymentpages pp  ON pp.paymentId  = s.paymentId
         JOIN pages p          ON p.pagesId     = pp.pagesId
         JOIN templatepages tp ON tp.templateId = pp.templateId
                              AND tp.pagesId    = pp.pagesId
        WHERE s.id = ?`,
      [id],
    );

    // Seed default header row if the table is empty
    await q(
      `INSERT INTO ${tn(id, "headers", generatedDbName)} (siteTitle)
       SELECT s.name FROM sites s
        WHERE s.id = ?
          AND NOT EXISTS (SELECT 1 FROM ${tn(
            id,
            "headers",
            generatedDbName,
          )})`,
      [id],
    );

    await q(
      "UPDATE sites SET dbName=?, provisionStatus='ready', provisionError=NULL WHERE id=?",
      [generatedDbName, id],
    );

    console.log(
      `Successfully provisioned database: ${generatedDbName} for site ID: ${id}`,
    );
  } catch (err) {
    console.error(`Provisioning error for site ${id}:`, err.message);
    try {
      await q(
        "UPDATE sites SET provisionStatus='failed', provisionError=? WHERE id=?",
        [String(err.message).slice(0, 500), id],
      );
    } catch (statusError) {
      console.error(
        `Could not record provisioning failure for site ${id}:`,
        statusError,
      );
    }
    throw err;
  }
}

async function dropSiteDatabase(siteId) {
  const id = safeId(siteId);
  const site = await q("SELECT dbName FROM sites WHERE id = ?", [id]);
  const actualDbName =
    site && site[0] && site[0].dbName ? site[0].dbName : `site_${id}`;

  await q(`DROP DATABASE IF EXISTS \`${escapeIdent(actualDbName)}\``);
  await q("DELETE FROM sitetables WHERE siteId=?", [id]);
  await q(
    "UPDATE sites SET dbName=NULL, provisionStatus='pending', provisionError=NULL WHERE id=?",
    [id],
  );
}

module.exports = {
  provisionSiteDatabase,
  dropSiteDatabase,
  tn,
  dbName,
  generateDbName,
  generateUniqueDbName,
  databaseExists,
  isDbNameTaken,
  tableExists,
  qualifyDdl,
};