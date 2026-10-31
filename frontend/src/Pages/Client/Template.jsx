import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

const PLACEHOLDER_IMAGE = "https://placehold.co/900x520?text=Template+Preview";
const PREVIEW_WIDTHS = ["100%", 768, 390];

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const getArray = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.templates)) return data.templates;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
};

const formatPrice = (price, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));
  } catch {
    return `${currency || "INR"} ${Number(price || 0).toFixed(2)}`;
  }
};

const parsePhotos = (photos) => {
  if (Array.isArray(photos)) {
    return photos.filter((p) => typeof p === "string" && p.trim());
  }
  if (typeof photos !== "string" || !photos.trim()) return [];
  try {
    const parsed = JSON.parse(photos);
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => typeof p === "string" && p.trim());
    }
    if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    return [];
  } catch {
    return /^https?:\/\/\S+$/i.test(photos.trim()) ? [photos.trim()] : [];
  }
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const isDefaultPage = (p) =>
  p?.isDefault === 1 || p?.isDefault === true || p?.isDefault === "1";

const isDefaultTheme = (t) =>
  t?.isDefault === 1 || t?.isDefault === true || t?.isDefault === "1";

/* ---------------- Photo slider (no extra dependency) ---------------- */

function PhotoSlider({ photos, alt = "Template" }) {
  const [index, setIndex] = useState(0);
  const safePhotos = photos?.length ? photos : [];

  useEffect(() => {
    setIndex(0);
  }, [safePhotos.length]);

  if (!safePhotos.length) return null;

  const go = (delta) => {
    setIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return safePhotos.length - 1;
      if (next >= safePhotos.length) return 0;
      return next;
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        Template Photos
      </Typography>

      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 900,
          mx: "auto",
          overflow: "hidden",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "#eef2f7",
          aspectRatio: "16 / 9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={safePhotos[index]}
          alt={`${alt} photo ${index + 1}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            display: "block",
            objectFit: "contain",
          }}
        />

        {safePhotos.length > 1 && (
          <>
            <IconButton
              aria-label="Previous photo"
              onClick={() => go(-1)}
              sx={{
                position: "absolute",
                top: "50%",
                left: 8,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Next photo"
              onClick={() => go(1)}
              sx={{
                position: "absolute",
                top: "50%",
                right: 8,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>

            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                right: 12,
                bgcolor: "rgba(0,0,0,0.6)",
                color: "#fff",
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: 12,
              }}
            >
              {index + 1} / {safePhotos.length}
            </Box>
          </>
        )}
      </Box>

      {safePhotos.length > 1 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, overflowX: "auto", py: 0.5 }}
        >
          {safePhotos.map((url, i) => (
            <Box
              key={`${url}-${i}`}
              component="img"
              src={url}
              alt={`${alt} thumbnail ${i + 1}`}
              onClick={() => setIndex(i)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
              sx={{
                width: 84,
                height: 56,
                flex: "0 0 auto",
                objectFit: "cover",
                borderRadius: 1,
                cursor: "pointer",
                border: i === index ? "2px solid" : "1px solid",
                borderColor: i === index ? "primary.main" : "divider",
                opacity: i === index ? 1 : 0.75,
                transition: "all .15s",
                "&:hover": { opacity: 1 },
              }}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

/* ----------------------- Theme-aware preview ------------------------ */

function ThemePagePreview({ theme, pages = [] }) {
  const [activePageId, setActivePageId] = useState("");

  const background = theme?.background || "#ffffff";
  const color = theme?.color || "#222222";

  const getPageId = (page, index) =>
    String(page.pageId ?? page.id ?? `page-${index}`);

  const selectedPageId = pages.some(
    (page, index) => getPageId(page, index) === String(activePageId),
  )
    ? String(activePageId)
    : pages.length > 0
      ? getPageId(pages[0], 0)
      : "";

  const activePage = pages.find(
    (page, index) => getPageId(page, index) === selectedPageId,
  );

  const html = activePage?.page ?? "";

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <style>
          * {
            box-sizing: border-box;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            margin: 0;
            padding: 16px;
            background: ${background};
            color: ${color};
            font-family: Arial, Helvetica, sans-serif;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          table {
            max-width: 100%;
          }

          @media (max-width: 600px) {
            body {
              padding: 8px;
            }
          }
        </style>
      </head>

      <body>
        ${html || "<p>No page content available.</p>"}
      </body>
    </html>
  `;

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      {pages.length > 0 && (
        <Tabs
          value={selectedPageId}
          onChange={(event, newValue) => {
            setActivePageId(newValue);
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Preview website pages"
          sx={{
            mb: 2,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
              color,
            },
            "& .Mui-selected": {
              color: `${color} !important`,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: color,
              height: 3,
            },
          }}
        >
          {pages.map((page, index) => {
            const id = getPageId(page, index);

            return (
              <Tab
                key={id}
                value={id}
                label={page.title || "Untitled Page"}
                id={`preview-tab-${id}`}
                aria-controls={`preview-panel-${id}`}
              />
            );
          })}
        </Tabs>
      )}

      <Box
        role="tabpanel"
        id={
          activePage ? `preview-panel-${selectedPageId}` : "preview-panel-empty"
        }
        aria-labelledby={
          activePage ? `preview-tab-${selectedPageId}` : undefined
        }
        sx={{ width: "100%" }}
      >
        <iframe
          key={selectedPageId}
          title={activePage?.title || "Theme page preview"}
          srcDoc={srcDoc}
          sandbox=""
          style={{
            width: "100%",
            minHeight: 700,
            border: `1px solid ${color}`,
            borderRadius: 8,
            background,
            display: "block",
          }}
        />
      </Box>
    </Box>
  );
}

/* ------------------------------ Page ------------------------------- */

export default function Template() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryWarning, setCategoryWarning] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [previewThemeId, setPreviewThemeId] = useState(null);
  const [purchasedTemplateIds, setPurchasedTemplateIds] = useState([]);

  // Categories + purchase state
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const categoryRequest = axios.get(`${API}/categories`);
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken");
        const purchaseRequest = token
          ? axios.get(`${API}/sites/my`, getAuthConfig()).catch(() => null)
          : Promise.resolve(null);

        const [catRes, purchaseRes] = await Promise.all([
          categoryRequest,
          purchaseRequest,
        ]);
        if (cancelled) return;

        setCategories(getArray(catRes));
        if (purchaseRes) {
          setPurchasedTemplateIds(
            getArray(purchaseRes)
              .map((site) => Number(site.templateId))
              .filter((id) => Number.isFinite(id)),
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setCategoryWarning(
            getErrorMessage(loadError, "Categories could not be loaded."),
          );
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Templates list
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API}/templates`);
        if (!cancelled) setTemplates(getArray(response));
      } catch (loadError) {
        if (!cancelled) {
          setTemplates([]);
          setError(getErrorMessage(loadError, "Could not load templates."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategory = useMemo(
    () =>
      categories.find(
        (c) => String(c.categoryId ?? c.id) === String(categoryId),
      ),
    [categories, categoryId],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates
      .filter((t) => {
        if (t.status !== "published") return false;
        if (categoryId && String(t.categoryId) !== String(categoryId))
          return false;
        return (
          !q ||
          [t.name, t.shortDescription, t.description, t.categoryName].some(
            (v) =>
              String(v || "")
                .toLowerCase()
                .includes(q),
          )
        );
      })
      .sort((a, b) => {
        if (sort === "priceLow" || sort === "priceHigh") {
          const diff = Number(a.price || 0) - Number(b.price || 0);
          return sort === "priceLow" ? diff : -diff;
        }
        const aDate = Date.parse(a.createdAt || "");
        const bDate = Date.parse(b.createdAt || "");
        if (Number.isFinite(aDate) && Number.isFinite(bDate))
          return bDate - aDate;
        return Number(b.templateId || 0) - Number(a.templateId || 0);
      });
  }, [categoryId, search, sort, templates]);

  const openTemplate = useCallback(async (template) => {
    setSelected(template);
    setDetailLoading(true);
    setDetailError("");
    setTabIndex(0);
    // Preselect the template's default theme (fallback to first)
    const defTheme =
      (template.themes || []).find(isDefaultTheme) ||
      (template.themes || [])[0];
    setPreviewThemeId(
      defTheme?.themeId ?? template.themes?.[0]?.themeId ?? null,
    );

    try {
      const response = await axios.get(
        `${API}/templates/${template.templateId}`,
      );
      const full = response?.data ?? template;
      setSelected(full);
      const def =
        (full.themes || []).find(isDefaultTheme) || (full.themes || [])[0];
      setPreviewThemeId(def?.themeId ?? null);
    } catch (err) {
      console.error("Failed to load template detail:", err);
      setDetailError(
        getErrorMessage(err, "Full template details couldn't be loaded."),
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeTemplate = () => {
    setSelected(null);
    setDetailError("");
  };

  const isPurchased = (templateId) =>
    purchasedTemplateIds.includes(Number(templateId));

  const goBuy = () => {
    if (!selected) return;
    navigate("/payment", {
      state: {
        template: selected,
        themeId: previewThemeId,
      },
    });
  };

  // Card thumbnail: prefer thumbnailUrl, then first photo, then placeholder
  const cardImage = (t) => {
    if (t?.thumbnailUrl) return t.thumbnailUrl;
    const photos = parsePhotos(t?.photos);
    if (photos[0]) return photos[0];
    return PLACEHOLDER_IMAGE;
  };

  const selectedThemes = Array.isArray(selected?.themes) ? selected.themes : [];
  const selectedPages = Array.isArray(selected?.pages) ? selected.pages : [];

  // Slider photos: prefer `photos`, fall back to thumbnailUrl
  const sliderPhotos = useMemo(() => {
    const photos = parsePhotos(selected?.photos);
    if (photos.length) return photos;
    if (selected?.thumbnailUrl) return [selected.thumbnailUrl];
    return [];
  }, [selected]);

  const previewTheme =
    selectedThemes.find((t) => String(t.themeId) === String(previewThemeId)) ||
    selectedThemes[0];

  return (
    <Box sx={{ bgcolor: "#f7f8fb", minHeight: "100vh", pb: 8 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            fontWeight={750}
            gutterBottom
            sx={{ fontSize: { xs: "2rem", md: "3rem" } }}
          >
            {activeCategory?.name || "Website templates"}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 700, mb: 3 }}>
            {(typeof activeCategory?.content === "string" &&
              activeCategory.content) ||
              "Browse published templates, preview their included pages and themes, then purchase one to create your own site."}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              size="small"
              label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="priceLow">Price: low to high</MenuItem>
              <MenuItem value="priceHigh">Price: high to low</MenuItem>
            </TextField>
          </Stack>
        </Container>
      </Box>

      {/* Categories + grid */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {categoryWarning && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            onClose={() => setCategoryWarning("")}
          >
            {categoryWarning}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Categories
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                <Button
                  variant={categoryId === "" ? "contained" : "text"}
                  onClick={() => setCategoryId("")}
                  sx={{ justifyContent: "flex-start" }}
                >
                  All templates
                </Button>
                {categories.map((c) => (
                  <Button
                    key={c.categoryId}
                    variant={
                      String(categoryId) === String(c.categoryId)
                        ? "contained"
                        : "text"
                    }
                    onClick={() => setCategoryId(String(c.categoryId))}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                    }}
                  >
                    {c.name}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {loading
                ? "Loading templates…"
                : `${visible.length} template${
                    visible.length === 1 ? "" : "s"
                  }`}
            </Typography>

            <Grid container spacing={3}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                      <Skeleton variant="rounded" height={300} />
                    </Grid>
                  ))
                : visible.map((template) => (
                    <Grid
                      size={{ xs: 12, sm: 6, lg: 4 }}
                      key={template.templateId}
                    >
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          overflow: "hidden",
                          transition: "all .2s",
                          "&:hover": {
                            boxShadow: 5,
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <CardActionArea
                          onClick={() => openTemplate(template)}
                          sx={{ height: "100%" }}
                        >
                          <CardMedia
                            component="img"
                            height="280"
                            image={cardImage(template)}
                            alt={template.name || "Template"}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = PLACEHOLDER_IMAGE;
                            }}
                            sx={{
                              objectFit: "cover",
                              bgcolor: "#eef2f7",
                            }}
                          />
                          <CardContent>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                overflowWrap: "anywhere",
                                mb: 1,
                              }}
                            >
                              {template.name}
                            </Typography>
                            <Typography
                              fontWeight={700}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {formatPrice(template.price, template.currency)}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
            </Grid>

            {!loading && !visible.length && !error && (
              <Paper
                variant="outlined"
                sx={{ p: 5, textAlign: "center", mt: 2 }}
              >
                <Typography variant="h6">No templates found</Typography>
                <Typography color="text.secondary">
                  Try another search or category.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Detail dialog */}
      <Dialog fullScreen open={Boolean(selected)} onClose={closeTemplate}>
        {selected && (
          <>
            <DialogTitle component="div" sx={{ pb: 0 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{ alignItems: { md: "center" } }}
              >
                <Button
                  onClick={closeTemplate}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Back
                </Button>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ flexGrow: 1, overflowWrap: "anywhere" }}
                >
                  {selected.name}
                </Typography>
                <Button
                  variant="contained"
                  disabled={detailLoading || isPurchased(selected.templateId)}
                  onClick={goBuy}
                >
                  {isPurchased(selected.templateId)
                    ? "Already purchased"
                    : `Buy for ${formatPrice(
                        selected.price,
                        selected.currency,
                      )}`}
                </Button>
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
              {detailLoading ? (
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 280,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <Container maxWidth="xl" sx={{ py: 1 }}>
                  <Grid
                    container
                    spacing={{ xs: 2, md: 2 }}
                    columns={{ xs: 12, sm: 12, md: 12 }}
                  >
                    <Grid size={{ xs: 12, sm: 12, md: 8 }}>
                      {detailError && (
                        <Alert
                          severity="warning"
                          sx={{ mb: 2 }}
                          onClose={() => setDetailError("")}
                        >
                          {detailError}
                        </Alert>
                      )}

                      {/* Main preview (only if demoUrl exists) */}
                      {selected.demoUrl && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1,
                            bgcolor: "#eef1f5",
                            display: "flex",
                            justifyContent: "center",
                            minHeight: 260,
                            overflow: "hidden",
                            mb: 3,
                          }}
                        >
                          <Box
                            component="iframe"
                            src={selected.demoUrl}
                            title={`${selected.name} demo`}
                            sx={{
                              width: PREVIEW_WIDTHS[tabIndex],
                              maxWidth: "100%",
                              height: { xs: "55vh", md: "68vh" },
                              border: 0,
                              bgcolor: "#fff",
                              borderRadius: 1,
                            }}
                          />
                        </Paper>
                      )}

                      {/* Photo slider (replaces thumbnail in detail view) */}
                      {sliderPhotos.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <PhotoSlider
                            photos={sliderPhotos}
                            alt={selected.name}
                          />
                        </Box>
                      )}
                    </Grid>

                    {/* Right: theme picker + pages list */}
                    <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                      <Grid
                        container
                        spacing={{ xs: 2, md: 2 }}
                        columns={{ xs: 12, sm: 12, md: 12 }}
                      >
                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                          <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
                            <Typography variant="h6" fontWeight={400}>
                              Available Themes
                            </Typography>
                            <Divider sx={{ my: 1.5 }} />

                            {selectedThemes.length > 0 ? (
                              <Box
                                sx={{
                                  maxHeight: 400, // adjust to taste
                                  overflowY: "auto",

                                  scrollbarWidth: "none", // Firefox
                                  msOverflowStyle: "none", // old Edge / IE
                                  "&::-webkit-scrollbar": {
                                    display: "none",
                                  },
                                }}
                              >
                                {selectedThemes.map((theme, i) => (
                                  <Box
                                    key={theme.themeId ?? i}
                                    sx={{
                                      py: 1,
                                      borderBottom:
                                        i < selectedThemes.length - 1
                                          ? "1px dashed #e5e7eb"
                                          : "none",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: "90%",
                                        height: 40,
                                        borderRadius: 1,
                                        backgroundColor:
                                          theme.background || "#fff",
                                        color: theme.color || "#111",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {theme.name}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography color="text.secondary">
                                No themes listed for this template.
                              </Typography>
                            )}
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                          <Paper variant="outlined" sx={{ p: 2.5 }}>
                            <Typography variant="h6" fontWeight={700}>
                              Included Pages
                            </Typography>
                            <Divider sx={{ my: 1.5 }} />
                            {selectedPages.length > 0 ? (
                              <Box
                                sx={{
                                  maxHeight: 400, // adjust to taste
                                  overflowY: "auto",
                                  
                                  scrollbarWidth: "none", // Firefox
                                  msOverflowStyle: "none", // old Edge / IE
                                  "&::-webkit-scrollbar": {
                                    display: "none",
                                  },
                                }}
                              >
                              {selectedPages.map((p, i) => (
                                <Box
                                  key={p.pagesId ?? i}
                                  sx={{
                                    py: 1,
                                    borderBottom:
                                      i < selectedPages.length - 1
                                        ? "1px dashed #e5e7eb"
                                        : "none",
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Typography fontWeight={600}>
                                      {p.title || "Untitled page"}
                                    </Typography>
                                  </Stack>
                                </Box>
                              ))}
                              </Box>
                            ) : (
                              <Typography color="text.secondary">
                                No pages listed for this template.
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                    {/* Left: description + live preview */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {selected.name}
                      </Typography>
                      {selected.shortDescription && (
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {selected.shortDescription}
                        </Typography>
                      )}

                      <Paper variant="outlined" sx={{ p: 2.5, mt: 3 }}>
                        <Grid
                          container
                          spacing={{ xs: 2, md: 2 }}
                          columns={{ xs: 12, sm: 12, md: 12 }}
                        >
                          {[
                            ["Category", selected.categoryName || "General"],
                            ["Language", selected.language || "Not specified"],
                            [
                              "Access period",
                              selected.validityDays
                                ? `${selected.validityDays} days`
                                : "Not specified",
                            ],
                            [
                              "Price",
                              formatPrice(selected.price, selected.currency),
                            ],
                          ].map(([label, value]) => (
                            <Grid size={{ xs: 6, sm: 6, md: 3 }} key={label}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {label}
                              </Typography>
                              <Typography
                                fontWeight={700}
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                {value}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>

                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="h6" fontWeight={700}>
                          Description
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {selected.description ||
                            "Explore the included pages, themes, and preview for this template."}
                        </Typography>
                      </Paper>

                      {/* Theme-aware live preview of default pages */}
                      <Paper
                        variant="outlined"
                        sx={{ p: { xs: 1.5, sm: 2.5 }, mt: 3 }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          View Pages preview with selected theme
                        </Typography>
                        <br />
                        <Grid
                          container
                          spacing={{ xs: 2, md: 2 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                            <Paper
                              variant="outlined"
                              sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2 }}
                            >
                              <Typography variant="h6" fontWeight={400}>
                                Apply Themes
                              </Typography>
                              <Divider sx={{ my: 1.5 }} />
                              {selectedThemes.length > 0 ? (
                                <Stack spacing={1}>
                                  {selectedThemes.map((theme, i) => {
                                    const active =
                                      String(theme.themeId) ===
                                      String(previewThemeId);
                                    return (
                                      <Paper
                                        key={theme.themeId ?? i}
                                        variant="outlined"
                                        onClick={() =>
                                          setPreviewThemeId(theme.themeId)
                                        }
                                        sx={{
                                          p: 0,
                                          cursor: "pointer",
                                          borderColor: active
                                            ? "primary.main"
                                            : "divider",
                                          borderWidth: active ? 2 : 1,
                                          transition: "all .15s",
                                          "&:hover": {
                                            borderColor: "primary.light",
                                          },
                                        }}
                                      >
                                        <Stack
                                          direction="row"
                                          spacing={1.5}
                                          alignItems="center"
                                          flexWrap="wrap"
                                        >
                                          <Box
                                            sx={{
                                              width: "100%",
                                              height: 40,
                                              borderRadius: 1,
                                              backgroundColor:
                                                theme.background || "#fff",
                                              color: theme.color || "#111",
                                              border: "1px solid",
                                              borderColor: "divider",
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: 12,
                                              fontWeight: 700,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontWeight={700}
                                              sx={{
                                                color: theme.color || "#111111",
                                              }}
                                            >
                                              {theme.name || `Theme ${i + 1}`}
                                            </Typography>
                                          </Box>
                                          {isDefaultTheme(theme) && (
                                            <Chip
                                              size="small"
                                              label="Default"
                                              color="primary"
                                            />
                                          )}
                                        </Stack>
                                      </Paper>
                                    );
                                  })}
                                </Stack>
                              ) : (
                                <Typography color="text.secondary">
                                  No themes listed for this template.
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 12, md: 9 }}>
                            <ThemePagePreview
                              theme={previewTheme}
                              pages={selectedPages}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </Container>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
