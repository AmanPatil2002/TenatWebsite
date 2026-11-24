import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useTheme, alpha } from "@mui/material/styles";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Link,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { createSiteSlug } from "../../utils/siteSlug";
import { buildSiteTheme } from "../../utils/siteTheme";
import { installSiteFormHandler, SITE_FORM_SCRIPT } from "../../utils/siteForms";
import { renderSlider } from "../../utils/siteSlider";
/* ------------------------------------------------------------------ */
/* Inline SVG icons (no @mui/icons-material dependency)                */
/* ------------------------------------------------------------------ */
const strokeIcon = (size, children) => {
  const Icon = (props) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
  return Icon;
};

const fillIcon = (size, children) => {
  const Icon = (props) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
  return Icon;
};

const CloseIcon = strokeIcon(20, <path d="M18 6 6 18M6 6l12 12" />);

const FacebookIcon = fillIcon(
  18,
  <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />,
);

const InstagramIcon = strokeIcon(
  18,
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </>,
);

const YouTubeIcon = fillIcon(
  18,
  <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />,
);

const TwitterIcon = fillIcon(
  18,
  <path d="M17.5 3h3l-6.6 7.6L21.8 21h-6.1l-4.8-6.2L5.4 21H2.4l7-8L2.6 3h6.2l4.3 5.7L17.5 3zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3z" />,
);

const LinkedInIcon = fillIcon(
  18,
  <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V21h-4V9z" />,
);

const PlaceIcon = strokeIcon(
  18,
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </>,
);

const PhoneOutlineIcon = strokeIcon(
  18,
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" />,
);

const EmailIcon = strokeIcon(
  18,
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>,
);

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const SOCIALS = [
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "twitter", label: "Twitter", Icon: TwitterIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
];

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const pageKey = (page) => String(page.sitePageId ?? page.pagesId);

const PAGE_HASH_PREFIX = "#tenant-page-";
const pageAnchorId = (id) =>
  `${PAGE_HASH_PREFIX.slice(1)}${encodeURIComponent(String(id))}`;
const pageHref = (id) => `#${pageAnchorId(id)}`;
const pageIdFromHash = () => {
  if (!window.location.hash.startsWith(PAGE_HASH_PREFIX)) return "";
  try {
    return decodeURIComponent(window.location.hash.slice(PAGE_HASH_PREFIX.length));
  } catch {
    return "";
  }
};

