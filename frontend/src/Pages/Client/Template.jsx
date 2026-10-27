
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

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PLACEHOLDER_IMAGE =
  "https://placehold.co/900x520?text=Template+Preview";

const PREVIEW_WIDTHS = ["100%", 768, 390];

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

const getArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.templates)) return data.templates;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.pages)) return data.pages;
  if (Array.isArray(data?.themes)) return data.themes;

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

const formatJson = (value) => {
  if (value == null || value === "") {
    return "No content defined";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// Supports arrays, JSON-encoded arrays, and legacy single URLs.
const parsePhotos = (photos) => {
  if (Array.isArray(photos)) {
    return photos.filter(
      (photo) => typeof photo === "string" && photo.trim()
    );
  }

  if (typeof photos !== "string" || !photos.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(photos);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (photo) => typeof photo === "string" && photo.trim()
      );
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }

    return [];
  } catch {
    return /^https?:\/\/\S+$/i.test(photos.trim())
      ? [photos.trim()]
      : [];
  }
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

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
  const [content, setContent] = useState({
    pages: [],
    themes: [],
    menuItems: [],
  });

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [purchasedTemplateIds, setPurchasedTemplateIds] = useState([]);

  // Load categories and purchase information.
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const categoryRequest = axios.get(`${API}/categories`);

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken");

        const purchaseRequest = token
          ? axios.get(`${API}/site`, getAuthConfig()).catch(() => null)
          : Promise.resolve(null);

        const [categoryResponse, purchaseResponse] = await Promise.all([
          categoryRequest,
          purchaseRequest,
        ]);

        if (cancelled) return;

        setCategories(getArray(categoryResponse));

        if (purchaseResponse) {
          setPurchasedTemplateIds(
            getArray(purchaseResponse)
              .map((site) => Number(site.templateId))
              .filter((id) => Number.isFinite(id))
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setCategoryWarning(
            getErrorMessage(
              loadError,
              "Categories could not be loaded. You can still browse templates."
            )
          );
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // The template list route returns the full list and does not implement query filters.
  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API}/templates`);

        if (!cancelled) {
          setTemplates(getArray(response));
        }
      } catch (loadError) {
        if (!cancelled) {
          setTemplates([]);
          setError(
            getErrorMessage(loadError, "Could not load templates.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          String(category.categoryId ?? category.id) === String(categoryId)
      ),
    [categories, categoryId]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates
      .filter((template) => {
        if (template.status !== "published") return false;
        if (
          categoryId &&
          String(template.categoryId) !== String(categoryId)
        ) {
          return false;
        }

        return (
          !query ||
          [
            template.name,
            template.shortDescription,
            template.description,
            template.categoryName,
          ].some((value) =>
            String(value || "").toLowerCase().includes(query)
          )
        );
      })
      .sort((first, second) => {
        if (sort === "priceLow" || sort === "priceHigh") {
          const difference =
            Number(first.price || 0) - Number(second.price || 0);
          return sort === "priceLow" ? difference : -difference;
        }

        const firstDate = Date.parse(first.createdAt || "");
        const secondDate = Date.parse(second.createdAt || "");
        if (Number.isFinite(firstDate) && Number.isFinite(secondDate)) {
          return secondDate - firstDate;
        }

        return Number(second.templateId || 0) - Number(first.templateId || 0);
      });
  }, [categoryId, search, sort, templates]);

  // Open the template details and retrieve included content.
  const openTemplate = useCallback(async (template) => {
    setSelected(template);
    setDetailLoading(true);
    setDetailError("");
    setTabIndex(0);

    setContent({
      pages: [],
      themes: [],
      menuItems: [],
    });

    try {
      const response = await axios.get(
        `${API}/templates/${template.templateId}/content`
      );

      const data = response?.data?.data || response?.data || {};

      setContent({
        pages: Array.isArray(data.pages) ? data.pages : [],
        themes: Array.isArray(data.themes) ? data.themes : [],
        menuItems: Array.isArray(data.menuItems)
          ? data.menuItems
          : [],
      });
    } catch (loadError) {
      console.error("Failed to load template content:", loadError);

      setDetailError(
        getErrorMessage(
          loadError,
          "Included pages and themes could not be loaded."
        )
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

  return (
    <Box
      sx={{
        bgcolor: "#f7f8fb",
        minHeight: "100vh",
        pb: 8,
      }}
    >
      {/* Header and search */}
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

          <Typography
            color="text.secondary"
            sx={{ maxWidth: 700, mb: 3 }}
          >
            {(typeof activeCategory?.content === "string" &&
              activeCategory.content) ||
              "Browse published templates, preview their included pages and themes, then purchase one to create your own site."}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              onChange={(event) => setSort(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="priceLow">
                Price: low to high
              </MenuItem>
              <MenuItem value="priceHigh">
                Price: high to low
              </MenuItem>
            </TextField>
          </Stack>
        </Container>
      </Box>

      {/* Categories and template cards */}
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
              <Typography
                variant="overline"
                color="text.secondary"
              >
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

                {categories.map((category) => (
                  <Button
                    key={category.categoryId}
                    variant={
                      String(categoryId) ===
                      String(category.categoryId)
                        ? "contained"
                        : "text"
                    }
                    onClick={() =>
                      setCategoryId(String(category.categoryId))
                    }
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                    }}
                  >
                    {category.name}
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
                : `${visible.length} template${visible.length === 1 ? "" : "s"}`}
            </Typography>

            <Grid container spacing={3}>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <Grid
                      size={{ xs: 12, sm: 6, lg: 4 }}
                      key={index}
                    >
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
                            height="190"
                            image={
                              template.thumbnailUrl ||
                              PLACEHOLDER_IMAGE
                            }
                            alt={template.name || "Template"}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src =
                                PLACEHOLDER_IMAGE;
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

                            {template.shortDescription && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 1.5,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {template.shortDescription}
                              </Typography>
                            )}

                            <Typography
                              fontWeight={700}
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {formatPrice(
                                template.price,
                                template.currency
                              )}
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ mt: 2 }}
                            >
                              {template.validityDays && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`${template.validityDays} days`}
                                />
                              )}

                              {parsePhotos(template.photos).length > 0 && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`${parsePhotos(template.photos).length} photos`}
                                />
                              )}

                              {isPurchased(template.templateId) && (
                                <Chip
                                  size="small"
                                  color="success"
                                  label="Purchased"
                                />
                              )}
                            </Stack>
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
                <Typography variant="h6">
                  No templates found
                </Typography>

                <Typography color="text.secondary">
                  Try another search or category.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Full-screen template details */}
      <Dialog
        fullScreen
        open={Boolean(selected)}
        onClose={closeTemplate}
      >
        {selected && (
          <>
            <DialogTitle component="div" sx={{ pb: 0 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", md: "center" }}
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
                  sx={{
                    flexGrow: 1,
                    overflowWrap: "anywhere",
                  }}
                >
                  {selected.name}
                </Typography>

                {selected.demoUrl && (
                  <Tabs
                    value={tabIndex}
                    onChange={(_, value) => setTabIndex(value)}
                    variant="scrollable"
                  >
                    <Tab label="Desktop" />
                    <Tab label="Tablet" />
                    <Tab label="Mobile" />
                  </Tabs>
                )}

                <Button
                  variant="contained"
                  disabled={
                    detailLoading || isPurchased(selected.templateId)
                  }
                  onClick={() =>
                    navigate("/payment", {
                      state: { template: selected },
                    })
                  }
                >
                  {isPurchased(selected.templateId)
                    ? "Already purchased"
                    : `Buy for ${formatPrice(selected.price, selected.currency)}`}
                </Button>
              </Stack>
            </DialogTitle>

            <DialogContent dividers>
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
                <Container maxWidth="xl" sx={{ py: 2 }}>
                  {detailError && (
                    <Alert
                      severity="warning"
                      sx={{ mb: 2 }}
                      onClose={() => setDetailError("")}
                    >
                      {detailError}
                    </Alert>
                  )}

                  {/* Main preview */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      bgcolor: "#eef1f5",
                      display: "flex",
                      justifyContent: "center",
                      minHeight: 260,
                      overflow: "hidden",
                    }}
                  >
                    {selected.demoUrl ? (
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
                    ) : (
                      <Box
                        component="img"
                        src={
                          selected.thumbnailUrl ||
                          PLACEHOLDER_IMAGE
                        }
                        alt={selected.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            PLACEHOLDER_IMAGE;
                        }}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "68vh",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </Paper>

                  {/* Additional uploaded photos */}
                  {parsePhotos(selected.photos).length > 0 && (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2.5, mt: 3 }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ mb: 2 }}
                      >
                        Template Photos
                      </Typography>

                      <Grid container spacing={2}>
                        {parsePhotos(selected.photos).map(
                          (photo, index) => (
                            <Grid
                              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                              key={`${photo}-${index}`}
                            >
                              <Box
                                component="img"
                                src={photo}
                                alt={`${selected.name} photo ${index + 1}`}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                                sx={{
                                  width: "100%",
                                  height: 200,
                                  display: "block",
                                  objectFit: "cover",
                                  borderRadius: 2,
                                  bgcolor: "#eef2f7",
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                            </Grid>
                          )
                        )}
                      </Grid>
                    </Paper>
                  )}

                  <Grid container spacing={3} sx={{ mt: 0 }}>
                    {/* Template information */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ mt: 3 }}
                      >
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

                      <Paper
                        variant="outlined"
                        sx={{ p: 2.5, mt: 3 }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          Details
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Grid container spacing={2}>
                          {[
                            [
                              "Category",
                              selected.categoryName || "General",
                            ],
                            [
                              "Language",
                              selected.language || "Not specified",
                            ],
                            [
                              "Access period",
                              selected.validityDays
                                ? `${selected.validityDays} days`
                                : "Not specified",
                            ],
                            [
                              "Price",
                              formatPrice(
                                selected.price,
                                selected.currency
                              ),
                            ],
                          ].map(([label, value]) => (
                            <Grid
                              size={{ xs: 12, sm: 6 }}
                              key={label}
                            >
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
                      </Paper>

                      {/* Menu items, when supplied by the content API */}
                      {content.menuItems.length > 0 && (
                        <Paper
                          variant="outlined"
                          sx={{ p: 2.5, mt: 3 }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            Menu Items
                          </Typography>

                          <Divider sx={{ my: 1.5 }} />

                          <Stack
                            direction="row"
                            flexWrap="wrap"
                            gap={1}
                          >
                            {content.menuItems.map((item, index) => (
                              <Chip
                                key={item.id ?? index}
                                label={
                                  item.title ||
                                  item.label ||
                                  item.name ||
                                  `Menu item ${index + 1}`
                                }
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </Paper>
                      )}
                    </Grid>

                    {/* Included pages and themes */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2.5, mb: 2, mt: { xs: 0, lg: 2 } }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          Included Pages
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        {content.pages.length > 0 ? (
                          content.pages.map((page, index) => (
                            <Box
                              key={page.id ?? page.pageId ?? index}
                              sx={{ py: 1 }}
                            >
                              <Typography fontWeight={600}>
                                {page.parentId ? "↳ " : ""}
                                {page.title ||
                                  page.name ||
                                  page.pageName ||
                                  "Untitled page"}
                              </Typography>

                              {page.slug && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  /{page.slug}
                                </Typography>
                              )}
                            </Box>
                          ))
                        ) : (
                          <Typography color="text.secondary">
                            No pages listed for this template.
                          </Typography>
                        )}
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Typography variant="h6" fontWeight={700}>
                          Available Themes
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        {content.themes.length > 0 ? (
                          <Stack spacing={1}>
                            {content.themes.map((theme, index) => (
                              <Paper
                                key={theme.id ?? theme.themeId ?? index}
                                variant="outlined"
                                sx={{ p: 1.5 }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  flexWrap="wrap"
                                >
                                  <Typography fontWeight={600}>
                                    {theme.name ||
                                      theme.title ||
                                      "Unnamed theme"}
                                  </Typography>

                                  {(theme.isDefault === true ||
                                    theme.isDefault === 1 ||
                                    theme.isDefault === "1") && (
                                    <Chip
                                      size="small"
                                      label="Default"
                                      color="primary"
                                    />
                                  )}
                                </Stack>

                                {theme.type && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {theme.type}
                                  </Typography>
                                )}

                                <Box
                                  component="pre"
                                  sx={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                    fontSize: 12,
                                    mb: 0,
                                    mt: 1,
                                  }}
                                >
                                  {formatJson(theme.settings)}
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Typography color="text.secondary">
                            No themes listed for this template.
                          </Typography>
                        )}
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
