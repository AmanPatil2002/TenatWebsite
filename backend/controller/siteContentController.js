const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");

const ID_PATTERN = /^[1-9]\d{0,19}$/;

const isId = (value) =>
  ID_PATTERN.test(String(value ?? "")) &&
  BigInt(value) <= 18446744073709551615n;

const getSiteId = (req) => {
  const { siteId } = req.params;
  if (!isId(siteId)) throw new HttpError(400, "Invalid site id");
  if (String(req.siteAdmin.siteId) !== String(siteId)) {
    throw new HttpError(403, "This login is not assigned to the requested site");
  }
  return siteId;
};

const ensureActiveSite = async (siteId) => {
  const [[site]] = await db.query(
    `SELECT s.id
       FROM sites s
       JOIN payments p ON p.id = s.paymentId
      WHERE s.id = ? AND s.status = 'active'
        AND s.expiresAt > CURRENT_TIMESTAMP
        AND p.status = 'captured'`,
    [siteId],
  );
  if (!site) throw new HttpError(403, "Site is inactive or expired");
};

const validEmail = (email) =>
  email === null || email === "" ||
  (typeof email === "string" && email.length <= 190 && /^\S+@\S+\.\S+$/.test(email));

const readEmployee = (body, partial = false) => {
  const fields = [];
  const values = [];
  const fieldSpecs = [
    ["name", "name", 150, true],
    ["jobTitle", "jobTitle", 120, true],
    ["email", "email", 190, false],
    ["phone", "phone", 30, false],
  ];

  for (const [input, column, maxLength, required] of fieldSpecs) {
    if (partial && body[input] === undefined) continue;
    const value = typeof body[input] === "string" ? body[input].trim() : "";
    if (required && !value) {
      return { error: `${input} is required` };
    }
    if (value.length > maxLength) {
      return { error: `${input} must be ${maxLength} characters or fewer` };
    }
    if (input === "email" && !validEmail(value)) {
      return { error: "Enter a valid employee email" };
    }
    fields.push(`${column} = ?`);
    values.push(value || null);
  }

  if (!partial || body.status !== undefined) {
    const status = body.status ?? "active";
    if (!["active", "inactive"].includes(status)) {
      return { error: "Status must be active or inactive" };
    }
    fields.push("status = ?");
    values.push(status);
  }
  return { fields, values };
};

