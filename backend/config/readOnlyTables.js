/**
 * Read-only and Status-only table configurations for admin panel access.
 * Backend implementation - mirrors frontend logic for server-side enforcement.
 */

// Centralized table access modes. Unknown tables intentionally keep the
// existing default behaviour (full access for authenticated tenant admins).
const TABLE_PERMISSIONS = {
  sitetables: 'hidden',
  sitethemes: 'hidden',
};

// Only list tables that differ from the default (admin full, no public)
const TABLE_ACCESS = {
};

const getAccess = (vertical, table) =>
  TABLE_ACCESS[vertical]?.[String(table || '').toLowerCase()] || null;

// true/false when configured, null = fall back to the old rules
const canPublicSubmit = (vertical, table) =>
  getAccess(vertical, table)?.public ?? null;

const STATUS_FIELD_MAP = {
  appointments: 'status',
  reservations: 'status',
  orders: 'status',
  bookings: 'bookingStatus',
  salonbookings: 'status',
  tablebookings: 'status',
  petappointments: 'status',
  dentalappointments: 'status',
  classbookings: 'status',
  registrations: 'registrationStatus',
  propertyinquiries: 'status',
  propertyviewings: 'status',
  caseinquiries: 'status',
  leads: 'status',
  designinquiries: 'status',
  jewelryinquiries: 'status',
  farminquiries: 'status',
  consultationrequests: 'status',
  admissionenquiries: 'status',
  financeapplications: 'status',
  customorders: 'status',
  jewelryorders: 'orderStatus',
  furnitureorders: 'orderStatus',
  groceryorders: 'status',
  cafeorders: 'status',
  donations: 'paymentStatus',
  volunteers: 'status',
  subscribers: 'status',
  subscriptions: 'status',
  reviews: 'status',
  hotelreviews: 'status',
  productreviews: 'status',
  appreviews: 'status',
  comments: 'status',
  payments: 'paymentStatus',
  enrollment: 'status',
  enrollments: 'status',
};

const STATUS_ONLY_TABLES_BY_NAME = new Set([
  'appointments',
  'reservations',
  'orders',
  'bookings',
  'salonbookings',
  'tablebookings',
  'petappointments',
  'dentalappointments',
  'classbookings',
  'registrations',
  'propertyinquiries',
  'propertyviewings',
  'caseinquiries',
  'leads',
  'designinquiries',
  'jewelryinquiries',
  'farminquiries',
  'consultationrequests',
  'admissionenquiries',
  'financeapplications',
  'customorders',
  'jewelryorders',
  'furnitureorders',
  'groceryorders',
  'cafeorders',
  'donations',
  'volunteers',
  'subscribers',
  'subscriptions',
  'reviews',
  'hotelreviews',
  'productreviews',
  'appreviews',
  'comments',
  'propertyfavorites',
  'watchlist',
  'watchhistory',
  'downloads',
  'tickets',
  'donationreceipts',
  'kycdocuments',
  'casedocuments',
  'attendance',
  'examresults',
  'feepayments',
  'patients',
  'prescriptions',
  'doctoravailability',
  'petrecords',
  'petpayments',
  'dentalpayments',
  'daycarepayments',
  'memberpayments',
  'treatmentplans',
  'dentalpatients',
  'sitevisits',
  'transactions',
  'apppurchases',
]);

const VIEW_ONLY_TABLES_BY_NAME = new Set([
  'customers',
  'addresses',
  'carts',
  'cartitems',
  'wishlists',
  'orderitems',
  'jewelryorderitems',
  'furnitureorderitems',
  'groceryorderitems',
  'cafeorderitems',
  'farmorderitems',
  'payments',
  'petpayments',
  'dentalpayments',
  'daycarepayments',
  'memberpayments',
  'propertyfavorites',
  'watchlist',
  'watchhistory',
  'downloads',
  'tickets',
  'donationreceipts',
  'kycdocuments',
  'casedocuments',
  'attendance',
  'examresults',
  'feepayments',
  'patients',
  'prescriptions',
  'doctoravailability',
  'petrecords',
  'transactions',
  'apppurchases',
  'treatmentplans',
  'dentalpatients',
  'sitevisits',
]);

