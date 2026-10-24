import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  List,
  ListItemButton,
  ListItemText,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Tabs,
  Tab,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PLACEHOLDER_IMG = "https://placehold.co/600x340?text=No+Preview";

// Preview widths for the Desktop / Tablet / Mobile tabs
const PREVIEW_WIDTHS = ["100%", 768, 390];

const formatPrice = (price, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

export default function Template() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/categories`)
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    axios
      .get(`${API}/templates`, { params: categoryId ? { categoryId } : {} })
      .then((res) => setTemplates(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load templates"),
      )
      .finally(() => setLoading(false));
  }, [categoryId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = templates.filter(
      (t) =>
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.shortDescription?.toLowerCase().includes(q),
    );
    if (sort === "priceLow")
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "priceHigh")
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "rating")
      list = [...list].sort(
        (a, b) => Number(b.avgRating || 0) - Number(a.avgRating || 0),
      );
    return list;
  }, [templates, search, sort]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setError("");
    setSelected({ templateId: id, name: "", shortDescription: "" });
    setTabIndex(0);

    try {
      const res = await axios.get(`${API}/templates/${id}`);
      setSelected(res.data);
    } catch {
      setSelected(null);
      setError("Could not load template details");
    } finally {
      setDetailLoading(false);
    }
  };

  const activeCategory = categories.find((c) => c.categoryId === categoryId);
  const detailReady = !!selected && !detailLoading && !!selected.name;

  return (
    <Box sx={{ bgcolor: "#f7f7f8", minHeight: "100vh", pb: 8 }}>
      {/* Hero */}
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e5e5e5", py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {activeCategory ? activeCategory.name : "Website Templates"}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640, mb: 3 }}>
            {activeCategory?.content ||
              "Browse professionally designed templates. Pick one, preview it, and launch your site."}
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
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="rating">Top rated</MenuItem>
              <MenuItem value="priceLow">Price: low to high</MenuItem>
              <MenuItem value="priceHigh">Price: high to low</MenuItem>
            </TextField>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          {/* Categories */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Categories
            </Typography>
            <List dense>
              <ListItemButton
                selected={categoryId === ""}
                onClick={() => setCategoryId("")}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary="All templates" />
              </ListItemButton>
              {categories.map((c) => (
                <ListItemButton
                  key={c.categoryId}
                  selected={categoryId === c.categoryId}
                  onClick={() => setCategoryId(c.categoryId)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText primary={c.name} />
                </ListItemButton>
              ))}
            </List>
          </Grid>

          {/* Template grid */}
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
                ? "Loading…"
                : `${visible.length} template${visible.length === 1 ? "" : "s"}`}
            </Typography>

            <Grid container spacing={3}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                      <Skeleton variant="rounded" height={260} />
                    </Grid>
                  ))
                : visible.map((t) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={t.templateId}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          borderRadius: 2,
                          transition: "box-shadow .2s, transform .2s",
                          "&:hover": {
                            boxShadow: 6,
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <CardActionArea
                          onClick={() => openDetail(t.templateId)}
                          sx={{ height: "100%" }}
                        >
                          <CardMedia
                            component="img"
                            height="200"
                            image={t.thumbnailUrl || PLACEHOLDER_IMG}
                            alt={t.name}
                            sx={{ objectFit: "cover", bgcolor: "#eee" }}
                          />
                          <CardContent>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={1}
                              mb={0.5}
                            >
                              <Typography variant="h6" noWrap>
                                {t.name}
                              </Typography>
                              <Typography fontWeight={700} sx={{ flexShrink: 0 }}>
                                {formatPrice(t.price, t.currency)}
                              </Typography>
                            </Stack>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                minHeight: 40,
                              }}
                            >
                              {t.shortDescription}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
            </Grid>

            {!loading && !visible.length && !error && (
              <Box textAlign="center" py={8}>
                <Typography variant="h6">No templates found</Typography>
                <Typography color="text.secondary">
                  Try another category or search term.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Detail dialog */}
      <Dialog fullScreen open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <DialogTitle component="div" sx={{ pb: 0 }}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Button onClick={() => setSelected(null)}>Close</Button>
                <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
                  {selected.name}
                </Typography>

                {selected.demoUrl && (
                  <Button
                    variant="outlined"
                    href={selected.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Live preview
                  </Button>
                )}
                <Button
                  variant="contained"
                  disabled={!detailReady}
                  onClick={() =>
                    navigate("/payment", {
                      state: {
                        templateId: selected.templateId,
                        template: selected,
                      },
                    })
                  }
                >
                  {detailReady
                    ? `Buy ${formatPrice(selected.price, selected.currency)}`
                    : "Buy"}
                </Button>
              </Stack>

              <Tabs
                onChange={handleTabChange}
                value={tabIndex}
                sx={{ mt: 1 }}
              >
                <Tab label="Desktop" />
                <Tab label="Tablet" />
                <Tab label="Mobile" />
              </Tabs>
            </DialogTitle>

            <DialogContent dividers>
              {!detailReady ? (
                <Skeleton variant="rounded" height={300} />
              ) : (
                <Stack spacing={3}>
                  {/* Device preview */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      bgcolor: "#eee",
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    {selected.demoUrl ? (
                      <Box
                        component="iframe"
                        src={selected.demoUrl}
                        title={`${selected.name} preview`}
                        sx={{
                          width: PREVIEW_WIDTHS[tabIndex],
                          maxWidth: "100%",
                          height: "60vh",
                          border: 0,
                          bgcolor: "#fff",
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={selected.thumbnailUrl || PLACEHOLDER_IMG}
                        alt={selected.name}
                        sx={{
                          width: PREVIEW_WIDTHS[tabIndex],
                          maxWidth: "100%",
                          maxHeight: 360,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </Box>

                  {/* Details */}
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Stack spacing={1}>
                        <Typography variant="h4">{selected.name}</Typography>
                        <Typography variant="h6" color="text.secondary">
                          {selected.shortDescription}
                        </Typography>
                        <Divider />
                        <Typography variant="h6">Description</Typography>
                        <Typography sx={{ whiteSpace: "pre-line" }}>
                          {selected.description}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="overline" color="text.secondary">
                            Languages / frameworks
                          </Typography>
                          <Typography>{selected.language || "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="overline" color="text.secondary">
                            Validity
                          </Typography>
                          <Typography>{selected.validityDays} days</Typography>
                        </Box>
                        <Box>
                          <Typography variant="overline" color="text.secondary">
                            Posted on
                          </Typography>
                          <Typography>{formatDate(selected.createdAt)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="overline" color="text.secondary">
                            Last updated
                          </Typography>
                          <Typography>{formatDate(selected.updatedAt)}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}