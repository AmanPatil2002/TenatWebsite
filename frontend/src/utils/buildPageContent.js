// src/utils/buildPageContent.js
export const SLIDER_MARKER = /<!--\s*SLIDER\s*-->|\[\[slider\]\]/i;

export function renderSlider(slides = []) {
  if (!slides.length) return "";
  const items = slides
    .map((s) => {
      const src = s.image || s.url || "";
      const caption = s.title || s.caption || "";
      return `<div class="site-slide"><img src="${src}" alt="${caption}"/>${
        caption ? `<span>${caption}</span>` : ""
      }</div>`;
    })
    .join("");
  return `<div class="site-home-slider"><div class="site-slider-track">${items}</div></div>`;
}

export function renderGallery(galleries = []) {
  if (!galleries.length) return "";
  const figs = galleries
    .map((g) => {
      const src = g.image || g.url || "";
      const cap = g.title || g.name || "";
      return `<figure><img src="${src}" alt="${cap}"/>${
        cap ? `<figcaption>${cap}</figcaption>` : ""
      }</figure>`;
    })
    .join("");
  return `<section class="site-gallery"><div class="site-gallery-grid">${figs}</div></section>`;
}

export function hydrateSiteData(html = "", siteData = {}) {
  if (!html) return html;
  return html.replace(
    /\[\[\s*([a-zA-Z0-9_-]+)\s*\]\]/g,
    (match, key) => {
      const rows = siteData[key];
      if (!Array.isArray(rows) || !rows.length) return match;
      const lis = rows
        .map((r) => `<li>${r.name ?? r.title ?? JSON.stringify(r)}</li>`)
        .join("");
      return `<ul class="site-data-${key}">${lis}</ul>`;
    }
  );
}

/**
 * Produce the fully-hydrated body HTML for a page.
 * This is what both `buildSrcDoc` and CKEditor should use.
 */
export function buildPageBody({
  html,
  pageTitle,
  slides = [],
  galleries = [],
  siteData = {},
}) {
  const isHome = /home/i.test(pageTitle || "");
  const isGallery = /gall[ae]ry/i.test(pageTitle || "");

  const sliderHtml = isHome ? renderSlider(slides) : "";
  let bodyHtml =
    hydrateSiteData(html, siteData) ||
    "<p>This page has no content yet.</p>";

  if (SLIDER_MARKER.test(bodyHtml)) {
    bodyHtml = bodyHtml.replace(SLIDER_MARKER, () => sliderHtml);
  } else if (isHome && sliderHtml) {
    const withIntro = bodyHtml.replace(
      /(<section class="intro">[\s\S]*?<\/section>)/,
      `$1${sliderHtml}`
    );
    bodyHtml = withIntro === bodyHtml ? `${bodyHtml}${sliderHtml}` : withIntro;
  }

  if (isGallery) bodyHtml += renderGallery(galleries);

  return bodyHtml;
}