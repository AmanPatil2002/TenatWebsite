const db = require('../config/db').promise();
const { tn } = require('../config/provisionSite');
const { getActiveManagedSite, getPublicSite } = require('./site/access');
const packs = require('../config/packs');
const { assertWritable } = require('../config/permissions');
const {
  DERIVED_FIELDS,
  getTablePermission,
  getStatusField,
  canPublicSubmit,
} = require('../config/readOnlyTables');
const SYSTEM_COLUMNS = new Set(['id', 'createdAt', 'updatedAt']);
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Per-site uploads root: /backend/uploads/sites/ (matches express.static in server.js)
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads', 'sites');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const imageStorage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const siteId = req.params.siteId;
    const siteDir = path.join(UPLOADS_ROOT, siteId);
    if (!fs.existsSync(siteDir)) {
      fs.mkdirSync(siteDir, { recursive: true });
    }
    callback(null, siteDir);
  },
  filename: (_req, file, callback) =>
    callback(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`),
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'));
    }
    callback(null, true);
  },
});

const ID_PATTERN = /^[1-9]\d{0,19}$/;
const isId = (value) =>
  ID_PATTERN.test(String(value ?? '')) &&
  BigInt(value) <= 18446744073709551615n;

const sendError = (res, error) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error('Site data database error:', error);
  return res.status(500).json({ message: 'Could not access site data' });
};

const requireManagedSite = async (siteId, req) => {
  if (!isId(siteId)) {
    const error = new Error('Invalid site id');
    error.status = 400;
    throw error;
  }
  const site = await getActiveManagedSite(siteId, req);
  return site;
};

const parseEnumValues = (columnType) =>
  [...String(columnType).matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(([, value]) =>
    value.replace(/\\'/g, "'").replace(/\\\\/g, "\\"),
  );

const toColumnMetadata = (column, tableName) => {
  const generated = /auto_increment|generated/i.test(column.extra || '');
  const systemColumn = SYSTEM_COLUMNS.has(column.name);
  // parentId on the pages table is set during provisioning and must not be edited
  const isLockedParentId =
    tableName === 'pages' && column.name === 'parentId';
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
    editable: !systemColumn && !generated && !isLockedParentId,
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

  return columns.map((column) => toColumnMetadata(column, resource));
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
    const site = await requireManagedSite(siteId, req);
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
      [site.dbName, siteId],
    );
    const commonTables = new Set(packs.common().map(([name]) => name));
    const resources = {};

    for (const row of rows) {
      const resource = (resources[row.baseName] ||= {
        isCommon: commonTables.has(row.baseName),
        columns: [],
      });
      resource.columns.push(toColumnMetadata(row, row.baseName));
    }

    const backendOrigin = `http://localhost:${process.env.PORT || 5000}`;
    return res.json({
      resources,
      packKey: site.packKey,
      vertical: site.packKey,
      assetOrigin: backendOrigin
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.sections = async (req, res) => {
  try {
    const site = await requireManagedSite(req.params.siteId, req);
    const [rows] = await db.query(
      'SELECT baseName FROM sitetables WHERE siteId = ? ORDER BY baseName',
      [req.params.siteId],
    );
    const backendOrigin = `http://localhost:${process.env.PORT || 5000}`;
    const sections = rows.map(({ baseName }) => baseName);
    // Return array for backward compatibility, but also include assetOrigin if requested
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json') && req.query.includeOrigin === 'true') {
      return res.json({ sections, assetOrigin: backendOrigin });
    }
    return res.json(sections);
  } catch (error) {
    return sendError(res, error);
  }
};

const SAFE_COLUMN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

exports.list = async (req, res) => {
  const { siteId, resource } = req.params;
  const { dependsOn, dependsOnValue } = req.query;
  try {
    const site = await requireManagedSite(siteId, req);
    await requireResourceTable(siteId, resource, site.dbName);

    let whereClause = '';
    const params = [];
    if (
      dependsOn &&
      SAFE_COLUMN.test(dependsOn) &&
      dependsOnValue !== undefined &&
      dependsOnValue !== ''
    ) {
      whereClause = ` WHERE ${dependsOn} = ?`;
      params.push(dependsOnValue);
    }

    const [rows] = await db.query(
      `SELECT * FROM ${tn(siteId, resource, site.dbName)}${whereClause} ORDER BY id DESC`,
      params,
    );
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.create = async (req, res) => {
  const { siteId, resource } = req.params;
  try {
    const site = await requireManagedSite(siteId, req);
    const vertical = site.packKey;
    // Enforce read-only / status-only table restrictions
    assertWritable(vertical, resource, 'create', req.body);

    const columns = await requireResourceTable(siteId, resource, site.dbName);
    const data = readInput(req.body, columns);
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No editable fields were provided' });
    }
    const [result] = await db.query(
      `INSERT INTO ${tn(siteId, resource, site.dbName)} SET ?`,
      [data],
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.message.includes('read-only') || error.message.includes('status-only') || error.message.includes('allows only')) {
      return res.status(403).json({ message: error.message });
    }
    return sendError(res, error);
  }
};

exports.update = async (req, res) => {
  const { siteId, resource, id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: 'Invalid record id' });
  try {
    const site = await requireManagedSite(siteId, req);
    const vertical = site.packKey;
    // Enforce read-only / status-only table restrictions
    assertWritable(vertical, resource, 'update', req.body);

    const columns = await requireResourceTable(siteId, resource, site.dbName);
    const data = readInput(req.body, columns);
    const statusField = getStatusField(vertical, resource);
    if (statusField && Object.prototype.hasOwnProperty.call(data, statusField)) {
      const statusColumn = columns.find((column) => column.name === statusField);
      if (statusColumn?.enumValues?.length && !statusColumn.enumValues.includes(data[statusField])) {
        return res.status(400).json({
          message: `Invalid value '${data[statusField]}' for ${statusField}`,
        });
      }
    }
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No editable fields were provided' });
    }
    const [result] = await db.query(
      `UPDATE ${tn(siteId, resource, site.dbName)} SET ? WHERE id = ?`,
      [data, id],
    );
    if (result.affectedRows === 0) {
      const [[record]] = await db.query(
        `SELECT id FROM ${tn(siteId, resource, site.dbName)} WHERE id = ? LIMIT 1`,
        [id],
      );
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }
    }
    return res.json({ message: 'Updated' });
  } catch (error) {
    if (error.message.includes('read-only') || error.message.includes('status-only') || error.message.includes('allows only') || error.message.includes('Invalid status')) {
      return res.status(403).json({ message: error.message });
    }
    return sendError(res, error);
  }
};

