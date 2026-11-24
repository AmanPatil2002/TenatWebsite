import { useMemo } from 'react';
import {
  STATUS_ONLY_TABLES,
  isReadOnly,
  getDerivedFields,
  hasDerivedFields,
  getTablePermission,
  getStatusField,
} from '../config/readOnlyTables';

/**
 * Custom hook to determine table permissions for admin panel.
 *
 * @param {string} vertical - The vertical identifier (e.g., 'ecommerce', 'school', 'restaurant')
 * @param {string} table - The table/resource name
 * @returns {Object} Permission flags and helper functions
 */
export const useTablePermissions = (vertical, table) => {
  const permissions = useMemo(() => {
    // Fail closed: if vertical or table is missing, deny all write operations
    if (!vertical || !table) {
      return {
        isReadOnly: true,
        isStatusOnly: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        allowedStatusField: null,
        allowedStatuses: [],
        derivedFields: [],
        hasDerivedFields: false,
        getRestrictionMessage: () => 'Table permissions unavailable',
      };
    }

    const mode = getTablePermission(vertical, table);
    const readOnly = mode === 'view' || (mode === 'full' && isReadOnly(vertical, table));
    const statusOnly = mode === 'status';
    const allowedStatusField = getStatusField(vertical, table);
    const allowedStatuses = STATUS_ONLY_TABLES[vertical]?.[table] || [];
    const derivedFields = getDerivedFields(vertical, table);
    const hasDerived = hasDerivedFields(vertical, table);

    let message = null;
    if (readOnly && !statusOnly) {
      message = `Table '${table}' is populated by site users and is read-only in admin`;
    } else if (statusOnly) {
      message = `Table '${table}' allows only status updates`;
    } else if (hasDerived) {
      message = `Table '${table}' has derived fields that are calculated automatically: ${derivedFields.join(', ')}`;
    }

    return {
      mode,
      isReadOnly: readOnly && !statusOnly,
      isStatusOnly: statusOnly,
      canCreate: !readOnly && !statusOnly,
      canUpdate: !readOnly,
      canDelete: !readOnly && !statusOnly,
      allowedStatusField,
      allowedStatuses,
      derivedFields,
      hasDerivedFields: hasDerived,
      getRestrictionMessage: () => message,
    };
  }, [vertical, table]);

  return permissions;
};

/**
 * Hook to check permissions for multiple tables at once.
 * Useful for navigation menus or bulk operations.
 *
 * @param {string} vertical - The vertical identifier
 * @param {string[]} tables - Array of table names
 * @returns {Object} Map of table -> permission object
 */
export const useTablePermissionsMap = (vertical, tables = []) => {
  return useMemo(() => {
    const map = {};
    for (const table of tables) {
      const mode = getTablePermission(vertical, table);
      const readOnly = mode === 'view';
      const statusOnly = mode === 'status';
      map[table] = {
        mode,
        isReadOnly: readOnly,
        isStatusOnly: statusOnly,
        isHidden: mode === 'hidden',
        canCreate: mode === 'full',
        canUpdate: mode === 'full' || mode === 'status',
        canDelete: mode === 'full',
        allowedStatusField: getStatusField(vertical, table),
        allowedStatuses: STATUS_ONLY_TABLES[vertical]?.[table] || [],
        derivedFields: getDerivedFields(vertical, table),
        hasDerivedFields: hasDerivedFields(vertical, table),
        getRestrictionMessage: () => (
          mode === 'view'
            ? `Table '${table}' is read-only`
            : mode === 'status'
              ? `Table '${table}' allows only status updates`
              : mode === 'hidden'
                ? `Table '${table}' is hidden`
                : null
        ),
      };
    }
    return map;
  }, [vertical, tables]);
};

export default useTablePermissions;