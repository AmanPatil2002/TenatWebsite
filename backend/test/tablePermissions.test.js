const {
  getTablePermission,
  getStatusField,
  TABLE_PERMISSIONS,
} = require('../config/readOnlyTables');
const { assertWritable } = require('../config/permissions');

describe('centralized table permissions', () => {
  test('system tables are hidden', () => {
    expect(TABLE_PERMISSIONS.sitetables).toBe('hidden');
    expect(TABLE_PERMISSIONS.sitethemes).toBe('hidden');
    expect(getTablePermission('school', 'sitetables')).toBe('hidden');
    expect(getTablePermission('school', 'sitethemes')).toBe('hidden');
  });

  test('unknown tables preserve full access', () => {
    expect(getTablePermission('school', 'customresource')).toBe('full');
  });

  test('school academic records retain full admin CRUD access', () => {
    for (const table of ['attendance', 'examresults', 'feepayments']) {
      expect(getTablePermission('school', table)).toBe('full');
      expect(() =>
        assertWritable('school', table, 'create', {})
      ).not.toThrow();
      expect(() =>
        assertWritable('school', table, 'update', {})
      ).not.toThrow();
      expect(() =>
        assertWritable('school', table, 'delete', {})
      ).not.toThrow();
    }
  });

  test('status-only tables reject create and delete', () => {
    expect(getTablePermission('hotel', 'bookings')).toBe('status');
    expect(() =>
      assertWritable('hotel', 'bookings', 'create', {})
    ).toThrow(/status-only/i);
    expect(() =>
      assertWritable('hotel', 'bookings', 'delete', {})
    ).toThrow(/status-only/i);
  });

  test('status fields are table-specific', () => {
    expect(getStatusField('hotel', 'bookings')).toBe('bookingStatus');
    expect(getStatusField('jewelry', 'jewelryorders')).toBe('orderStatus');
    expect(getStatusField('ngo', 'donations')).toBe('paymentStatus');
    expect(getStatusField('eventmanagement', 'registrations')).toBe('registrationStatus');
  });

  test('status updates reject customer fields and permit only status fields', () => {
    expect(() =>
      assertWritable('hotel', 'bookings', 'update', {
        guestName: 'Changed',
        bookingStatus: 'confirmed',
      })
    ).toThrow(/only status updates/i);

    expect(() =>
      assertWritable('hotel', 'bookings', 'update', {
        bookingStatus: 'confirmed',
      })
    ).not.toThrow();
  });
});