const handlePageAnchorClick = (event, id, onNavigate, options) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  onNavigate(id, options);
};

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const isSafeExternalUrl = (value) => {
  if (typeof value !== "string") return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const resolveMediaImage = (url) => {
  if (typeof url !== "string") return "";
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return /^https?:\/\/\S+$/i.test(url) ? url : "";
};

const renderGallery = (items) => {
  if (!Array.isArray(items)) return "";
  const cards = items
    .map((item) => {
      const imageUrl = resolveMediaImage(item.imageUrl);
      if (!imageUrl) return "";
      const title =
        item.title || item.caption || item.altText || "Gallery image";
      const description = item.caption || item.title;
      const caption = description
        ? `<figcaption>${escapeHtml(description)}</figcaption>`
        : "";
      return `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.altText || title)}" width="640" height="480" loading="lazy" decoding="async" />${caption}</figure>`;
    })
    .filter(Boolean)
    .join("");

  if (!cards) return "";
  return `<section class="site-gallery" aria-labelledby="site-gallery-title"><h2 id="site-gallery-title" class="site-visually-hidden">Gallery</h2><div class="site-gallery-grid">${cards}</div></section>`;
};

// const renderSlider = (items) => {
//   if (!Array.isArray(items)) return "";
//   const slides = items
//     .filter((item) => resolveMediaImage(item.imageUrl))
//     .map((item, index) => {
//       const title = item.title || `Slide ${index + 1}`;
//       const loading = index === 0 ? "eager" : "lazy";
//       const fetchPriority = index === 0 ? ' fetchpriority="high"' : "";
//       return `<figure class="site-slide"><img src="${escapeHtml(resolveMediaImage(item.imageUrl))}" alt="${escapeHtml(title)}" width="1600" height="900" loading="${loading}" decoding="async"${fetchPriority} /><figcaption>${escapeHtml(title)}</figcaption></figure>`;
//     });

//   if (!slides.length) return "";
//   const hasMotion = slides.length > 1;
//   const animation = hasMotion
//     ? `animation: siteSlider ${slides.length * 5}s ease-in-out infinite;`
//     : "";
//   const keyframes = hasMotion
//     ? `@keyframes siteSlider { ${slides
//         .map((_, index) => {
//           const start = (index / slides.length) * 100;
//           const holdEnd =
//             index === slides.length - 1
//               ? 100
//               : ((index + 1) / slides.length) * 100 - 1;
//           return `${start}% , ${holdEnd}% { transform: translateX(-${index * 100}%); }`;
//         })
//         .join(" ")} }`
//     : "";

//   return `<section class="site-home-slider" aria-label="Featured images"><button class="site-slider-pause" type="button" aria-pressed="false"${hasMotion ? "" : " hidden"}>Pause slideshow</button><div class="site-slider-track"${animation ? ` style="${animation}"` : ""}>${slides.join("")}</div></section><style>${keyframes}</style>`;
// };


const SLIDER_MARKER = /<!--\s*SITE_SLIDER\s*-->/i;

const SITE_IFRAME_UX_SCRIPT = `
<script>
(() => {
  const postFrameMessage = (type, details = {}) => {
    parent.postMessage({ type, ...details }, '*');
  };

  let resizeFrame = 0;
  const reportHeight = () => {
  resizeFrame = 0;
  const height = Math.ceil(
    document.documentElement.getBoundingClientRect().height,
  );
  postFrameMessage('tenant-site-frame-resize', { height });
};
  const scheduleHeight = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(reportHeight);
  };

  const getFormStatus = (form, index) => {
    let status = form.querySelector('[data-form-status]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-form-status', '');
      form.appendChild(status);
    }
    if (!status.id) status.id = 'tenant-form-status-' + index;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const describedBy = new Set(
      (form.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean),
    );
    describedBy.add(status.id);
    form.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
    return status;
  };

  document.querySelectorAll('form[data-form]').forEach((form, index) => {
    const status = getFormStatus(form, index);
    form.querySelectorAll('input, select, textarea').forEach((control) => {
      if (control.type === 'hidden') return;
      const hasLabel = control.id && document.querySelector('label[for="' + CSS.escape(control.id) + '"]');
      if (!hasLabel && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
        const fallbackLabel = control.getAttribute('placeholder') || control.getAttribute('name');
        if (fallbackLabel) control.setAttribute('aria-label', fallbackLabel.replace(/[-_]+/g, ' '));
      }
    });
    form.addEventListener('submit', () => {
      form.setAttribute('aria-busy', 'true');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('data-state', 'pending');
      window.setTimeout(() => {
        status.textContent = 'Submitting…';
        scheduleHeight();
      }, 0);
    });
  });

  window.addEventListener('message', (message) => {
    if (message.data?.type !== 'tenant-site-form-result') return;
    window.setTimeout(() => {
      document.querySelectorAll('form[aria-busy="true"]').forEach((form, index) => {
        const status = getFormStatus(form, index);
        const success = message.data.success === true;
        form.removeAttribute('aria-busy');
        status.setAttribute('role', success ? 'status' : 'alert');
        status.setAttribute('aria-live', success ? 'polite' : 'assertive');
        status.setAttribute('data-state', success ? 'success' : 'error');
        status.textContent = String(
          message.data.message ||
            (success ? 'Submission received successfully.' : 'Could not submit the form. Please try again.'),
        );
      });
      scheduleHeight();
    }, 0);
  });

  const slider = document.querySelector('.site-home-slider');
  const sliderTrack = slider?.querySelector('.site-slider-track');
  const pauseButton = slider?.querySelector('.site-slider-pause');
  if (sliderTrack && pauseButton) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      sliderTrack.style.animation = 'none';
      pauseButton.hidden = true;
    } else {
      pauseButton.addEventListener('click', () => {
        const paused = sliderTrack.style.animationPlayState === 'paused';
        sliderTrack.style.animationPlayState = paused ? 'running' : 'paused';
        pauseButton.setAttribute('aria-pressed', String(!paused));
        pauseButton.textContent = paused ? 'Pause slideshow' : 'Play slideshow';
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) sliderTrack.style.animationPlayState = 'paused';
      });
    }
  }

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
  });
  document.querySelectorAll('img').forEach((image, index) => {
    if (!image.hasAttribute('alt')) image.setAttribute('alt', '');
    image.decoding = 'async';
    if (!image.hasAttribute('loading') && index > 0) image.loading = 'lazy';
    const setDimensions = () => {
      if (!image.hasAttribute('width') && image.naturalWidth) image.width = image.naturalWidth;
      if (!image.hasAttribute('height') && image.naturalHeight) image.height = image.naturalHeight;
      scheduleHeight();
    };
    if (image.complete) setDimensions();
    else image.addEventListener('load', setDimensions, { once: true });
  });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(scheduleHeight);
    resizeObserver.observe(document.documentElement);
    if (document.body) resizeObserver.observe(document.body);
  }
  window.addEventListener('load', scheduleHeight, { once: true });
  window.addEventListener('error', (event) => {
    if (!event.error) return;
    postFrameMessage('tenant-site-frame-error', {
      message: 'Some page content could not load. Refresh the page or choose another page.',
    });
  });
  window.addEventListener('unhandledrejection', () => {
    postFrameMessage('tenant-site-frame-error', {
      message: 'Some page content could not load. Refresh the page or choose another page.',
    });
  });

  postFrameMessage('tenant-site-frame-ready');
  scheduleHeight();
})();
</script>`;

/* ------------------------------------------------------------------ */
/* Hydration: relationships                                            */
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

/* Statuses that should never be shown on a public page.
   Everything else (active, available, upcoming, published, ...) is shown. */
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

/* --------------------------------
   Utility functions
--------------------------------- */

const isEmpty = (value) =>
  value === null || value === undefined || value === "";

const getNestedValue = (object, path) => {
  if (!object || !path) return undefined;

  return String(path)
    .split(".")
    .reduce((current, key) => current?.[key], object);
};

const resolveEntity = (entity, siteData) => {
  const aliases = {
    categories: "productcategories",
  };

  return siteData[entity] ?? siteData[aliases[entity] || entity];
};

/* --------------------------------
   Value formatting
   <span data-field="price" data-format="currency" data-currency="INR">
--------------------------------- */

const formatValue = (value, format, element) => {
  if (isEmpty(value)) return value;

  // JSON columns (features, amenities, tags...) arrive as arrays.
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




/* --------------------------------
   Relationship maps
--------------------------------- */

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

/* --------------------------------
   Entity enrichment
--------------------------------- */

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

/* --------------------------------
   Safe attribute rendering
--------------------------------- */

const renderField = (element, item) => {
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
    if (element.hasAttribute("data-format")) {
      element.style.fontVariantNumeric = "tabular-nums";
    }

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
    output = resolveMediaImage(value);
  }

  // data-prefix="tel:" / "mailto:" builds the link from a raw value
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

  // Attributes honour data-fallback too (e.g. placeholder images).
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

  if (attr === "src" && element.tagName === "IMG") {
    if (!element.hasAttribute("alt")) element.setAttribute("alt", "");
    if (!element.hasAttribute("loading")) element.setAttribute("loading", "lazy");
    element.setAttribute("decoding", "async");
  }
};

/* --------------------------------
   Recursive hydration
--------------------------------- */

const hydrateContainer = (container, siteData, maps) => {
  const entity = container.getAttribute("data-entity");

  const source = resolveEntity(entity, siteData);

  const template = Array.from(container.children)
    .flatMap((child) => [child, ...child.querySelectorAll("[data-row]")])
    .find((element) => element.hasAttribute("data-row"));

  if (!template || !Array.isArray(source)) return;

  // Clone before clearing the original holder.
  const holder = template.parentElement;
  const rowTemplate = template.cloneNode(true);

  // Hide only unwanted statuses; available / upcoming / published etc. are shown.
  const rows = source.filter(
    (record) =>
      record.isApproved !== false &&
      record.isApproved !== 0 &&
      record.approved !== false &&
      record.approved !== 0 &&
      !HIDDEN_STATUSES.has(String(record.status ?? "").toLowerCase()),
  );

  holder.replaceChildren();

  if (!rows.length) {
    const empty = container.ownerDocument.createElement("p");

    empty.className = "hydration-empty-state";
    empty.setAttribute("role", "status");

    empty.textContent =
      container.getAttribute("data-empty-text") || "No published items yet.";

    holder.appendChild(empty);

    return;
  }

  rows.forEach((raw) => {
    const item = enrichEntity(entity, raw, maps);

    const row = rowTemplate.cloneNode(true);

    // The row element itself may carry data-field.
    if (row.hasAttribute?.("data-field")) renderField(row, item);

    // Hydrate fields belonging to this row.
    row
      .querySelectorAll("[data-field]")
      .forEach((element) => renderField(element, item));

    // Hydrate nested entity containers independently.
    row.querySelectorAll("[data-entity]").forEach((nestedContainer) => {
      hydrateContainer(nestedContainer, siteData, maps);
    });

    holder.appendChild(row);
  });
};

/* --------------------------------
   Main function
--------------------------------- */

const hydrateSiteData = (html, siteData = {}) => {
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

  // Process only top-level entity containers.
  const containers = Array.from(root.querySelectorAll("[data-entity]")).filter(
    (container) => {
      return !container.parentElement.closest("[data-entity]");
    },
  );

  containers.forEach((container) => {
    hydrateContainer(container, siteData, maps);
  });

  return root.innerHTML;
};

/* ------------------------------------------------------------------ */
/* Build iframe srcdoc                                                 */
/* ------------------------------------------------------------------ */
const buildSrcDoc = ({
  html,
  themeConfig,
  pageTitle,
  galleries,
  slides,
  siteData,
}) => {
  const isHome = /home/i.test(pageTitle);
  const isGallery = /gall[ae]ry/i.test(pageTitle);

  const sliderHtml = isHome ? renderSlider(slides, resolveMediaImage, escapeHtml) : "";
  // Hydrate the page's [data-entity] tables BEFORE injecting into iframe
  const pageHtml =
    hydrateSiteData(html, siteData) || "<p>This page has no content yet.</p>";

  const bodyHtml = SLIDER_MARKER.test(pageHtml)
    ? pageHtml.replace(SLIDER_MARKER, () => sliderHtml)
    : `${sliderHtml}${pageHtml}`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        --site-primary: ${themeConfig.primaryColor || themeConfig.color || "#0284c7"};
        --site-secondary: ${themeConfig.secondaryColor || themeConfig.color || "#0369a1"};
        --site-bg: ${themeConfig.background || "#ffffff"};
        --site-text: ${themeConfig.textColor || themeConfig.color || "#0f172a"};
        --site-header-bg: ${themeConfig.headerBackground || themeConfig.headerBg || "#ffffff"};
        --site-footer-bg: ${themeConfig.footerBackground || themeConfig.footerBg || "#0f172a"};
        --site-button-bg: ${themeConfig.buttonBackground || themeConfig.primaryColor || "#0284c7"};
        --site-button-text: ${themeConfig.buttonTextColor || "#ffffff"};
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
        font-family: ${themeConfig.fontFamily || "Arial, sans-serif"};
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .site-page { width: min(100%, 1200px); margin-inline: auto; padding: clamp(12px, 3vw, 32px); }
      .site-page > :first-child { margin-top: 0; }
      h1, h2, h3, h4, h5, h6 { scroll-margin-top: 24px; text-wrap: balance; overflow-wrap: anywhere; }
      p, li, figcaption { text-wrap: pretty; overflow-wrap: anywhere; }
      img, video, svg, canvas { max-width: 100%; height: auto; }
      iframe { max-width: 100%; }
      table { width: 100%; max-width: 100%; border-collapse: collapse; }
      th, td { overflow-wrap: anywhere; }
      .site-visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
      .hydration-empty-state { margin: 16px 0; padding: 24px 16px; border: 1px dashed color-mix(in srgb, var(--site-text) 30%, transparent); border-radius: ${themeConfig.borderRadius || "8px"}; text-align: center; opacity: .8; }

      button, .btn, input, select, textarea { font: inherit; }
      button, .btn {
        min-height: 44px;
        background: var(--site-button-bg);
        color: var(--site-button-text);
        border-radius: ${themeConfig.borderRadius || "4px"};
        padding: 10px 16px;
        border: none;
        cursor: pointer;
        touch-action: manipulation;
      }
      button:hover, .btn:hover { filter: brightness(.94); }
      button:disabled, .btn:disabled { cursor: wait; opacity: .7; }
      a, button, .btn, input, select, textarea { scroll-margin-block: 24px; }
      :where(a, button, .btn, input, select, textarea):focus-visible { outline: 3px solid var(--site-primary); outline-offset: 3px; }
      input, select, textarea { max-width: 100%; }
      [data-form-status] { min-height: 1.5em; margin-block: 12px 0; font-weight: 600; }
      [data-form-status][data-state="error"] { color: #b91c1c; }
      [data-form-status][data-state="success"] { color: #166534; }

      .site-home-slider { position: relative; width: 100%; margin: 22px auto 28px; overflow: hidden; border-radius: ${themeConfig.borderRadius || "12px"}; background: #f0f0f0; }
      .site-slider-track { display: flex; width: 100%; will-change: transform; }
      .site-slider-pause { position: absolute; z-index: 2; top: 12px; right: 12px; min-height: 40px; padding: 8px 12px; background: rgba(0, 0, 0, .78); color: #fff; }
      .site-slide { position: relative; flex: 0 0 100%; margin: 0; aspect-ratio: var(--slide-ratio, 16 / 9); min-height: 160px; }
      .site-slide img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .site-slide figcaption { position: absolute; inset: auto 0 0; padding: 38px 22px 18px; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,.78)); font-size: 1.15rem; text-align: left; }
      .site-gallery { margin-top: 32px; }
      .site-gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
      .site-gallery figure { min-width: 0; margin: 0; overflow: hidden; border-radius: ${themeConfig.borderRadius || "10px"}; background: var(--site-header-bg); }
      .site-gallery img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; transition: transform 0.4s ease; }
      .site-gallery figure:hover img { transform: scale(1.04); }
      .site-gallery figcaption { padding: 10px 12px; }
      main, div, section, p, h1, h2, h3, h4, h5, h6, span, a, li, ul, ol { color: inherit; }

      @media (max-width: 640px) {
        .site-page { padding: 12px; }
        
        .site-slide figcaption { padding: 32px 14px 14px; font-size: 1rem; }
        .site-slider-pause { top: 8px; right: 8px; }
        table { display: block; overflow-x: auto; overscroll-behavior-inline: contain; }
      }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        .site-slider-track { animation: none !important; transform: none !important; }
        .site-slider-pause { display: none; }
        .site-gallery figure:hover img { transform: none; }
      }
      @media (forced-colors: active) {
        :where(a, button, .btn, input, select, textarea):focus-visible { outline-color: Highlight; }
      }
    </style>
  </head>
  <body><main class="site-page">${bodyHtml}${isGallery ? renderGallery(galleries) : ""}</main>${SITE_FORM_SCRIPT}${SITE_IFRAME_UX_SCRIPT}</body>
</html>`;
};

/* ------------------------------------------------------------------ */
/* Site Header                                                         */
/* ------------------------------------------------------------------ */
function SiteHeader({ header, siteName, pages, activeId, onNavigate, theme }) {
  const logo = resolveMediaImage(header?.logoUrl);
  const title = header?.siteTitle || siteName;

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        color: theme.textColor || theme.color,
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.headerBackground || theme.headerBg || theme.background,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, md: 4 },
        }}
      >
        {/* Logo + title */}
        {(logo || title) && (
          <Box
            component="a"
            href={pages[0] ? pageHref(pageKey(pages[0])) : "#main-content"}
            onClick={(event) => {
              if (pages[0]) {
                handlePageAnchorClick(
                  event,
                  pageKey(pages[0]),
                  onNavigate,
                  { focus: true },
                );
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              borderRadius: 1,
              "&:focus-visible": {
                outline: `3px solid ${theme.primaryColor || theme.color}`,
                outlineOffset: 3,
              },
              py: 1,
              minHeight: { xs: 56, md: 64 },
              color: "inherit",
              textDecoration: "none",
              minWidth: 0,
              flexShrink: 0,
              maxWidth: { xs: "100%", md: "40%" },
            }}
          >
            {logo && (
              <Box
                component="img"
                src={logo}
                alt={title ? `${title} logo` : "Site logo"}
                width={44}
                height={44}
                fetchPriority="high"
                sx={{
                  display: "block",
                  width: { xs: 36, md: 44 },
                  height: { xs: 36, md: 44 },
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            {title && (
              <Typography
                component="span"
                noWrap
                sx={{
                  fontSize: { xs: "1.05rem", md: "1.3rem" },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
        )}

        {/* Navigation: scrollable so many pages stay usable */}
        <Box
          sx={{
            minWidth: 0,
            maxWidth: "100%",
            borderTop: { xs: `1px solid ${theme.border}`, md: "none" },
          }}
        >
          <Tabs
            component="nav"
            aria-label="Site navigation"
            value={activeId}
            onChange={(_, value) => onNavigate(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 48,
              minWidth: 0,
              color: theme.textColor || theme.color,
              "& .MuiTabs-flexContainer": { gap: 0.5 },
              "& .MuiTabs-indicator": {
                backgroundColor: theme.primaryColor || theme.color,
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiTabScrollButton-root": {
                color: theme.textColor || theme.color,
                width: 32,
              },
              "& .MuiTab-root": {
                minHeight: 48,
                minWidth: "auto",
                maxWidth: 220,
                px: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                color: theme.textColor || theme.color,
                opacity: 0.7,
                borderRadius: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "opacity .2s, background-color .2s",
                "&:hover": { opacity: 1, bgcolor: theme.hover },
                "&:focus-visible": {
                  opacity: 1,
                  outline: `3px solid ${theme.primaryColor || theme.color}`,
                  outlineOffset: -3,
                },
              },
              "& .MuiTab-root.Mui-selected": {
                color: theme.textColor || theme.color,
                opacity: 1,
              },
            }}
          >
            {pages.map((p) => {
              const id = pageKey(p);
              const label = p.title || "Untitled page";
              return (
                <Tab
                  key={id}
                  component="a"
                  href={pageHref(id)}
                  value={id}
                  label={label}
                  title={label}
                  aria-current={id === activeId ? "page" : undefined}
                  onClick={(event) =>
                    handlePageAnchorClick(event, id, onNavigate, { focus: true })
                  }
                />
              );
            })}
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Site Footer                                                         */
/* ------------------------------------------------------------------ */
function FooterHeading({ children }) {
  return (
    <Typography
      component="h3"
      sx={{
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

function SiteFooter({ header, siteName, pages, activeId, onNavigate, theme }) {
  const title = header?.siteTitle || siteName;
  const socialLinks =
    header?.socialLinks && typeof header.socialLinks === "object"
      ? header.socialLinks
      : {};
  const socials = SOCIALS.filter(({ key }) =>
    isSafeExternalUrl(socialLinks[key]),
  );

  const contacts = [
    header?.footerAddress && {
      key: "address",
      Icon: PlaceIcon,
      text: header.footerAddress,
    },
    header?.footerPhone && {
      key: "phone",
      Icon: PhoneOutlineIcon,
      text: header.footerPhone,
      href: `tel:${header.footerPhone}`,
    },
    header?.footerEmail && {
      key: "email",
      Icon: EmailIcon,
      text: header.footerEmail,
      href: `mailto:${header.footerEmail}`,
    },
  ].filter(Boolean);

  const hasAbout = Boolean(header?.footerText || title);
  const hasLinks = pages.length > 1;
  const copyright =
    header?.copyrightText ||
    (title ? `© ${new Date().getFullYear()} ${title}` : "");

  // Cap the height of very long link lists so the footer stays balanced.
  const linkCap = pages.length > 12;

  const linkSx = {
    color: "inherit",
    textDecoration: "none",
    opacity: 0.85,
    borderRadius: 0.5,
    "&:hover": { opacity: 1, textDecoration: "underline" },
    "&:focus-visible": {
      opacity: 1,
      outline: `3px solid ${theme.primaryColor || theme.color}`,
      outlineOffset: 3,
    },
  };

  if (
    !hasAbout &&
    !hasLinks &&
    !contacts.length &&
    !socials.length &&
    !copyright
  ) {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.footerBackground || theme.footerBg || theme.background,
        color: theme.textColor || theme.color,
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 3 }, py: 5 }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 5 },
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            overflowWrap: "anywhere",
          }}
        >
          {hasAbout && (
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography
                  sx={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    mb: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </Typography>
              )}
              {header?.footerText && (
                <Typography
                  sx={{
                    color: theme.muted,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {header.footerText}
                </Typography>
              )}
            </Box>
          )}

          {/* ---- Quick links: responsive multi-column grid ---- */}
          {hasLinks && (
            <Box
              component="nav"
              aria-label="Footer navigation"
              sx={{ minWidth: 0 }}
            >
              <FooterHeading>Quick links</FooterHeading>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  columnGap: 2,
                  rowGap: 1,
                  maxHeight: linkCap ? 240 : "none",
                  overflowY: linkCap ? "auto" : "visible",
                  pr: linkCap ? 1 : 0,
                }}
              >
                {pages.map((p) => {
                  const isActive = pageKey(p) === activeId;
                  return (
                    <Link
                      key={pageKey(p)}
                      component="a"
                      href={pageHref(pageKey(p))}
                      onClick={(event) =>
                        handlePageAnchorClick(
                          event,
                          pageKey(p),
                          onNavigate,
                          { focus: true },
                        )
                      }
                      aria-current={isActive ? "page" : undefined}
                      title={p.title || "Untitled page"}
                      sx={{
                        ...linkSx,
                        display: "block",
                        textAlign: "left",
                        font: "inherit",
                        fontWeight: isActive ? 700 : 400,
                        justifySelf: "stretch",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.title || "Untitled page"}
                    </Link>
                  );
                })}
              </Box>
            </Box>
          )}

          {contacts.length > 0 && (
            <Box sx={{ minWidth: 0 }}>
              <FooterHeading>Contact</FooterHeading>
              <Box sx={{ display: "grid", gap: 1.25 }}>
                {contacts.map(({ key, Icon, text, href }) => (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      gap: 1.25,
                      alignItems: "flex-start",
                      minWidth: 0,
                    }}
                  >
                    <Icon
                      style={{ marginTop: 2, opacity: 0.8, flexShrink: 0 }}
                    />
                    {href ? (
                      <Link
                        href={href}
                        sx={{
                          ...linkSx,
                          minWidth: 0,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {text}
                      </Link>
                    ) : (
                      <Typography
                        sx={{ opacity: 0.85, overflowWrap: "anywhere" }}
                      >
                        {text}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {socials.length > 0 && (
            <Box sx={{ minWidth: 0 }}>
              <FooterHeading>Follow us</FooterHeading>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {socials.map(({ key, label, Icon }) => (
                  <IconButton
                    key={key}
                    component="a"
                    href={socialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    sx={{
                      color: theme.textColor || theme.color,
                      border: `1px solid ${theme.border}`,
                      width: 40,
                      height: 40,
                      "&:hover": { bgcolor: theme.hover },
                      "&:focus-visible": {
                        outline: `3px solid ${theme.primaryColor || theme.color}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Icon />
                  </IconButton>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {copyright && (
        <Box sx={{ borderTop: `1px solid ${theme.border}` }}>
          <Typography
            sx={{
              maxWidth: 1200,
              mx: "auto",
              px: { xs: 2, md: 3 },
              py: 2,
              textAlign: "center",
              fontSize: "0.85rem",
              color: theme.muted,
            }}
          >
            {copyright}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */
export default function Site() {
  const { siteId: adminSiteId, siteSlug } = useParams();
  const navigate = useNavigate();
  const siteAdminMode = window.location.pathname.startsWith("/site-admin/");
  const publicMode = window.location.pathname.startsWith("/site/");
  const routeSiteKey = siteAdminMode ? adminSiteId : siteSlug;

  const [site, setSite] = useState({
    color: "#222222",
    background: "#ffffff",
  });
  const [pages, setPages] = useState([]);
  const [media, setMedia] = useState({ news: [], galleries: [], slider: [] });
  const [siteData, setSiteData] = useState({});
  const [activeId, setActiveId] = useState("");
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsOpen, setNewsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [themeConfig, setThemeConfig] = useState(null);
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameError, setFrameError] = useState("");
  const iframeRef = useRef(null);
  const mainRef = useRef(null);
  const [targetSiteId, setTargetSiteId] = useState("");
  const [submissionVersion, setSubmissionVersion] = useState(0);

  useEffect(() => {
    const token = siteAdminMode
      ? localStorage.getItem("siteAdminToken")
      : getToken();
    if (!token && !publicMode) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let targetSiteId = routeSiteKey;
        let meta = null;
        if (publicMode) {
          const resolved = await axios.get(
            `${API_URL}/sites/public/resolve/${encodeURIComponent(routeSiteKey)}`,
          );
          if (cancelled) return;
          meta = resolved.data;
          targetSiteId = meta.id;
        } else if (!siteAdminMode) {
          const sitesRes = await axios.get(`${API_URL}/sites/my`, { headers });
          if (cancelled) return;
          const sites = Array.isArray(sitesRes.data) ? sitesRes.data : [];
          meta = sites.find((item) => createSiteSlug(item) === siteSlug);

          if (!meta) {
            const legacySite = sites.find(
              (item) => String(item.id) === siteSlug,
            );
            if (legacySite) {
              const previewPath = window.location.pathname.endsWith("/preview")
                ? "/preview"
                : "";
              navigate(`/mysite/${createSiteSlug(legacySite)}${previewPath}`, {
                replace: true,
              });
              return;
            }
            setError("Site not found in your account.");
            return;
          }
          targetSiteId = meta.id;
        }
        setTargetSiteId(targetSiteId);

        const pagesUrl = siteAdminMode
          ? `${API_URL}/sites/client-admin/${targetSiteId}/pages`
          : publicMode
            ? `${API_URL}/sites/${targetSiteId}/public/pages`
            : `${API_URL}/sites/${targetSiteId}/pages`;
        const themeUrl = siteAdminMode
          ? `${API_URL}/sites/client-admin/${targetSiteId}/theme`
          : publicMode
            ? `${API_URL}/sites/${targetSiteId}/public/theme`
            : `${API_URL}/sites/${targetSiteId}/theme`;
        const mediaUrl = siteAdminMode
          ? `${API_URL}/sites/client-admin/${targetSiteId}/media`
          : publicMode
            ? `${API_URL}/sites/${targetSiteId}/public/media`
            : `${API_URL}/sites/${targetSiteId}/media`;

        const [pagesRes, themeRes, mediaRes] = await Promise.all([
          axios.get(pagesUrl, { headers }),
          axios.get(themeUrl, { headers }).catch(() => ({ data: null })),
          axios.get(mediaUrl, { headers }),
        ]);
        if (cancelled) return;

        const list = Array.isArray(pagesRes.data?.pages)
          ? pagesRes.data.pages
          : [];

        setPages(list);
        setThemeConfig(themeRes.data);

        const news = Array.isArray(mediaRes.data?.news)
          ? mediaRes.data.news
          : [];
        setNewsIndex(0);
        setNewsOpen(news.length > 0);
        setMedia({
          news,
          galleries: Array.isArray(mediaRes.data?.galleries)
            ? mediaRes.data.galleries
            : [],
          slider: Array.isArray(mediaRes.data?.slider)
            ? mediaRes.data.slider
            : [],
        });

        // Fetch site data resources.
        try {
          const base = siteAdminMode
            ? `${API_URL}/sites/client-admin/${targetSiteId}/data`
            : publicMode
              ? `${API_URL}/sites/${targetSiteId}/public/data`
              : `${API_URL}/sites/${targetSiteId}/data`;
          const dataRes = await axios.get(base, { headers });
          if (cancelled) return;

          const resources = Array.isArray(dataRes.data?.sections)
            ? dataRes.data.sections.map((s) => s.resource)
            : Array.isArray(dataRes.data)
              ? dataRes.data
              : [];

          const dataMap = {};
          await Promise.all(
            resources.map(async (resource) => {
              try {
                const res = await axios.get(`${base}/${resource}`, {
                  headers,
                });
                dataMap[resource] = Array.isArray(res.data)
                  ? res.data
                  : Array.isArray(res.data?.rows)
                    ? res.data.rows
                    : Array.isArray(res.data?.data)
                      ? res.data.data
                      : [];
              } catch (e) {
                console.warn(`Could not load site data "${resource}"`, e);
              }
            }),
          );
          if (cancelled) return;
          setSiteData(dataMap);
        } catch (e) {
          console.warn("Could not load site data resources", e);
        }

        const requestedPageId = pageIdFromHash();
        const initialPage =
          list.find((page) => pageKey(page) === requestedPageId) || list[0];
        setActiveId(initialPage ? pageKey(initialPage) : "");
        setSite({
          color: meta?.color || pagesRes.data?.color || "#222222",
          background:
            meta?.background || pagesRes.data?.background || "#ffffff",
          currency: pagesRes.data?.currency || "INR",
          siteName: pagesRes.data?.siteName || meta?.name || "",
          header: pagesRes.data?.header || {},
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : err.response?.data?.message || "Could not load this site.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [routeSiteKey, siteSlug, navigate, siteAdminMode, publicMode, submissionVersion]);

  useEffect(
    () =>
      installSiteFormHandler({
        siteId: targetSiteId,
        iframeRef,
        onSubmitted: () => {
          setSubmissionVersion((version) => version + 1);
        },
      }),
    [targetSiteId],
  );

  useEffect(() => {
    if (!media.news.length) return undefined;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return undefined;

    let nextIndex = 0;
    const timer = window.setInterval(
      () => {
        nextIndex = (nextIndex + 1) % media.news.length;
        setNewsIndex(nextIndex);
        setNewsOpen(true);
      },
      5 * 60 * 1000,
    );

    return () => window.clearInterval(timer);
  }, [media.news]);

  useEffect(() => {
    const onFrameMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === "tenant-site-frame-ready") {
        setFrameLoading(false);
        return;
      }

      if (event.data?.type === "tenant-site-frame-resize") {
        const height = Number(event.data.height);
        if (Number.isFinite(height) && height > 0 && iframeRef.current) {
          iframeRef.current.style.height = `${Math.ceil(height)}px`;
        }
        return;
      }

      if (event.data?.type === "tenant-site-frame-error") {
        setFrameLoading(false);
        setFrameError(
          event.data.message ||
            "Some page content could not load. Refresh the page or choose another page.",
        );
      }
    };

    window.addEventListener("message", onFrameMessage);
    return () => window.removeEventListener("message", onFrameMessage);
  }, []);

  const muiTheme = useTheme();
  const muiPrimary = muiTheme.palette.primary.main;
  const muiPrimaryDark = muiTheme.palette.primary.dark;
  const muiTextPrimary = muiTheme.palette.text.primary;
  const muiTextSecondary = muiTheme.palette.text.secondary;
  const muiBackgroundDefault = muiTheme.palette.background.default;
  const muiBackgroundPaper = muiTheme.palette.background.paper;
  const muiDivider = muiTheme.palette.divider;

  const activePage = useMemo(
    () => pages.find((p) => pageKey(p) === String(activeId)),
    [pages, activeId],
  );

  const theme = useMemo(
    () =>
      buildSiteTheme(
        site.background || "#ffffff",
        site.color || "#222222",
        themeConfig,
      ),
    [site.background, site.color, themeConfig],
  );

  // Re-mount the iframe when the data set changes so tables re-hydrate.
  const dataVersion = useMemo(() => Object.keys(siteData).length, [siteData]);

  const srcDoc = useMemo(
    () =>
      buildSrcDoc({
        html: activePage?.page,
        themeConfig: theme,
        pageTitle: activePage?.title || "Site",
        galleries: media.galleries,
        slides: media.slider,
        siteData: {
          ...siteData,
          headers:
            site.header && Object.keys(site.header).length
              ? [site.header]
              : siteData.headers || [],
        },
      }),
    [activePage, theme, media.galleries, media.slider, siteData, site.header],
  );

  const handleNavigate = (id, { focus = false } = {}) => {
    const nextId = String(id);
    if (!pages.some((page) => pageKey(page) === nextId)) return;

    setFrameLoading(true);
    setFrameError("");
    setActiveId(nextId);
    window.history.replaceState(null, "", pageHref(nextId));
    window.scrollTo({ top: 0, behavior: "auto" });
    if (focus) window.requestAnimationFrame(() => mainRef.current?.focus());
  };

  const handleFrameLoad = () => {
    // A sandboxed srcdoc has an opaque origin, so frame sizing is reported via postMessage.
    window.setTimeout(() => setFrameLoading(false), 1500);
  };

  const retryFrame = () => {
    setFrameError("");
    setFrameLoading(true);
    setSubmissionVersion((version) => version + 1);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(160deg, ${muiBackgroundDefault} 0%, ${alpha(muiTheme.palette.primary.main, 0.04)} 45%, ${alpha(muiTheme.palette.info.main, 0.04)} 100%)`,
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            flex: 1,
            minHeight: 320,
            bgcolor: muiBackgroundPaper,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: muiBackgroundPaper, flex: 1 }}>
          <Alert severity="error" sx={{ maxWidth: 720, mx: "auto" }}>
            {error}
          </Alert>
        </Box>
      ) : pages.length === 0 ? (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: muiBackgroundPaper, flex: 1 }}>
          <Alert severity="info" sx={{ maxWidth: 720, mx: "auto" }}>
            This site has no pages yet.
          </Alert>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.background,
          }}
        >
          <SiteHeader
            header={site.header}
            siteName={site.siteName}
            pages={pages}
            activeId={String(activeId)}
            onNavigate={handleNavigate}
            theme={theme}
          />

          <Box
            component="main"
            sx={{ flex: "1 0 auto", bgcolor: theme.background }}
          >
            <Box
              component="iframe"
              key={`${activeId}-${dataVersion}`}
              title={activePage?.title || "Page preview"}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              srcDoc={srcDoc}
              onLoad={handleFrameLoad}
              sx={{
                display: "block",
                width: "100%",
                minHeight: "calc(100vh - 160px)",
                border: 0,
                bgcolor: theme.background,
              }}
            />
          </Box>

          <SiteFooter
            header={site.header}
            siteName={site.siteName}
            pages={pages}
            activeId={String(activeId)}
            onNavigate={handleNavigate}
            theme={theme}
          />
        </Box>
      )}

      {/* ---------- News dialog ---------- */}
      {media.news[newsIndex] && (
        <Dialog
          open={newsOpen}
          onClose={() => setNewsOpen(false)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="site-news-title"
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: alpha(muiTheme.palette.common.black, 0.6),
                backdropFilter: "blur(3px)",
              },
            },
            paper: {
              sx: {
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: `0 24px 60px ${alpha(muiTheme.palette.common.black, 0.25)}`,
                position: "relative",
              },
            },
          }}
        >
          {resolveMediaImage(media.news[newsIndex].imageUrl) && (
            <Box
              component="img"
              src={resolveMediaImage(media.news[newsIndex].imageUrl)}
              alt={media.news[newsIndex].title || "News"}
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              sx={{
                display: "block",
                width: "100%",
                height: { xs: 200, sm: 260 },
                objectFit: "cover",
              }}
            />
          )}

          <IconButton
            aria-label="Close news"
            onClick={() => setNewsOpen(false)}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: muiTheme.palette.common.white,
              bgcolor: alpha(muiTheme.palette.common.black, 0.5),
              "&:hover": { bgcolor: alpha(muiTheme.palette.common.black, 0.75) },
            }}
          >
            <CloseIcon />
          </IconButton>

          <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
            <Typography
              id="site-news-title"
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                mb: 2,
                textAlign: "center",
                color: muiTextPrimary,
              }}
            >
              {media.news[newsIndex].title}
            </Typography>

            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                color: muiTextSecondary,
                lineHeight: 1.7,
                textAlign: "center",
                overflowWrap: "anywhere",
                textWrap: "pretty",
              }}
            >
              {media.news[newsIndex].content}
            </Typography>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
