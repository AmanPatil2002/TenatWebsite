import { useMemo } from 'react';
import { STATUS_ONLY_TABLES, isReadOnly, isStatusOnly, getAllowedStatusField, getDerivedFields, hasDerivedFields } from '../config/readOnlyTables';

/**
 * Custom hook to determine table permissions for admin panel.
 *
 * @param {string} vertical - The vertical identifier (e.g., 'ecommerce', 'school', 'restaurant')
 * @param {string} table - The table/resource name
 * @returns {Object} Permission flags and helper functions
 */
export const useTablePermissions = (vertical, table) => {
  const permissions = useMemo(() => {
    if (!vertical || !table) {
      return {
        isReadOnly: false,
        isStatusOnly: false,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        allowedStatusField: null,
        allowedStatuses: [],
        derivedFields: [],
        hasDerivedFields: false,
        getRestrictionMessage: () => null,
      };
    }

    const readOnly = isReadOnly(vertical, table);
    const statusOnly = isStatusOnly(vertical, table);
    const allowedStatusField = getAllowedStatusField(vertical, table);
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
  const permissionsMap = useMemo(() => {
    const map = {};
    for (const table of tables) {
      map[table] = useTablePermissions(vertical, table);
    }
    return map;
  }, [vertical, tables]);

  return permissionsMap;
};

export default useTablePermissions;