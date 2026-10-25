const db = require("../config/db");

const isAdmin = (req) =>
  !!req.user && req.user.role === "admin";

// Safely validate a BIGINT UNSIGNED id. Never throws.
const validId = (id) => {
  if (typeof id !== "string") return false;
  if (!/^[1-9]\d*$/.test(id)) return false;
  try {
    return BigInt(id) <= 18446744073709551615n;
  } catch {
    return false;
  }
};

const STATUSES = ["draft", "published", "archived"];

const SELECT_COLUMNS = `t.templateId, t.categoryId, c.name AS categoryName, t.name, t.language,
  t.shortDescription, t.description, t.thumbnailUrl, t.demoUrl, t.domainLink, t.price,
  t.currency, t.validityDays, t.status, t.createdBy, t.createdAt, t.updatedAt`;

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// Escape LIKE wildcards in user input.
const escapeLike = (s) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

// Validates and normalises template fields.
// partial=false (add): categoryId, name and price required, defaults filled in.
// partial=true (update): only fields present in body are checked.
// Returns { error } or { data }.
const cleanTemplate = (body, partial) => {
  if (!isPlainObject(body)) return { error: "Invalid request body" };

  const data = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("categoryId")) {
    const raw = body.categoryId;
    const asStr = typeof raw === "number" ? String(raw) : raw;
    if (typeof asStr !== "string" || !validId(asStr)) {
      return { error: "A valid categoryId is required" };
    }
    data.categoryId = asStr;
  }

  if (!partial || has("name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return { error: "Name is required" };
    if (name.length > 150) return { error: "Name must be 150 characters or fewer" };
    data.name = name;
  }

  // optional text columns: [column, max length (null = TEXT), must be http(s) link]
  const textFields = [
    ["language", null, false],
    ["shortDescription", 300, false],
    ["description", null, false],
    ["thumbnailUrl", 500, true],
    ["demoUrl", 500, true],
    ["domainLink", 255, false],
  ];
  for (const [key, max, isUrl] of textFields) {
    if (!has(key)) continue;
    const raw = body[key];
    if (raw !== null && typeof raw !== "string") {
      return { error: `${key} must be a string` };
    }
    const value = typeof raw === "string" && raw.trim() ? raw.trim() : null;
    if (value && max && value.length > max) {
      return { error: `${key} must be ${max} characters or fewer` };
    }
    if (value && isUrl && !/^https?:\/\/\S+$/i.test(value)) {
      return { error: `${key} must be a valid http(s) link` };
    }
    data[key] = value;
  }

  if (!partial || has("price")) {
    const priceValue =
      typeof body.price === "number" || typeof body.price === "string"
        ? String(body.price).trim()
        : "";
    const price = Number(priceValue);
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(priceValue) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 99999999.99
    ) {
      return { error: "Price must be positive, at most 99999999.99, and have no more than two decimal places" };
    }
    data.price = price.toFixed(2);
  }

  if (has("currency")) {
    if (
      typeof body.currency !== "string" ||
      !/^[A-Za-z]{3}$/.test(body.currency.trim())
    ) {
      return { error: "Currency must be a 3-letter code, e.g. INR" };
    }
    data.currency = body.currency.trim().toUpperCase();
  }

  if (has("validityDays")) {
    const days = Number(body.validityDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return {
        error: "Validity must be a whole number of days from 1 to 3650",
      };
    }
    data.validityDays = days;
  }

  if (has("status")) {
    if (!STATUSES.includes(body.status)) {
      return { error: "Status must be draft, published or archived" };
    }
    data.status = body.status;
  }

  return { data };
};

