const db = require('../config/db').promise();
const { tn } = require('../config/provisionSite');

const RESOURCES = {
  // Common tables (all sites)
  headers: [
    'logoUrl', 'siteTitle', 'footerText', 'footerAddress', 'footerPhone',
    'footerEmail', 'copyrightText', 'socialLinks',
  ],
  pages: ['sourcePagesId', 'title', 'page', 'sortOrder'],
  news: ['title', 'imageUrl', 'content', 'status', 'publishedAt'],
  galleries: ['title', 'imageUrl', 'caption', 'altText', 'sortOrder', 'status'],
  slider: ['title', 'imageUrl', 'sortOrder', 'status'],
  employees: ['name', 'email', 'phone', 'jobTitle', 'status'],

  // School pack
  teachers: ['name', 'email', 'phone', 'qualification', 'subjectSpecialty', 'photoUrl', 'joinedOn', 'status'],
  classes: ['name', 'section', 'academicYear', 'classTeacherId', 'status'],
  students: ['admissionNo', 'name', 'classId', 'rollNo', 'gender', 'dob', 'guardianName', 'guardianPhone', 'address', 'photoUrl', 'status'],

  // Medical pack
  departments: ['name', 'description', 'status'],
  doctors: ['departmentId', 'name', 'qualification', 'specialization', 'experienceYears', 'consultationFee', 'bio', 'photoUrl', 'status'],

  // E-commerce pack
  productcategories: ['name', 'description', 'status'],
  products: ['categoryId', 'name', 'sku', 'description', 'price', 'salePrice', 'stock', 'thumbnailUrl', 'attributes', 'status'],

  // Restaurant pack
  menucategories: ['name', 'description', 'sortOrder', 'status'],
  menuitems: ['categoryId', 'name', 'description', 'price', 'imageUrl', 'isVeg', 'isSpecial', 'status'],
  reservations: ['customerName', 'customerEmail', 'customerPhone', 'reservationDate', 'reservationTime', 'partySize', 'specialRequests', 'status'],

  // Hotel pack
  roomtypes: ['name', 'description', 'basePrice', 'maxOccupancy', 'amenities', 'imageUrl', 'status'],
  rooms: ['roomTypeId', 'roomNumber', 'floorNumber', 'status'],
  bookings: ['roomId', 'guestName', 'guestEmail', 'guestPhone', 'checkInDate', 'checkOutDate', 'adults', 'children', 'totalAmount', 'paymentStatus', 'bookingStatus', 'specialRequests'],

  // Real Estate pack
  propertytypes: ['name', 'description'],
  properties: ['propertyTypeId', 'title', 'description', 'listingType', 'price', 'address', 'city', 'state', 'zipCode', 'bedrooms', 'bathrooms', 'area', 'areaUnit', 'yearBuilt', 'features', 'mainImageUrl', 'images', 'status', 'featuredProperty'],
  agents: ['name', 'email', 'phone', 'photoUrl', 'bio', 'licenseNumber', 'specialization', 'status'],

  // Gym pack
  trainers: ['name', 'email', 'phone', 'specialization', 'certification', 'experienceYears', 'photoUrl', 'bio', 'status'],
  membershipplans: ['name', 'description', 'durationMonths', 'price', 'features', 'status'],
  members: ['membershipNo', 'name', 'email', 'phone', 'dob', 'gender', 'planId', 'joinDate', 'expiryDate', 'emergencyContact', 'emergencyPhone', 'photoUrl', 'status'],

  // Blog pack
  blogcategories: ['name', 'slug', 'description', 'status'],
  blogposts: ['categoryId', 'authorId', 'title', 'slug', 'excerpt', 'content', 'featuredImageUrl', 'tags', 'viewCount', 'status', 'publishedAt'],
  comments: ['postId', 'authorName', 'authorEmail', 'content', 'status'],

  // Portfolio pack
  projectcategories: ['name', 'description', 'sortOrder', 'status'],
  projects: ['categoryId', 'title', 'description', 'clientName', 'projectUrl', 'thumbnailUrl', 'images', 'technologies', 'completedDate', 'featured', 'sortOrder', 'status'],
  testimonials: ['clientName', 'clientCompany', 'clientPosition', 'content', 'rating', 'photoUrl', 'featured', 'status'],

  // Event Management pack
  eventtypes: ['name', 'description'],
  events: ['eventTypeId', 'title', 'description', 'venue', 'address', 'startDateTime', 'endDateTime', 'capacity', 'ticketPrice', 'imageUrl', 'organizer', 'contactEmail', 'contactPhone', 'status', 'featured'],
  registrations: ['eventId', 'attendeeName', 'attendeeEmail', 'attendeePhone', 'ticketCount', 'totalAmount', 'paymentStatus', 'registrationStatus'],

  // NGO pack
  causes: ['title', 'description', 'goalAmount', 'raisedAmount', 'imageUrl', 'startDate', 'endDate', 'status', 'featured'],
  donations: ['causeId', 'donorName', 'donorEmail', 'donorPhone', 'amount', 'isAnonymous', 'paymentStatus', 'transactionId'],
  volunteers: ['name', 'email', 'phone', 'address', 'skillsInterests', 'availability', 'photoUrl', 'status', 'joinedDate'],

  // Spa pack
  servicecategories: ['name', 'description', 'sortOrder', 'status'],
  services: ['categoryId', 'name', 'description', 'duration', 'price', 'imageUrl', 'benefits', 'status'],
  appointments: ['serviceId', 'therapistId', 'customerName', 'customerEmail', 'customerPhone', 'appointmentDate', 'appointmentTime', 'specialRequests', 'status'],

  // Law Firm pack
  practiceareas: ['name', 'description', 'sortOrder', 'status'],
  attorneys: ['name', 'email', 'phone', 'practiceAreaId', 'barNumber', 'education', 'experienceYears', 'photoUrl', 'bio', 'status'],
  caseinquiries: ['practiceAreaId', 'clientName', 'clientEmail', 'clientPhone', 'caseDetails', 'status'],
};

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
    `SELECT s.id, s.dbName
       FROM sites s
       JOIN payments p ON p.id = s.paymentId AND p.status = 'captured'
      WHERE s.id = ? AND s.userId = ? AND s.provisionStatus = 'ready'
        AND s.status = 'active' AND s.expiresAt > CURRENT_TIMESTAMP`,
    [siteId, userId],
  );
  if (!site) {
    const error = new Error('Site not found, unavailable, or not owned by this user');
    error.status = 403;
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
      `SELECT s.id, s.dbName
         FROM sites s
         JOIN payments p ON p.id = s.paymentId AND p.status = 'captured'
        WHERE s.id = ? AND s.provisionStatus = 'ready'
          AND s.status = 'active' AND s.expiresAt > CURRENT_TIMESTAMP`,
      [siteId],
    );
    if (!site) {
      const error = new Error('Site is not provisioned or is unavailable');
      error.status = 403;
      throw error;
    }
    return site.dbName;
  }
  return await requireOwnedSite(siteId, req.user.userId);
};

const requireResourceTable = async (siteId, resource) => {
  if (!Object.prototype.hasOwnProperty.call(RESOURCES, resource)) {
    const error = new Error('Unknown resource');
    error.status = 404;
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
  return RESOURCES[resource];
};

const readInput = (body, columns) =>
  Object.fromEntries(
    Object.entries(body && typeof body === 'object' && !Array.isArray(body) ? body : {})
      .filter(([key]) => columns.includes(key)),
  );

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
    await requireResourceTable(siteId, resource);
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
    const columns = await requireResourceTable(siteId, resource);
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
    const columns = await requireResourceTable(siteId, resource);
    const data = readInput(req.body, columns);
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No editable fields were provided' });
    }
    await db.query(
      `UPDATE ${tn(siteId, resource, dbName)} SET ? WHERE id = ?`,
      [data, id],
    );
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
    await requireResourceTable(siteId, resource);
    await db.query(`DELETE FROM ${tn(siteId, resource, dbName)} WHERE id = ?`, [id]);
    return res.json({ message: 'Deleted' });
  } catch (error) {
    return sendError(res, error);
  }
};
