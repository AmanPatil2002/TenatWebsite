import { useEffect, useState } from "react";
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

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER_IMAGE = "https://placehold.co/900x520?text=Template+Preview";
const PREVIEW_WIDTHS = ["100%", 768, 390];

const formatPrice = (price, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(price || 0));

const formatJson = (value) => {
  if (value == null) return "No content defined";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

export default function Template() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState({ pages: [], themes: [], menuItems: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [purchasedTemplateIds, setPurchasedTemplateIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .get(`${API}/site`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (!cancelled && Array.isArray(response.data)) {
            setPurchasedTemplateIds(response.data.map((site) => Number(site.templateId)).filter((id) => Number.isFinite(id)));
          }
        })
        .catch(() => {
          if (!cancelled) setPurchasedTemplateIds([]);
        });
    }

    axios
      .get(`${API}/categories`)
      .then((response) => {
        if (!cancelled) setCategories(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) setError("Categories could not be loaded. You can still browse all templates.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    axios
      .get(`${API}/templates`, {
        params: {
          ...(categoryId ? { categoryId } : {}),
          ...(search.trim() ? { q: search.trim() } : {}),
          sort: sort === "priceLow" ? "price_asc" : sort === "priceHigh" ? "price_desc" : "newest",
          limit: 100,
        },
      })
      .then((response) => {
        if (!cancelled) setTemplates(Array.isArray(response.data) ? response.data : []);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.response?.data?.message || "Could not load templates.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, search, sort]);

  const visible = templates;

  const openTemplate = async (template) => {
    setSelected(template);
    setDetailLoading(true);
    setTabIndex(0);
    setContent({ pages: [], themes: [], menuItems: [] });
    try {
      const response = await axios.get(`${API}/templates/${template.templateId}/content`);
      setContent({
        pages: Array.isArray(response.data.pages) ? response.data.pages : [],
        themes: Array.isArray(response.data.themes) ? response.data.themes : [],
        menuItems: Array.isArray(response.data.menuItems) ? response.data.menuItems : [],
      });
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Template details could not be loaded.");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const activeCategory = categories.find(
    (category) => String(category.categoryId) === String(categoryId),
  );

  return (
    <Box sx={{ bgcolor: "#f7f8fb", minHeight: "100vh", pb: 8 }}>
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e7eb", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={750} gutterBottom>
            {activeCategory?.name || "Website templates"}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 700, mb: 3 }}>
            {(typeof activeCategory?.content === "string" && activeCategory.content) || "Browse published templates, preview their included pages and themes, then purchase one to create your own site."}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
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
              <MenuItem value="priceLow">Price: low to high</MenuItem>
              <MenuItem value="priceHigh">Price: high to low</MenuItem>
            </TextField>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="overline" color="text.secondary">Categories</Typography>
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
                    variant={String(categoryId) === String(category.categoryId) ? "contained" : "text"}
                    onClick={() => setCategoryId(String(category.categoryId))}
                    sx={{ justifyContent: "flex-start", textAlign: "left" }}
                  >
                    {category.name}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {loading ? "Loading templates…" : `${visible.length} template${visible.length === 1 ? "" : "s"}`}
            </Typography>
            <Grid container spacing={3}>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}><Skeleton variant="rounded" height={300} /></Grid>
                  ))
                : visible.map((template) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={template.templateId}>
                      <Card variant="outlined" sx={{ height: "100%", borderRadius: 3, "&:hover": { boxShadow: 5, transform: "translateY(-2px)" }, transition: "all .2s" }}>
                        <CardActionArea onClick={() => openTemplate(template)} sx={{ height: "100%" }}>
                          <CardMedia component="img" height="190" image={template.thumbnailUrl || PLACEHOLDER_IMAGE} alt={template.name} sx={{ objectFit: "cover", bgcolor: "#eef2f7" }} />
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                              <Typography variant="h6" fontWeight={700}>{template.name}</Typography>
                              <Typography fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{formatPrice(template.price, template.currency)}</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                              {template.shortDescription || template.description || "Explore this website template."}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                              {template.categoryName && <Chip size="small" label={template.categoryName} />}
                              {template.validityDays && <Chip size="small" variant="outlined" label={`${template.validityDays} days`} />}
                            </Stack>
                            <Button variant="text" sx={{ mt: 1, px: 0 }}>View pages, themes & preview</Button>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
            </Grid>
            {!loading && !visible.length && !error && (
              <Paper variant="outlined" sx={{ p: 5, textAlign: "center" }}>
                <Typography variant="h6">No templates found</Typography>
                <Typography color="text.secondary">Try another search or category.</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      <Dialog fullScreen open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <DialogTitle component="div" sx={{ pb: 0 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                <Button onClick={() => setSelected(null)} sx={{ alignSelf: "flex-start" }}>Back</Button>
                <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>{selected.name}</Typography>
                {selected.demoUrl && (
                  <Tabs value={tabIndex} onChange={(_, value) => setTabIndex(value)} variant="scrollable">
                    <Tab label="Desktop" />
                    <Tab label="Tablet" />
                    <Tab label="Mobile" />
                  </Tabs>
                )}
                <Button
                  variant="contained"
                  disabled={detailLoading || purchasedTemplateIds.includes(Number(selected.templateId))}
                  onClick={() => navigate("/payment", { state: { template: selected } })}
                >
                  {purchasedTemplateIds.includes(Number(selected.templateId))
                    ? "Already purchased"
                    : `Buy for ${formatPrice(selected.price, selected.currency)}`}
                </Button>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              {detailLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}><CircularProgress /></Box>
              ) : (
                <Container maxWidth="xl" sx={{ py: 2 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                      <Paper variant="outlined" sx={{ p: 1, bgcolor: "#eef1f5", display: "flex", justifyContent: "center", minHeight: 260 }}>
                        {selected.demoUrl ? (
                          <Box
                            component="iframe"
                            src={selected.demoUrl}
                            title={`${selected.name} demo`}
                            sx={{ width: PREVIEW_WIDTHS[tabIndex], maxWidth: "100%", height: { xs: "55vh", md: "68vh" }, border: 0, bgcolor: "#fff", borderRadius: 1 }}
                          />
                        ) : (
                          <Box component="img" src={selected.thumbnailUrl || PLACEHOLDER_IMAGE} alt={selected.name} sx={{ maxWidth: "100%", maxHeight: "68vh", objectFit: "contain" }} />
                        )}
                      </Paper>
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 3 }}>{selected.name}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>{selected.description || selected.shortDescription}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Included pages</Typography>
                        <Divider sx={{ my: 1.5 }} />
                        {content.pages.length ? content.pages.map((page) => (
                          <Box key={page.id} sx={{ py: 1 }}>
                            <Typography fontWeight={600}>{page.parentId ? "↳ " : ""}{page.title}</Typography>
                            <Typography variant="body2" color="text.secondary">/{page.slug}</Typography>
                          </Box>
                        )) : <Typography color="text.secondary">No pages listed for this template.</Typography>}
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Typography variant="h6" fontWeight={700}>Available themes</Typography>
                        <Divider sx={{ my: 1.5 }} />
                        {content.themes.length ? (
                          <Stack spacing={1}>
                            {content.themes.map((theme) => (
                              <Paper key={theme.id} variant="outlined" sx={{ p: 1.5 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography fontWeight={600}>{theme.name}</Typography>
                                  {Boolean(theme.isDefault) && <Chip size="small" label="Default" color="primary" />}
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>{theme.type}</Typography>
                                <Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, mb: 0 }}>
                                  {formatJson(theme.settings)}
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        ) : <Typography color="text.secondary">Themes can be added after purchase.</Typography>}
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
