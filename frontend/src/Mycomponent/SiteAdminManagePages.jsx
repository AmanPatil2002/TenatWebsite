import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
  TextField,
  useTheme,
} from "@mui/material";

import { buildPageBody } from "../utils/buildPageContent";

/* ------------------------------------------------------------------ */
/*  dehydrate                                                          */
/*  The editor shows hydrated HTML (real table data). Before storing   */
/*  we swap every generated block back to its original placeholder,    */
/*  so pages.page keeps placeholders and the live site stays current.  */
/* ------------------------------------------------------------------ */
const dehydrate = (html) => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("[data-tn-placeholder]").forEach((el) => {
      let original;
      try {
        let raw = el.getAttribute("data-tn-placeholder") || "";
        if (raw.startsWith("v1:")) raw = raw.slice(3);
        original = decodeURIComponent(raw);
      } catch {
        return;
      }
      const tpl = doc.createElement("template");
      tpl.innerHTML = original;
      el.replaceWith(tpl.content);
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no MUI icon imports, no tree-shaking issues     */
/* ------------------------------------------------------------------ */
const SvgIcon = ({ children, size = 20, color = "currentColor" }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    sx={{ width: size, height: size, display: "block", color, flexShrink: 0 }}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Box>
);

const UpIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m6 15 6-6 6 6" />
  </SvgIcon>
);
const DownIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m6 9 6 6 6-6" />
  </SvgIcon>
);
const AddIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);
const EditIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </SvgIcon>
);
const SaveIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </SvgIcon>
);
const CheckIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </SvgIcon>
);
const DeleteIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </SvgIcon>
);
// Convert different API response formats into arrays.
const getArrayResponse = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  if (payload.data && payload.data !== payload) {
    return getArrayResponse(payload.data, keys);
  }

  return [];
};

// Extract a resource name whether the API returns a string or object.
const getResourceName = (item) => {
  if (typeof item === "string") return item.trim();

  if (item && typeof item === "object") {
    return String(
      item.resourceName ??
        item.resource ??
        item.tableName ??
        item.entity ??
        item.name ??
        item.key ??
        "",
    ).trim();
  }

  return "";
};

// Normalize resource records.
const getRecords = (payload) =>
  getArrayResponse(payload, ["records", "rows", "items", "data"]);
