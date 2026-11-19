const db = require('../config/db').promise();
const { tn } = require('../config/provisionSite');
const packs = require('../config/packs');
const SYSTEM_COLUMNS = new Set(['id', 'createdAt', 'updatedAt']);

const ID_PATTERN = /^[1-9]\d{0,19}$/;
const isId = (value) =>
  ID_PATTERN.test(String(value ?? '')) &&
  BigInt(value) <= 18446744073709551615n;

const sendError = (res, error) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error('Site data database error:', error);
  return res.status(500).json({ message: 'Could not access site data' });
};

const requireOwnedSite = async (siteId, userId) => {
  if (!isId(siteId)) {
    const error = new Error('Invalid site id');
    error.status = 400;
    throw error;
  }
  const [[site]] = await db.query(
    `SELECT s.id, s.dbName, s.provisionStatus
       FROM sites s
       JOIN payments p ON p.id = s.paymentId AND p.status = 'captured'
      WHERE s.id = ? AND s.userId = ?
        AND s.status = 'active' AND s.expiresAt > CURRENT_TIMESTAMP`,
    [siteId, userId],
  );
  if (!site) {
    const error = new Error('Site not found, unavailable, or not owned by this user');
    error.status = 403;
    throw error;
  }
  if (site.provisionStatus !== 'ready' || !site.dbName) {
    const error = new Error('Site database is not ready yet');
    error.status = 503;
    throw error;
  }
  return site.dbName;
};

const requireManagedSite = async (siteId, req) => {
  if (req.siteAdmin) {
    if (String(req.siteAdmin.siteId) !== String(siteId)) {
      const error = new Error('This login is not assigned to the requested site');
      error.status = 403;
      throw error;
    }
    if (!isId(siteId)) {
      const error = new Error('Invalid site id');
      error.status = 400;
      throw error;
    }
    const [[site]] = await db.query(
      `SELECT s.id, s.dbName, s.provisionStatus
         FROM sites s
         JOIN payments p ON p.id = s.paymentId AND p.status = 'captured'
        WHERE s.id = ? AND s.status = 'active'
          AND s.expiresAt > CURRENT_TIMESTAMP`,
      [siteId],
    );
    if (!site) {
      const error = new Error('Site is not provisioned or is unavailable');
      error.status = 403;
      throw error;
    }
    if (site.provisionStatus !== 'ready' || !site.dbName) {
      const error = new Error('Site database is not ready yet');
      error.status = 503;
      throw error;
    }
    return site.dbName;
  }
  return await requireOwnedSite(siteId, req.user.userId);
};

