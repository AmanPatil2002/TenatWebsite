import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Rating,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import LanguageIcon from "@mui/icons-material/Language";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import StarIcon from "@mui/icons-material/Star";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

/* ======================================================================
   Config & helpers
   ====================================================================== */

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
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(value || 0);

const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const pctChange = (current, previous) =>
  previous ? ((current - previous) / previous) * 100 : null;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const lastMonths = (n = 6) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
    };
  });
};

// Fresh palette: ocean / teal / sunset tones
const C = {
  sky: "#0ea5e9",
  teal: "#14b8a6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  orange: "#f97316",
  indigo: "#6366f1",
  lime: "#84cc16",
};
const PALETTE = [
  C.sky,
  C.teal,
  C.amber,
  C.rose,
  C.violet,
  C.orange,
  C.indigo,
  C.lime,
];

const STATUS_COLOR = {
  captured: "success",
  authorized: "info",
  created: "default",
  failed: "error",
  refunded: "warning",
};

const cardSx = {
  width: "100%",
  minWidth: 0,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow:
    "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.08)",
  transition: "box-shadow 180ms ease, transform 180ms ease",
  "&:hover": {
    boxShadow:
      "0 1px 2px rgba(16,24,40,0.04), 0 16px 32px -12px rgba(16,24,40,0.16)",
  },
};

/* ======================================================================
   Reusable pieces
   ====================================================================== */

function TrendBadge({ value }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return (
      <Typography variant="caption" color="text.secondary">
        No prior data
      </Typography>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Icon sx={{ fontSize: 16, color: up ? "success.main" : "error.main" }} />
      <Typography
        variant="caption"
        fontWeight={700}
        color={up ? "success.main" : "error.main"}
      >
        {Math.abs(value).toFixed(1)}%
      </Typography>
      <Typography variant="caption" color="text.secondary">
        vs last month
      </Typography>
    </Stack>
  );
}