exports.remove = async (req, res) => {
  const { siteId, resource, id } = req.params;
  if (!isId(id)) return res.status(400).json({ message: 'Invalid record id' });
  try {
    const site = await requireManagedSite(siteId, req);
    const vertical = site.packKey;
    // Enforce read-only / status-only table restrictions
    assertWritable(vertical, resource, 'delete', req.body);

    await requireResourceTable(siteId, resource, site.dbName);
    const [result] = await db.query(
      `DELETE FROM ${tn(siteId, resource, site.dbName)} WHERE id = ?`,
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    return res.json({ message: 'Deleted' });
  } catch (error) {
    if (error.message.includes('read-only') || error.message.includes('status-only') || error.message.includes('allows only')) {
      return res.status(403).json({ message: error.message });
    }
    return sendError(res, error);
  }
};

/**
 * Upload an image for a resource.
 * Returns a JSON response compatible with CKEditor and the frontend ImageUploadField:
 * { uploaded: 1, fileName: string, url: string }
 */
exports.uploadImage = async (req, res) => {
  const { siteId, resource } = req.params;
  try {
    const site = await requireManagedSite(siteId, req);
    const vertical = site.packKey;
    // Enforce write permissions for the resource
    assertWritable(vertical, resource, 'create', {});

    await requireResourceTable(siteId, resource, site.dbName);

    imageUpload.single('image')(req, res, (error) => {
      if (error) {
        const message =
          error.code === 'LIMIT_FILE_SIZE'
            ? 'File is too large (max 5 MB).'
            : error.message || 'Upload failed.';
        return res.status(400).json({ uploaded: 0, error: { message } });
      }

      if (!req.file) {
        return res.status(400).json({
          uploaded: 0,
          error: { message: 'No file was uploaded.' },
        });
      }

      const fileUrl = `/uploads/sites/${req.params.siteId}/${req.file.filename}`;
      return res.json({
        uploaded: 1,
        fileName: req.file.originalname,
        url: fileUrl,
      });
    });
  } catch (error) {
    if (error.message.includes('read-only') || error.message.includes('status-only') || error.message.includes('allows only')) {
      return res.status(403).json({ message: error.message });
    }
    return sendError(res, error);
  }
};

const PUBLIC_PRIVATE_RESOURCE_NAMES = new Set([
  'customers','addresses','carts','cartitems','wishlists','orderitems',
  'jewelryorderitems','furnitureorderitems','groceryorderitems',
  'cafeorderitems','farmorderitems','payments','petpayments',
  'dentalpayments','daycarepayments','memberpayments','propertyfavorites',
  'watchlist','watchhistory','downloads','tickets','donationreceipts',
  'kycdocuments','casedocuments',
  'attendance','examresults','feepayments','patients','prescriptions',
  'doctoravailability','petrecords','petpayments','dentalpatients',
  'treatmentplans','daycarepayments','memberpayments','transactions',
  'apppurchases','kycdocuments','casedocuments',
  'cafeorderitems', 'farmorderitems', 'jewelryorderitems', 'furnitureorderitems', 'groceryorderitems',
  'petpayments', 'dentalpayments', 'daycarepayments', 'memberpayments',
  'downloads', 'tickets', 'donationreceipts', 'kycdocuments', 'casedocuments', 'transactions', 'apppurchases',
  'attendance', 'examresults', 'feepayments', 'patients', 'prescriptions', 'doctoravailability', 'petrecords',
  'dentalpatients', 'treatmentplans', 'sitevisits', 'enrollments', 'daycarepayments',
]);

exports.publicSections = async (req, res) => {
  try {
    const site = await getPublicSite(req.params.siteId);
    const [rows] = await db.query(
      'SELECT baseName FROM sitetables WHERE siteId = ? ORDER BY baseName',
      [req.params.siteId],
    );
    return res.json(
      rows
        .map(({ baseName }) => baseName)
        .filter((name) =>
          !PUBLIC_PRIVATE_RESOURCE_NAMES.has(name) &&
          !['sitetables','sitethemes','headers','pages'].includes(name)
        ),
    );
  } catch (error) {
    return sendError(res, error);
  }
};

exports.publicList = async (req, res) => {
  const { siteId, resource } = req.params;
  try {
    if (
      PUBLIC_PRIVATE_RESOURCE_NAMES.has(resource) ||
      ['sitetables','sitethemes','headers','pages'].includes(resource)
    ) {
      return res.status(403).json({ message: 'This resource is private' });
    }
    const site = await getPublicSite(siteId);
    await requireResourceTable(siteId, resource, site.dbName);
    const [rows] = await db.query(
      `SELECT * FROM ${tn(siteId, resource, site.dbName)} ORDER BY id DESC`,
    );
    const moderated = new Set([
      'reviews','hotelreviews','productreviews','appreviews','comments',
    ]);
    const visible = moderated.has(resource)
      ? rows.filter((row) => {
          const approval =
            row.isApproved !== undefined ? row.isApproved :
            row.approved !== undefined ? row.approved :
            row.status;
          return approval === true ||
            approval === 1 ||
            approval === '1' ||
            String(approval).toLowerCase() === 'approved';
        })
      : rows;
    return res.json(visible);
  } catch (error) {
    return sendError(res, error);
  }
};

const PUBLIC_BLOCKED_VIEW_TABLES = new Set([
  'carts','cartitems','orderitems','jewelryorderitems','furnitureorderitems',
  'groceryorderitems','cafeorderitems','farmorderitems','payments','petpayments',
  'dentalpayments','daycarepayments','memberpayments','downloads','tickets',
  'donationreceipts','kycdocuments','casedocuments','transactions','apppurchases',
  'sitetables','sitethemes','headers','pages',
  'petrecords', 'dentalpatients', 'treatmentplans', 'sitevisits', 'enrollments', 'daycarepayments',
]);

const PUBLIC_RESOURCE_NAMES = new Set([
  'appointments','reservations','orders','bookings','salonbookings',
  'tablebookings','petappointments','dentalappointments','classbookings',
  'registrations','propertyinquiries','propertyviewings','caseinquiries',
  'leads','designinquiries','jewelryinquiries','farminquiries',
  'consultationrequests','admissionenquiries','financeapplications',
  'customorders','jewelryorders','furnitureorders','groceryorders',
  'cafeorders','donations','volunteers','subscribers','subscriptions',
  'reviews','hotelreviews','productreviews','appreviews','comments',
  'farmproducts', 'consultingservices', 'consultants', 'petservices', 'veterinarians', 'daycareprograms',
  'caregivers', 'dentalservices', 'dentists', 'appcategories', 'mobileapps', 'designservices',
  'designprojects', 'moodboards', 'artists', 'albums', 'tracks', 'eventshows', 'genres', 'movies',
  'subscriptionplans', 'episodes', 'gamecategories', 'games', 'teams', 'tournaments', 'players',
  'teamrosters', 'matches', 'matchresults', 'jewelrycategories', 'jewelryproducts', 'goldrates',
  'furniturecategories', 'furnitureproducts', 'grocerycategories', 'groceryproducts', 'deliveryslots',
  'cafecategories', 'cafeitems',
]);

const PUBLIC_PROTECTED_FIELDS = new Set([
  'id','siteId','userId','createdAt','updatedAt',
  'status','bookingStatus','orderStatus','paymentStatus',
  'registrationStatus','approvalStatus','isApproved','approved',
  'totalAmount','subtotal','taxAmount','shippingAmount','discountAmount',
  'grandTotal','amount','lineTotal','price','salePrice',
]);

exports.publicSubmit = async (req, res) => {
  const { siteId, resource } = req.params;
  try {
    const site = await getPublicSite(siteId);
    const permission = getTablePermission(site.packKey, resource);

    if (permission === 'hidden') {
      return res.status(403).json({ message: 'This resource does not accept public submissions' });
    }

    const publicRule = canPublicSubmit(site.packKey, resource);
    const isSubmittable =
      publicRule !== null
        ? publicRule
        : PUBLIC_RESOURCE_NAMES.has(resource) ||
          (permission === 'view' && !PUBLIC_BLOCKED_VIEW_TABLES.has(resource));

    if (!isSubmittable || (publicRule === null && permission !== 'status' && permission !== 'view')) {
      return res.status(403).json({ message: 'This resource does not accept public submissions' });
    }

    const columns = await requireResourceTable(siteId, resource, site.dbName);
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body
      : {};

    if (typeof body.website === 'string' && body.website.trim()) {
      return res.status(400).json({ message: 'Submission rejected' });
    }

    const allowed = new Set(
      columns
        .filter((column) =>
          column.editable &&
          !PUBLIC_PROTECTED_FIELDS.has(column.name) &&
          !column.references
        )
        .map((column) => column.name),
    );

    const unknown = Object.keys(body).filter((key) => key !== 'website' && !allowed.has(key));
    if (unknown.length) {
      return res.status(400).json({
        message: `Unsupported field(s): ${unknown.join(', ')}`,
      });
    }

    const data = {};
    for (const column of columns) {
      if (!allowed.has(column.name)) continue;
      let value = body[column.name];

      if (value === undefined || value === null || String(value).trim() === '') {
        if (column.required) {
          return res.status(400).json({ message: `${column.name} is required` });
        }
        continue;
      }

      if (typeof value === 'string') {
        value = value.replace(/[^\t\n\r\x20-\x7E\u00A0-\uFFFF]/g, '').trim();
        if (value.length > 2000) {
          return res.status(400).json({ message: `${column.name} is too long` });
        }
      }

      if (column.dataType === 'enum') {
        if (!column.enumValues.includes(String(value))) {
          return res.status(400).json({ message: `Invalid value for ${column.name}` });
        }
      } else if (['int','integer','bigint','tinyint','smallint','mediumint','decimal','numeric','float','double'].includes(column.dataType)) {
        if (value === '' || Number.isNaN(Number(value))) {
          return res.status(400).json({ message: `Invalid number for ${column.name}` });
        }
        value = Number(value);
      } else if (/email/i.test(column.name) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return res.status(400).json({ message: `Invalid email for ${column.name}` });
      }

      data[column.name] = value;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No supported fields were provided' });
    }

    const [result] = await db.query(
      `INSERT INTO ${tn(siteId, resource, site.dbName)} SET ?`,
      [data],
    );
    return res.status(201).json({
      id: result.insertId,
      message: 'Submission received successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};