const parseEnumValues = (columnType) =>
  [...String(columnType).matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(([, value]) =>
    value.replace(/\\'/g, "'").replace(/\\\\/g, "\\"),
  );

const toColumnMetadata = (column) => {
  const generated = /auto_increment|generated/i.test(column.extra || '');
  const systemColumn = SYSTEM_COLUMNS.has(column.name);
  const defaultIsExpression =
    typeof column.columnDefault === 'string' &&
    /^(CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME)(\(\d+\))?$/i.test(
      column.columnDefault,
    );

  return {
    name: column.name,
    dataType: column.dataType,
    columnType: column.columnType,
    nullable: column.isNullable === 'YES',
    required:
      column.isNullable === 'NO' &&
      column.columnDefault === null &&
      !generated &&
      !systemColumn,
    defaultValue:
      column.columnDefault !== null && !defaultIsExpression
        ? column.columnDefault
        : null,
    enumValues:
      column.dataType === 'enum'
        ? parseEnumValues(column.columnType)
        : [],
    editable: !systemColumn && !generated,
    references: column.referencedTable
      ? {
          table: column.referencedTable,
          column: column.referencedColumn,
        }
      : null,
  };
};

const requireResourceTable = async (siteId, resource, dbName) => {
  if (typeof resource !== 'string' || !/^[a-z][a-z0-9_]*$/.test(resource)) {
    const error = new Error('Invalid resource');
    error.status = 400;
    throw error;
  }

  const [[table]] = await db.query(
    'SELECT id FROM sitetables WHERE siteId = ? AND baseName = ?',
    [siteId, resource],
  );
  if (!table) {
    const error = new Error('This resource is not available for the site category');
    error.status = 404;
    throw error;
  }

  const [columns] = await db.query(
    `SELECT c.COLUMN_NAME AS name, c.DATA_TYPE AS dataType,
            c.COLUMN_TYPE AS columnType, c.IS_NULLABLE AS isNullable,
            c.COLUMN_DEFAULT AS columnDefault, c.EXTRA AS extra,
            k.REFERENCED_TABLE_NAME AS referencedTable,
            k.REFERENCED_COLUMN_NAME AS referencedColumn
       FROM information_schema.COLUMNS c
       LEFT JOIN information_schema.KEY_COLUMN_USAGE k
         ON k.TABLE_SCHEMA = c.TABLE_SCHEMA
        AND k.TABLE_NAME = c.TABLE_NAME
        AND k.COLUMN_NAME = c.COLUMN_NAME
        AND k.REFERENCED_TABLE_NAME IS NOT NULL
      WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ?
      ORDER BY c.ORDINAL_POSITION`,
    [dbName, resource],
  );
  if (!columns.length) {
    const error = new Error('This resource table is missing from the site database');
    error.status = 404;
    throw error;
  }

  return columns.map(toColumnMetadata);
};

const readInput = (body, columns) => {
  const values =
    body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const editableColumns = new Set(
    columns.filter((column) => column.editable).map((column) => column.name),
  );
  const unknown = Object.keys(values).filter(
    (key) => !editableColumns.has(key),
  );
  if (unknown.length) {
    const error = new Error(`Unsupported field(s): ${unknown.join(', ')}`);
    error.status = 400;
    throw error;
  }
  return Object.fromEntries(Object.entries(values));
};

exports.schema = async (req, res) => {
  try {
    const siteId = req.params.siteId;
    const dbName = await requireManagedSite(siteId, req);
    const [rows] = await db.query(
      `SELECT st.baseName, c.COLUMN_NAME AS name, c.DATA_TYPE AS dataType,
              c.COLUMN_TYPE AS columnType, c.IS_NULLABLE AS isNullable,
              c.COLUMN_DEFAULT AS columnDefault, c.EXTRA AS extra,
              c.ORDINAL_POSITION AS ordinalPosition,
              k.REFERENCED_TABLE_NAME AS referencedTable,
              k.REFERENCED_COLUMN_NAME AS referencedColumn
         FROM sitetables st
         JOIN information_schema.COLUMNS c
           ON c.TABLE_SCHEMA = ? AND c.TABLE_NAME = st.baseName
         LEFT JOIN information_schema.KEY_COLUMN_USAGE k
           ON k.TABLE_SCHEMA = c.TABLE_SCHEMA
          AND k.TABLE_NAME = c.TABLE_NAME
          AND k.COLUMN_NAME = c.COLUMN_NAME
          AND k.REFERENCED_TABLE_NAME IS NOT NULL
        WHERE st.siteId = ?
        ORDER BY st.baseName, c.ORDINAL_POSITION`,
      [dbName, siteId],
    );
    const commonTables = new Set(packs.common().map(([name]) => name));
    const resources = {};

    for (const row of rows) {
      const resource = (resources[row.baseName] ||= {
        isCommon: commonTables.has(row.baseName),
        columns: [],
      });
      resource.columns.push(toColumnMetadata(row));
    }

    return res.json({ resources });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.sections = async (req, res) => {
  try {
    await requireManagedSite(req.params.siteId, req);
    const [rows] = await db.query(
      'SELECT baseName FROM sitetables WHERE siteId = ? ORDER BY baseName',
      [req.params.siteId],
    );
    return res.json(rows.map(({ baseName }) => baseName));
  } catch (error) {
    return sendError(res, error);
  }
};

exports.list = async (req, res) => {
  const { siteId, resource } = req.params;
  try {
    const dbName = await requireManagedSite(siteId, req);
    await requireResourceTable(siteId, resource, dbName);
    const [rows] = await db.query(
      `SELECT * FROM ${tn(siteId, resource, dbName)} ORDER BY id DESC`,
    );
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.create = async (req, res) => {
  const { siteId, resource } = req.params;
  try {
    const dbName = await requireManagedSite(siteId, req);
    const columns = await requireResourceTable(siteId, resource, dbName);
    const data = readInput(req.body, columns);
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No editable fields were provided' });
    }
    const [result] = await db.query(
      `INSERT INTO ${tn(siteId, resource, dbName)} SET ?`,
      [data],
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.update = async (req, res) => {
  const { siteId, resource, id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: 'Invalid record id' });
  try {
    const dbName = await requireManagedSite(siteId, req);
    const columns = await requireResourceTable(siteId, resource, dbName);
    const data = readInput(req.body, columns);
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No editable fields were provided' });
    }
    const [result] = await db.query(
      `UPDATE ${tn(siteId, resource, dbName)} SET ? WHERE id = ?`,
      [data, id],
    );
    if (result.affectedRows === 0) {
      const [[record]] = await db.query(
        `SELECT id FROM ${tn(siteId, resource, dbName)} WHERE id = ? LIMIT 1`,
        [id],
      );
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }
    }
    return res.json({ message: 'Updated' });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.remove = async (req, res) => {
  const { siteId, resource, id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: 'Invalid record id' });
  try {
    const dbName = await requireManagedSite(siteId, req);
    await requireResourceTable(siteId, resource, dbName);
    const [result] = await db.query(
      `DELETE FROM ${tn(siteId, resource, dbName)} WHERE id = ?`,
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    return res.json({ message: 'Deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};