// Public + admin list.
// Filters: ?categoryId= ?q= ?status= (admin only)
//          ?sort=newest|price_asc|price_desc|name
// Paging:  ?page= ?limit= (default 20, max 100). Total count in X-Total-Count.
const getTemplates = (req, res) => {
  const where = [];
  const values = [];

  if (!isAdmin(req)) {
    where.push("t.status='published'");
  } else if (STATUSES.includes(req.query.status)) {
    where.push("t.status=?");
    values.push(req.query.status);
  }

  if (req.query.categoryId !== undefined) {
    const cid =
      typeof req.query.categoryId === "number"
        ? String(req.query.categoryId)
        : req.query.categoryId;
    if (typeof cid !== "string" || !validId(cid)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    where.push("t.categoryId=?");
    values.push(cid);
  }

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where.push("(t.name LIKE ? OR t.shortDescription LIKE ?)");
    values.push(pattern, pattern);
  }

  const orders = {
    newest: "t.createdAt DESC",
    price_asc: "t.price ASC",
    price_desc: "t.price DESC",
    name: "t.name ASC",
  };
  const orderBy = orders[req.query.sort] || orders.newest;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";

  db.query(
    `SELECT COUNT(*) AS total FROM template t${whereSql}`,
    values,
    (countErr, countResult) => {
      if (countErr) {
        console.error("getTemplates count error:", countErr);
        return res.status(500).json({ message: "Internal server error" });
      }

      db.query(
        `SELECT ${SELECT_COLUMNS}
         FROM template t
         JOIN categories c ON c.categoryId = t.categoryId
         ${whereSql}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
        (err, result) => {
          if (err) {
            console.error("getTemplates select error:", err);
            return res.status(500).json({ message: "Internal server error" });
          }
          res.set("X-Total-Count", String(countResult[0].total));
          res.set("X-Page", String(page));
          res.set("X-Limit", String(limit));
          res.json(result);
        }
      );
    }
  );
};

// One template. Non-admins only see it if it is published.
const getTemplate = (req, res) => {
  const templateId = req.params.templateId;
  if (!validId(templateId)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }

  let sql = `SELECT ${SELECT_COLUMNS}
             FROM template t
             JOIN categories c ON c.categoryId = t.categoryId
             WHERE t.templateId=?`;
  const values = [templateId];
  if (!isAdmin(req)) {
    sql += " AND t.status='published'";
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("getTemplate error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(result[0]);
  });
};

// Admin: add a template
const addTemplate = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const { error, data } = cleanTemplate(req.body, false);
  if (error) return res.status(400).json({ message: error });

  data.status = data.status || "draft";
  if (data.status === "published" && !data.demoUrl) {
    return res
      .status(400)
      .json({ message: "A demo URL is required to publish a template" });
  }
  data.createdBy = req.user.userId;

  const columns = Object.keys(data);
  db.query(
    `INSERT INTO template(${columns.join(",")}) VALUES(${columns
      .map(() => "?")
      .join(",")})`,
    columns.map((c) => data[c]),
    (err, result) => {
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ message: "Category does not exist" });
      }
      if (err) {
        console.error("addTemplate error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({
        message: "Template added",
        templateId: result.insertId,
      });
    }
  );
};

// Admin: edit a template (send only the fields you want to change)
// Uses a transaction so the "published requires demoUrl" invariant can't be
// violated by a concurrent write between SELECT and UPDATE.
const updateTemplate = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const templateId = req.params.templateId;
  if (!validId(templateId)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }

  const { error, data } = cleanTemplate(req.body, true);
  if (error) return res.status(400).json({ message: error });

  const columns = Object.keys(data);
  if (columns.length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  db.getConnection((connErr, conn) => {
    if (connErr) {
      console.error("updateTemplate connection error:", connErr);
      return res.status(500).json({ message: "Internal server error" });
    }

    const finish = (fn) => {
      conn.release();
      fn();
    };

    conn.beginTransaction((txErr) => {
      if (txErr) {
        return finish(() => {
          console.error("updateTemplate beginTransaction error:", txErr);
          res.status(500).json({ message: "Internal server error" });
        });
      }

      conn.query(
        "SELECT status, demoUrl FROM template WHERE templateId=? FOR UPDATE",
        [templateId],
        (findErr, found) => {
          if (findErr) {
            return conn.rollback(() =>
              finish(() => {
                console.error("updateTemplate select error:", findErr);
                res.status(500).json({ message: "Internal server error" });
              })
            );
          }
          if (found.length === 0) {
            return conn.rollback(() =>
              finish(() => res.status(404).json({ message: "Template not found" }))
            );
          }

          const finalStatus =
            data.status !== undefined ? data.status : found[0].status;
          const finalDemo =
            data.demoUrl !== undefined ? data.demoUrl : found[0].demoUrl;

          if (finalStatus === "published" && !finalDemo) {
            return conn.rollback(() =>
              finish(() =>
                res
                  .status(400)
                  .json({ message: "A demo URL is required to publish a template" })
              )
            );
          }

          const setSql = columns.map((c) => `${c}=?`).join(",");
          const params = [...columns.map((c) => data[c]), templateId];

          conn.query(
            `UPDATE template SET ${setSql} WHERE templateId=?`,
            params,
            (err) => {
              if (err?.code === "ER_NO_REFERENCED_ROW_2") {
                return conn.rollback(() =>
                  finish(() =>
                    res.status(400).json({ message: "Category does not exist" })
                  )
                );
              }
              if (err) {
                return conn.rollback(() =>
                  finish(() => {
                    console.error("updateTemplate update error:", err);
                    res.status(500).json({ message: "Internal server error" });
                  })
                );
              }

              conn.commit((commitErr) => {
                if (commitErr) {
                  return conn.rollback(() =>
                    finish(() => {
                      console.error(
                        "updateTemplate commit error:",
                        commitErr
                      );
                      res.status(500).json({ message: "Internal server error" });
                    })
                  );
                }
                finish(() =>
                  res.json({ message: "Template updated", templateId })
                );
              });
            }
          );
        }
      );
    });
  });
};

// Admin: delete a template. Templates that were ordered or have sites can't be deleted.
const deleteTemplate = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const templateId = req.params.templateId;
  if (!validId(templateId)) {
    return res.status(400).json({ message: "Invalid template ID" });
  }

  db.query(
    "DELETE FROM template WHERE templateId=?",
    [templateId],
    (err, result) => {
      if (err?.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          message:
            "Template has orders or sites. Set its status to archived instead",
        });
      }
      if (err) {
        console.error("deleteTemplate error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted", templateId });
    }
  );
};

module.exports = {
  getTemplates,
  getTemplate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
};