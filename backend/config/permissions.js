/**
 * Shared backend permission utility.
 */
const {
  READ_ONLY_TABLES,
  STATUS_ONLY_TABLES,
  DERIVED_FIELDS,
  getTablePermission,
  getStatusField,
} = require('./readOnlyTables');

const isReadOnly = (vertical, table) =>
  READ_ONLY_TABLES[vertical]?.includes(table) ?? false;

const isStatusOnly = (vertical, table) =>
  !!STATUS_ONLY_TABLES[vertical]?.[table];

const getDerivedFields = (vertical, table) =>
  DERIVED_FIELDS[vertical]?.[table] || [];

const assertWritable = (vertical, table, action, payload = {}, options = {}) => {
  const mode = getTablePermission(vertical, table);
  if (mode === 'hidden') {
    throw new Error(`Table '${table}' is hidden`);
  }
  if (mode === 'view') {
    if (action === 'create' || action === 'update' || action === 'delete') {
      throw new Error(`Table '${table}' is read-only`);
    }
  }
  if (mode === 'status' && (action === 'create' || action === 'delete')) {
    throw new Error(`Table '${table}' is status-only in admin`);
  }

  const readOnly = isReadOnly(vertical, table);
  const statusOnly = isStatusOnly(vertical, table);

  // Preserve legacy vertical-specific restrictions for existing full-mode tables.
  if (mode === 'full' && readOnly && !statusOnly) {
    if (action === 'create' || action === 'update' || action === 'delete') {
      throw new Error(`Table '${table}' is populated by site users and is read-only in admin`);
    }
  }

  if (mode === 'full' && statusOnly) {
    if (action === 'create' || action === 'delete') {
      throw new Error(`Table '${table}' is status-only in admin`);
    }
  }

  // Priority 3: Derived fields protection - check on create/update
  if (action === 'create' || action === 'update') {
    const derivedFields = getDerivedFields(vertical, table);
    if (derivedFields.length > 0) {
      const invalidKeys = Object.keys(payload).filter((k) => derivedFields.includes(k) && k !== 'updatedAt');
      if (invalidKeys.length > 0) {
        throw new Error(
          `Table '${table}' has derived fields that cannot be directly modified: ${invalidKeys.join(', ')}. ` +
          `These fields are calculated automatically.`
        );
      }
    }
  }

  if (mode === 'status' && action === 'update') {
    const statusField = getStatusField(vertical, table);
    if (!statusField) {
      throw new Error(`Table '${table}' has no permitted status field`);
    }
    const keys = Object.keys(payload).filter((k) => k !== 'updatedAt' && k !== 'id');
    const invalidKeys = keys.filter((k) => k !== statusField);
    if (invalidKeys.length > 0) {
      throw new Error(`Table '${table}' allows only status updates. Invalid fields: ${invalidKeys.join(', ')}`);
    }

    const allowedStatuses = STATUS_ONLY_TABLES[vertical]?.[table];
    if (
      statusField === 'status' &&
      Array.isArray(allowedStatuses) &&
      payload.status !== undefined &&
      !allowedStatuses.includes(payload.status)
    ) {
      throw new Error(`Invalid status '${payload.status}' for table '${table}'`);
    }
  }
};

module.exports = { assertWritable };
