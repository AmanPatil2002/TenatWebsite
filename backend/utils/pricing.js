const { HttpError } = require("./tx");

const MAX_AMOUNT_MINOR = 9999999999n;

const toMinor = (value) => {
  const amount = String(value);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(amount)) {
    throw new HttpError(400, "Invalid payment amount");
  }
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

const fromMinor = (value) => {
  const amount = BigInt(value);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, "0")}`;
};

async function buildQuote(connection, { templateId, themeId, additionalPageIds }) {
    const [[template]] = await connection.query(
    `SELECT templateId, name, price, currency, validityDays
       FROM template WHERE templateId = ? AND status = 'published' FOR UPDATE`,
    [templateId],
  );
  if (!template) throw new HttpError(404, "Template is not available");
  if (template.currency !== "INR") {
    throw new HttpError(400, "Razorpay checkout currently supports INR templates only");
  }

  const [[theme]] = await connection.query(
    `SELECT th.themeId
       FROM templatetheme tt JOIN theme th ON th.themeId = tt.themeId
      WHERE tt.templateId = ? AND tt.themeId = ?`,
    [templateId, themeId],
  );
  if (!theme) throw new HttpError(400, "Theme does not belong to this template");

  const [availablePages] = await connection.query(
    `SELECT tp.pagesId, tp.isDefault, tp.sortOrder, p.pagePrice
       FROM templatepages tp
       JOIN pages p ON p.pagesId = tp.pagesId
      WHERE tp.templateId = ? ORDER BY tp.sortOrder, tp.pagesId`,
    [templateId],
  );
  const extraIds = new Set(
    availablePages.filter((page) => !page.isDefault).map((page) => String(page.pagesId)),
  );
  if (additionalPageIds.some((id) => !extraIds.has(id))) {
    throw new HttpError(400, "One or more additional pages are not available for this template");
  }
  if (!availablePages.some((page) => Boolean(page.isDefault))) {
    throw new HttpError(409, "This template has no default pages and cannot be purchased");
  }

  const pages = availablePages
    .filter((page) => Boolean(page.isDefault) || additionalPageIds.includes(String(page.pagesId)))
    .map((page) => ({
      pagesId: String(page.pagesId),
      isDefault: Boolean(page.isDefault),
      sortOrder: page.sortOrder,
      minor: page.isDefault ? 0n : toMinor(page.pagePrice),
    }));

  const totalMinor = toMinor(template.price) + pages.reduce((sum, page) => sum + page.minor, 0n);
  if (totalMinor <= 0n || totalMinor > MAX_AMOUNT_MINOR) {
    throw new HttpError(400, "Order total is outside the supported amount range");
  }

  return { template, pages, totalMinor };
}

module.exports = { buildQuote, toMinor, fromMinor };