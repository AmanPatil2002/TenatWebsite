import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import LaptopIcon from "@mui/icons-material/Laptop";
import TabletAndroidIcon from "@mui/icons-material/TabletAndroid";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
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

const buildSrcDoc = (html, background, color, entries, currency, pageTitle) => `<!DOCTYPE html>
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
    </style>
  </head>
  <body>${html || "<p>This page has no content yet.</p>"}${renderSiteEntries(entries, currency, pageTitle)}</body>
</html>`;

export default function MySiteView() {
  const { siteId: adminSiteId, siteSlug } = useParams();
  const navigate = useNavigate();
  const siteAdminMode = window.location.pathname.startsWith("/site-admin/");
  const routeSiteKey = siteAdminMode ? adminSiteId : siteSlug;

  const [site, setSite] = useState({ color: "#222222", background: "#ffffff" });
  const [pages, setPages] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [devices, setDevices] = useState("laptop");
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
        const pagesRes = await axios.get(pagesUrl, { headers });
        if (cancelled) return;

        const list = Array.isArray(pagesRes.data?.pages)
          ? pagesRes.data.pages
          : [];

        setPages(list);
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
  <Button onClick={() => navigate(siteAdminMode ? `/site-admin/${adminSiteId}/panel` : "/mysite")}>
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
    </Box>
  );
}
