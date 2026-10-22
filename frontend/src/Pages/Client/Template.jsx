import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Container, Grid, Typography, TextField, InputAdornment, MenuItem,
  List, ListItemButton, ListItemText, Card, CardActionArea, CardMedia,
  CardContent, Chip, Rating, Skeleton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, IconButton, Stack, Divider, Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatPrice = (price, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

export default function Template() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // detail dialog
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // categories (once)
  useEffect(() => {
    axios
      .get(`${API}/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  // templates (refetch on category change)
  useEffect(() => {
    setLoading(true);
    setError("");
    axios
      .get(`${API}/templates`, { params: categoryId ? { categoryId } : {} })
      .then((res) => setTemplates(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load templates")
      )
      .finally(() => setLoading(false));
  }, [categoryId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = templates.filter(
      (t) =>
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.shortDescription?.toLowerCase().includes(q)
    );
    if (sort === "priceLow") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceHigh") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating")
      list = [...list].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    return list; // "newest" = server order (createdAt DESC)
  }, [templates, search, sort]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected({ templateId: id });
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
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
          {/* Category sidebar */}
          <Grid item xs={12} md={3}>
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

          {/* Grid */}
          <Grid item xs={12} md={9}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {loading ? "Loading…" : `${visible.length} template${visible.length === 1 ? "" : "s"}`}
            </Typography>

            <Grid container spacing={3}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Grid item xs={12} sm={6} lg={4} key={i}>
                      <Skeleton variant="rounded" height={260} />
                    </Grid>
                  ))
                : visible.map((t) => (
                    <Grid item xs={12} sm={6} lg={4} key={t.templateId}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          borderRadius: 2,
                          transition: "box-shadow .2s, transform .2s",
                          "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
                        }}
                      >
                        <CardActionArea
                          onClick={() => openDetail(t.templateId)}
                          sx={{ height: "100%" }}
                        >
                          <CardMedia
                            component="img"
                            height="170"
                            image={
                              t.thumbnailUrl ||
                              "https://placehold.co/600x340?text=No+Preview"
                            }
                            alt={t.name}
                            sx={{ objectFit: "cover", bgcolor: "#eee" }}
                          />
                          <CardContent>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              mb={0.5}
                            >
                              <Chip size="small" label={t.categoryName} />
                              <Typography fontWeight={700}>
                                {formatPrice(t.price, t.currency)}
                              </Typography>
                            </Stack>
                            <Typography variant="h6" noWrap>
                              {t.name}
                            </Typography>
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
                            <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                              <Rating
                                size="small"
                                precision={0.5}
                                readOnly
                                value={Number(t.avgRating) || 0}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {t.validityDays} days
                              </Typography>
                            </Stack>
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
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              {selected.name || "Loading…"}
              <IconButton
                onClick={() => setSelected(null)}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {detailLoading || !selected.name ? (
                <Skeleton variant="rounded" height={300} />
              ) : (
                <>
                  <Box
                    component="img"
                    src={
                      selected.thumbnailUrl ||
                      "https://placehold.co/900x400?text=No+Preview"
                    }
                    alt={selected.name}
                    sx={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 1 }}
                  />
                  <Stack direction="row" spacing={1} my={2} flexWrap="wrap">
                    {selected.language && <Chip label={selected.language} />}
                    <Chip label={`${selected.validityDays} days validity`} />
                    <Chip label={`${selected.pages?.length || 0} pages`} />
                    <Chip label={`${selected.themes?.length || 0} themes`} />
                  </Stack>
                  <Typography sx={{ whiteSpace: "pre-line" }}>
                    {selected.description || selected.shortDescription}
                  </Typography>

                  {selected.pages?.some((p) => p.showInMenu) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Included pages
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {selected.pages
                          .filter((p) => p.showInMenu)
                          .map((p) => (
                            <Chip key={p.id} size="small" variant="outlined" label={p.title} />
                          ))}
                      </Stack>
                    </>
                  )}
                </>
              )}
            </DialogContent>
            {selected.name && (
              <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
                <Typography variant="h6">
                  {formatPrice(selected.price, selected.currency)}
                </Typography>
                <Stack direction="row" spacing={1}>
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
                    onClick={() => navigate("/payment", { state: { template: selected } })}
                  >
                    Buy template
                  </Button>
                </Stack>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>
    </Box>
  );
}