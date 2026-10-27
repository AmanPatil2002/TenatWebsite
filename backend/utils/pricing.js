const toCents = (v) => Math.round(Number(v) * 100);

// `conn` is anything with a promise-style .query (db.promise() or a pooled connection)
async function buildQuote(conn, { templateId, themeId, pageIds }) {
  const [[tpl]] = await conn.query(
    `SELECT templateId, name, price, currency
       FROM template WHERE templateId = ? AND status = 'active'`,
    [templateId]
  );
  if (!tpl) throw new Error("Template is no longer available");

  const [[themeOk]] = await conn.query(
    "SELECT 1 AS ok FROM template_theme WHERE templateId = ? AND themeId = ?",
    [templateId, themeId]
  );
  if (!themeOk) throw new Error("Theme not allowed for this template");

  const [pages] = await conn.query(
    `SELECT p.pagesId, p.title, p.pagePrice
       FROM template_pages tp
       JOIN pages p ON p.pagesId = tp.pagesId
      WHERE tp.templateId = ? AND p.pagesId IN (?)`,
    [templateId, pageIds]
  );
  if (pages.length !== pageIds.length) throw new Error("One or more pages are invalid");

  const baseCents = toCents(tpl.price);
  const pagesCents = pages.reduce((s, p) => s + toCents(p.pagePrice), 0);

  return {
    template: tpl,
    pages,
    currency: tpl.currency,
    baseAmount: (baseCents / 100).toFixed(2),
    pagesAmount: (pagesCents / 100).toFixed(2),
    amount: ((baseCents + pagesCents) / 100).toFixed(2),
  };
}

module.exports = { buildQuote };