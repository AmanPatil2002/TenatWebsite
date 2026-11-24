/* ------------------------------------------------------------------ */
/*  Escaping helpers                                                   */
/* ------------------------------------------------------------------ */
const escapeAttr = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const escapeHtml = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

/**
 * Humanise a column key: "imageUrl" -> "Image Url", "price" -> "Price".
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
export const guessRenderer = (key) => {
  const k = key.toLowerCase();
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
        `<th style="text-align:left;padding:10px 12px;">${escapeHtml(
          c.label || humanize(c.key),
        )}</th>`,
    )
    .join("");

  const bodyCells = columns
    .map((c) => {
      const attrs = [`data-field="${escapeAttr(c.key)}"`];
      if (c.type === "image") {
        attrs.push(`data-attr="src"`);
        attrs.push(`data-fallback="/uploads/placeholder.png"`);
        return `<td style="padding:10px 12px;">
          <img ${attrs.join(
            " ",
          )} alt="" style="width:80px;height:60px;object-fit:cover;border-radius:6px;display:block;" />
        </td>`;
      }
      if (c.type === "link") {
        attrs.push(`data-attr="href"`);
        attrs.push(`data-prefix=""`);
        return `<td style="padding:10px 12px;">
          <a ${attrs.join(
            " ",
          )} target="_blank" rel="noopener" style="color:#0284c7;">&nbsp;</a>
        </td>`;
      }
      if (c.format) attrs.push(`data-format="${escapeAttr(c.format)}"`);
      if (c.format === "currency")
        attrs.push(`data-currency="${escapeAttr(c.currency || "INR")}"`);
      return `<td ${attrs.join(
        " ",
      )} style="padding:10px 12px;vertical-align:top;"></td>`;
    })
    .join("");

  const titleHtml = title
    ? `<h2 style="margin:0 0 12px;font-size:1.4rem;">${escapeHtml(title)}</h2>`
    : "";

  return `
<div data-entity="${escapeAttr(resource)}" data-empty-text="${escapeAttr(
    emptyText,
  )}" style="margin:24px 0;">
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
 *
 * Excludes `id`, `*Id` (foreign keys), credentials, and audit fields.
 * Foreign-key labels are resolved at hydration time via
 * HYDRATION_RELATIONSHIPS, not here.
 */
export function inferColumns(records) {
  if (!Array.isArray(records) || !records.length) return [];
  const first = records[0];
  return Object.keys(first)
    .filter(
      (k) =>
        !/^id$/i.test(k) &&
        !/Id$/.test(k) &&
        !/(password|token)/i.test(k) &&
        !/^(createdAt|updatedAt)$/.test(k),
    )
    .map((key) => {
      const sample = first[key];
      return {
        key,
        label: humanize(key),
        type: guessRenderer(key),
        format: guessFormat(key, sample),
        sample,
      };
    });
}

export function buildFormMarkup({
  resource,
  fields = [],
  submitText = "Submit",
  successMessage = "Thank you. Your submission was received.",
}) {
  if (!resource || !Array.isArray(fields) || !fields.length) return "";
  const fieldMarkup = fields.map((field) => {
    const name = String(field.name || "").trim();
    if (!/^[a-z][a-z0-9_]*$/i.test(name)) return "";
    const label = escapeHtml(field.label || humanize(name));
    const required = field.required ? " required" : "";
    const type =
      field.type === "email" ? "email" :
      field.type === "phone" ? "tel" :
      field.type === "number" ? "number" :
      field.type === "date" ? "date" :
      field.type === "time" ? "time" :
      "text";

    if (field.type === "textarea") {
      return `<div style="margin-bottom:12px;"><label style="display:block;margin-bottom:6px;">${label}</label><textarea name="${escapeAttr(name)}"${required} rows="4" style="width:100%;"></textarea></div>`;
    }
    if (field.type === "select" && Array.isArray(field.options) && field.options.length) {
      const options = field.options.map((option) =>
        `<option value="${escapeAttr(option)}">${escapeHtml(humanize(option))}</option>`
      ).join("");
      return `<div style="margin-bottom:12px;"><label style="display:block;margin-bottom:6px;">${label}</label><select name="${escapeAttr(name)}"${required} style="width:100%;"><option value="">Select</option>${options}</select></div>`;
    }
    if (field.type === "checkbox") {
      return `<div style="margin-bottom:12px;"><label><input type="checkbox" name="${escapeAttr(name)}" value="1"${required} /> ${label}</label></div>`;
    }
    return `<div style="margin-bottom:12px;"><label style="display:block;margin-bottom:6px;">${label}</label><input type="${type}" name="${escapeAttr(name)}"${required} style="width:100%;" /></div>`;
  }).join("");

  return `<form data-form="${escapeAttr(resource)}" data-success-message="${escapeAttr(successMessage)}" style="max-width:640px;margin:24px auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">${fieldMarkup}<div style="position:absolute;left:-9999px;" aria-hidden="true"><label>Website</label><input type="text" name="website" tabindex="-1" autocomplete="off" /></div><button type="submit">${escapeHtml(submitText)}</button><p data-form-status role="status"></p></form>`;
}

