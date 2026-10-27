import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import LanguageIcon from "@mui/icons-material/Language";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import PaletteIcon from "@mui/icons-material/Palette";
import DescriptionIcon from "@mui/icons-material/Description";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const authFetch = async (path, signal) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Failed to load dashboard");
  return data;
};

const money = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const compact = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(value);

const STATUS_COLOR = {
  captured: "success",
  authorized: "info",
  created: "default",
  failed: "error",
  refunded: "warning",
};

// Reusable surface style with subtle depth
const cardSx = {
  width: "100%",
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.08)",
  transition: "box-shadow 180ms ease, transform 180ms ease",
  "&:hover": {
    boxShadow:
      "0 1px 2px rgba(16,24,40,0.04), 0 16px 32px -12px rgba(16,24,40,0.16)",
  },
};

// ---------- StatCard ----------
function StatCard({ title, value, icon, color, loading }) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ fontWeight: 500, letterSpacing: 0.2 }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={90} height={44} sx={{ mt: 0.5 }} />
            ) : (
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  mt: 0.5,
                  lineHeight: 1.15,
                  letterSpacing: -0.5,
                  overflowWrap: "anywhere",
                }}
              >
                {value}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              color,
              background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(
                color,
                0.08
              )} 100%)`,
              border: `1px solid ${alpha(color, 0.2)}`,
              flexShrink: 0,
              "& svg": { fontSize: 26 },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ---------- ChartCard ----------
function ChartCard({
  title,
  subtitle,
  loading,
  error,
  empty,
  height = 300,
  accent,
  children,
  action,
}) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: subtitle ? 0.5 : 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {accent && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: accent,
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography variant="h6" fontWeight={700} noWrap>
                {title}
              </Typography>
            </Stack>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>

        {loading ? (
          <Skeleton variant="rounded" height={height} sx={{ mt: 2 }} />
        ) : error || empty ? (
          <Box
            sx={{
              height,
              display: "grid",
              placeItems: "center",
              color: "text.secondary",
              mt: 1,
            }}
          >
            <Stack alignItems="center" spacing={0.5}>
              <Typography fontWeight={500}>
                {error ? "Could not load data" : "No data yet"}
              </Typography>
              {!error && (
                <Typography variant="caption" color="text.secondary">
                  Data will appear here once available.
                </Typography>
              )}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>{children}</Box>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- DonutChart ----------
function DonutChart({ data, palette }) {
  return (
    <PieChart
      height={300}
      colors={palette}
      series={[
        {
          data,
          innerRadius: 62,
          outerRadius: 100,
          paddingAngle: 2,
          cornerRadius: 4,
          highlightScope: { fade: "global", highlight: "item" },
        },
      ]}
      slotProps={{
        legend: {
          direction: "row",
          position: { vertical: "bottom", horizontal: "middle" },
          labelStyle: { fontSize: 12 },
        },
      }}
      margin={{ top: 10, bottom: 70, left: 10, right: 10 }}
    />
  );
}

// ---------- Page ----------
export default function AdminDashboard() {
  const theme = useTheme();
  const username = localStorage.getItem("username") || "Admin";

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const palette = [
    theme.palette.primary.main,
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
  ];

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const [userData, reviewData, statsData] = await Promise.all([
        authFetch("/auth/register", signal),
        authFetch("/review", signal),
        authFetch("/stats", signal),
      ]);
      if (signal?.aborted) return;
      setUsers(Array.isArray(userData) ? userData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setStats(statsData);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      setUsers([]);
      setReviews([]);
      setStats(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // ---------- Derived data ----------
  const clients = useMemo(
    () => users.filter((u) => u.role === "client"),
    [users]
  );

  const avgRating = useMemo(() => {
    const rated = reviews.map((r) => Number(r.rating)).filter(Boolean);
    return rated.length
      ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1)
      : "–";
  }, [reviews]);

  const cards = [
    {
      title: "Total Revenue",
      value: money(stats?.revenue),
      icon: <CurrencyRupeeIcon />,
      color: "#10b981",
    },
    {
      title: "Templates Purchased",
      value: stats?.purchases ?? 0,
      icon: <ShoppingCartIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: "Active Clients",
      value: clients.filter((u) => u.status === "active").length,
      icon: <PeopleIcon />,
      color: "#8b5cf6",
    },
    {
      title: "Live Sites",
      value: stats?.sites ?? 0,
      icon: <LanguageIcon />,
      color: "#06b6d4",
    },
    {
      title: "Templates",
      value: stats?.templates ?? 0,
      icon: <DashboardCustomizeIcon />,
      color: "#f59e0b",
    },
    {
      title: "Themes",
      value: stats?.themes ?? 0,
      icon: <PaletteIcon />,
      color: "#ec4899",
    },
    {
      title: "Pages",
      value: stats?.pages ?? 0,
      icon: <DescriptionIcon />,
      color: "#14b8a6",
    },
    {
      title: `Avg Rating · ${reviews.length} reviews`,
      value: avgRating,
      icon: <StarIcon />,
      color: "#f59e0b",
    },
  ];

  const reviewDonut = useMemo(() => {
    const counts = {};
    reviews.forEach((r) => {
      const rating = Number(r.rating);
      if (rating) counts[rating] = (counts[rating] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([rating, value]) => ({
        id: `rating-${rating}`,
        value,
        label: `${rating} ★`,
      }));
  }, [reviews]);

  const purchaseDonut = useMemo(
    () =>
      (stats?.purchasesByTemplate || []).map((t) => ({
        id: `template-${t.templateId}`,
        value: Number(t.purchases),
        label: t.name,
      })),
    [stats]
  );

  const paymentStatusDonut = useMemo(
    () =>
      (stats?.paymentsByStatus || []).map((s) => ({
        id: `status-${s.status}`,
        value: Number(s.count),
        label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
      })),
    [stats]
  );

  const userDonut = useMemo(() => {
    const counts = {};
    clients.forEach((u) => {
      const key = u.status || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      id: `user-${status}`,
      value,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    }));
  }, [clients]);

  const monthly = stats?.monthly || [];
  const months = monthly.map((m) => m.label);
  const hasMonthly = monthly.some((m) => m.revenue > 0 || m.purchases > 0);
  const topTemplates = stats?.revenueByTemplate || [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 500px at 10% -10%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(1000px 400px at 100% 0%, rgba(16,185,129,0.07), transparent 55%)",
        py: { xs: 3, md: 4 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                letterSpacing: 1.5,
              }}
            >
              Admin Dashboard
            </Typography>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                letterSpacing: -0.5,
                overflowWrap: "anywhere",
              }}
            >
              Welcome back, {username} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Here's what's happening across your platform today.
            </Typography>
          </Box>

          <Tooltip title="Refresh data">
            <span>
              <IconButton
                onClick={() => load()}
                disabled={loading}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => load()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* KPI cards */}
        <Grid container spacing={{ xs: 2, md: 2.5 }}>
          {cards.map((card) => (
            <Grid
              key={card.title}
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              sx={{ display: "flex" }}
            >
              <StatCard
                {...card}
                value={error ? "-" : card.value}
                loading={loading}
              />
            </Grid>
          ))}
        </Grid>

        {/* Revenue trend + monthly purchases */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Revenue trend"
              subtitle="Captured payments · last 6 months"
              accent={theme.palette.primary.main}
              loading={loading}
              error={error}
              empty={!hasMonthly}
            >
              <LineChart
                height={300}
                colors={[theme.palette.primary.main]}
                xAxis={[{ scaleType: "point", data: months }]}
                yAxis={[{ valueFormatter: compact }]}
                series={[
                  {
                    data: monthly.map((m) => m.revenue),
                    label: "Revenue",
                    area: true,
                    showMark: true,
                    valueFormatter: (v) => money(v),
                  },
                ]}
                grid={{ horizontal: true }}
                slotProps={{ legend: { hidden: true } }}
                sx={{
                  "& .MuiLineElement-root": { strokeWidth: 3 },
                  "& .MuiAreaElement-root": {
                    fill: alpha(theme.palette.primary.main, 0.12),
                  },
                }}
              />
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Purchases per month"
              subtitle="Captured payments count"
              accent="#10b981"
              loading={loading}
              error={error}
              empty={!hasMonthly}
            >
              <BarChart
                height={300}
                colors={["#10b981"]}
                xAxis={[{ scaleType: "band", data: months }]}
                series={[
                  {
                    data: monthly.map((m) => m.purchases),
                    label: "Purchases",
                  },
                ]}
                borderRadius={6}
                grid={{ horizontal: true }}
                slotProps={{ legend: { hidden: true } }}
              />
            </ChartCard>
          </Grid>
        </Grid>

        {/* Donuts */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Purchases by template"
              accent={palette[0]}
              loading={loading}
              error={error}
              empty={!purchaseDonut.length}
            >
              <DonutChart data={purchaseDonut} palette={palette} />
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Reviews by rating"
              accent={palette[2]}
              loading={loading}
              error={error}
              empty={!reviewDonut.length}
            >
              <DonutChart data={reviewDonut} palette={palette} />
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Payment status"
              accent={palette[1]}
              loading={loading}
              error={error}
              empty={!paymentStatusDonut.length}
            >
              <DonutChart data={paymentStatusDonut} palette={palette} />
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Clients by status"
              accent={palette[4]}
              loading={loading}
              error={error}
              empty={!userDonut.length}
            >
              <DonutChart data={userDonut} palette={palette} />
            </ChartCard>
          </Grid>
        </Grid>

        {/* Top templates + recent payments */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
            <ChartCard
              title="Top templates by revenue"
              subtitle="Best performing templates"
              accent={theme.palette.primary.main}
              loading={loading}
              error={error}
              empty={!topTemplates.length}
            >
              <BarChart
                height={300}
                layout="horizontal"
                colors={[theme.palette.primary.main]}
                yAxis={[
                  {
                    scaleType: "band",
                    data: topTemplates.map((t) => t.name),
                  },
                ]}
                xAxis={[{ valueFormatter: compact }]}
                series={[
                  {
                    data: topTemplates.map((t) => Number(t.revenue)),
                    label: "Revenue",
                    valueFormatter: (v) => money(v),
                  },
                ]}
                borderRadius={6}
                margin={{ left: 100 }}
                slotProps={{ legend: { hidden: true } }}
              />
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 2 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingUpIcon
                        sx={{ fontSize: 20, color: "success.main" }}
                      />
                      <Typography variant="h6" fontWeight={700}>
                        Recent payments
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      Latest transactions across the platform
                    </Typography>
                  </Box>
                  <Chip
                    label={`${(stats?.recentPayments || []).length} records`}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                  />
                </Stack>

                <Divider sx={{ mb: 1 }} />

                {loading ? (
                  <Skeleton variant="rounded" height={300} />
                ) : error || !(stats?.recentPayments || []).length ? (
                  <Box
                    sx={{
                      height: 300,
                      display: "grid",
                      placeItems: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Stack alignItems="center" spacing={0.5}>
                      <Typography fontWeight={500}>
                        {error ? "Could not load data" : "No payments yet"}
                      </Typography>
                      {!error && (
                        <Typography variant="caption">
                          Recent transactions will appear here.
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: "auto", mx: -1 }}>
                    <Table size="small" sx={{ minWidth: 640 }}>
                      <TableHead>
                        <TableRow
                          sx={{
                            "& th": {
                              fontWeight: 700,
                              fontSize: 12,
                              letterSpacing: 0.6,
                              textTransform: "uppercase",
                              color: "text.secondary",
                              borderBottom: "1px solid",
                              borderColor: "divider",
                              py: 1.25,
                            },
                          }}
                        >
                          <TableCell>Template</TableCell>
                          <TableCell>Transaction</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.recentPayments.map((p) => (
                          <TableRow
                            key={p.id}
                            hover
                            sx={{
                              "& td": { py: 1.25 },
                              "&:last-child td": { borderBottom: 0 },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              {p.templateName || "—"}
                            </TableCell>
                            <TableCell
                              sx={{
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                                fontSize: 12,
                                color: "text.secondary",
                              }}
                            >
                              {p.transactionId}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                            >
                              {money(p.amount, p.currency || "INR")}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={p.status}
                                color={STATUS_COLOR[p.status] || "default"}
                                sx={{
                                  textTransform: "capitalize",
                                  fontWeight: 600,
                                  borderRadius: 1.5,
                                }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{ whiteSpace: "nowrap", color: "text.secondary" }}
                            >
                              {new Date(p.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}