import { useEffect, useState } from "react";
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
  Typography,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PLACEHOLDER_IMG = "https://placehold.co/600x340?text=No+Preview";

export default function MySite() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchSites = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please log in and try again.");
        setLoading(false);
        return;
      }

      try {
        // Same endpoint AddTheme uses to list the logged-in user's sites
        const res = await axios.get(`${API_URL}/site`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!Array.isArray(res.data)) {
          throw new Error("Invalid sites response");
        }
        if (!cancelled) setSites(res.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            err.response?.data?.message || err.message || "Failed to load sites",
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
          My sites
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {loading
            ? "Loading…"
            : `${sites.length} site${sites.length === 1 ? "" : "s"}`}
        </Typography>

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Skeleton variant="rounded" height={260} />
                </Grid>
              ))
            : sites.map((site) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={site.id}>
                  <Card
                    variant="outlined"
                    sx={{ height: "100%", borderRadius: 2 }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={site.thumbnailUrl || PLACEHOLDER_IMG}
                      alt={site.siteName}
                      sx={{ objectFit: "cover", bgcolor: "#eee" }}
                    />
                    <CardContent>
                      <Stack spacing={0.5}>
                        <Typography variant="h6" noWrap>
                          {site.siteName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {site.subdomain}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {!loading && !sites.length && !error && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6">No sites yet</Typography>
            <Typography color="text.secondary">
              Buy a template to create your first site.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}