export default function SiteAdminManagePages() {
  const { site, pages, setPages, setSite, baseUrl, authConfig, API_URL } =
    useOutletContext();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  // `content` always holds the STORED html (with placeholders).
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [sliders, setSliders] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [siteData, setSiteData] = useState({});
  const [resourcesReady, setResourcesReady] = useState(false);
  const editorRef = useRef(null);
  const dehydrateTimer = useRef(null);
  const pagesUrl = `${baseUrl}/pages`;

  const hiddenScrollSx = {
    overflowY: "auto",
    "&::-webkit-scrollbar": { display: "none" },
    scrollbarWidth: "none",
  };

  const applyTheme = useCallback(
    (editor) => {
      if (!editor || !editor.document) return;
      const eff = site?.effectiveTheme || {};
      const bg = eff.background || site?.background || "#ffffff";
      const fg = eff.color || site?.color || "#222222";
      const doc = editor.document.$;
      doc
        .querySelectorAll('style[data-tenat-theme="1"]')
        .forEach((n) => n.remove());
      const style = doc.createElement("style");
      style.setAttribute("data-tenat-theme", "1");
      style.textContent = `
        body { background-color: ${bg} !important; color: ${fg} !important; }

        /* Gallery + slider styles — mirror buildPageSrcDoc so the editor
           preview matches the live site. */
        .site-gallery { margin-top: 32px; }
        .site-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 16px;
        }
        .site-gallery figure {
          margin: 0;
          overflow: hidden;
          border-radius: 10px;
          background: #ffffff;
        }
        .site-gallery img {
          display: block;
          width: 100%;
          height: 240px;
          object-fit: cover;
        }
        .site-gallery figcaption { padding: 10px 12px; }

        .site-home-slider {
          width: 100%;
          margin: 22px auto 28px;
          overflow: hidden;
          border-radius: 12px;
          background: #f0f0f0;
        }
        .site-slider-track { display: flex; width: 100%; }
        .site-slide {
          position: relative;
          flex: 0 0 100%;
          height: clamp(220px, 42vw, 520px);
        }
        .site-slide img { width: 100%; height: 100%; object-fit: cover; }
        .site-slide span {
          position: absolute;
          inset: auto 0 0;
          padding: 18px 22px;
          color: #fff;
          background: linear-gradient(transparent, rgba(0,0,0,.7));
          font-size: 1.15rem;
          text-align: left;
        }
      `;
      doc.head.appendChild(style);
      editor.document.getBody().setStyles({ backgroundColor: bg, color: fg });
    },
    [site],
  );

  /* ---------------- Single loader (mount + save + delete) ------------ */
  const loadPages = useCallback(
    async (keepSelectedId = "") => {
      const { data } = await axios.get(pagesUrl, authConfig);
      const list = Array.isArray(data.pages) ? data.pages : [];
      setSite(data);
      setPages(list);

      const selected =
        list.find(
          (page) => String(page.sitePageId) === String(keepSelectedId),
        ) || list[0];
      setSelectedId(selected ? String(selected.sitePageId) : "");
      setTitle(selected?.title || "");
      setContent(selected?.page || "");
      setCreating(!selected);
      return list;
    },
    [authConfig, pagesUrl, setPages, setSite],
  );

  /* ---------------- Load pages ---------------- */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        await loadPages("");
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Could not load pages for this site.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadPages]);

  /* ---------------- Load slider / gallery / data / headers ---------- */

  useEffect(() => {
    let cancelled = false;

    const loadResources = async () => {
      setResourcesReady(false);

      try {
        const [sliderRes, galleryRes, sectionsRes, headersRes] =
          await Promise.allSettled([
            axios.get(`${baseUrl}/slider`, authConfig),
            axios.get(`${baseUrl}/galleries`, authConfig),
            axios.get(`${baseUrl}/data`, authConfig),
            axios.get(`${baseUrl}/header`, authConfig),
          ]);

        if (cancelled) return;

        const getResult = (result, name) => {
          if (result.status === "rejected") {
            console.error(
              `[ManagePages] Failed to load ${name}:`,
              result.reason?.response?.data || result.reason,
            );
            return null;
          }

          return result.value.data;
        };

        const sliderPayload = getResult(sliderRes, "slider");
        const galleryPayload = getResult(galleryRes, "galleries");
        const sectionsPayload = getResult(sectionsRes, "data sections");
        const headersPayload = getResult(headersRes, "headers");

        const sliderList = getArrayResponse(sliderPayload, [
          "sliders",
          "items",
          "data",
        ]);

        const galleryList = getArrayResponse(galleryPayload, [
          "galleries",
          "items",
          "data",
        ]);

        const sections = getArrayResponse(sectionsPayload, [
          "resources",
          "sections",
          "tables",
          "entities",
          "data",
        ])
          .map(getResourceName)
          .filter(Boolean);

        console.log("[ManagePages] Available resources:", sections);

        setSliders(sliderList);
        setGalleryItems(galleryList);

        // Fetch actual records for every resource.
        const recordsEntries = await Promise.all(
          sections.map(async (resource) => {
            try {
              const response = await axios.get(
                `${baseUrl}/data/${encodeURIComponent(resource)}`,
                authConfig,
              );

              const records = getRecords(response.data);

              console.log(
                `[ManagePages] ${resource}:`,
                records.length,
                "records",
              );

              return [resource, records];
            } catch (err) {
              console.error(
                `[ManagePages] Failed to fetch ${resource}:`,
                err.response?.data || err.message,
              );

              return [resource, []];
            }
          }),
        );

        const merged = Object.fromEntries(recordsEntries);

        // Support both a direct header object and wrapped header response.
        const headerObject =
          headersPayload?.header ?? headersPayload?.headers ?? headersPayload;

        if (
          headerObject &&
          !Array.isArray(headerObject) &&
          typeof headerObject === "object"
        ) {
          merged.headers = [{ id: "headers", ...headerObject }];
        }

        if (cancelled) return;

        setSiteData(merged);
        setResourcesReady(true);

        console.log("[ManagePages] Final site data:", merged);
      } catch (err) {
        console.error("[ManagePages] Resource loading failed:", err);

        if (!cancelled) {
          setSiteData({});
          setResourcesReady(true);
        }
      }
    };

    loadResources();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, authConfig]);

  /* ---------------- Hydrated html shown inside the editor ------------ */
  // Recompute the initial editor markup as data changes. The editor is not
  // mounted until resource loading finishes, so async CKEditor initialization
  // cannot race a resource-driven remount.
  const editorInitData = useMemo(() => {
    if (creating) return "";
    try {
      return buildPageBody({
        html: content,
        pageTitle: title,
        slides: sliders,
        galleries: galleryItems,
        siteData,
        baseUrl: API_URL, // absolute /uploads/… in editor preview
      });
    } catch (err) {
      console.error("[ManagePages] buildPageBody failed:", err);
      return content;
    }
  }, [
    creating,
    selectedId,
    resourcesReady,
    content,
    title,
    sliders,
    galleryItems,
    siteData,
    API_URL,
  ]);

  useEffect(() => {
    if (site && editorRef.current) {
      applyTheme(editorRef.current);
    }
  }, [site, applyTheme]);

  const selectPage = (page) => {
    setSelectedId(String(page.sitePageId));
    setTitle(page.title);
    setContent(page.page);
    setCreating(false);
    setError("");
    setSuccess("");
  };

  // CKEditor 4 does not re-apply initData after mount, so push the new
  // page's hydrated markup into the live editor instance on selection change.
  useEffect(() => {
    if (!editorRef.current) return;
    const nextData = creating ? "" : editorInitData;
    try {
      editorRef.current.setData(nextData || "");
    } catch {
      // editor not ready yet; initData prop will handle initial load
    }
  }, [selectedId, creating, editorInitData]);

  const movePage = async (index, offset) => {
    const targetIndex = index + offset;
    if (reordering || targetIndex < 0 || targetIndex >= pages.length) return;

    const reorderedPages = [...pages];
    [reorderedPages[index], reorderedPages[targetIndex]] = [
      reorderedPages[targetIndex],
      reorderedPages[index],
    ];

    setReordering(true);
    setError("");
    setSuccess("");
    try {
      await axios.put(
        `${pagesUrl}/order`,
        { pageIds: reorderedPages.map((page) => String(page.sitePageId)) },
        authConfig,
      );
      setPages(reorderedPages);
      setSuccess("Page order saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not update page order.",
      );
    } finally {
      setReordering(false);
    }
  };

  const startNewPage = () => {
    setSelectedId("");
    setTitle("");
    setContent("");
    setCreating(true);
    setError("");
    setSuccess("");
  };

  const savePage = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Enter a page title and content before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (creating) {
        const { data } = await axios.post(
          pagesUrl,
          { title, page: content, isFormSubmission: true },
          authConfig,
        );
        await loadPages(data.sitePageId);
        setSuccess("Custom page created.");
      } else {
        await axios.put(
          `${pagesUrl}/${selectedId}`,
          { title, page: content, isFormSubmission: true },
          authConfig,
        );
        await loadPages(selectedId);
        setSuccess("Page changes saved.");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save this page.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (page) => {
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(String(page.sitePageId));
    setError("");
    setSuccess("");
    try {
      await axios.delete(`${pagesUrl}/${page.sitePageId}`, authConfig);
      const keepSelectedId =
        String(page.sitePageId) === String(selectedId) ? "" : selectedId;
      await loadPages(keepSelectedId);
      setSuccess("Page deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not delete this page.",
      );
    } finally {
      setDeletingId("");
    }
  };

  // Debounced dehydrate — avoids re-parsing the editor DOM on every keystroke.
  const handleEditorChange = (event) => {
    const html = event.editor.getData();
    if (dehydrateTimer.current) clearTimeout(dehydrateTimer.current);
    dehydrateTimer.current = setTimeout(() => {
      setContent(dehydrate(html));
    }, 200);
  };

  useEffect(
    () => () => {
      if (dehydrateTimer.current) clearTimeout(dehydrateTimer.current);
    },
    [],
  );

  const selectedPage = pages.find((p) => String(p.sitePageId) === selectedId);
  const currentTitle = creating
    ? "New custom page"
    : selectedPage?.title || "Page";

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Stack>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Manage pages
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Edit the content of your site's pages and control their display
            order.
          </Typography>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          icon={<CheckIcon size={20} />}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "320px minmax(0, 1fr)",
            },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          {/* ---------------- Sidebar: pages ---------------- */}
          <Stack
            spacing={2}
            sx={{
              ...hiddenScrollSx,
              maxHeight: { xs: "none", md: "calc(100vh - 220px)" },
              pr: { md: 0.5 },
            }}
          >
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 3, minWidth: 0 }}
            >
              <Stack
                direction="row"
                sx={{
                  mb: 1,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Pages
                </Typography>
                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon size={14} />}
                  onClick={startNewPage}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  New
                </Button>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 1.5 }}
              >
                Use the arrows to reorder.
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={0.75} sx={{ ...hiddenScrollSx, maxHeight: 320 }}>
                {pages.map((page, index) => {
                  const isActive =
                    !creating && selectedId === String(page.sitePageId);
                  return (
                    <Stack
                      key={page.sitePageId}
                      direction="row"
                      gap={0.5}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        border: `1px solid ${
                          isActive
                            ? alpha(theme.palette.primary.main, 0.25)
                            : "transparent"
                        }`,
                        transition: "background-color .15s ease",
                        "&:hover": {
                          bgcolor: isActive
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.04),
                        },
                        alignItems: "center",
                      }}
                    >
                      <Button
                        fullWidth
                        onClick={() => selectPage(page)}
                        sx={{
                          textAlign: "left",
                          textTransform: "none",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 14,
                          color: isActive ? "primary.main" : "text.primary",
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.75,
                          minWidth: 0,
                          "& .MuiButton-endIcon": { ml: "auto" },
                        }}
                        endIcon={
                          isActive ? (
                            <Chip
                              size="small"
                              label="Editing"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.15,
                                ),
                                color: "primary.main",
                                "& .MuiChip-label": { px: 0.75 },
                              }}
                            />
                          ) : null
                        }
                      >
                        <Box
                          component="span"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {page.title}
                        </Box>
                      </Button>

                      <Stack
                        direction="row"
                        spacing={0.25}
                        sx={{ flexShrink: 0, alignItems: "center" }}
                      >
                        <Stack sx={{ flexShrink: 0 }}>
                          <IconButton
                            type="button"
                            size="small"
                            aria-label={`Move ${page.title} up`}
                            disabled={reordering || !!deletingId || index === 0}
                            onClick={() => movePage(index, -1)}
                            sx={{ p: 0.25, borderRadius: 1 }}
                          >
                            <UpIcon size={14} />
                          </IconButton>
                          <IconButton
                            type="button"
                            size="small"
                            aria-label={`Move ${page.title} down`}
                            disabled={
                              reordering ||
                              !!deletingId ||
                              index === pages.length - 1
                            }
                            onClick={() => movePage(index, 1)}
                            sx={{ p: 0.25, borderRadius: 1 }}
                          >
                            <DownIcon size={14} />
                          </IconButton>
                        </Stack>
                        <Tooltip title={`Delete ${page.title}`}>
                          <span>
                            <IconButton
                              type="button"
                              size="small"
                              aria-label={`Delete ${page.title}`}
                              color="error"
                              disabled={
                                reordering || !!deletingId || pages.length <= 1
                              }
                              onClick={() => deletePage(page)}
                              sx={{ p: 0.25, borderRadius: 1 }}
                            >
                              {deletingId === String(page.sitePageId) ? (
                                <CircularProgress size={14} color="error" />
                              ) : (
                                <DeleteIcon size={14} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  );
                })}
                {!pages.length && (
                  <Box
                    sx={{
                      py: 3,
                      px: 1.5,
                      textAlign: "center",
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    }}
                  >
                    <Typography fontWeight={600} variant="body2">
                      No pages yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click "New" to create your first page.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>

          {/* ---------------- Editor ---------------- */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, minWidth: 0 }}
          >
            <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.25}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                {creating ? <AddIcon size={18} /> : <EditIcon size={18} />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ lineHeight: 1.2 }}
                  noWrap
                >
                  {creating ? "Create a custom page" : "Edit page"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {creating
                    ? "Give your page a title and add the content below."
                    : currentTitle}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <TextField
                label="Page title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 150 } }}
                fullWidth
                size="small"
                helperText="Shown in the site navigation and browser tab."
              />

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{
                    display: "block",
                    mb: 1,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  Page content
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    "& .cke, & .cke_chrome, & .cke_inner, & .cke_contents": {
                      width: "100% !important",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    },
                    "& .cke_chrome": {
                      border: "none !important",
                      borderBottom: `1px solid ${theme.palette.divider} !important`,
                    },
                    "& .cke_contents": { minHeight: "300px" },
                    "& .cke_top": {
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    },
                  }}
                >
                  {resourcesReady && (
                  <CKEditor
                    editorUrl="https://cdn.ckeditor.com/4.22.1/full-all/ckeditor.js"
                    initData={editorInitData}
                    onBeforeLoad={(CKEDITOR) => {
                      if (CKEDITOR.plugins.get("localvideo")) return;

                      CKEDITOR.plugins.add("localvideo", {
                        init(editor) {
                          editor.addCommand("localvideoCmd", {
                            exec() {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "video/mp4,video/webm,video/ogg";

                              input.onchange = async () => {
                                const file = input.files?.[0];
                                if (!file) return;

                                const body = new FormData();
                                body.append("upload", file);

                                try {
                                  const res = await fetch(
                                    `${API_URL}/uploads/ckeditor-video`,
                                    { method: "POST", body },
                                  );
                                  const data = await res.json();
                                  if (!data.uploaded) {
                                    throw new Error(
                                      data.error?.message || "Upload failed",
                                    );
                                  }
                                  editor.insertHtml(
                                    `<video controls style="max-width:100%" src="${data.url}"></video><p></p>`,
                                  );
                                } catch (err) {
                                  alert(err.message);
                                }
                              };

                              input.click();
                            },
                          });
                          editor.ui.addButton("LocalVideo", {
                            label: "Insert video",
                            command: "localvideoCmd",
                            toolbar: "insert,10",
                            icon: "/assets/icons/video.png",
                          });
                        },
                      });
                    }}
                    config={{
                      height: 420,
                      language: "en",
                      versionCheck: false,
                      removePlugins: "exportpdf",
                      // Preserve every attribute/class the generator relies on
                      // so data-field / data-attr survive editor round-trips.
                      allowedContent: true,
                      extraAllowedContent:
                        "div[*]{*}; section[*]{*}; p[*]{*}; a[*]{*}; img[*]{*}; figure; figcaption; table[*]{*}; thead; tbody; tr[*]{*}; td[*]{*}; th[*]{*}; span[*]{*}; video[*]{*}; source[*]; form[*]{*}; input[*]{*}; textarea[*]{*}; select[*]{*}; option[*]{*}; label[*]{*}; button[*]{*}",

                      extraPlugins:
                        "uploadimage,localvideo,colorbutton,find,divarea,justify,showblocks,smiley,pagebreak,copyformatting",

                      clipboard_handleImages: false,

                      toolbar: [
                        {
                          name: "document",
                          items: [
                            "Source",
                            "-",
                            "Preview",
                            "-",
                            "Print",
                            "-",
                            "Templates",
                          ],
                        },
                        {
                          name: "clipboard",
                          items: [
                            "Cut",
                            "Copy",
                            "Paste",
                            "PasteText",
                            "PasteFromWord",
                            "-",
                            "Undo",
                            "Redo",
                          ],
                        },
                        {
                          name: "editing",
                          items: [
                            "Find",
                            "Replace",
                            "-",
                            "SelectAll",
                            "CopyFormatting",
                          ],
                        },
                        { name: "tools", items: ["Maximize", "ShowBlocks"] },

                        "/",

                        {
                          name: "basicstyles",
                          items: [
                            "Bold",
                            "Italic",
                            "Underline",
                            "Strike",
                            "Subscript",
                            "Superscript",
                            "-",
                            "RemoveFormat",
                          ],
                        },
                        { name: "colors", items: ["TextColor", "BGColor"] },
                        {
                          name: "styles",
                          items: [
                            "Styles",
                            "-",
                            "Format",
                            "-",
                            "Font",
                            "FontSize",
                          ],
                        },

                        "/",

                        {
                          name: "paragraph",
                          items: [
                            "NumberedList",
                            "BulletedList",
                            "-",
                            "Outdent",
                            "Indent",
                            "-",
                            "Blockquote",
                            "-",
                            "JustifyLeft",
                            "JustifyCenter",
                            "JustifyRight",
                            "JustifyBlock",
                            "-",
                            "BidiLtr",
                            "BidiRtl",
                          ],
                        },
                        { name: "links", items: ["Link", "Unlink", "Anchor"] },

                        "/",

                        {
                          name: "insert",
                          items: [
                            "Image",
                            "LocalVideo",
                            "Table",
                            "HorizontalRule",
                            "-",
                            "SpecialChar",
                            "Smiley",
                            "PageBreak",
                            "Iframe",
                          ],
                        },

                        "/",

                        {
                          name: "forms",
                          items: [
                            "Form",
                            "Checkbox",
                            "Radio",
                            "TextField",
                            "Textarea",
                            "Select",
                            "Button",
                            "ImageButton",
                            "HiddenField",
                          ],
                        },
                      ],

                      removeButtons: "",

                      uploadUrl: `${API_URL}/uploads/ckeditor`,
                      imageUploadUrl: `${API_URL}/uploads/ckeditor`,
                      filebrowserImageUploadUrl: `${API_URL}/uploads/ckeditor`,
                    }}
                    onInstanceReady={(event) => {
                      editorRef.current = event.editor;
                      applyTheme(event.editor);
                    }}
                    onChange={handleEditorChange}
                  />
                  )}
                </Box>
              </Box>

              <Divider />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {creating
                    ? "The new page will be added to the end of your navigation."
                    : "Changes are not published until you save."}
                </Typography>
                <Button
                  type="button"
                  variant="contained"
                  disableElevation
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveIcon size={16} />
                    )
                  }
                  onClick={savePage}
                  disabled={saving || !title.trim() || !content.trim()}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2.5,
                    alignSelf: { xs: "stretch", sm: "center" },
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.primary.main,
                      0.25,
                    )}`,
                  }}
                >
                  {saving
                    ? "Saving…"
                    : creating
                      ? "Create page"
                      : "Save changes"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
