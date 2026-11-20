// src/utils/buildPageContent.js

/**
 * Utility functions for building page content with site data hydration.
 * Used by both admin editor preview (CKEditor) and client site rendering (iframe srcdoc).
 */

const escapeAttr = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&",
        "<": "<",
        ">": ">",
        '"': """,
        "'": "'",
      })[c],
  );

const escapeHtml = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&",
        "<": "<",
        ">": ">",
        '"': """,
        "'": "'",
      })[c],
  );

/**
 * Humanise a column key: "imageUrl" -> "Image", "price" -> "Price".
 */
export const humanize = (key) =>
  String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

/**
 * Guess a sensible format from the key / sample value.
 */
export const guessFormat = (key, sample) => {
  const k = key.toLowerCase();
  if (/(price|amount|cost|salary|fee|total|subtotal|rate)$/.test(k))
    return "currency";
  if (/(date|created|updated|published|expires)(at|on)?$/.test(k))
    return "date";
  if (/(time|start|end)$/.test(k) && typeof sample === "string") return "time";
  if (/(qty|quantity|count|stock|number|age|rating|seats|rooms)/.test(k))
    return "number";
  return "";
};

/**
 * Decide whether a field should be rendered as text, image, or link.
 */
export const guessRenderer = (key, sample) => {
  const k = key.toLowerCase();
  const v = String(sample ?? "").toLowerCase();
  if (/(image|photo|thumbnail|avatar|logo|banner|cover)/.test(k))
    return "image";
  if (/^(url|link|website|href)$/.test(k) || /(Url|Link)$/.test(key))
    return "link";
  return "text";
};

/**
 * Build hydration markup for a resource table.
 *
 * @param {object}   opts
 * @param {string}   opts.resource   - key in siteData, e.g. "products"
 * @param {Array}    opts.columns    - [{ key, label, type, format, currency }]
 * @param {string}   [opts.title]    - optional <h2> above the table
 * @param {string}   [opts.emptyText]
 * @returns {string} HTML string ready to be inserted into CKEditor
 */
export function buildDataTableMarkup({
  resource,
  columns,
  title = "",
  emptyText = "No records added yet.",
}) {
  if (!resource || !columns?.length) return "";

  const headerCells = columns
    .map(
      (c) =>
        `<th style="text-align:left;padding:10px 12px;">${escapeHtml(c.label || humanize(c.key))}</th>`,
    )
    .join("");

  const bodyCells = columns
    .map((c) => {
      const attrs = [`data-field="${escapeAttr(c.key)}"`];
      if (c.type === "image") {
        attrs.push(`data-attr="src"`);
        attrs.push(`data-fallback="/uploads/placeholder.png"`);
        return `<td style="padding:10px 12px;">
          <img ${attrs.join(" ")} alt="" style="width:80px;height:60px;object-fit:cover;border-radius:6px;display:block;" />
        </td>`;
      }
      if (c.type === "link") {
        attrs.push(`data-attr="href"`);
        attrs.push(`data-prefix=""`);
        return `<td style="padding:10px 12px;">
          <a ${attrs.join(" ")} target="_blank" rel="noopener" style="color:#0284c7;"></a>
        </td>`;
      }
      if (c.format) attrs.push(`data-format="${escapeAttr(c.format)}"`);
      if (c.format === "currency")
        attrs.push(`data-currency="${escapeAttr(c.currency || "INR")}"`);
      return `<td ${attrs.join(" ")} style="padding:10px 12px;vertical-align:top;"></td>`;
    })
    .join("");

  const titleHtml = title
    ? `<h2 style="margin:0 0 12px;font-size:1.4rem;">${escapeHtml(title)}</h2>`
    : "";

  return `
<div data-entity="${escapeAttr(resource)}" data-empty-text="${escapeAttr(emptyText)}" style="margin:24px 0;">
  ${titleHtml}
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <thead style="background:#f8fafc;">
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      <tr data-row>${bodyCells}</tr>
    </tbody>
  </table>
</div>
`.trim();
}

/**
 * Return an array of { key, label, type, format, sample } for a resource's
 * first record, so the dialog can build column choices automatically.
 */
export function inferColumns(records) {
  if (!Array.isArray(records) || !records.length) return [];
  const first = records[0];
  return Object.keys(first)
    .filter(
      (k) =>
        !/(^id$|Id$|_id$|password|token|createdAt|updatedAt)/i.test(k) ||
        k === "id",
    )
    .map((key) => {
      const sample = first[key];
      return {
        key,
        labe