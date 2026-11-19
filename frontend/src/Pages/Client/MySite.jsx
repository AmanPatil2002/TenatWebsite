import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { createSiteSlug } from "../../utils/siteSlug";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const PLACEHOLDER_IMG = "https://placehold.co/600x340?text=No+Preview";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const statusStyles = (theme) => ({
  active: { label: "Active", color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.10) },
  inactive: { label: "Inactive", color: theme.palette.text.muted, bg: alpha(theme.palette.text.muted, 0.10) },
  expired: { label: "Expired", color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.10) },
  pending: { label: "Pending", color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.12) },
});

const MySite = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;
  const textPrimary = theme.palette.text.primary;
  const textMuted = theme.palette.text.muted;
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const styles = statusStyles(theme);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    axios
      .get(`${API_URL}/sites/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) setSites(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.status === 401
              ? "Your session has expired. Please log in again."
              : err.response?.data?.message || "Failed to load your sites.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const daysLeft = (value) => {
    if (!value) return Infinity;
    const ms = new Date(value).getTime() - Date.now();
    return Number.isFinite(ms) ? Math.max(Math.ceil(ms / 86400000), 0) : 0;
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" })
      : "—";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 7 },
        background: `linear-gradient(160deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.04)} 45%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: "center" }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: primary,
            }}
          >
            Workspace
          </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: textPrimary,
              mt: 0.5,
            }}
          >
            My Sites
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 520, mx: "auto" }}
          >
            Manage your purchased templates and sites.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <Skeleton
                    variant="rounded"
                    height={380}
                    sx={{ borderRadius: 3, bgcolor: alpha(primary, 0.06) }}
                  />
                </Grid>
              ))
            : sites.map((site) => {
                const status = site.currentStatus || site.status;
                const usable = status === "active";
                const remaining = daysLeft(site.expiresAt);
                const expiringSoon = usable && remaining <= 30;
                const unusableReason = usable
                  ? ""
                  : `Site is ${status ?? "inactive"} and cannot be opened.`;
                const style = styles[status] || styles.inactive;

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={String(site.id)}>
                    <Card
                      variant="outlined"
                      elevation={0}
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                        borderColor: "divider",
                        overflow: "hidden",
                        transition: "box-shadow 0.2s ease, transform 0.2s ease",
                        "&:hover": {
                          boxShadow: "0 16px 40px rgba(15,23,42,0.10)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      {/* Thumbnail with status badge */}
                      <Box sx={{ position: "relative" }}>
                        <CardMedia
                          component="img"
                          height="180"
                          image={site.thumbnailUrl || PLACEHOLDER_IMG}
                          alt={site.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_IMG;
                          }}
                          sx={{
                            objectFit: "cover",
                            bgcolor: "#e2e8f0",
                            display: "block",
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            px: 1.25,
                            py: 0.35,
                            borderRadius: 99,
                            bgcolor: style.bg,
                            backdropFilter: "blur(6px)",
                            border: `1px solid ${alpha(style.color, 0.25)}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: style.color,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {style.label}
                          </Typography>
                        </Box>
                      </Box>

                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          p: { xs: 2, sm: 2.5 },
                          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
                        }}
                      >
                        <Stack spacing={0.75} sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: textPrimary,
                              lineHeight: 1.3,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {site.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: textMuted, fontWeight: 500 }}
                          >
                            {site.templateName}
                          </Typography>

                          <Divider sx={{ my: 1.25 }} />

                          <Stack spacing={0.5}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: textMuted, fontWeight: 600 }}
                              >
                                Purchased
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: textPrimary, fontWeight: 500 }}
                              >
                                {formatDate(site.startsAt)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: textMuted, fontWeight: 600 }}
                              >
                                Expires
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: expiringSoon
                                    ? theme.palette.warning.main
                                    : textPrimary,
                                }}
                              >
                                {formatDate(site.expiresAt)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>

                        <Stack spacing={1} sx={{ mt: 2.5 }}>
                          <Tooltip
                            title={unusableReason}
                            disableHoverListener={usable}
                          >
                            <span style={{ width: "100%" }}>
                              <Button
                                fullWidth
                                variant="contained"
                                disabled={!usable}
                                onClick={() =>
                                  navigate(`/mysite/${createSiteSlug(site)}`)
                                }
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 700,
                                  py: 1,
                                  bgcolor: primary,
                                  boxShadow: `0 6px 16px ${alpha(primary, 0.22)}`,
                                  "&:hover": {
                                    bgcolor: primaryDark,
                                    boxShadow: `0 8px 20px ${alpha(primary, 0.30)}`,
                                  },
                                  "&.Mui-disabled": {
                                    bgcolor: alpha(primary, 0.12),
                                    color: alpha(primary, 0.4),
                                    boxShadow: "none",
                                  },
                                }}
                              >
                                Open site
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={unusableReason}
                            disableHoverListener={usable}
                          >
                            <span style={{ width: "100%" }}>
                              <Button
                                fullWidth
                                variant="outlined"
                                disabled={!usable}
                                onClick={() =>
                                  navigate(`/site-admin/${site.id}/login`)
                                }
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 600,
                                  py: 1,
                                  borderColor: alpha(primary, 0.35),
                                  color: primary,
                                  "&:hover": {
                                    borderColor: primary,
                                    bgcolor: alpha(primary, 0.04),
                                  },
                                }}
                              >
                                Manage pages
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}

          {!loading && !sites.length && !error && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  textAlign: "center",
                  py: { xs: 5, md: 7 },
                  px: 3,
                  maxWidth: 480,
                  mx: "auto",
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  No sites yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't purchased any templates yet. Explore our library to get started.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/templates")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1,
                    bgcolor: primary,
                    boxShadow: `0 6px 16px ${alpha(primary, 0.22)}`,
                    "&:hover": {
                      bgcolor: primaryDark,
                      boxShadow: `0 8px 20px ${alpha(primary, 0.30)}`,
                    },
                  }}
                >
                  Browse templates
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default MySite;