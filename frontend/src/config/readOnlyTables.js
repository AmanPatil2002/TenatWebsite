/**
 * Read-only and Status-only table configurations for admin panel access.
 */

// Derived/computed fields that should not be directly modifiable by admins
// These are typically calculated from other fields or updated by the system
export const DERIVED_FIELDS = {
  ecommerce: {
    orders: ['totalAmount', 'subtotal', 'taxAmount', 'shippingAmount', 'discountAmount', 'createdAt', 'updatedAt'],
    orderitems: ['lineTotal', 'createdAt', 'updatedAt'],
    payments: ['amount', 'createdAt', 'updatedAt'],
    customers: ['createdAt', 'updatedAt'],
    shipments: ['createdAt', 'updatedAt'],
  },
  restaurant: {
    orders: ['totalAmount', 'subtotal', 'taxAmount', 'createdAt', 'updatedAt'],
    orderitems: ['lineTotal', 'createdAt', 'updatedAt'],
    reservations: ['createdAt', 'updatedAt'],
  },
  hotel: {
    bookings: ['totalAmount', 'nights', 'createdAt', 'updatedAt'],
    invoices: ['totalAmount', 'createdAt', 'updatedAt'],
    roominventory: ['createdAt', 'updatedAt'],
  },
  realestate: {
    propertyinquiries: ['createdAt', 'updatedAt'],
    propertyviewings: ['createdAt', 'updatedAt'],
    propertyfavorites: ['createdAt', 'updatedAt'],
  },
  gym: {
    classbookings: ['createdAt', 'updatedAt'],
    memberpayments: ['amount', 'createdAt', 'updatedAt'],
    attendance: ['createdAt', 'updatedAt'],
  },
  blog: {
    comments: ['createdAt', 'updatedAt'],
  },
  portfolio: {
    testimonials: ['createdAt', 'updatedAt'],
  },
  eventmanagement: {
    registrations: ['createdAt', 'updatedAt'],
    tickets: ['createdAt', 'updatedAt'],
  },
  ngo: {
    donations: ['amount', 'createdAt', 'updatedAt'],
    volunteers: ['createdAt', 'updatedAt'],
    donationreceipts: ['createdAt', 'updatedAt'],
  },
  spa: {
    appointments: ['createdAt', 'updatedAt'],
  },
  lawfirm: {
    caseinquiries: ['createdAt', 'updatedAt'],
    consultations: ['createdAt', 'updatedAt'],
    casedocuments: ['createdAt', 'updatedAt'],
  },
  marketing: {
    leads: ['createdAt', 'updatedAt'],
  },
  salon: {
    salonbookings: ['createdAt', 'updatedAt'],
    payments: ['amount', 'createdAt', 'updatedAt'],
    reviews: ['createdAt', 'updatedAt'],
  },
  news: {
    subscribers: ['createdAt', 'updatedAt'],
  },
  finance: {
    financeapplications: ['createdAt', 'updatedAt'],
    kycdocuments: ['createdAt', 'updatedAt'],
    transactions: ['amount', 'createdAt', 'updatedAt'],
  },
  agriculture: {
    farminquiries: ['createdAt', 'updatedAt'],
    farmorders: ['totalAmount', 'createdAt', 'updatedAt'],
    farmorderitems: ['lineTotal', 'createdAt', 'updatedAt'],
  },
  consulting: {
    consultationrequests: ['createdAt', 'updatedAt'],
  },
  petcare: {
    petappointments: ['createdAt', 'updatedAt'],
    petrecords: ['createdAt', 'updatedAt'],
    petpayments: ['amount', 'createdAt', 'updatedAt'],
  },
  daycare: {
    admissionenquiries: ['createdAt', 'updatedAt'],
    daycarepayments: ['amount', 'createdAt', 'updatedAt'],
  },
  dental: {
    dentalappointments: ['createdAt', 'updatedAt'],
    dentalpatients: ['createdAt', 'updatedAt'],
    treatmentplans: ['createdAt', 'updatedAt'],
    dentalpayments: ['amount', 'createdAt', 'updatedAt'],
  },
  mobileapps: {
    appreviews: ['createdAt', 'updatedAt'],
    downloads: ['createdAt', 'updatedAt'],
    apppurchases: ['amount', 'createdAt', 'updatedAt'],
  },
  interiordesign: {
    designinquiries: ['createdAt', 'updatedAt'],
    sitevisits: ['createdAt', 'updatedAt'],
  },
  school: {
    attendance: ['createdAt', 'updatedAt'],
    examresults: ['createdAt', 'updatedAt'],
    feepayments: ['amount', 'createdAt', 'updatedAt'],
  },
  medical: {
    appointments: ['createdAt', 'updatedAt'],
    patients: ['createdAt', 'updatedAt'],
    prescriptions: ['createdAt', 'updatedAt'],
    doctoravailability: ['createdAt', 'updatedAt'],
  },
};

