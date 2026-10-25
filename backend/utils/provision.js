const crypto = require("crypto");
const db = require("../config/db");

const provisionSite = async ({ userId, templateId, siteName, subdomain }) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [templates] = await connection.execute(
      `SELECT templateId, price, currency, validityDays
         FROM template WHERE templateId = ? AND status = 'published'`,
      [templateId]
    );
    if (!templates.length) throw new Error("Template is no longer available");
    const template = templates[0];

    const [users] = await connection.execute(
      `SELECT name, email, passwordHash
         FROM users WHERE userId = ? AND status = 'active'`,
      [userId]
    );
    if (!users.length) throw new Error("User is unavailable");
    const user = users[0];

    const transactionId = `MOCK-${crypto.randomBytes(12).toString("hex")}`;
    const [paymentResult] = await connection.execute(
      `INSERT INTO payments
         (transactionId, userId, templateId, amount, currency, method, status, paidAt)
       VALUES (?, ?, ?, ?, ?, 'mock', 'captured', NOW())`,
      [transactionId, userId, templateId, template.price, template.currency]
    );
    const paymentId = paymentResult.insertId;

    const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices (invoiceNumber, paymentId, userId, billingName, totalAmount)
       VALUES (?, ?, ?, ?, ?)`,
      [invoiceNumber, paymentId, userId, user.name, template.price]
    );

    const [siteResult] = await connection.execute(
      `INSERT INTO sites (userId, templateId, paymentId, name, subdomain, expiresAt)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [userId, templateId, paymentId, siteName, subdomain, template.validityDays]
    );
    const siteId = siteResult.insertId;

    const [adminResult] = await connection.execute(
      `INSERT INTO admin (siteId, userId, email, passwordHash)
       VALUES (?, ?, ?, ?)`,
      [siteId, userId, user.email, user.passwordHash]
    );
    const adminId = adminResult.insertId;

    const [templatePages] = await connection.execute(
      `SELECT id, parentId, title, slug, pageType, content
         FROM templatePages WHERE templateId = ? ORDER BY id`,
      [templateId]
    );
    const sitePageIds = new Map();
    const siteSubPageIds = new Map();

    for (const page of templatePages.filter((item) => item.parentId == null)) {
      const [result] = await connection.execute(
        `INSERT INTO sitePages (siteId, adminId, title, slug, pageType, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [siteId, adminId, page.title, page.slug, page.pageType, page.content]
      );
      sitePageIds.set(String(page.id), result.insertId);
    }

    for (const page of templatePages.filter((item) => item.parentId != null)) {
      const parentPageId = sitePageIds.get(String(page.parentId));
      if (!parentPageId) {
        throw new Error("Template subpages must have a top-level page as their parent");
      }
      const [result] = await connection.execute(
        `INSERT INTO subPages
           (siteId, adminId, pageId, title, slug, pageType, content)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [siteId, adminId, parentPageId, page.title, page.slug, page.pageType, page.content]
      );
      siteSubPageIds.set(String(page.id), result.insertId);
    }

    const [themes] = await connection.execute(
      `SELECT name, settings, type, isDefault
         FROM templateThemes WHERE templateId = ? ORDER BY id`,
      [templateId]
    );
    if (themes.length) {
      const defaultTheme = themes.findIndex((theme) => Boolean(theme.isDefault));
      const activeIndex = defaultTheme === -1 ? 0 : defaultTheme;
      for (let index = 0; index < themes.length; index += 1) {
        const theme = themes[index];
        await connection.execute(
          `INSERT INTO siteThemes (siteId, adminId, name, settings, type, isActive)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [siteId, adminId, theme.name, theme.settings, theme.type, index === activeIndex ? 1 : 0]
        );
      }
    }

    const [menuItems] = await connection.execute(
      `SELECT id, menuLocation, parentItemId, templatePageId, externalUrl,
              label, sortOrder, isVisible
         FROM templateMenuItems WHERE templateId = ? ORDER BY id`,
      [templateId]
    );
    const menuItemIds = new Map();
    const pending = [...menuItems];

    while (pending.length) {
      const index = pending.findIndex(
        (item) => item.parentItemId == null || menuItemIds.has(String(item.parentItemId))
      );
      if (index === -1) throw new Error("Template menu contains an invalid parent reference");

      const item = pending.splice(index, 1)[0];
      const templatePageId =
        item.templatePageId == null ? null : String(item.templatePageId);
      const pageId = templatePageId ? sitePageIds.get(templatePageId) || null : null;
      const subPageId = templatePageId ? siteSubPageIds.get(templatePageId) || null : null;

      if (templatePageId && !pageId && !subPageId) {
        throw new Error("Template menu references a missing template page");
      }
      if (pageId && item.externalUrl) {
        throw new Error("Template menu item cannot link to both a page and an external URL");
      }
      if (!pageId && !subPageId && !item.externalUrl) {
        throw new Error("Template menu item must reference a page or external URL");
      }

      const [result] = await connection.execute(
        `INSERT INTO siteMenuItems
           (siteId, adminId, menuLocation, parentItemId, pageId, subPageId,
            externalUrl, label, sortOrder, isVisible)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          adminId,
          item.menuLocation,
          item.parentItemId == null ? null : menuItemIds.get(String(item.parentItemId)),
          pageId,
          subPageId,
          item.externalUrl,
          item.label,
          item.sortOrder,
          item.isVisible,
        ]
      );
      menuItemIds.set(String(item.id), result.insertId);
    }

    await connection.commit();
    return { siteId, paymentId, invoiceId: invoiceResult.insertId, invoiceNumber, transactionId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { provisionSite };
