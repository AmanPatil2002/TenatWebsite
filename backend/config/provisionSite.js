const db = require("./db");
const packs = require("./packs");

const q = (sql, params = []) =>
  new Promise((res, rej) =>
    db.query(sql, params, (e, r) => (e ? rej(e) : res(r))),
  );

const safeId = (siteId) => {
  const id = String(siteId ?? "");
  if (!/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > 18446744073709551615n) {
    throw new Error("Invalid siteId");
  }
  return id;
};

// Convert string to camelCase: "My Site Name" -> "mySiteName"
const toCamelCase = (str) => {
  return String(str || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .split(/\s+/) // Split by whitespace
    .map((word, index) => {
      if (!word) return "";
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
};

// Generate database name from client name and site name
// Example: "John Doe" + "My School Site" + 15 -> "johnDoeMySchoolSite15"
const generateDbName = (userName, siteName, siteId, suffix = "") => {
  const userPart = toCamelCase(userName);

  // Clean siteName: remove userName if present to avoid redundancy
  let cleanedSiteName = siteName;
  if (userName && siteName.toLowerCase().includes(userName.toLowerCase())) {
    cleanedSiteName = siteName.replace(new RegExp(userName, 'gi'), '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }

  const sitePart = toCamelCase(cleanedSiteName);

  // Capitalize first letter of sitePart to create proper camelCase
  const sitePartCapitalized = sitePart
    ? sitePart.charAt(0).toUpperCase() + sitePart.slice(1)
    : "";

  // Combine: userPart + sitePart + siteId + optional suffix
  const dbname = `${userPart}${sitePartCapitalized}${siteId}${suffix}`;

  // Ensure valid MySQL database name (max 64 chars, alphanumeric only)
  const sanitized = dbname.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);

  // MySQL database names can't start with a number
  if (/^[0-9]/.test(sanitized)) {
    return `db${sanitized}`.slice(0, 64);
  }

  return sanitized || `site${Date.now()}`;
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
  let attempt = 0;
  let dbName = generateDbName(userName, siteName, siteId);

  // Try base name first
  const baseExists = await databaseExists(dbName);
  const baseTaken = await isDbNameTaken(dbName, siteId);

  if (!baseExists && !baseTaken) {
    return dbName;
  }

  // If base name exists, try with numeric suffixes
  while (attempt < 100) {
    attempt++;
    dbName = generateDbName(userName, siteName, siteId, attempt.toString());

    const exists = await databaseExists(dbName);
    const taken = await isDbNameTaken(dbName, siteId);

    if (!exists && !taken) {
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
  `\`${dbName(siteId, dbNameFromSite)}\`.\`${base}\``;

const qualifyDdl = (siteId, base, ddl, dbNameFromSite) =>
  ddl
    .replace(
      /^CREATE TABLE(?: IF NOT EXISTS)?\s+[a-z_]+/i,
      `CREATE TABLE IF NOT EXISTS ${tn(siteId, base, dbNameFromSite)}`,
    )
    .replace(
      /\bREFERENCES\s+([a-z_]+)\s*\(/gi,
      (_match, referencedTable) =>
        `REFERENCES ${tn(siteId, referencedTable, dbNameFromSite)} (`,
    );

async function provisionSiteDatabase(siteId) {
  const id = safeId(siteId);
  try {
    const row = await q(
      `SELECT s.name AS siteName, u.name AS userName,
              c.packKey, c.name AS categoryName
       FROM sites s
       JOIN users u ON u.userId = s.userId
       JOIN template t ON t.templateId = s.templateId
       JOIN categories c ON c.categoryId = t.categoryId
       WHERE s.id = ?`,
      [id],
    );
    if (!row || row.length === 0)
      throw new Error("Site or template category was not found");

    const existingRows = await q("SELECT dbName FROM sites WHERE id = ?", [id]);
    const generatedDbName =
      existingRows[0]?.dbName ||
      (await generateUniqueDbName(row[0].userName, row[0].siteName, id));

    // Check if database already exists (shouldn't happen with generateUniqueDbName, but safety check)
    const dbAlreadyExists = await databaseExists(generatedDbName);

    if (dbAlreadyExists) {
      // Verify if it belongs to this site
      const dbOwner = await q("SELECT id FROM sites WHERE dbName = ?", [
        generatedDbName,
      ]);
      if (dbOwner.length > 0 && String(dbOwner[0].id) !== String(id)) {
        throw new Error(
          `Database name conflict: ${generatedDbName} is already in use by another site`,
        );
      }
    }

    // Create the database
    await q(`CREATE DATABASE IF NOT EXISTS \`${generatedDbName}\`
             CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);

    const tables = [...packs.common()];
    if (row[0].packKey && typeof packs[row[0].packKey] === 'function') {
      tables.push(...packs[row[0].packKey]());
    }

    for (const [base, ddl] of tables) {
      if (!/^[a-z_]+$/.test(base)) throw new Error(`Bad table key: ${base}`);
      if (!/^CREATE TABLE\b/i.test(ddl))
        throw new Error(`Invalid table definition: ${base}`);

      // Check if table already exists before creating
      const tableAlreadyExists = await tableExists(generatedDbName, base);

      if (!tableAlreadyExists) {
        await q(qualifyDdl(id, base, ddl, generatedDbName));
      } else {
        console.log(
          `Table ${base} already exists in ${generatedDbName}, skipping creation`,
        );
      }

      await q("INSERT IGNORE INTO sitetables (siteId, baseName) VALUES (?,?)", [
        id,
        base,
      ]);
    }

    // Verify required tables exist
    const pagesTableExists = await tableExists(generatedDbName, "pages");
    const headersTableExists = await tableExists(generatedDbName, "headers");

    if (!pagesTableExists) {
      throw new Error("Failed to create required table: pages");
    }
    if (!headersTableExists) {
      throw new Error("Failed to create required table: headers");
    }

    // seed purchased pages (snapshot) and a header row
    await q(
      `INSERT IGNORE INTO ${tn(id, "pages", generatedDbName)} (sourcePagesId, title, page, sortOrder)
       SELECT p.pagesId, p.title, p.page, tp.sortOrder
         FROM sites s
         JOIN paymentpages pp  ON pp.paymentId = s.paymentId
         JOIN pages p          ON p.pagesId = pp.pagesId
         JOIN templatepages tp ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId
        WHERE s.id = ?`,
      [id],
    );
    await q(
      `INSERT INTO ${tn(id, "headers", generatedDbName)} (siteTitle)
       SELECT s.name FROM sites s
        WHERE s.id = ? AND NOT EXISTS (SELECT 1 FROM ${tn(id, "headers", generatedDbName)})`,
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
  // Get the actual dbName from the site record
  const site = await q("SELECT dbName FROM sites WHERE id = ?", [id]);
  const actualDbName = site && site[0] ? site[0].dbName : `site_${id}`;

  await q(`DROP DATABASE IF EXISTS \`${actualDbName}\``);
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
};