export const READ_ONLY_TABLES = {
  school: ['attendance', 'examresults', 'feepayments'],
  medical: ['appointments', 'patients', 'prescriptions', 'doctoravailability'],
  ecommerce: [
    'customers', 'addresses', 'carts', 'cartitems', 'orders',
    'orderitems', 'payments', 'shipments', 'productreviews', 'wishlists'
  ],
  restaurant: ['reservations', 'orders', 'orderitems', 'reviews'],
  hotel: ['bookings', 'invoices', 'roominventory', 'hotelreviews'],
  realestate: ['propertyinquiries', 'propertyviewings', 'propertyfavorites'],
  gym: ['classbookings', 'memberpayments', 'attendance'],
  blog: ['comments'],
  portfolio: ['testimonials'],
  eventmanagement: ['registrations', 'tickets'],
  ngo: ['donations', 'volunteers', 'donationreceipts'],
  spa: ['appointments'],
  lawfirm: ['caseinquiries', 'consultations', 'casedocuments'],
  marketing: ['leads'],
  salon: ['salonbookings', 'payments', 'reviews'],
  news: ['subscribers'],
  finance: ['financeapplications', 'kycdocuments', 'transactions'],
  agriculture: ['farminquiries', 'farmorders', 'farmorderitems'],
  consulting: ['consultationrequests'],
  petcare: ['petappointments', 'petrecords', 'petpayments'],
  daycare: ['admissionenquiries', 'daycarepayments'],
  dental: ['dentalappointments', 'dentalpatients', 'treatmentplans', 'dentalpayments'],
  mobileapps: ['appreviews', 'downloads', 'apppurchases'],
  interiordesign: ['designinquiries', 'sitevisits'],
};

export const STATUS_ONLY_TABLES = {
  ecommerce: {
    orders: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    payments: ['pending', 'paid', 'failed', 'refunded'],
    productreviews: ['pending', 'approved', 'rejected'],
  },
  restaurant: {
    reservations: ['pending', 'confirmed', 'cancelled', 'completed'],
    orders: ['pending', 'preparing', 'served', 'completed', 'cancelled'],
  },
  hotel: {
    bookings: ['confirmed', 'cancelled', 'completed'],
  },
  medical: {
    appointments: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
  },
  spa: {
    appointments: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  salon: {
    salonbookings: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  dental: {
    dentalappointments: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  petcare: {
    petappointments: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  blog: {
    comments: ['pending', 'approved', 'spam'],
  },
  portfolio: {
    testimonials: ['active', 'inactive'],
  },
  mobileapps: {
    appreviews: ['pending', 'approved', 'rejected'],
  },
  realestate: {
    propertyinquiries: ['new', 'contacted', 'viewing_scheduled', 'closed'],
    propertyviewings: ['scheduled', 'completed', 'cancelled', 'no_show'],
  },
  lawfirm: {
    caseinquiries: ['new', 'contacted', 'consultation', 'closed'],
    consultations: ['scheduled', 'completed', 'cancelled', 'no_show'],
  },
  finance: {
    financeapplications: ['new', 'in_review', 'approved', 'rejected', 'closed'],
  },
  agriculture: {
    farminquiries: ['new', 'contacted', 'confirmed', 'delivered', 'cancelled'],
    farmorders: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
  },
  eventmanagement: {
    registrations: ['confirmed', 'cancelled', 'attended'],
  },
  ngo: {
    volunteers: ['active', 'inactive'],
  },
};

/**
 * @param {string} vertical
 * @param {string} table
 * @returns {boolean}
 */
export const isReadOnly = (vertical, table) =>
  READ_ONLY_TABLES[vertical]?.includes(table) ?? false;

/**
 * @param {string} vertical
 * @param {string} table
 * @returns {boolean}
 */
export const isStatusOnly = (vertical, table) =>
  !!STATUS_ONLY_TABLES[vertical]?.[table];

/**
 * @param {string} vertical
 * @param {string} table
 * @returns {string|null}
 */
export const getAllowedStatusField = (vertical, table) =>
  isStatusOnly(vertical, table) ? 'status' : null;

/**
 * @param {string} vertical
 * @param {string} table
 * @returns {string[]}
 */
export const getDerivedFields = (vertical, table) =>
  DERIVED_FIELDS[vertical]?.[table] || [];

/**
 * @param {string} vertical
 * @param {string} table
 * @returns {boolean}
 */
export const hasDerivedFields = (vertical, table) =>
  !!DERIVED_FIELDS[vertical]?.[table]?.length;

/**
 * @param {string} vertical
 * @param {string} table
 * @param {string} field
 * @returns {boolean}
 */
export const isDerivedField = (vertical, table, field) =>
  DERIVED_FIELDS[vertical]?.[table]?.includes(field) ?? false;

/**
 * @param {string} vertical
 * @param {string} table
 * @param {'create'|'update'|'delete'} action
 * @param {Object} payload
 */
export const assertWritable = (vertical, table, action, payload = {}) => {
  const readOnly = isReadOnly(vertical, table);
  const statusOnly = isStatusOnly(vertical, table);

  if (readOnly && !statusOnly) {
    if (action === 'create' || action === 'update' || action === 'delete') {
      throw new Error(`Table '${table}' is populated by site users and is read-only in admin`);
    }
  }

  if (statusOnly) {
    if (action === 'create' || action === 'delete') {
      throw new Error(`Table '${table}' is status-only in admin`);
    }

    if (action === 'update') {
      const keys = Object.keys(payload).filter((k) => k !== 'updatedAt');
      const invalidKeys = keys.filter((k) => k !== 'status');
      if (invalidKeys.length > 0) {
        throw new Error(`Table '${table}' allows only status updates. Invalid fields: ${invalidKeys.join(', ')}`);
      }

      const allowedStatuses = STATUS_ONLY_TABLES[vertical][table];
      if (Array.isArray(allowedStatuses) && !allowedStatuses.includes(payload.status)) {
        throw new Error(`Invalid status '${payload.status}' for table '${table}'`);
      }
    }
  }

  // Check for derived fields that cannot be directly modified
  if (action === 'create' || action === 'update') {
    const derivedFields = getDerivedFields(vertical, table);
    if (derivedFields.length > 0) {
      const invalidKeys = Object.keys(payload).filter((k) => derivedFields.includes(k));
      if (invalidKeys.length > 0) {
        throw new Error(
          `Table '${table}' has derived fields that cannot be directly modified: ${invalidKeys.join(', ')}. ` +
          `These fields are calculated automatically.`
        );
      }
    }
  }
};
