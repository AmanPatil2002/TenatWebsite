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

  return { siteId: site.insertId, invoiceNumber };
};

module.exports = { provisionSite };