import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Skeleton,
  Stack,
  Button,
  Chip,
  Typography,
  Divider,
} from "@mui/material";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

const PLACEHOLDER_IMG = "https://placehold.co/600x340?text=No+Preview";

// Helpers --------------------------------------------------------------------

const getArray = (value, key) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  return [];
};

const getThumbnail = (site) => {
  // Priority: explicit thumbnail → theme preview → first page image → placeholder
  const direct = site?.thumbnailUrl || site?.thumbnail;
  if (typeof direct === "string" && direct.trim()) return direct;

  const themeImg =
    site?.theme?.previewImage ||
    site?.theme?.previewUrl ||
    site?.theme?.thumbnailUrl ||
    site?.theme?.image;
  if (typeof themeImg === "string" && themeImg.trim()) return themeImg;

  const firstPage = getArray(site?.pages, "pages")[0];
  const pageImg =
    firstPage?.thumbnailUrl ||
    firstPage?.previewImage ||
    firstPage?.image;
  if (typeof pageImg === "string" && pageImg.trim()) return pageImg;

  return PLACEHOLDER_IMG;
};

const getThemeName = (site) =>
  site?.theme?.name || site?.theme?.title || site?.themeName || "";

const getPages = (site) =>
  getArray(site?.pages, "pages").filter(Boolean);

const getDomain = (site) =>
  site?.subdomain || site?.customDomain || site?.domain || "";

const getStatus = (site) => {
  // Backend may send `status`, `isActive`, or `isPublished`.
  if (typeof site?.status === "string" && site.status.trim()) {
    return site.status.toLowerCase();
  }
  if (typeof site?.isActive === "boolean") {
    return site.isActive ? "active" : "inactive";
  }
  if (typeof site?.isPublished === "boolean") {
    return site.isPublished ? "active" : "draft";
  }
  return "active"; // purchased templates are usable by default
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
    case "published":
      return "success";
    case "draft":
      return "warning";
    case "inactive":
    case "archived":
      return "default";
    default:
      return "default";
  }
};

// Component ------------------------------------------------------------------

export default function MySite() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchSites = async () => {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

      if (!token) {
        setError("You are not logged in. Please log in and try again.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/site`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.sites)
          ? res.data.sites
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        if (!cancelled) setSites(list);
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load your purchased templates."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSites();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box sx={{ bgcolor: "#f7f7f8", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My purchased templates
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Each template comes with one theme and a set of pages you can manage.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {loading
            ? "Loading…"
            : `${sites.length} template${sites.length === 1 ? "" : "s"}`}
        </Typography>

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Skeleton variant="rounded" height={320} />
                </Grid>
              ))
            : sites.map((site) => {
                const status = getStatus(site);
                const themeName = getThemeName(site);
                const pages = getPages(site);
                const domain = getDomain(site);
                const isUsable = status === "active" || status === "published";

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={site.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: 2,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="180"
                        image={getThumbnail(site)}
                        alt={site.name || "Template preview"}
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER_IMG;
                        }}
                        sx={{ objectFit: "cover", bgcolor: "#eee" }}
                      />

                      <CardContent
                        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
                      >
                        <Stack spacing={1} sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" noWrap title={site.name}>
                            {site.name || "Untitled template"}
                          </Typography>

                          {domain ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {domain}
                            </Typography>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.disabled"
                              noWrap
                            >
                              No domain set
                            </Typography>
                          )}

                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap", gap: 1 }}
                          >
                            <Chip
                              label={status}
                              color={getStatusColor(status)}
                              size="small"
                              sx={{ textTransform: "capitalize" }}
                            />
                            {themeName && (
                              <Chip
                                label={`Theme: ${themeName}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            )}
                          </Stack>

                          <Divider sx={{ my: 1 }} />

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                          >
                            Pages ({pages.length})
                          </Typography>

                          {pages.length === 0 ? (
                            <Typography variant="body2" color="text.disabled">
                              No pages assigned.
                            </Typography>
                          ) : (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ flexWrap: "wrap", gap: 0.5 }}
                            >
                              {pages.slice(0, 6).map((page, idx) => (
                                <Chip
                                  key={page.id ?? `${page.name}-${idx}`}
                                  label={page.name || page.title || "Page"}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                              {pages.length > 6 && (
                                <Chip
                                  label={`+${pages.length - 6} more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          )}
                        </Stack>

                        {isUsable && (
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ mt: 2 }}
                          >
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => navigate(`/mysite/${site.id}`)}
                            >
                              Manage pages &amp; theme
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() =>
                                navigate(`/mysite/${site.id}/preview`)
                              }
                            >
                              View site
                            </Button>
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
        </Grid>

        {!loading && !sites.length && !error && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" gutterBottom>
              No purchased templates yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Buy a template to get your own theme and pages.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/templates")}>
              Browse templates
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}