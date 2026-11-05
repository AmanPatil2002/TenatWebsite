import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import TabletMacIcon from "@mui/icons-material/TabletMac";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

/* ------------------------------ helpers ------------------------------ */

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);
const PLACEHOLDER_IMAGE = "https://placehold.co/900x520?text=Template+Preview";
const DEVICE_WIDTHS = { desktop: "100%", tablet: 768, mobile: 390 };

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const getAuthConfig = () => {
  const token = getToken();
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

const isDefaultFlag = (item) =>
  item?.isDefault === 1 || item?.isDefault === true || item?.isDefault === "1";

// One consistent id for a page (list keys, tabs and preview all use this)
const getPageKey = (page, index) =>
  String(page?.pageId ?? page?.pagesId ?? page?.id ?? `page-${index}`);

/* ---------------------------- Photo slider ---------------------------- */

function PhotoSlider({ photos, alt = "Template" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [photos.length]);

  if (!photos.length) return null;

  const go = (delta) =>
    setIndex((prev) => (prev + delta + photos.length) % photos.length);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        Template photos
      </Typography>

      <Box
        sx={{
          position: "relative",
          width: "100%",
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
          src={photos[index]}
          alt={`${alt} photo ${index + 1}`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
          sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />

        {photos.length > 1 && (
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
                "&:hover": { bgcolor: "#fff" },
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
                "&:hover": { bgcolor: "#fff" },
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
              {index + 1} / {photos.length}
            </Box>
          </>
        )}
      </Box>

      {photos.length > 1 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, overflowX: "auto", py: 0.5 }}
        >
          {photos.map((url, i) => (
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
                opacity: i === index ? 1 : 0.7,
                transition: "opacity .15s",
                "&:hover": { opacity: 1 },
              }}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

/* ------------------------ Theme-aware page preview ------------------------ */

function ThemePagePreview({ theme, pages, activePageKey, onPageChange, device }) {
  const background = theme?.background || "#ffffff";
  const color = theme?.color || "#222222";

  const keys = pages.map(getPageKey);
  const selectedKey = keys.includes(activePageKey) ? activePageKey : keys[0] || "";
  const activePage = pages.find((p, i) => getPageKey(p, i) === selectedKey);
  const html = activePage?.page ?? "";

  const srcDoc = useMemo(
    () => `<!DOCTYPE html>
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
      @media (max-width: 600px) { body { padding: 8px; } }
    </style>
  </head>
  <body>${html || "<p>No page content available.</p>"}</body>
</html>`,
    [background, color, html],
  );

  if (!pages.length) {
    return (
      <Typography color="text.secondary">
        No pages available to preview.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Tabs
        value={selectedKey}
        onChange={(_, value) => onPageChange(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Preview website pages"
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
        }}
      >
        {pages.map((page, i) => {
          const key = getPageKey(page, i);
          return (
            <Tab
              key={key}
              value={key}
              label={page.title || "Untitled page"}
              id={`preview-tab-${key}`}
              aria-controls="preview-panel"
            />
          );
        })}
      </Tabs>

      <Box
        id="preview-panel"
        role="tabpanel"
        aria-labelledby={`preview-tab-${selectedKey}`}
        sx={{
          bgcolor: "#eef1f5",
          borderRadius: 2,
          p: { xs: 0.5, sm: 1.5 },
          overflowX: "auto",
        }}
      >
        <Box sx={{ width: DEVICE_WIDTHS[device], maxWidth: "100%", mx: "auto" }}>
          <iframe
            key={`${selectedKey}-${device}`}
            title={activePage?.title || "Theme page preview"}
            srcDoc={srcDoc}
            sandbox=""
            style={{
              width: "100%",
              height: 700,
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 8,
              background,
              display: "block",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/* --------------------------------- Page --------------------------------- */

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
  const [previewThemeId, setPreviewThemeId] = useState(null);
  const [previewPageKey, setPreviewPageKey] = useState("");
  const [device, setDevice] = useState("desktop");
  const [purchasedTemplateIds, setPurchasedTemplateIds] = useState([]);

  const detailRequestRef = useRef(0);

  /* categories + purchased templates */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const categoryRequest = axios.get(`${API}/categories`);
        const purchaseRequest = getToken()
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
      } catch (err) {
        if (!cancelled) {
          setCategoryWarning(
            getErrorMessage(err, "Categories could not be loaded."),
          );
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* templates list */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API}/templates?published=1`);
        if (!cancelled) setTemplates(getArray(response));
      } catch (err) {
        if (!cancelled) {
          setTemplates([]);
          setError(getErrorMessage(err, "Could not load templates."));
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
      categories.find((c) => String(c.categoryId ?? c.id) === String(categoryId)),
    [categories, categoryId],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates
      .filter((t) => {
        if ((t.status ?? "published") !== "published") return false;
        if (categoryId && String(t.categoryId) !== String(categoryId)) {
          return false;
        }
        return (
          !q ||
          [t.name, t.shortDescription, t.description, t.categoryName].some((v) =>
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
        if (Number.isFinite(aDate) && Number.isFinite(bDate)) return bDate - aDate;
        return Number(b.templateId || 0) - Number(a.templateId || 0);
      });
  }, [categoryId, search, sort, templates]);

  /* open a template: show the card data immediately, then load full detail */
  const openTemplate = useCallback(async (template) => {
    const requestId = ++detailRequestRef.current;

    const pickDefaultTheme = (t) => {
      const themes = Array.isArray(t?.themes) ? t.themes : [];
      return (themes.find(isDefaultFlag) || themes[0])?.themeId ?? null;
    };

    setSelected(template);
    setDetailLoading(true);
    setDetailError("");
    setDevice("desktop");
    setPreviewPageKey("");
    setPreviewThemeId(pickDefaultTheme(template));

    try {
      const response = await axios.get(`${API}/templates/${template.templateId}`);
      if (requestId !== detailRequestRef.current) return;
      const full = response?.data ?? template;
      setSelected(full);
      setPreviewThemeId(pickDefaultTheme(full));
    } catch (err) {
      if (requestId !== detailRequestRef.current) return;
      setDetailError(
        getErrorMessage(err, "Full template details couldn't be loaded."),
      );
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  }, []);

  const closeTemplate = () => {
    detailRequestRef.current += 1;
    setSelected(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const isPurchased = (templateId) =>
    purchasedTemplateIds.includes(Number(templateId));

  const goBuy = () => {
    if (!selected) return;
    if (!getToken()) {
      navigate("/login");
      return;
    }
    navigate("/payment", {
      state: { template: selected, themeId: previewThemeId },
    });
  };

  const cardImage = (t) => {
    if (t?.thumbnailUrl) return t.thumbnailUrl;
    return parsePhotos(t?.photos)[0] || PLACEHOLDER_IMAGE;
  };

  /* derived detail data */
  const selectedThemes = Array.isArray(selected?.themes) ? selected.themes : [];
  const selectedPages = useMemo(
    () =>
      (Array.isArray(selected?.pages) ? selected.pages : [])
        .slice()
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    [selected],
  );
  const sliderPhotos = useMemo(() => {
    const photos = parsePhotos(selected?.photos);
    if (photos.length) return photos;
    return selected?.thumbnailUrl ? [selected.thumbnailUrl] : [];
  }, [selected]);
  const previewTheme =
    selectedThemes.find((t) => String(t.themeId) === String(previewThemeId)) ||
    selectedThemes[0];

  const infoRows = selected
    ? [
        ["Category", selected.categoryName || "General"],
        ["Language", selected.language || "Not specified"],
        [
          "Access period",
          selected.validityDays ? `${selected.validityDays} days` : "Not specified",
        ],
        ["Price", formatPrice(selected.price, selected.currency)],
      ]
    : [];

  return (
    <Box sx={{ bgcolor: "#f7f8fb", minHeight: "100vh", pb: 8 }}>
      {/* Header */}
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: { xs: 4, md: 6 } }}>
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
            {(typeof activeCategory?.content === "string" && activeCategory.content) ||
              "Browse published templates, preview their pages and themes, then purchase one to create your own site."}
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

      {/* Sidebar categories + grid */}
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, md: 3 } }}>
        {categoryWarning && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setCategoryWarning("")}>
            {categoryWarning}
          </Alert>
        )}

        <Grid container spacing={3} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper
              variant="outlined"
              sx={{ p: 2, position: { md: "sticky" }, top: { md: 20 } }}
            >
              <Typography variant="overline" color="text.secondary">
                Categories
              </Typography>
              <Stack
                direction={{ xs: "row", md: "column" }}
                spacing={0.5}
                sx={{
                  mt: 1,
                  maxHeight: { md: 400 },
                  overflowY: { md: "auto" },
                  overflowX: { xs: "auto", md: "hidden" },
                  pb: { xs: 0.5, md: 0 },
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                <Button
                  variant={categoryId === "" ? "contained" : "text"}
                  onClick={() => setCategoryId("")}
                  sx={{
                    justifyContent: "flex-start",
                    flex: "0 0 auto",
                    whiteSpace: "nowrap",
                    textTransform: "none",
                  }}
                >
                  All templates
                </Button>
                {categories.map((c) => {
                  const id = String(c.categoryId ?? c.id);
                  return (
                    <Button
                      key={id}
                      variant={categoryId === id ? "contained" : "text"}
                      onClick={() => setCategoryId(id)}
                      sx={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        flex: "0 0 auto",
                        whiteSpace: "nowrap",
                        textTransform: "none",
                      }}
                    >
                      {c.name}
                    </Button>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {loading
                ? "Loading templates…"
                : `${visible.length} template${visible.length === 1 ? "" : "s"}`}
            </Typography>

            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                      <Skeleton variant="rounded" height={320} />
                    </Grid>
                  ))
                : visible.map((template) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={template.templateId}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          overflow: "hidden",
                          transition: "box-shadow .2s, transform .2s",
                          "&:hover": { boxShadow: 5, transform: "translateY(-2px)" },
                        }}
                      >
                        <CardActionArea
                          onClick={() => openTemplate(template)}
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            justifyContent: "flex-start",
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={cardImage(template)}
                            alt={template.name || "Template"}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = PLACEHOLDER_IMAGE;
                            }}
                            sx={{ height: 190, objectFit: "cover", bgcolor: "#eef2f7" }}
                          />
                          <CardContent sx={{ flexGrow: 1, width: "100%" }}>
                            <Stack spacing={1}>
                              {template.categoryName && (
                                <Box>
                                  <Chip size="small" label={template.categoryName} />
                                </Box>
                              )}
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                sx={{ overflowWrap: "anywhere", lineHeight: 1.3 }}
                              >
                                {template.name}
                              </Typography>
                              <Typography fontWeight={700}>
                                {formatPrice(template.price, template.currency)}
                              </Typography>
                              {/* <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 2,
                                }}
                              >
                                {template.shortDescription ||
                                  template.description ||
                                  "Explore this template."}
                              </Typography> */}
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
            </Grid>

            {!loading && !visible.length && !error && (
              <Paper variant="outlined" sx={{ p: 5, textAlign: "center", mt: 2 }}>
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
            <DialogTitle component="div" sx={{ pb: 1 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "stretch", sm: "center" } }}
              >
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={closeTemplate}
                  sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
                >
                  Back
                </Button>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ flexGrow: 1, minWidth: 0, overflowWrap: "anywhere" }}
                >
                  {selected.name}
                </Typography>
                <Button
                  variant="contained"
                  sx={{ flexShrink: 0 }}
                  disabled={detailLoading || isPurchased(selected.templateId)}
                  onClick={goBuy}
                >
                  {isPurchased(selected.templateId)
                    ? "Already purchased"
                    : `Buy for ${formatPrice(selected.price, selected.currency)}`}
                </Button>
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ bgcolor: "#f7f8fb", px: { xs: 1, sm: 2, md: 3 } }}>
              {detailLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Container maxWidth="xl" disableGutters sx={{ py: 1 }}>
                  {detailError && (
                    <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setDetailError("")}>
                      {detailError}
                    </Alert>
                  )}

                  <Stack spacing={3}>
                    

                    {/* 1. Images */}
                    {sliderPhotos.length > 0 && (
                      <PhotoSlider photos={sliderPhotos} alt={selected.name} />
                    )}

                    {/* 2. Site description + information */}
                    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Typography variant="h5" fontWeight={700}>
                        {selected.name}
                      </Typography>
                      {selected.shortDescription && (
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          {selected.shortDescription}
                        </Typography>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        {infoRows.map(([label, value]) => (
                          <Grid size={{ xs: 6, sm: 3 }} key={label}>
                            <Typography variant="caption" color="text.secondary">
                              {label}
                            </Typography>
                            <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
                              {value}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="h6" fontWeight={700}>
                        Description
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                      >
                        {selected.description ||
                          "Explore the included pages, themes and preview for this template."}
                      </Typography>

                      {selected.demoUrl && (
                        <Button
                          component="a"
                          href={selected.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          startIcon={<OpenInNewIcon />}
                          sx={{ mt: 2 }}
                        >
                          Open live demo
                        </Button>
                      )}
                    </Paper>

                    {/* 3. Theme panel (left) + pages preview (right) */}
                    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                      <Typography variant="h6" fontWeight={700}>
                        Preview pages with a theme
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Choose a theme on the left; the pages show on the right.
                      </Typography>

                      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Themes
                            </Typography>
                            <Divider sx={{ my: 1.5 }} />
                            {selectedThemes.length ? (
                              <Stack
                                spacing={1}
                                sx={{ maxHeight: { md: 700 }, overflowY: "auto", pr: 0.5 }}
                              >
                                {selectedThemes.map((theme, i) => {
                                  const active =
                                    String(theme.themeId) === String(previewTheme?.themeId);
                                  return (
                                    <Box
                                      key={theme.themeId ?? i}
                                      role="button"
                                      tabIndex={0}
                                      aria-pressed={active}
                                      onClick={() => setPreviewThemeId(theme.themeId)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          setPreviewThemeId(theme.themeId);
                                        }
                                      }}
                                      sx={{
                                        minHeight: 48,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        bgcolor: theme.background || "#fff",
                                        color: theme.color || "#111",
                                        border: active ? "2px solid" : "1px solid",
                                        borderColor: active ? "primary.main" : "divider",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 1,
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Typography variant="body2" fontWeight={700} noWrap>
                                        {theme.name || `Theme ${i + 1}`}
                                      </Typography>
                                      {isDefaultFlag(theme) && (
                                        <Chip size="small" color="primary" label="Default" />
                                      )}
                                    </Box>
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

                        <Grid size={{ xs: 12, md: 9 }}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {previewTheme
                                ? `Theme: ${previewTheme.name || "selected"}`
                                : "Default styling"}
                            </Typography>
                            <ToggleButtonGroup
                              size="small"
                              exclusive
                              value={device}
                              onChange={(_, value) => value && setDevice(value)}
                              aria-label="Preview size"
                            >
                              <ToggleButton value="desktop" aria-label="Desktop">
                                <DesktopWindowsIcon fontSize="small" />
                              </ToggleButton>
                              <ToggleButton value="tablet" aria-label="Tablet">
                                <TabletMacIcon fontSize="small" />
                              </ToggleButton>
                              <ToggleButton value="mobile" aria-label="Mobile">
                                <PhoneIphoneIcon fontSize="small" />
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Stack>

                          <ThemePagePreview
                            theme={previewTheme}
                            pages={selectedPages}
                            activePageKey={previewPageKey}
                            onPageChange={setPreviewPageKey}
                            device={device}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Stack>
                </Container>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}