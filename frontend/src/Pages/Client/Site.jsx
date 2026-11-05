import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
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

/* ------------------------------------------------------------------ */
/* Inline SVG icons (no @mui/icons-material)                           */
/* ------------------------------------------------------------------ */
const ArrowLeftIcon = (props) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CloseIcon = (props) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const YouTubeIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.5 3h3l-6.6 7.6L21.8 21h-6.1l-4.8-6.2L5.4 21H2.4l7-8L2.6 3h6.2l4.3 5.7L17.5 3zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3z" />
  </svg>
);

const LinkedInIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V21h-4V9z" />
  </svg>
);

const PlaceIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneOutlineIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

const EmailIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TOOLBAR_HEIGHT = 56;

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

const buildTheme = (background, color) => ({
  background,
  color,
  border: `color-mix(in srgb, ${color} 18%, transparent)`,
  headerBg: `color-mix(in srgb, ${color} 6%, ${background})`,
  footerBg: `color-mix(in srgb, ${color} 10%, ${background})`,
  muted: `color-mix(in srgb, ${color} 70%, transparent)`,
  hover: `color-mix(in srgb, ${color} 12%, transparent)`,
});

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
      return `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.altText || title)}" loading="lazy" />${caption}</figure>`;
    })
    .filter(Boolean)
    .join("");

  if (!cards) return "";
  return `<section class="site-gallery"><div class="site-gallery-grid">${cards}</div></section>`;
};

const renderSlider = (items) => {
  if (!Array.isArray(items)) return "";
  const slides = items
    .filter((item) => resolveMediaImage(item.imageUrl))
    .map((item) => {
      const title = item.title || "Site slide";
      return `<div class="site-slide"><img src="${escapeHtml(resolveMediaImage(item.imageUrl))}" alt="${escapeHtml(title)}" /><span>${escapeHtml(title)}</span></div>`;
    });

  if (!slides.length) return "";
  const animation =
    slides.length > 1
      ? `animation: siteSlider ${slides.length * 5}s linear infinite;`
      : "";
  const keyframes =
    slides.length > 1
      ? `@keyframes siteSlider { ${slides
          .map((_, index) => {
            const start = (index / slides.length) * 100;
            const holdEnd =
              index === slides.length - 1
                ? 100
                : ((index + 1) / slides.length) * 100 - 1;
            return `${start}% , ${holdEnd}% { transform: translateX(-${index * 100}%); }`;
          })
          .join(" ")} }`
      : "";

  return `<section class="site-home-slider" aria-label="Image slider"><div class="site-slider-track" style="${animation}">${slides.join("")}</div></section><style>${keyframes}</style>`;
};

const SLIDER_MARKER = /<!--\s*SITE_SLIDER\s*-->/i;