function StatCard({ title, value, icon, color, loading, trend, caption }) {
  return (
    <Card sx={{ ...cardSx, position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.35)})`,
        }}
      />
      <CardContent sx={{ p: 2.5, pt: 3, "&:last-child": { pb: 2.5 } }}>
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
              sx={{ fontWeight: 600, letterSpacing: 0.2 }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={110} height={44} sx={{ mt: 0.5 }} />
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
            <Box sx={{ mt: 1, minHeight: 20 }}>
              {loading ? (
                <Skeleton width={120} />
              ) : trend !== undefined ? (
                <TrendBadge value={trend} />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {caption}
                </Typography>
              )}
            </Box>
          </Box>

          <Avatar
            sx={{
              width: 54,
              height: 54,
              flexShrink: 0,
              color: "#fff",
              background: `linear-gradient(135deg, ${alpha(color, 0.85)} 0%, ${color} 100%)`,
              boxShadow: `0 8px 16px -4px ${alpha(color, 0.5)}`,
              "& svg": { fontSize: 26 },
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Panel({
  title,
  subtitle,
  accent,
  action,
  loading,
  error,
  empty,
  height = 300,
  emptyText = "No data yet",
  children,
}) {
  return (
    <Card
      sx={{
        ...cardSx,
        display: "flex",
        flex: 1,
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: 3,
          "&:last-child": { pb: 3 },
          flex: 1,
          minWidth: 0,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: 1.5 }}
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
          <Skeleton variant="rounded" height={height} />
        ) : error || empty ? (
          <Box
            sx={{
              height,
              display: "grid",
              placeItems: "center",
              color: "text.secondary",
            }}
          >
            <Stack alignItems="center" spacing={0.5}>
              <Typography fontWeight={500}>
                {error ? "Could not load data" : emptyText}
              </Typography>
              {!error && (
                <Typography variant="caption">
                  Data will appear here once available.
                </Typography>
              )}
            </Stack>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function DonutChart({ data, centerLabel = "Total" }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <Box>
      <Box sx={{ position: "relative", height: 220 }}>
        <PieChart
          height={220}
          colors={PALETTE}
          series={[
            {
              data,
              innerRadius: 66,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          slotProps={{ legend: { hidden: true } }}
          margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
              {compact(total)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {centerLabel}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        {data.map((d, i) => (
          <Stack
            key={d.id}
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: 0.75,
                bgcolor: PALETTE[i % PALETTE.length],
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {d.label}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {d.value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ width: 42, textAlign: "right" }}
            >
              {total ? `${((d.value / total) * 100).toFixed(0)}%` : "0%"}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function RatingBreakdown({ reviews, average }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Number(r.rating) === star).length,
  }));
  const total = counts.reduce((s, c) => s + c.count, 0);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2.5} sx={{ mb: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h2" fontWeight={800} lineHeight={1}>
            {average}
          </Typography>
          <Rating
            value={Number(average) || 0}
            precision={0.1}
            readOnly
            size="small"
            sx={{ mt: 0.5, color: C.amber }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            {total} reviews
          </Typography>
        </Box>
        <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
          {counts.map(({ star, count }) => (
            <Stack key={star} direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ width: 22 }}>
                {star} ★
              </Typography>
              <LinearProgress
                variant="determinate"
                value={total ? (count / total) * 100 : 0}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(C.amber, 0.15),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    bgcolor: C.amber,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 24, textAlign: "right" }}
              >
                {count}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

function PersonRow({ name, secondary, right }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 14,
          fontWeight: 700,
          bgcolor: alpha(C.sky, 0.15),
          color: C.sky,
        }}
      >
        {(name || "?").trim().charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {name}
        </Typography>
        {secondary && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {secondary}
          </Typography>
        )}
      </Box>
      {right}
    </Stack>
  );
}

/* ======================================================================
   Page
   ====================================================================== */

export default function AdminDashboard() {
  const theme = useTheme();
  const username = localStorage.getItem("username") || "Admin";

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

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
      setUpdatedAt(new Date());
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

  /* ---------- Derived data ---------- */

  const clients = useMemo(
    () => users.filter((u) => u.role === "client"),
    [users],
  );

  const avgRating = useMemo(() => {
    const rated = reviews.map((r) => Number(r.rating)).filter(Boolean);
    return rated.length
      ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1)
      : "–";
  }, [reviews]);

  const monthly = stats?.monthly || [];
  const months = monthly.map((m) => m.label);
  const hasMonthly = monthly.some((m) => m.revenue > 0 || m.purchases > 0);
  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];

  const revenueTrend = pctChange(current?.revenue, previous?.revenue);
  const purchaseTrend = pctChange(current?.purchases, previous?.purchases);

  const aovByMonth = monthly.map((m) =>
    m.purchases ? Math.round(m.revenue / m.purchases) : 0,
  );
  const aov = stats?.purchases
    ? Math.round(Number(stats.revenue || 0) / Number(stats.purchases))
    : 0;

  const sixMonthRevenue = monthly.reduce((s, m) => s + Number(m.revenue), 0);
  const bestMonth = monthly.reduce(
    (best, m) => (m.revenue > (best?.revenue ?? -1) ? m : best),
    null,
  );

  const paymentTotals = useMemo(() => {
    const list = stats?.paymentsByStatus || [];
    const total = list.reduce((s, p) => s + Number(p.count), 0);
    const captured = Number(
      list.find((p) => p.status === "captured")?.count || 0,
    );
    return { total, rate: total ? (captured / total) * 100 : 0 };
  }, [stats]);

  const signupSeries = useMemo(() => {
    const buckets = lastMonths(6);
    const counts = Object.fromEntries(buckets.map((b) => [b.key, 0]));
    clients.forEach((u) => {
      if (!u.createdAt) return;
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in counts) counts[key] += 1;
    });
    return {
      labels: buckets.map((b) => b.label),
      values: buckets.map((b) => counts[b.key]),
    };
  }, [clients]);

  const purchaseDonut = useMemo(
    () =>
      (stats?.purchasesByTemplate || []).map((t) => ({
        id: `template-${t.templateId ?? t.name}`,
        value: Number(t.purchases),
        label: t.name,
      })),
    [stats],
  );

  const paymentStatusDonut = useMemo(
    () =>
      (stats?.paymentsByStatus || []).map((s) => ({
        id: `status-${s.status}`,
        value: Number(s.count),
        label: cap(s.status),
      })),
    [stats],
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
      label: cap(status),
    }));
  }, [clients]);

  const topTemplates = stats?.revenueByTemplate || [];

  const templateRows = useMemo(() => {
    const map = new Map();
    (stats?.purchasesByTemplate || []).forEach((t) =>
      map.set(t.name, {
        name: t.name,
        purchases: Number(t.purchases) || 0,
        revenue: 0,
      }),
    );
    (stats?.revenueByTemplate || []).forEach((t) => {
      const row = map.get(t.name) || {
        name: t.name,
        purchases: 0,
        revenue: 0,
      };
      row.revenue = Number(t.revenue) || 0;
      map.set(t.name, row);
    });
    const rows = [...map.values()].sort((a, b) => b.revenue - a.revenue);
    const total = rows.reduce((s, r) => s + r.revenue, 0);
    return rows.map((r) => ({
      ...r,
      share: total ? (r.revenue / total) * 100 : 0,
    }));
  }, [stats]);

  const latestReviews = useMemo(
    () =>
      [...reviews]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 4),
    [reviews],
  );

  const recentClients = useMemo(
    () =>
      [...clients]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 4),
    [clients],
  );

  const cards = [
    {
      title: "Total Revenue",
      value: money(stats?.revenue),
      icon: <CurrencyRupeeIcon />,
      color: C.teal,
      trend: revenueTrend,
    },
    {
      title: "Templates Purchased",
      value: stats?.purchases ?? 0,
      icon: <ShoppingCartIcon />,
      color: C.sky,
      trend: purchaseTrend,
    },
    {
      title: "Avg Order Value",
      value: money(aov),
      icon: <ReceiptLongIcon />,
      color: C.indigo,
      caption: "Revenue per purchase",
    },
    {
      title: "Payment Success Rate",
      value: paymentTotals.total
        ? `${paymentTotals.rate.toFixed(1)}%`
        : "–",
      icon: <TaskAltIcon />,
      color: C.lime,
      caption: `${paymentTotals.total} total payments`,
    },
    {
      title: "Active Clients",
      value: clients.filter((u) => u.status === "active").length,
      icon: <PeopleIcon />,
      color: C.violet,
      caption: `${clients.length} clients in total`,
    },
    {
      title: "Live Sites",
      value: stats?.sites ?? 0,
      icon: <LanguageIcon />,
      color: C.orange,
      caption: "Sites currently published",
    },
    {
      title: "Templates",
      value: stats?.templates ?? 0,
      icon: <DashboardCustomizeIcon />,
      color: C.rose,
      caption: `${stats?.themes ?? 0} themes · ${stats?.pages ?? 0} pages`,
    },
    {
      title: "Average Rating",
      value: avgRating,
      icon: <StarIcon />,
      color: C.amber,
      caption: `${reviews.length} reviews`,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 500px at 8% -10%, ${alpha(C.sky, 0.1)}, transparent 60%), radial-gradient(1000px 400px at 100% 0%, ${alpha(C.teal, 0.09)}, transparent 55%)`,
        py: { xs: 3, md: 4 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        {/* Hero */}
        <Box
          sx={{
            mb: 3,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #1f5ef0 0%, #1e86c3 55%, #2f7fe0 100%)",
            boxShadow: "0 20px 40px -20px rgba(15,23,42,0.6)",
            "&::after": {
              content: '""',
              position: "absolute",
              right: -80,
              top: -80,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={3}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ opacity: 0.75, fontWeight: 600, letterSpacing: 1.5 }}
              >
                Admin Dashboard ·{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
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
                {greeting()}, {username} 👋
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                Here's what's happening across your platform.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems="stretch"
              sx={{ minWidth: 0 }}
            >
              {[
                {
                  label: "Today's revenue",
                  value: money(stats?.todayRevenue),
                },
                {
                  label: "Today's purchases",
                  value: stats?.todayPurchases ?? 0,
                },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(6px)",
                    minWidth: { xs: 0, sm: 130 },
                  }}
                >
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {loading || error ? "–" : item.value}
                  </Typography>
                </Box>
              ))}
              <Tooltip
                title={
                  updatedAt
                    ? `Last updated ${updatedAt.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Refresh data"
                }
              >
                <span>
                  <IconButton
                    onClick={() => load()}
                    disabled={loading}
                    sx={{
                      width: { xs: 44, sm: "auto" },
                      height: { xs: 44, sm: "100%" },
                      alignSelf: { xs: "flex-end", sm: "stretch" },
                      borderRadius: 2.5,
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.3)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                      "&.Mui-disabled": { color: "rgba(255,255,255,0.4)" },
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

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
              size={{ xs: 12, sm: 6, lg: 3 }}
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

        {/* Revenue trend + rating breakdown */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
            <Panel
              title="Revenue trend"
              subtitle="Captured payments · last 6 months"
              accent={C.teal}
              loading={loading}
              error={error}
              empty={!hasMonthly}
              height={340}
              action={
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={`6-mo total ${money(sixMonthRevenue)}`}
                    sx={{
                      fontWeight: 600,
                      bgcolor: alpha(C.teal, 0.12),
                      color: C.teal,
                    }}
                  />
                  {bestMonth && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Best: ${bestMonth.label}`}
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>
              }
            >
              <LineChart
                height={340}
                colors={[C.teal]}
                xAxis={[{ scaleType: "point", data: months }]}
                yAxis={[{ valueFormatter: compact }]}
                series={[
                  {
                    data: monthly.map((m) => Number(m.revenue)),
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
                  "& .MuiAreaElement-root": { fill: alpha(C.teal, 0.14) },
                }}
              />
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
            <Panel
              title="Customer satisfaction"
              subtitle="Rating distribution"
              accent={C.amber}
              loading={loading}
              error={error}
              empty={!reviews.length}
              emptyText="No reviews yet"
              height={340}
            >
              <RatingBreakdown reviews={reviews} average={avgRating} />
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 1 }}
              >
                Latest reviews
              </Typography>
              {latestReviews.map((r, i) => (
                <Box key={r.id ?? i}>
                  {i > 0 && <Divider />}
                  <PersonRow
                    name={
                      r.reviewerName ||
                      r.userName ||
                      r.name ||
                      r.username ||
                      r.user?.name ||
                      "Anonymous"
                    }
                    secondary={
                      r.description ||
                      r.comment ||
                      r.review ||
                      r.message ||
                      r.feedback ||
                      ""
                    }
                    right={
                      <Rating
                        value={Number(r.rating) || 0}
                        readOnly
                        size="small"
                        sx={{ color: C.amber }}
                      />
                    }
                  />
                </Box>
              ))}
            </Panel>
          </Grid>
        </Grid>

        {/* Monthly detail charts */}
        <Grid
          container
          spacing={{ xs: 2, md: 2.5 }}
          justifyContent={{ md: "center", lg: "flex-start" }}
          sx={{ mt: 0.5 }}
        >
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Purchases per month"
              subtitle="Captured payments count"
              accent={C.sky}
              loading={loading}
              error={error}
              empty={!hasMonthly}
            >
              <BarChart
                height={280}
                colors={[C.sky]}
                xAxis={[{ scaleType: "band", data: months }]}
                series={[
                  {
                    data: monthly.map((m) => Number(m.purchases)),
                    label: "Purchases",
                  },
                ]}
                borderRadius={6}
                grid={{ horizontal: true }}
                slotProps={{ legend: { hidden: true } }}
              />
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Average order value"
              subtitle="Revenue ÷ purchases, per month"
              accent={C.indigo}
              loading={loading}
              error={error}
              empty={!hasMonthly}
            >
              <LineChart
                height={280}
                colors={[C.indigo]}
                xAxis={[{ scaleType: "point", data: months }]}
                yAxis={[{ valueFormatter: compact }]}
                series={[
                  {
                    data: aovByMonth,
                    label: "AOV",
                    showMark: true,
                    curve: "monotoneX",
                    valueFormatter: (v) => money(v),
                  },
                ]}
                grid={{ horizontal: true }}
                slotProps={{ legend: { hidden: true } }}
                sx={{ "& .MuiLineElement-root": { strokeWidth: 3 } }}
              />
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Client sign-ups"
              subtitle="New clients · last 6 months"
              accent={C.violet}
              loading={loading}
              error={error}
              empty={!signupSeries.values.some((v) => v > 0)}
              emptyText="No sign-up dates available"
            >
              <BarChart
                height={280}
                colors={[C.violet]}
                xAxis={[{ scaleType: "band", data: signupSeries.labels }]}
                series={[{ data: signupSeries.values, label: "Sign-ups" }]}
                borderRadius={6}
                grid={{ horizontal: true }}
                slotProps={{ legend: { hidden: true } }}
              />
            </Panel>
          </Grid>
        </Grid>

        {/* Donuts */}
        <Grid
          container
          spacing={{ xs: 2, md: 2.5 }}
          justifyContent={{ md: "center", lg: "flex-start" }}
          sx={{ mt: 0.5 }}
        >
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Purchases by template"
              subtitle="Share of total purchases"
              accent={PALETTE[0]}
              loading={loading}
              error={error}
              empty={!purchaseDonut.length}
              height={380}
            >
              <DonutChart data={purchaseDonut} centerLabel="Purchases" />
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Payment status"
              subtitle="All transactions by outcome"
              accent={PALETTE[1]}
              loading={loading}
              error={error}
              empty={!paymentStatusDonut.length}
              height={380}
            >
              <DonutChart data={paymentStatusDonut} centerLabel="Payments" />
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Clients by status"
              subtitle="Account health"
              accent={PALETTE[4]}
              loading={loading}
              error={error}
              empty={!userDonut.length}
              height={380}
            >
              <DonutChart data={userDonut} centerLabel="Clients" />
            </Panel>
          </Grid>
        </Grid>

        {/* Template performance */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
            <Panel
              title="Template performance"
              subtitle="Purchases, revenue and share of total"
              accent={C.orange}
              loading={loading}
              error={error}
              empty={!templateRows.length}
            >
              <Box sx={{ overflowX: "auto", mx: -1 }}>
                <Table size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          color: "text.secondary",
                        },
                      }}
                    >
                      <TableCell>#</TableCell>
                      <TableCell>Template</TableCell>
                      <TableCell align="right">Purchases</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell sx={{ width: 170 }}>Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateRows.map((row, i) => (
                      <TableRow
                        key={row.name}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 } }}
                      >
                        <TableCell sx={{ color: "text.secondary" }}>
                          {i + 1}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.name}
                        </TableCell>
                        <TableCell align="right">{row.purchases}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {money(row.revenue)}
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={row.share}
                              sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(PALETTE[i % PALETTE.length], 0.15),
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 3,
                                  bgcolor: PALETTE[i % PALETTE.length],
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              sx={{ width: 38, textAlign: "right" }}
                            >
                              {row.share.toFixed(0)}%
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
            <Panel
              title="Top templates by revenue"
              subtitle="Best performing templates"
              accent={C.rose}
              loading={loading}
              error={error}
              empty={!topTemplates.length}
            >
              <BarChart
                height={300}
                layout="horizontal"
                colors={[C.rose]}
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
            </Panel>
          </Grid>
        </Grid>

        {/* Recent payments + new clients */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: "flex" }}>
            <Panel
              title="Recent payments"
              subtitle="Latest transactions across the platform"
              accent={C.teal}
              loading={loading}
              error={error}
              empty={!(stats?.recentPayments || []).length}
              emptyText="No payments yet"
              action={
                <Chip
                  label={`${(stats?.recentPayments || []).length} records`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1.5, fontWeight: 600 }}
                />
              }
            >
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
                    {(stats?.recentPayments || []).map((p) => (
                      <TableRow
                        key={p.id}
                        hover
                        sx={{
                          "& td": { py: 1.25 },
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.25}
                          >
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 30,
                                height: 30,
                                fontSize: 13,
                                fontWeight: 700,
                                bgcolor: alpha(C.teal, 0.14),
                                color: C.teal,
                              }}
                            >
                              {(p.templateName || "?").charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {p.templateName || "—"}
                            </Typography>
                          </Stack>
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
                          sx={{
                            whiteSpace: "nowrap",
                            color: "text.secondary",
                          }}
                        >
                          {shortDate(p.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Panel>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
            <Panel
              title="Newest clients"
              subtitle="Most recent sign-ups"
              accent={C.violet}
              loading={loading}
              error={error}
              empty={!recentClients.length}
              emptyText="No clients yet"
            >
              {recentClients.map((u, i) => (
                <Box key={u.id ?? i}>
                  {i > 0 && <Divider />}
                  <PersonRow
                    name={u.name || u.username || u.email || "Client"}
                    secondary={u.email || shortDate(u.createdAt)}
                    right={
                      <Chip
                        size="small"
                        label={u.status || "unknown"}
                        color={u.status === "active" ? "success" : "default"}
                        variant="outlined"
                        sx={{
                          textTransform: "capitalize",
                          fontWeight: 600,
                          borderRadius: 1.5,
                        }}
                      />
                    }
                  />
                </Box>
              ))}
            </Panel>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}