const normalizeTableName = (table) =>
  String(table || '').trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const getTablePermission = (vertical, table) => {
  const explicit = TABLE_PERMISSIONS[String(table || '').toLowerCase()];
  if (explicit) return explicit;
  const normalized = normalizeTableName(table);
  if ([...STATUS_ONLY_TABLES_BY_NAME].some((name) => normalizeTableName(name) === normalized)) {
    return 'status';
  }
  if ([...VIEW_ONLY_TABLES_BY_NAME].some((name) => normalizeTableName(name) === normalized)) {
    return 'view';
  }
  return 'full';
};

const getStatusField = (vertical, table) =>
  getTablePermission(vertical, table) === 'status'
    ? STATUS_FIELD_MAP[String(table || '').toLowerCase()] || null
    : null;

// Derived/computed fields that should not be directly modifiable by admins
const DERIVED_FIELDS = {
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

const READ_ONLY_TABLES = {
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

const STATUS_ONLY_TABLES = {
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

const isReadOnly = (vertical, table) =>
  READ_ONLY_TABLES[vertical]?.includes(table) ?? false;

const isStatusOnly = (vertical, table) =>
  !!STATUS_ONLY_TABLES[vertical]?.[table];

const getAllowedStatusField = (vertical, table) =>
  isStatusOnly(vertical, table) ? 'status' : null;

const getDerivedFields = (vertical, table) =>
  DERIVED_FIELDS[vertical]?.[table] || [];

const hasDerivedFields = (vertical, table) =>
  !!DERIVED_FIELDS[vertical]?.[table]?.length;

const isDerivedField = (vertical, table, field) =>
  DERIVED_FIELDS[vertical]?.[table]?.includes(field) ?? false;

/**
 * @param {string} vertical
 * @param {string} table
 * @param {'create'|'update'|'delete'} action
 * @param {Object} [payload={}]
 * @param {Object} [options={}]
 * @param {boolean} [options.isFormSubmission=false] - If true, allows operations on read-only tables (e.g., from CKEditor forms)
 */
const assertWritable = (vertical, table, action, payload = {}, options = {}) => {
  void options;
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

  // Preserve legacy vertical-specific restrictions.
  if (readOnly && !statusOnly) {
    if (action === 'create' || action === 'update' || action === 'delete') {
      throw new Error(`Table '${table}' is populated by site users and is read-only in admin`);
    }
  }

  // Priority 2: Status-only tables - block create/delete operations
  // Allow form submissions to create on status-only tables (e.g., CKEditor forms creating orders/payments)
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

  // Priority 4: Status-only tables - validate update operations (only status field allowed)
  if (statusOnly && action === 'update') {
    const keys = Object.keys(payload).filter((k) => k !== 'updatedAt');
    const invalidKeys = keys.filter((k) => k !== 'status');
    if (invalidKeys.length > 0) {
      throw new Error(`Table '${table}' allows only status updates. Invalid fields: ${invalidKeys.join(', ')}`);
    }

    const allowedStatuses = STATUS_ONLY_TABLES[vertical]?.[table];
    if (Array.isArray(allowedStatuses) && payload.status !== undefined && !allowedStatuses.includes(payload.status)) {
      throw new Error(`Invalid status '${payload.status}' for table '${table}'`);
    }
  }
};

module.exports = {
  DERIVED_FIELDS,
  READ_ONLY_TABLES,
  STATUS_ONLY_TABLES,
  TABLE_PERMISSIONS,
  STATUS_FIELD_MAP,
  getTablePermission,
  getStatusField,
  isReadOnly,
  isStatusOnly,
  getAllowedStatusField,
  getDerivedFields,
  hasDerivedFields,
  isDerivedField,
  assertWritable,
  getAccess,
  canPublicSubmit,
};