const buildSrcDoc = ({
  html,
  background,
  color,
  pageTitle,
  galleries,
  slides,
}) => {
  const isHome = /home/i.test(pageTitle);
  const isGallery = /gall[ae]ry/i.test(pageTitle);

  const sliderHtml = isHome ? renderSlider(slides) : "";
  const pageHtml = html || "<p>This page has no content yet.</p>";

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
        --site-header-bg: color-mix(in srgb, ${color} 6%, ${background});
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        padding: 0;
        background: ${background};
        color: ${color};
        font-family: Arial, Helvetica, sans-serif;
      }
      .site-page { padding: 16px; }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }
      .site-home-slider { width: 100%; margin: 22px auto 28px; overflow: hidden; border-radius: 12px; background: #f0f0f0; }
      .site-slider-track { display: flex; width: 100%; }
      .site-slide { position: relative; flex: 0 0 100%; height: clamp(220px, 42vw, 520px); }
      .site-slide img { width: 100%; height: 100%; object-fit: cover; }
      .site-slide span { position: absolute; inset: auto 0 0; padding: 18px 22px; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,.7)); font-size: 1.15rem; text-align: left; }
      .site-gallery { margin-top: 32px; }
      .site-gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
      .site-gallery figure { margin: 0; overflow: hidden; border-radius: 10px; background: var(--site-header-bg); }
      .site-gallery img { display: block; width: 100%; height: 240px; object-fit: cover; transition: transform 0.4s ease; }
      .site-gallery figure:hover img { transform: scale(1.06); }
      .site-gallery figcaption { padding: 10px 12px; }
    </style>
  </head>
  <body><main class="site-page">${bodyHtml}${isGallery ? renderGallery(galleries) : ""}</main></body>
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
        bgcolor: theme.headerBg,
        color: theme.color,
        borderBottom: `1px solid ${theme.border}`,
        backgroundImage: `linear-gradient(${theme.headerBg}, ${theme.headerBg})`,
        backgroundColor: theme.background,
      }}
    >
      <Box
        sx={{
          width: "100%",
          m: 0,
          px: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 0,
        }}
      >
        {(logo || title) && (
          <Box
            component="a"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (pages[0]) onNavigate(pageKey(pages[0]));
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 0,
              color: "inherit",
              textDecoration: "none",
              minWidth: 0,
            }}
          >
            {logo && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  m: 0,
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt={title || "Site logo"}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}
            {title && (
              <Typography
                component="span"
                sx={{
                  fontSize: { xs: "1.15rem", md: "1.4rem" },
                  fontWeight: 700,
                  lineHeight: 1,
                  m: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
        )}

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
            color: theme.color,
            "& .MuiTabs-indicator": {
              backgroundColor: theme.color,
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTabScrollButton-root": { color: theme.color },
            "& .MuiTab-root": {
              minHeight: 48,
              px: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: theme.color,
              opacity: 0.7,
              transition: "opacity .2s, background-color .2s",
              "&:hover": { opacity: 1, bgcolor: theme.hover },
            },
            "& .MuiTab-root.Mui-selected": { color: theme.color, opacity: 1 },
          }}
        >
          {pages.map((p) => (
            <Tab key={pageKey(p)} value={pageKey(p)} label={p.title} />
          ))}
        </Tabs>
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

  const linkSx = {
    color: "inherit",
    textDecoration: "none",
    opacity: 0.85,
    "&:hover": { opacity: 1, textDecoration: "underline" },
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
        bgcolor: theme.background,
        backgroundImage: `linear-gradient(${theme.footerBg}, ${theme.footerBg})`,
        color: theme.color,
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
            <Box>
              {title && (
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 700, mb: 1 }}>
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

          {hasLinks && (
            <Box component="nav" aria-label="Footer navigation">
              <FooterHeading>Quick links</FooterHeading>
              <Box sx={{ display: "grid", gap: 1 }}>
                {pages.map((p) => (
                  <Link
                    key={pageKey(p)}
                    component="button"
                    type="button"
                    onClick={() => onNavigate(pageKey(p))}
                    sx={{
                      ...linkSx,
                      textAlign: "left",
                      font: "inherit",
                      fontWeight: pageKey(p) === activeId ? 700 : 400,
                      justifySelf: "start",
                    }}
                  >
                    {p.title}
                  </Link>
                ))}
              </Box>
            </Box>
          )}

          {contacts.length > 0 && (
            <Box>
              <FooterHeading>Contact</FooterHeading>
              <Box sx={{ display: "grid", gap: 1.25 }}>
                {contacts.map(({ key, Icon, text, href }) => (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      gap: 1.25,
                      alignItems: "flex-start",
                    }}
                  >
                    <Icon style={{ marginTop: 2, opacity: 0.8, flexShrink: 0 }} />
                    {href ? (
                      <Link href={href} sx={linkSx}>
                        {text}
                      </Link>
                    ) : (
                      <Typography sx={{ opacity: 0.85 }}>{text}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {socials.length > 0 && (
            <Box>
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
                      color: theme.color,
                      border: `1px solid ${theme.border}`,
                      width: 38,
                      height: 38,
                      "&:hover": { bgcolor: theme.hover },
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
export default function MySiteView() {
  const { siteId: adminSiteId, siteSlug } = useParams();
  const navigate = useNavigate();
  const siteAdminMode = window.location.pathname.startsWith("/site-admin/");
  const routeSiteKey = siteAdminMode ? adminSiteId : siteSlug;

  const [site, setSite] = useState({
    color: "#222222",
    background: "#ffffff",
  });
  const [pages, setPages] = useState([]);
  const [media, setMedia] = useState({ news: [], galleries: [], slider: [] });
  const [activeId, setActiveId] = useState("");
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsOpen, setNewsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const observerRef = useRef(null);

  useEffect(() => {
    const token = siteAdminMode
      ? localStorage.getItem("siteAdminToken")
      : getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let targetSiteId = routeSiteKey;
        let meta = null;
        if (!siteAdminMode) {
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
              navigate(
                `/mysite/${createSiteSlug(legacySite)}${previewPath}`,
                { replace: true },
              );
              return;
            }
            setError("Site not found in your account.");
            return;
          }
          targetSiteId = meta.id;
        }

        const pagesUrl = siteAdminMode
          ? `${API_URL}/sites/client-admin/${targetSiteId}/pages`
          : `${API_URL}/sites/${targetSiteId}/pages`;
        const mediaUrl = siteAdminMode
          ? `${API_URL}/sites/client-admin/${targetSiteId}/media`
          : `${API_URL}/sites/${targetSiteId}/media`;
        const [pagesRes, mediaRes] = await Promise.all([
          axios.get(pagesUrl, { headers }),
          axios.get(mediaUrl, { headers }),
        ]);
        if (cancelled) return;

        const list = Array.isArray(pagesRes.data?.pages)
          ? pagesRes.data.pages
          : [];

        setPages(list);

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

        setActiveId(list[0] ? pageKey(list[0]) : "");
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
  }, [routeSiteKey, siteSlug, navigate, siteAdminMode]);

  useEffect(() => {
    if (!media.news.length) return undefined;

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

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const activePage = useMemo(
    () => pages.find((p) => pageKey(p) === String(activeId)),
    [pages, activeId],
  );

  const theme = useMemo(
    () => buildTheme(site.background || "#ffffff", site.color || "#222222"),
    [site.background, site.color],
  );

  const srcDoc = useMemo(
    () =>
      buildSrcDoc({
        html: activePage?.page,
        background: theme.background,
        color: theme.color,
        pageTitle: activePage?.title || "Site",
        galleries: media.galleries,
        slides: media.slider,
      }),
    [activePage, theme, media.galleries, media.slider],
  );

  const handleNavigate = (id) => {
    setActiveId(String(id));
    window.scrollTo({ top: 0 });
  };

  const handleFrameLoad = (event) => {
    const frame = event.currentTarget;
    const doc = frame.contentDocument;
    if (!doc?.body) return;

    observerRef.current?.disconnect();
    const resize = () => {
      frame.style.height = `${doc.documentElement.scrollHeight}px`;
    };
    resize();

    if (typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(resize);
      observerRef.current.observe(doc.body);
    }
  };

  const backTarget = siteAdminMode
    ? `/site-admin/${adminSiteId}/panel`
    : "/mysite";

  return (
    <Box
      sx={{
        bgcolor: theme.background,
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* -------- Running site (exactly like the original) -------- */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            flex: 1,
            minHeight: 320,
            bgcolor: "#f8fafc",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", flex: 1 }}>
          <Alert severity="error" sx={{ maxWidth: 720, mx: "auto" }}>
            {error}
          </Alert>
        </Box>
      ) : pages.length === 0 ? (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", flex: 1 }}>
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
              key={activeId}
              title={activePage?.title || "Page preview"}
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              srcDoc={srcDoc}
              onLoad={handleFrameLoad}
              sx={{
                display: "block",
                width: "100%",
                minHeight: 300,
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

      {/* -------- News dialog -------- */}
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
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(3px)",
              },
            },
            paper: {
              sx: {
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
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
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
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
              }}
            >
              {media.news[newsIndex].title}
            </Typography>

            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                color: "text.secondary",
                lineHeight: 1.75,
                textAlign: "center",
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