/* ------------------------------------------------------------------ */
/*  Hydration logic (shared with Site.jsx)                             */
/* ------------------------------------------------------------------ */

// "this foreign key points at <entity>; copy <source> into <field>".
const rel = (entity, field, source = "name", fallback) => ({
  entity,
  fields: { [field]: source },
  ...(fallback ? { fallback: { [field]: fallback } } : {}),
});

const HYDRATION_RELATIONSHIPS = {
  /* school */
  students: {
    classId: {
      entity: "classes",
      fields: {
        className: (record) =>
          `${record.name || ""}${record.section ? ` - ${record.section}` : ""}`,
      },
    },
  },
  classes: {
    classTeacherId: rel("teachers", "classTeacherName"),
  },

  /* ecommerce */
  products: {
    categoryId: rel(
      "productcategories",
      "categoryName",
      "name",
      "Uncategorized",
    ),
  },

  /* medical */
  doctors: {
    departmentId: rel(
      "departments",
      "departmentName",
      "name",
      "General Department",
    ),
  },

  /* restaurant */
  menuitems: { categoryId: rel("menucategories", "categoryName") },

  /* hotel */
  rooms: { roomTypeId: rel("roomtypes", "roomTypeName") },

  /* real estate */
  properties: { propertyTypeId: rel("propertytypes", "propertyTypeName") },

  /* gym */
  members: { planId: rel("membershipplans", "planName") },

  /* blog */
  blogposts: { categoryId: rel("blogcategories", "categoryName") },

  /* portfolio */
  projects: { categoryId: rel("projectcategories", "categoryName") },

  /* events */
  events: { eventTypeId: rel("eventtypes", "eventTypeName") },

  /* spa */
  services: { categoryId: rel("servicecategories", "categoryName") },

  /* law firm */
  attorneys: { practiceAreaId: rel("practiceareas", "practiceAreaName") },
  caseinquiries: { practiceAreaId: rel("practiceareas", "practiceAreaName") },

  /* marketing */
  casestudies: { serviceId: rel("marketingservices", "serviceName") },
  leads: { serviceId: rel("marketingservices", "serviceName") },

  /* news */
  articles: { categoryId: rel("newscategories", "categoryName") },

  /* agriculture */
  farmproducts: { categoryId: rel("cropcategories", "categoryName") },

  /* mobile apps */
  mobileapps: { categoryId: rel("appcategories", "categoryName") },

  /* streaming */
  movies: { genreId: rel("genres", "genreName") },

  /* gaming */
  games: { categoryId: rel("gamecategories", "categoryName") },
  teams: { gameId: rel("games", "gameTitle", "title") },
  tournaments: { gameId: rel("games", "gameTitle", "title") },

  /* jewelry / furniture / grocery / cafe */
  jewelryproducts: { categoryId: rel("jewelrycategories", "categoryName") },
  furnitureproducts: { categoryId: rel("furniturecategories", "categoryName") },
  groceryproducts: { categoryId: rel("grocerycategories", "categoryName") },
  cafeitems: { categoryId: rel("cafecategories", "categoryName") },

  /* interior design */
  designprojects: { serviceId: rel("designservices", "serviceName") },

  /* music */
  albums: { artistId: rel("artists", "artistName") },
  tracks: {
    artistId: rel("artists", "artistName"),
    albumId: rel("albums", "albumTitle", "title"),
  },
  eventshows: { artistId: rel("artists", "artistName") },

  /* dental / pet care / salon / consulting / daycare */
  dentalappointments: {
    serviceId: rel("dentalservices", "serviceName"),
    dentistId: rel("dentists", "dentistName"),
  },
  petappointments: {
    serviceId: rel("petservices", "serviceName"),
    veterinarianId: rel("veterinarians", "veterinarianName"),
  },
  salonbookings: {
    serviceId: rel("salonservices", "serviceName"),
    stylistId: rel("stylists", "stylistName"),
  },
  consultationrequests: {
    serviceId: rel("consultingservices", "serviceName"),
    consultantId: rel("consultants", "consultantName"),
  },
  admissionenquiries: { programId: rel("daycareprograms", "programName") },
};

