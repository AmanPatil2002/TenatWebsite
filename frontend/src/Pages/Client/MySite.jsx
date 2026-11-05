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

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const statusStyles = {
  active: { label: "Active", color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
  inactive: { label: "Inactive", color: "#64748b", bg: "rgba(100,116,139,0.10)" },
  expired: { label: "Expired", color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
  pending: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

const MySite = () => {
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
        background:
          "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
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
              color: BRAND.indigo,
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
              color: BRAND.ink,
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
                    sx={{ borderRadius: 3, bgcolor: alpha(BRAND.indigo, 0.06) }}
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
                const style = statusStyles[status] || statusStyles.inactive;

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
                              color: BRAND.ink,
                              lineHeight: 1.3,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {site.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: BRAND.muted, fontWeight: 500 }}
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
                                sx={{ color: BRAND.muted, fontWeight: 600 }}
                              >
                                Purchased
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: BRAND.ink, fontWeight: 500 }}
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
                                sx={{ color: BRAND.muted, fontWeight: 600 }}
                              >
                                Expires
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: expiringSoon
                                    ? "warning.main"
                                    : BRAND.ink,
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
                                  bgcolor: BRAND.indigo,
                                  boxShadow: `0 6px 16px ${alpha(BRAND.indigo, 0.22)}`,
                                  "&:hover": {
                                    bgcolor: BRAND.indigoDeep,
                                    boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.30)}`,
                                  },
                                  "&.Mui-disabled": {
                                    bgcolor: alpha(BRAND.indigo, 0.12),
                                    color: alpha(BRAND.indigo, 0.4),
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
                                  borderColor: alpha(BRAND.indigo, 0.35),
                                  color: BRAND.indigo,
                                  "&:hover": {
                                    borderColor: BRAND.indigo,
                                    bgcolor: alpha(BRAND.indigo, 0.04),
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
                  py: 10,
                  px: 3,
                  borderRadius: 3,
                  border: "1px dashed",
                  borderColor: alpha(BRAND.indigo, 0.25),
                  bgcolor: alpha(BRAND.indigo, 0.03),
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: BRAND.ink }}
                  gutterBottom
                >
                  No sites found
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
                >
                  Buy a template to get your own theme and pages.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/templates")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    py: 1.1,
                    bgcolor: BRAND.indigo,
                    boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.25)}`,
                    "&:hover": { bgcolor: BRAND.indigoDeep },
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