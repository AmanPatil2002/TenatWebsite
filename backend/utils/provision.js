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

  return { siteId: site.insertId, invoiceNumber };
};

module.exports = { provisionSite };