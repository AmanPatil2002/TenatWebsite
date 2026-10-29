import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PLACEHOLDER_IMG = "https://placehold.co/600x340?text=No+Preview";

const STATUS_COLOR = { active: "success", expired: "error", suspended: "warning" };

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

const daysLeft = (value) => {
  const ms = new Date(value).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(Math.ceil(ms / 86400000), 0) : 0;
};

export default function MySite() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    axios
      .get(`${API_URL}/sites/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!cancelled) setSites(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : err.response?.data?.message || "Failed to load your sites."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <Box sx={{ bgcolor: "#f7f7f8", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My Purchased Template
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Templates you have purchased, with the theme and pages you chose.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Skeleton variant="rounded" height={340} />
                </Grid>
              ))
            : sites.map((site) => {
                const status = site.currentStatus || site.status;
                const usable = status === "active";
                const remaining = daysLeft(site.expiresAt);

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={site.id}>
                    <Card
                      variant="outlined"
                      sx={{ height: "100%", borderRadius: 3, display: "flex", flexDirection: "column" }}
                    >
                      <CardMedia
                        component="img"
                        height="180"
                        image={site.thumbnailUrl || PLACEHOLDER_IMG}
                        alt={site.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER_IMG;
                        }}
                        sx={{ objectFit: "cover", bgcolor: "#eee" }}
                      />

                      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <Stack spacing={1} sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
                            {site.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {site.templateName}
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Typography variant="body2" color="text.secondary">
                            Purchased: {formatDate(site.startsAt)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={usable && remaining <= 30 ? "warning.main" : "text.secondary"}
                          >
                            {usable
                              ? `Valid until ${formatDate(site.expiresAt)} (${remaining} day${
                                  remaining === 1 ? "" : "s"
                                } left)`
                              : `Expired on ${formatDate(site.expiresAt)}`}
                          </Typography>
                        </Stack>

                        <Button
                          fullWidth
                          variant="contained"
                          disabled={!usable}
                          onClick={() => navigate(`/mysite/${site.id}`)}
                          sx={{ mt: 2 }}
                        >
                          Open site
                        </Button>
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