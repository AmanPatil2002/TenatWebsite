import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import LaptopIcon from "@mui/icons-material/Laptop";
import TabletAndroidIcon from "@mui/icons-material/TabletAndroid";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import CloseIcon from "@mui/icons-material/Close";
import { createSiteSlug } from "../utils/siteSlug";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const DEVICE_WIDTHS = {
  laptop: "100%",
  tablet: 768,
  phone: 390,
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const readCustomFields = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return {};
};

const resolveMediaImage = (url) => {
  if (typeof url !== "string") return "";
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return /^https?:\/\/\S+$/i.test(url) ? url : "";
};

// Gallery grid: built ONLY from gallery images.
// The "Gallery" heading comes from the CKEditor gallery page, so it is not added here.
const renderGallery = (items) => {
  if (!Array.isArray(items)) return "";
  const cards = items
    .map((item) => {
      const imageUrl = resolveMediaImage(item.imageUrl);
      if (!imageUrl) return "";
      const title = item.title || item.caption || item.altText || "Gallery image";
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

// Home slider: built ONLY from slider images. Renders nothing when there are none.
const renderSlider = (items) => {
  if (!Array.isArray(items)) return "";
  const slides = items
    .filter((item) => resolveMediaImage(item.imageUrl))
    .map((item) => {
      const title = item.title || "Site slide";
      return `<div class="site-slide"><img src="${escapeHtml(resolveMediaImage(item.imageUrl))}" alt="${escapeHtml(title)}" /><span>${escapeHtml(title)}</span></div>`;
    });

  if (!slides.length) return "";
  const animation = slides.length > 1
    ? `animation: siteSlider ${slides.length * 5}s linear infinite;`
    : "";
  const keyframes = slides.length > 1
    ? `@keyframes siteSlider { ${slides
        .map((_, index) => {
          const start = (index / slides.length) * 100;
          const holdEnd = index === slides.length - 1
            ? 100
            : ((index + 1) / slides.length) * 100 - 1;
          return `${start}% , ${holdEnd}% { transform: translateX(-${index * 100}%); }`;
        })
        .join(" ")} }`
    : "";

  return `<section class="site-home-slider" aria-label="Image slider"><div class="site-slider-track" style="${animation}">${slides.join("")}</div></section><style>${keyframes}</style>`;
};

const renderSiteEntries = (entries, currency, pageTitle) => {
  if (!Array.isArray(entries) || !entries.length) return "";
  const cards = entries
    .map((entry) => {
      const image =
        typeof entry.imageUrl === "string" &&
        /^https?:\/\/\S+$/i.test(entry.imageUrl)
          ? `<img src="${escapeHtml(entry.imageUrl)}" alt="${escapeHtml(entry.name)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px" />`
          : "";
      const description = entry.description
        ? `<p>${escapeHtml(entry.description)}</p>`
        : "";
      const price =
        entry.price !== null && entry.price !== undefined
          ? `<p><strong>${escapeHtml(currency || "")} ${escapeHtml(entry.price)}</strong></p>`
          : "";
      const fields = Object.entries(readCustomFields(entry.customFields))
        .map(
          ([name, value]) =>
            `<p><strong>${escapeHtml(name)}:</strong> ${escapeHtml(value)}</p>`,
        )
        .join("");
      return `<article style="border:1px solid #ddd;border-radius:12px;padding:16px;min-width:220px;max-width:320px">${image}<h3>${escapeHtml(entry.name)}</h3>${description}${price}${fields}</article>`;
    })
    .join("");

  return `<section style="margin-top:32px"><h2>${escapeHtml(pageTitle)} items</h2><div style="display:flex;flex-wrap:wrap;gap:16px">${cards}</div></section>`;
};

const SLIDER_MARKER = /<!--\s*SITE_SLIDER\s*-->/i;
 
const buildSrcDoc = (
  html,
  background,
  color,
  entries,
  currency,
  pageTitle,
  galleries,
  slides,
) => {
  const isHome = /home/i.test(pageTitle);
  const isGallery = /gall[ae]ry/i.test(pageTitle);
 
  const sliderHtml = isHome ? renderSlider(slides) : "";
  const pageHtml = html || "<p>This page has no content yet.</p>";
 
  // Marker found  -> slider replaces the marker (e.g. right below the title).
  // No marker     -> slider goes at the top of the page, as before.
  // No slider imgs-> sliderHtml is "", so the marker simply disappears.
  const bodyHtml = SLIDER_MARKER.test(pageHtml)
    ? pageHtml.replace(SLIDER_MARKER, () => sliderHtml)
    : `${sliderHtml}${pageHtml}`;
 
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        padding: 16px;
        background: ${background};
        color: ${color};
        font-family: Arial, Helvetica, sans-serif;
      }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }
      .site-home-slider { width: 100%; margin: 22px auto 28px; overflow: hidden; border-radius: 12px; background: #f0f0f0; }
      .site-slider-track { display: flex; width: 100%; }
      .site-slide { position: relative; flex: 0 0 100%; height: clamp(220px, 42vw, 520px); }
      .site-slide img { width: 100%; height: 100%; object-fit: cover; }
      .site-slide span { position: absolute; inset: auto 0 0; padding: 18px 22px; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,.7)); font-size: 1.15rem; text-align: left; }
      .site-gallery { margin-top: 32px; }
      .site-gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
      .site-gallery figure { margin: 0; overflow: hidden; border-radius: 10px; background: #f3f4f6; }
      .site-gallery img { display: block; width: 100%; height: 240px; object-fit: cover; transition: transform 0.4s ease; }
      .site-gallery figure:hover img { transform: scale(1.06); }
      .site-gallery figcaption { padding: 10px 12px; }
    </style>
  </head>
  <body>${bodyHtml}${isGallery ? renderGallery(galleries) : ""}</body>
</html>`;
};

export default function MySiteView() {
  const { siteId: adminSiteId, siteSlug } = useParams();
  const navigate = useNavigate();
  const siteAdminMode = window.location.pathname.startsWith("/site-admin/");
  const routeSiteKey = siteAdminMode ? adminSiteId : siteSlug;

  const [site, setSite] = useState({ color: "#222222", background: "#ffffff" });
  const [pages, setPages] = useState([]);
  const [media, setMedia] = useState({ news: [], galleries: [], slider: [] });
  const [activeId, setActiveId] = useState("");
  const [devices, setDevices] = useState("laptop");
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsOpen, setNewsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleDevices = (_, value) => {
    if (value) setDevices(value); // ignore deselect so one is always active
  };

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

        const news = Array.isArray(mediaRes.data?.news) ? mediaRes.data.news : [];
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

        setActiveId(
          list[0] ? String(list[0].sitePageId ?? list[0].pagesId) : "",
        );
        setSite({
          color: meta?.color || pagesRes.data?.color || "#222222",
          background: meta?.background || pagesRes.data?.background || "#ffffff",
          currency: pagesRes.data?.currency || "INR",
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

  // News pop-up: re-open every 5 minutes, rotating through the news items.
  useEffect(() => {
    if (!media.news.length) return undefined;

    let nextIndex = 0;
    const timer = window.setInterval(() => {
      nextIndex = (nextIndex + 1) % media.news.length;
      setNewsIndex(nextIndex);
      setNewsOpen(true);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [media.news]);

  const activePage = useMemo(
    () =>
      pages.find(
        (p) => String(p.sitePageId ?? p.pagesId) === String(activeId),
      ),
    [pages, activeId],
  );

  return (
    <Box sx={{ bgcolor: "#f7f7f8", minHeight: "100vh", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Button
          onClick={() =>
            navigate(
              siteAdminMode ? `/site-admin/${adminSiteId}/panel` : "/mysite",
            )
          }
        >
          ← Back
        </Button>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={devices}
          onChange={handleDevices}
          aria-label="device"
        >
          <ToggleButton value="laptop" aria-label="laptop">
            <LaptopIcon />
          </ToggleButton>
          <ToggleButton value="tablet" aria-label="tablet">
            <TabletAndroidIcon />
          </ToggleButton>
          <ToggleButton value="phone" aria-label="phone">
            <PhoneAndroidIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : pages.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>
          This site has no pages yet.
        </Alert>
      ) : (
        <>
          <Tabs
            value={activeId}
            onChange={(_, value) => setActiveId(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#fff" }}
          >
            {pages.map((p) => (
              <Tab
                key={p.sitePageId ?? p.pagesId}
                value={String(p.sitePageId ?? p.pagesId)}
                label={p.title}
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
            ))}
          </Tabs>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              bgcolor: devices === "laptop" ? "transparent" : "#e5e7eb",
              p: devices === "laptop" ? 0 : { xs: 1, sm: 2 },
            }}
          >
            <Box
              component="iframe"
              key={`${activeId}-${devices}`}
              title={activePage?.title || "Page preview"}
              sandbox=""
              srcDoc={buildSrcDoc(
                activePage?.page,
                site.background,
                site.color,
                activePage?.entries,
                site.currency,
                activePage?.title || "Site",
                media.galleries, // gallery page -> gallery images only
                media.slider, //    home page    -> slider images only
              )}
              sx={{
                width: DEVICE_WIDTHS[devices],
                maxWidth: "100%",
                height: "calc(100vh - 110px)",
                border: devices === "laptop" ? 0 : "1px solid #d1d5db",
                borderRadius: devices === "laptop" ? 0 : 1,
                bgcolor: site.background || "#fff",
                display: "block",
              }}
            />
          </Box>
        </>
      )}

      {media.news[newsIndex] && (
        <Dialog
          open={newsOpen}
          onClose={() => setNewsOpen(false)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="site-news-title"
        >
          <DialogTitle id="site-news-title" sx={{ pr: 7 }}>
            {media.news[newsIndex].title}
            <IconButton
              aria-label="Close news"
              onClick={() => setNewsOpen(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {resolveMediaImage(media.news[newsIndex].imageUrl) && (
              <Box
                component="img"
                src={resolveMediaImage(media.news[newsIndex].imageUrl)}
                alt={media.news[newsIndex].title || "News"}
                sx={{
                  display: "block",
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 1,
                  mb: 2,
                }}
              />
            )}
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {media.news[newsIndex].content}
            </Typography>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}