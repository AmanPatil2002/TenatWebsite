const toDim = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
};

/**
 * @param {Array} items            slider rows from the API
 * @param {(url:string)=>string} resolveImage   returns a usable image URL or ""
 * @param {(v:any)=>string} escapeHtml
 */
export const renderSlider = (items, resolveImage, escapeHtml) => {
  if (!Array.isArray(items)) return "";

  const valid = items.filter((item) => resolveImage(item.imageUrl));
  if (!valid.length) return "";

  // The first slide's size sets the slider's aspect ratio.
  const ratioW = toDim(valid[0].width, 1920);
  const ratioH = toDim(valid[0].height, 600);

  const slides = valid.map((item, index) => {
    const title = item.title || `Slide ${index + 1}`;
    const w = toDim(item.width, ratioW);
    const h = toDim(item.height, ratioH);
    const loading = index === 0 ? "eager" : "lazy";
    const fetchPriority = index === 0 ? ' fetchpriority="high"' : "";
    return `<figure class="site-slide"><img src="${escapeHtml(resolveImage(item.imageUrl))}" alt="${escapeHtml(title)}" width="${w}" height="${h}" loading="${loading}" decoding="async"${fetchPriority} /><figcaption>${escapeHtml(title)}</figcaption></figure>`;
  });

  const hasMotion = slides.length > 1;
  const animation = hasMotion
    ? `animation: siteSlider ${slides.length * 5}s ease-in-out infinite;`
    : "";
  const keyframes = hasMotion
    ? `@keyframes siteSlider { ${slides
        .map((_, index) => {
          const start = (index / slides.length) * 100;
          const holdEnd =
            index === slides.length - 1
              ? 100
              : ((index + 1) / slides.length) * 100 - 1;
          return `${start}%, ${holdEnd}% { transform: translateX(-${index * 100}%); }`;
        })
        .join(" ")} }`
    : "";

  return `<section class="site-home-slider" style="--slide-ratio:${ratioW} / ${ratioH};" aria-label="Featured images"><button class="site-slider-pause" type="button" aria-pressed="false"${hasMotion ? "" : " hidden"}>Pause slideshow</button><div class="site-slider-track"${animation ? ` style="${animation}"` : ""}>${slides.join("")}</div></section><style>${keyframes}</style>`;
};