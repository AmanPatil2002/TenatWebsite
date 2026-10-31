const { HttpError } = require("./tx");

// payments.amount is DECIMAL(12,2); toMinor allows at most 8 whole digits,
// so this ceiling always fits the column.
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
  if (!/^[A-Z]{3}$/.test(String(template.currency))) {
    throw new HttpError(400, "Template has an invalid currency");
  }

  const [[theme]] = await connection.query(
    `SELECT th.themeId
       FROM templatetheme tt JOIN theme th ON th.themeId = tt.themeId
      WHERE tt.templateId = ? AND tt.themeId = ?`,
    [templateId, themeId],
  );
  if (!theme) throw new HttpError(400, "Theme does not belong to this template");

  const [availablePages] = await connection.query(
    `SELECT tp.pagesId, tp.isDefault, tp.sortOrder, p.title, p.pagePrice
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
      title: page.title,
      isDefault: Boolean(page.isDefault),
      sortOrder: page.sortOrder,
      minor: page.isDefault ? 0n : toMinor(page.pagePrice),
    }));

  const baseMinor = toMinor(template.price); // -> baseAmount / templatePriceSnapshot
  const pagesMinor = pages.reduce((sum, page) => sum + page.minor, 0n); // -> pagesAmount
  const totalMinor = baseMinor + pagesMinor; // -> amount

  if (totalMinor <= 0n || totalMinor > MAX_AMOUNT_MINOR) {
    throw new HttpError(400, "Order total is outside the supported amount range");
  }

  return { template, pages, baseMinor, pagesMinor, totalMinor };
}

// What gets stored in payments.pages (JSON): a frozen copy of the order's pages,
// so history stays correct even if page titles or prices change later.
const buildPagesSnapshot = (pages) =>
  pages.map((page) => ({
    pagesId: page.pagesId,
    title: page.title,
    isDefault: page.isDefault,
    price: fromMinor(page.minor),
    sortOrder: page.sortOrder,
  }));

module.exports = { buildQuote, buildPagesSnapshot, toMinor, fromMinor };