/* Statuses that should never be shown on a public page. */
const HIDDEN_STATUSES = new Set([
  "inactive",
  "draft",
  "archived",
  "unsubscribed",
  "spam",
  "pending",
  "rejected",
  "cancelled",
  "expired",
  "suspended",
  "paused",
]);

const isEmpty = (value) =>
  value === null || value === undefined || value === "";

const getNestedValue = (object, path) => {
  if (!object || !path) return undefined;
  return String(path)
    .split(".")
    .reduce((current, key) => current?.[key], object);
};

const normalizeResourceKey = (value) =>
  String(value ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const resolveEntity = (entity, siteData = {}) => {
  const aliases = {
    categories: "productcategories",
  };

  const requested = normalizeResourceKey(entity);

  // Exact match first.
  if (Array.isArray(siteData[entity])) {
    return siteData[entity];
  }

  // Existing aliases.
  const alias = aliases[entity];

  if (alias && Array.isArray(siteData[alias])) {
    return siteData[alias];
  }

  // Case-insensitive resource matching.
  const matchedKey = Object.keys(siteData).find(
    (key) => normalizeResourceKey(key) === requested,
  );

  return matchedKey ? siteData[matchedKey] : undefined;
};

/* Value formatting */
const formatValue = (value, format, element) => {
  if (isEmpty(value)) return value;
  if (Array.isArray(value)) return value.join(", ");
  if (!format) return value;

  if (format === "currency") {
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: element.getAttribute("data-currency") || "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number);
    } catch {
      return value;
    }
  }

  if (format === "number") {
    const number = Number(value);
    return Number.isNaN(number) ? value : number.toLocaleString("en-IN");
  }

  if (format === "date") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  if (format === "datetime") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  }

  if (format === "time") return String(value).slice(0, 5);

  return value;
};

/* Relationship maps */
const createEntityMaps = (siteData) => {
  const maps = {};
  Object.entries(siteData).forEach(([entity, records]) => {
    if (!Array.isArray(records)) return;
    maps[entity] = new Map(
      records.map((record) => [String(record.id), record]),
    );
  });
  if (!maps.productcategories && maps.categories) {
    maps.productcategories = maps.categories;
  }
  return maps;
};

/* Entity enrichment */
const enrichEntity = (entity, item, maps) => {
  const result = { ...item };
  const relationships = HYDRATION_RELATIONSHIPS[entity] || {};
  Object.entries(relationships).forEach(([foreignKey, config]) => {
    const related = maps[config.entity]?.get(String(item[foreignKey]));
    if (related) {
      Object.entries(config.fields || {}).forEach(
        ([targetField, sourceField]) => {
          if (!isEmpty(result[targetField])) return;
          result[targetField] =
            typeof sourceField === "function"
              ? sourceField(related)
              : getNestedValue(related, sourceField);
        },
      );
    }
    Object.entries(config.fallback || {}).forEach(([field, fallback]) => {
      if (isEmpty(result[field])) {
        result[field] = fallback;
      }
    });
  });
  return result;
};

/* Resolve media images.
 * `baseUrl` is used ONLY in the editor preview, where root-relative
 * /uploads/… paths would otherwise resolve against the admin app origin
 * instead of the API/uploads server. On the live site (buildPageSrcDoc)
 * relative paths are correct, so baseUrl is omitted there.
 */
const resolveMediaImage = (url, baseUrl = "") => {
  if (typeof url !== "string" || !url) return "";
  if (url.startsWith("/uploads/")) {
    return baseUrl ? `${String(baseUrl).replace(/\/$/, "")}${url}` : url;
  }
  return /^https?:\/\/\S+$/i.test(url) ? url : "";
};

/* Safe attribute rendering.
 * For href cells we also fill the visible text (if the element is empty),
 * so phone/email links don't render as invisible empty anchors inside
 * CKEditor, which drops empty inline elements.
 */