const parseCustomFields = (value) => {
  if (value === undefined || value === null || value === "") return {};
  let fields = value;
  if (typeof value === "string") {
    try {
      fields = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return null;
  const entries = Object.entries(fields);
  if (
    entries.length > 30 ||
    entries.some(
      ([key, fieldValue]) =>
        !key.trim() ||
        key.length > 60 ||
        !["string", "number", "boolean"].includes(typeof fieldValue) ||
        String(fieldValue).length > 500,
    )
  ) {
    return null;
  }
  return Object.fromEntries(entries);
};

const readEntry = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const status = body.status ?? "active";
  const price =
    body.price === "" || body.price === null || body.price === undefined
      ? null
      : Number(body.price);
  const customFields = parseCustomFields(body.customFields);

  if (!name || name.length > 190) {
    return { error: "Entry name is required and must be at most 190 characters" };
  }
  if (description.length > 10000) {
    return { error: "Description must be at most 10,000 characters" };
  }
  if (imageUrl.length > 1000) {
    return { error: "Image URL must be at most 1,000 characters" };
  }
  if (
    price !== null &&
    (!Number.isFinite(price) || price < 0 || price > 99999999.99)
  ) {
    return { error: "Price must be a nonnegative amount up to 99,999,999.99" };
  }
  if (!["active", "inactive"].includes(status)) {
    return { error: "Status must be active or inactive" };
  }
  if (!customFields) {
    return {
      error: "Custom fields must contain at most 30 key/value pairs of text, numbers, or booleans",
    };
  }
  return { name, description, imageUrl, price, status, customFields };
};

const getEmployees = async (req, res) => {
  try {
    const siteId = getSiteId(req);
    await ensureActiveSite(siteId);
    const [rows] = await db.query(
      `SELECT id, name, email, phone, jobTitle, status, createdAt, updatedAt
         FROM siteemployees WHERE siteId = ? ORDER BY name, id`,
      [siteId],
    );
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
};

const createEmployee = async (req, res) => {
  try {
    const siteId = getSiteId(req);
    const { error, values } = readEmployee(req.body ?? {});
    if (error) return res.status(400).json({ message: error });
    await ensureActiveSite(siteId);
    const [result] = await db.query(
      `INSERT INTO siteemployees (siteId, name, jobTitle, email, phone, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [siteId, values[0], values[1], values[2], values[3], values[4]],
    );
    return res.status(201).json({ id: result.insertId, message: "Employee created" });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateEmployee = async (req, res) => {
  if (!isId(req.params.employeeId)) {
    return res.status(400).json({ message: "Invalid employee id" });
  }
  try {
    const siteId = getSiteId(req);
    const { error, fields, values } = readEmployee(req.body ?? {}, true);
    if (error) return res.status(400).json({ message: error });
    if (!fields.length) {
      return res.status(400).json({ message: "Provide at least one employee field to update" });
    }
    await ensureActiveSite(siteId);
    const [result] = await db.query(
      `UPDATE siteemployees SET ${fields.join(", ")}
        WHERE id = ? AND siteId = ?`,
      [...values, req.params.employeeId, siteId],
    );
    if (!result.affectedRows) throw new HttpError(404, "Employee not found");
    return res.json({ message: "Employee updated" });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteEmployee = async (req, res) => {
  if (!isId(req.params.employeeId)) {
    return res.status(400).json({ message: "Invalid employee id" });
  }
  try {
    const siteId = getSiteId(req);
    await ensureActiveSite(siteId);
    const [result] = await db.query(
      "DELETE FROM siteemployees WHERE id = ? AND siteId = ?",
      [req.params.employeeId, siteId],
    );
    if (!result.affectedRows) throw new HttpError(404, "Employee not found");
    return res.json({ message: "Employee deleted" });
  } catch (error) {
    return sendError(res, error);
  }
};

const getEntries = async (req, res) => {
  try {
    const siteId = getSiteId(req);
    await ensureActiveSite(siteId);
    const [rows] = await db.query(
      `SELECT e.id, e.sitePageId, e.name, e.description, e.price,
              e.imageUrl, e.status, e.customFields, e.createdAt, e.updatedAt,
              sp.title AS pageTitle
         FROM siteentries e
         JOIN sitepages sp ON sp.id = e.sitePageId AND sp.siteId = e.siteId
        WHERE e.siteId = ?
        ORDER BY sp.sortOrder, sp.title, e.name`,
      [siteId],
    );
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
};

const createEntry = async (req, res) => {
  const { sitePageId } = req.body ?? {};
  if (!isId(sitePageId)) {
    return res.status(400).json({ message: "Choose a valid site page" });
  }
  const entry = readEntry(req.body ?? {});
  if (entry.error) return res.status(400).json({ message: entry.error });

  try {
    const siteId = getSiteId(req);
    await ensureActiveSite(siteId);
    const [result] = await db.query(
      `INSERT INTO siteentries
         (siteId, sitePageId, name, description, price, imageUrl, status, customFields)
       SELECT ?, sp.id, ?, ?, ?, ?, ?, ?
         FROM sitepages sp
        WHERE sp.id = ? AND sp.siteId = ?`,
      [
        siteId,
        entry.name,
        entry.description || null,
        entry.price,
        entry.imageUrl || null,
        entry.status,
        JSON.stringify(entry.customFields),
        sitePageId,
        siteId,
      ],
    );
    if (!result.affectedRows) throw new HttpError(404, "Page not found for this site");
    return res.status(201).json({ id: result.insertId, message: "Business entry created" });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateEntry = async (req, res) => {
  if (!isId(req.params.entryId)) {
    return res.status(400).json({ message: "Invalid entry id" });
  }
  if (req.body?.sitePageId !== undefined && !isId(req.body.sitePageId)) {
    return res.status(400).json({ message: "Choose a valid site page" });
  }
  const entry = readEntry(req.body ?? {});
  if (entry.error) return res.status(400).json({ message: entry.error });

  try {
    const siteId = getSiteId(req);
    await ensureActiveSite(siteId);
    const pageId = req.body.sitePageId;
    const [result] = await db.query(
      `UPDATE siteentries e
         JOIN sitepages sp ON sp.id = ? AND sp.siteId = e.siteId
          SET e.sitePageId = sp.id, e.name = ?, e.description = ?,
              e.price = ?, e.imageUrl = ?, e.status = ?, e.customFields = ?
        WHERE e.id = ? AND e.siteId = ?`,
      [
        pageId,
        entry.name,
        entry.description || null,
        entry.price,
        entry.imageUrl || null,
        entry.status,
        JSON.stringify(entry.customFields),
        req.params.entryId,
        siteId,
      ],
    );
    if (!result.affectedRows) throw new HttpError(404, "Entry or page not found");
    return res.json({ message: "Business entry updated" });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteEntry = async (req, res) => {
  if (!isId(req.params.entryId)) {
    return res.status(400).json({ message: "Invalid entry id" });
  }
  try {
    const siteId = getSiteId(req);
    await ensureActiveSite(siteId);
    const [result] = await db.query(
      "DELETE FROM siteentries WHERE id = ? AND siteId = ?",
      [req.params.entryId, siteId],
    );
    if (!result.affectedRows) throw new HttpError(404, "Business entry not found");
    return res.json({ message: "Business entry deleted" });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
};
