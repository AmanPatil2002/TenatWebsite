const crypto = require("crypto");

const provisionSite = async (connection, payment) => {
  const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  await connection.query(
    `INSERT INTO invoices (invoiceNumber, paymentId, userId, billingName, totalAmount)
     VALUES (?, ?, ?, ?, ?)`,
    [
      invoiceNumber,
      payment.id,
      payment.userId,
      payment.userName,
      payment.amount,
    ],
  );

  const siteName = `${payment.templateName} - ${payment.userName}`.slice(0, 150);
  const [site] = await connection.query(
    `INSERT INTO sites (userId, templateId, themeId, paymentId, name, expiresAt)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))`,
    [
      payment.userId,
      payment.templateId,
      payment.themeId,
      payment.id,
      siteName,
      payment.validityDays,
    ],
  );

  const [[siteAdminAccount]] = await connection.query(
    `SELECT email, passwordHash
       FROM users
      WHERE userId = ? AND status = 'active'
      FOR UPDATE`,
    [payment.userId],
  );
  if (!siteAdminAccount) {
    throw new Error("Client account is not available for site login");
  }

  await connection.query(
    "INSERT INTO `admin` (siteId, userId, email, passwordHash) VALUES (?, ?, ?, ?)",
    [
      site.insertId,
      payment.userId,
      siteAdminAccount.email,
      siteAdminAccount.passwordHash,
    ],
  );

  const [[theme]] = await connection.query(
    "SELECT color, background FROM theme WHERE themeId = ?",
    [payment.themeId],
  );
  if (!theme) throw new Error("Purchased theme is not available");

  await connection.query(
  `INSERT INTO sitepages (siteId, sourcePagesId, title, page, sortOrder)
   SELECT ?, p.pagesId, p.title, p.page, tp.sortOrder
     FROM paymentpages pp
     JOIN pages p ON p.pagesId = pp.pagesId
     JOIN templatepages tp
       ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId
    WHERE pp.paymentId = ?`,
  [site.insertId, payment.id],
);

  // Map template-level parent grouping onto the copied per-site rows.
  // Central pages.parentId references pages.pagesId; translate it to the
  // per-site id via sourcePagesId.
  // await connection.query(
  //   `UPDATE sitepages child
  //    JOIN (
  //      SELECT p2.id AS newParentId, p1.id AS newChildId
  //      FROM sitepages p1
  //      JOIN pages p_central ON p1.sourcePagesId = p_central.pagesId
  //      JOIN pages p_parent_central ON p_central.parentId = p_parent_central.pagesId
  //      JOIN sitepages p2 ON p2.sourcePagesId = p_parent_central.pagesId AND p2.siteId = p1.siteId
  //      WHERE p1.siteId = ?
  //    ) mapping ON child.id = mapping.newChildId
  //    SET child.parentId = mapping.newParentId
  //    WHERE child.siteId = ?`,
  //   [site.insertId, site.insertId],
  // );

  await connection.query(
    `INSERT INTO sitethemes (siteId, defaultThemeId, defaultTheme)
     VALUES (?, ?, ?)`,
    [
      site.insertId,
      payment.themeId,
      JSON.stringify({ color: theme.color, background: theme.background }),
    ],
  );

  return { siteId: site.insertId, invoiceNumber };
};

module.exports = { provisionSite };