const renderField = (element, item, baseUrl = "") => {
  const field = element.getAttribute("data-field");
  if (!field) return;
  const value = getNestedValue(item, field);
  const attr = element.getAttribute("data-attr");
  const fallback = element.getAttribute("data-fallback");

  if (!attr) {
    const shown = formatValue(
      value,
      element.getAttribute("data-format"),
      element,
    );
    element.textContent = isEmpty(shown) ? (fallback ?? "—") : String(shown);
    return;
  }

  const allowedAttributes = [
    "src",
    "href",
    "alt",
    "title",
    "target",
    "rel",
    "loading",
  ];
  if (!allowedAttributes.includes(attr)) return;

  let output = value;
  if (attr === "src" && !isEmpty(value)) {
    output = resolveMediaImage(value, baseUrl);
  }

  const prefix = element.getAttribute("data-prefix");
  if (attr === "href" && prefix && !isEmpty(value)) {
    const clean =
      prefix === "tel:"
        ? String(value).replace(/[^\d+]/g, "")
        : String(value).trim();
    output = `${prefix}${clean}`;
  }

  if (attr === "src" || attr === "href") {
    if (!isEmpty(output)) {
      try {
        const url = new URL(String(output), "https://hydration.invalid");
        const relative = !/^[a-z][a-z0-9+.-]*:/i.test(String(output));
        if (
          !relative &&
          !["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
        ) {
          output = "";
        }
      } catch {
        output = "";
      }
    }
  }

  if (isEmpty(output) && !isEmpty(fallback)) {
    output = fallback;
  }

  if (isEmpty(output)) {
    element.removeAttribute(attr);
  } else {
    element.setAttribute(attr, String(output));
  }

  if (attr === "target" && output === "_blank") {
    element.setAttribute("rel", "noopener noreferrer");
  }

  // For links, ensure the element has visible text so CKEditor keeps it.
  if (attr === "href" && !isEmpty(value)) {
    const text = element.textContent.replace(/\u00a0/g, "").trim();
    if (!text) {
      element.textContent = String(value);
    }
  }
};

/* Render gallery */
const renderGallery = (items, baseUrl = "") => {
  if (!Array.isArray(items)) return "";
  const cards = items
    .filter(
      (item) => String(item.status ?? "active").toLowerCase() !== "inactive",
    )
    .map((item) => {
      const imageUrl = resolveMediaImage(item.imageUrl, baseUrl);
      if (!imageUrl) return "";
      const title =
        item.title || item.caption || item.altText || "Gallery image";
      const description = item.caption || item.title;
      const caption = description
        ? `<figcaption>${escapeHtml(description)}</figcaption>`
        : "";
      return `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(
        item.altText || title,
      )}" loading="lazy" />${caption}</figure>`;
    })
    .filter(Boolean)
    .join("");
  if (!cards) return "";
  return `<section class="site-gallery"><div class="site-gallery-grid">${cards}</div></section>`;
};

/* Render slider */
const SLIDER_MARKER = /<!--\s*SITE_SLIDER\s*-->/i;

const renderSlider = (items, baseUrl = "") => {
  if (!Array.isArray(items)) return "";

  const slides = items
    .filter(
      (item) =>
        resolveMediaImage(item.imageUrl, baseUrl) &&
        String(item.status ?? "active").toLowerCase() !== "inactive",
    )
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((item) => {
      const title = item.title || "Site slide";
      const imageUrl = resolveMediaImage(item.imageUrl, baseUrl);

      const w = Number(item.width);
      const h = Number(item.height);
      const hasSize =
        Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
      const slideStyle = hasSize ? `aspect-ratio:${w} / ${h};height:auto;` : "";

      return `<div class="site-slide" style="${slideStyle}"><img src="${escapeHtml(
        imageUrl,
      )}" alt="${escapeHtml(title)}" loading="lazy" /><span>${escapeHtml(
        title,
      )}</span></div>`;
    });

  if (!slides.length) return "";

  const n = slides.length;
  const animation =
    n > 1 ? `animation: siteSlider ${n * 5}s linear infinite;` : "";
  const keyframes =
    n > 1
      ? `@keyframes siteSlider { ${Array.from({ length: n }, (_, i) => {
          const pct = (i / n) * 100;
          const nextPct = ((i + 1) / n) * 100;
          return `${pct.toFixed(2)}% { transform: translateX(-${i * 100}%); } ${(
            nextPct - 0.01
          ).toFixed(2)}% { transform: translateX(-${i * 100}%); }`;
        }).join(" ")} 100% { transform: translateX(-${(n - 1) * 100}%); } }`
      : "";

  return `<section class="site-home-slider" aria-label="Image slider"><div class="site-slider-track" style="${animation}">${slides.join(
    "",
  )}</div></section>${keyframes ? `<style>${keyframes}</style>` : ""}`;
};

/* Recursive hydration */
const hydrateContainer = (container, siteData, maps, baseUrl = "") => {
  const entity = container.getAttribute("data-entity");
  const source = resolveEntity(entity, siteData);

  // Find the row template: prefer a direct child with [data-row], otherwise
  // the first descendant.
  let template = null;
  for (const child of Array.from(container.children)) {
    if (child.hasAttribute("data-row")) {
      template = child;
      break;
    }
  }
  if (!template) {
    template = container.querySelector("[data-row]");
  }
  if (!template) return;

  // If the resource hasn't loaded yet, leave the template alone so a
  // later hydration pass (or the live site) can fill it in.
  //if (!template || !Array.isArray(source)) return;

  const holder = template.parentElement;
  if (!holder) return;
  const rowTemplate = template.cloneNode(true);
  // Show a visible message instead of leaving blank rows.
  const showEmptyState = () => {
    const empty = container.ownerDocument.createElement("p");

    empty.className = "hydration-empty-state";

    empty.textContent =
      container.getAttribute("data-empty-text") || "No records available.";

    empty.style.cssText = "text-align:center;opacity:.7;padding:16px;";

    holder.replaceChildren(empty);
  };

  // Missing resource or invalid API response.
  if (!Array.isArray(source)) {
    console.warn(
      `[Page Hydration] Resource "${entity}" was not found.`,
      siteData,
    );

    showEmptyState();
    return;
  }

  // Filter records that should not appear publicly.
  const rows = source.filter((record) => {
    const hiddenByApproval =
      record.isApproved === false ||
      record.isApproved === 0 ||
      record.approved === false ||
      record.approved === 0;
    return !hiddenByApproval &&
      !HIDDEN_STATUSES.has(String(record.status ?? "").toLowerCase());
  });

  holder.replaceChildren();

  if (!rows.length) {
    showEmptyState();
    return;
  }

  rows.forEach((raw) => {
    const item = enrichEntity(entity, raw, maps);

    const row = rowTemplate.cloneNode(true);

    if (row.hasAttribute("data-field")) {
      renderField(row, item, baseUrl);
    }

    row.querySelectorAll("[data-field]").forEach((element) => {
      renderField(element, item, baseUrl);
    });

    row.querySelectorAll("[data-entity]").forEach((nestedContainer) => {
      hydrateContainer(nestedContainer, siteData, maps, baseUrl);
    });
    holder.appendChild(row);
  });
};

/* ------------------------------------------------------------------ */
/*  Editor round-trip helpers                                          */
/* ------------------------------------------------------------------ */

/**
 * Attribute used to remember the ORIGINAL (stored) markup of a generated
 * block while it is displayed hydrated inside the editor.
 * The "v1:" prefix guarantees the attribute is never empty, because empty
 * attributes can be dropped by the editor's HTML writer.
 * The admin component's `dehydrate()` reads this attribute.
 */
const PLACEHOLDER_ATTR = "data-tn-placeholder";

const encodePlaceholder = (original) =>
  `v1:${encodeURIComponent(original || "")}`;

/** Wrap generated html in a locked block that remembers what to store. */
const wrapBlock = (innerHtml, original = "") =>
  `<div class="tn-block" contenteditable="false" ${PLACEHOLDER_ATTR}="${escapeAttr(
    encodePlaceholder(original),
  )}">${innerHtml}</div>`;

const EMPTY_SLIDER_NOTE =
  '<p style="margin:8px 0;padding:12px;text-align:center;opacity:.6;border:1px dashed #94a3b8;">Image slider appears here (no active slides yet).</p>';

/**
 * Hydrate site data into HTML string.
 * Finds all top-level [data-entity] containers and populates them with data
 * from siteData. Nested [data-entity] containers are hydrated recursively.
 *
 * @param {string}  html     - Raw HTML from CKEditor or template
 * @param {Object}  siteData - Resource names as keys, arrays of records as values
 * @param {Object}  [options]
 * @param {boolean} [options.wrap=false] - Editor mode: wrap each hydrated top-level
 *        container in a locked block that stores its original markup, so it can be
 *        restored before saving. The public site never uses this.
 * @param {string}  [options.baseUrl=""] - API root used to make /uploads/… paths
 *        absolute in the editor preview.
 * @returns {string} Hydrated HTML
 */
export function hydrateSiteData(
  html,
  siteData = {},
  { wrap = false, baseUrl = "" } = {},
) {
  if (typeof html !== "string" || !html.includes("data-entity")) {
    return html;
  }
  const doc = new DOMParser().parseFromString(
    `<div id="hydration-root">${html}</div>`,
    "text/html",
  );
  const root = doc.getElementById("hydration-root");
  if (!root) return html;

  const maps = createEntityMaps(siteData);

  // Only top-level containers are wrapped; nested ones are hydrated in place.
  const containers = Array.from(root.querySelectorAll("[data-entity]")).filter(
    (container) => !container.parentElement.closest("[data-entity]"),
  );

  containers.forEach((container) => {
    // Capture the original markup BEFORE hydration changes it.
    const original = wrap ? container.outerHTML : "";

    hydrateContainer(container, siteData, maps, baseUrl);

    if (wrap) {
      const wrapper = doc.createElement("div");
      wrapper.className = "tn-block";
      wrapper.setAttribute("contenteditable", "false");
      wrapper.setAttribute(PLACEHOLDER_ATTR, encodePlaceholder(original));
      container.replaceWith(wrapper);
      wrapper.appendChild(container);
    }
  });

  return root.innerHTML;
}

/* ------------------------------------------------------------------ */
/*  Main exported functions                                            */
/* ------------------------------------------------------------------ */

/**
 * Build page HTML for CKEditor preview (admin panel).
 * Hydrates site data into the page content and adds slider/gallery if applicable.
 *
 * @param {Object} opts
 * @param {string} opts.html - Raw (stored) page HTML
 * @param {string} opts.pageTitle - Page title (used to detect home/gallery pages)
 * @param {Array} opts.slides - Slider items
 * @param {Array} opts.galleries - Gallery items
 * @param {Object} opts.siteData - Site data resources
 * @param {string} [opts.baseUrl=""] - API root used to make /uploads/… absolute
 * @returns {string} Hydrated HTML ready for CKEditor
 */
export function buildPageBody({
  html,
  pageTitle,
  slides = [],
  galleries = [],
  siteData = {},
  baseUrl = "",
}) {
  const safeHtml = typeof html === "string" ? html : "";
  const safeSlides = Array.isArray(slides) ? slides : [];
  const safeGalleries = Array.isArray(galleries) ? galleries : [];
  const safeData = siteData && typeof siteData === "object" ? siteData : {};

  const isHome = /home/i.test(pageTitle || "");
  const isGallery = /gall[ae]ry/i.test(pageTitle || "");

  const sliderHtml = renderSlider(safeSlides, baseUrl);

  // Hydrate the page's [data-entity] tables; each one is wrapped for round-trip.
  const pageHtml =
    hydrateSiteData(safeHtml, safeData, { wrap: true, baseUrl }) ||
    "<p>This page has no content yet.</p>";

  // Slider: either replace the marker (restored on save) or auto-add on Home
  // (removed on save, because the live site adds it again by itself).
  const markerMatch = pageHtml.match(SLIDER_MARKER);
  let bodyHtml;
  if (markerMatch) {
    const block = wrapBlock(sliderHtml || EMPTY_SLIDER_NOTE, markerMatch[0]);
    bodyHtml = pageHtml.replace(SLIDER_MARKER, () => block);
  } else if (isHome && sliderHtml) {
    bodyHtml = `${wrapBlock(sliderHtml, "")}${pageHtml}`;
  } else {
    bodyHtml = pageHtml;
  }

  // Gallery: the live site appends it on gallery pages, so show it here too
  // (removed on save).
  const galleryHtml = isGallery ? renderGallery(safeGalleries, baseUrl) : "";

  return `${bodyHtml}${galleryHtml ? wrapBlock(galleryHtml, "") : ""}`;
}

/**
 * Build complete iframe srcdoc for client site rendering.
 * Includes full HTML document with CSS variables for theming.
 *
 * Note: on the live site, relative /uploads/… URLs are correct, so baseUrl
 * is intentionally NOT applied here.
 */
export function buildPageSrcDoc({
  html,
  themeConfig,
  pageTitle,
  galleries = [],
  slides = [],
  siteData = {},
}) {
  const safeHtml = typeof html === "string" ? html : "";
  const safeSlides = Array.isArray(slides) ? slides : [];
  const safeGalleries = Array.isArray(galleries) ? galleries : [];
  const safeData = siteData && typeof siteData === "object" ? siteData : {};

  const isHome = /home/i.test(pageTitle || "");
  const isGallery = /gall[ae]ry/i.test(pageTitle || "");

  const sliderHtml = renderSlider(safeSlides);

  // Hydrate the page's [data-entity] tables BEFORE injecting into iframe
  const pageHtml =
    hydrateSiteData(safeHtml, safeData) ||
    "<p>This page has no content yet.</p>";

  const hasMarker = SLIDER_MARKER.test(pageHtml);

  const bodyHtml = hasMarker
    ? pageHtml.replace(SLIDER_MARKER, () => sliderHtml)
    : isHome
      ? `${sliderHtml}${pageHtml}`
      : pageHtml;

  const fullBodyHtml = `${bodyHtml}${
    isGallery ? renderGallery(safeGalleries) : ""
  }`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        --site-primary: ${
          themeConfig?.primaryColor || themeConfig?.color || "#0284c7"
        };
        --site-secondary: ${
          themeConfig?.secondaryColor || themeConfig?.color || "#0369a1"
        };
        --site-bg: ${themeConfig?.background || "#ffffff"};
        --site-text: ${
          themeConfig?.textColor || themeConfig?.color || "#0f172a"
        };
        --site-header-bg: ${
          themeConfig?.headerBackground || themeConfig?.headerBg || "#ffffff"
        };
        --site-footer-bg: ${
          themeConfig?.footerBackground || themeConfig?.footerBg || "#0f172a"
        };
        --site-button-bg: ${
          themeConfig?.buttonBackground ||
          themeConfig?.primaryColor ||
          "#0284c7"
        };
        --site-button-text: ${themeConfig?.buttonTextColor || "#ffffff"};
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        width: 100%;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        background: var(--site-bg);
        color: var(--site-text);
        font-family: ${themeConfig?.fontFamily || "Arial, sans-serif"};
      }
      .site-page { padding: 16px; }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }

      button, .btn {
        background: var(--site-button-bg);
        color: var(--site-button-text);
        border-radius: ${themeConfig?.borderRadius || "4px"};
        padding: 8px 16px;
        border: none;
        cursor: pointer;
      }

      .site-home-slider { width: 100%; margin: 22px auto 28px; overflow: hidden; border-radius: ${
        themeConfig?.borderRadius || "12px"
      }; background: #f0f0f0; }
      .site-slider-track { display: flex; width: 100%; }
      .site-slide { position: relative; flex: 0 0 100%; height: clamp(220px, 42vw, 520px); }
      .site-slide img { width: 100%; height: 100%; object-fit: cover; }
      .site-slide span { position: absolute; inset: auto 0 0; padding: 18px 22px; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,.7)); font-size: 1.15rem; text-align: left; }
      .site-gallery { margin-top: 32px; }
      .site-gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
      .site-gallery figure { margin: 0; overflow: hidden; border-radius: ${
        themeConfig?.borderRadius || "10px"
      }; background: var(--site-header-bg); }
      .site-gallery img { display: block; width: 100%; height: 240px; object-fit: cover; transition: transform 0.4s ease; }
      .site-gallery figure:hover img { transform: scale(1.06); }
      .site-gallery figcaption { padding: 10px 12px; }

      .site-data-container { margin: 24px 0; }
      .site-data-container h2 { margin: 0 0 12px; font-size: 1.4rem; }
      .site-data-table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
      .site-data-table thead { background: #f8fafc; }
      .site-data-table th { text-align: left; padding: 10px 12px; }
      .site-data-table td { padding: 10px 12px; vertical-align: top; }
      .site-data-table img { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; display: block; }
      .site-data-table a { color: #0284c7; }
      .hydration-empty-state { text-align: center; opacity: 0.7; padding: 16px; }

      main, div, section, p, h1, h2, h3, h4, h5, h6, span, a, li, ul, ol {
        color: inherit;
      }
      body {
        color: var(--site-text);
        background-color: var(--site-bg);
      }
    </style>
  </head>
  <body><main class="site-page">${fullBodyHtml}</main></body>
</html>`;
}
