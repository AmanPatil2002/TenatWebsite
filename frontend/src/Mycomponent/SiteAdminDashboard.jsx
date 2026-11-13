import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

/* ------------------------------------------------------------------ */
/*  Resource metadata — mirrors RESOURCE_CONFIG in SiteAdminData       */
/* ------------------------------------------------------------------ */
const RESOURCE_META = {
  students: {
    label: "Students",
    color: "#1976d2",
  },
  teachers: {
    label: "Teachers",
    color: "#2e7d32",
  },
  classes: {
    label: "Classes",
    color: "#6a1b9a",
  },
  departments: {
    label: "Departments",
    color: "#c62828",
  },
  doctors: {
    label: "Doctors",
    color: "#00695c",
  },
  productcategories: {
    label: "Product categories",
    color: "#ef6c00",
  },
  products: {
    label: "Products",
    color: "#4527a0",
  },
  menucategories: {
    label: "Menu categories",
    color: "#ad1457",
  },
  menuitems: {
    label: "Menu items",
    color: "#3e2723",
  },
};

const RESOURCE_ORDER = [
  "students",
  "teachers",
  "classes",
  "departments",
  "doctors",
  "productcategories",
  "products",
  "menucategories",
  "menuitems",
];

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */
const SvgIcon = ({ children, size = 22, color = "currentColor" }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    sx={{
      width: size,
      height: size,
      display: "block",
      color,
      flexShrink: 0,
    }}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Box>
);

const PagesIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v6h6" />
    <path d="M8 13h8M8 17h5" />
  </SvgIcon>
);

const EmployeesIcon = (props) => (
  <SvgIcon {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 14.2a6 6 0 0 1 4 5.8" />
  </SvgIcon>
);

const RefreshIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 4v5h-5" />
  </SvgIcon>
);

const CalendarIcon = (props) => (
  <SvgIcon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </SvgIcon>
);

const LayersIcon = (props) => (
  <SvgIcon {...props}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 18 9 5 9-5" />
  </SvgIcon>
);

const PaletteIcon = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);

const IdIcon = (props) => (
  <SvgIcon {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M14 10h5M14 14h5" />
  </SvgIcon>
);

const DatabaseIcon = (props) => (
  <SvgIcon {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </SvgIcon>
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

function SummaryCard({ title, value, caption, icon, accent }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        borderColor: alpha(accent, 0.25),
        background: `linear-gradient(180deg, ${alpha(accent, 0.06)} 0%, ${
          theme.palette.background.paper
        } 70%)`,
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(accent, 0.18)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              color="text.secondary"
              variant="body2"
              fontWeight={600}
              sx={{ textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 1, lineHeight: 1.1 }}>
              {value}
            </Typography>
            <Typography color="text.secondary" variant="caption" component="div" sx={{ mt: 0.5 }}>
              {caption}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(accent, 0.12),
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailItem({ icon, label, value }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography color="text.secondary" variant="caption" component="div">
          {label}
        </Typography>
        <Typography fontWeight={600} variant="body2" noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SiteAdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    site,
    pages = [],
    siteError,
    reloadSite,
    baseUrl,
    authConfig,
    siteBasePath,
  } = useOutletContext();

  const [employees, setEmployees] = useState(null);
  const [resourceCounts, setResourceCounts] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const [countsError, setCountsError] = useState("");

  /* -------------------- data fetchers -------------------- */
  const fetchEmployees = useCallback(
    async (signal) => {
      const { data } = await axios.get(`${baseUrl}/employees`, {
        ...authConfig,
        signal,
      });
      return Array.isArray(data) ? data : [];
    },
    [authConfig, baseUrl],
  );

  const fetchResourceCounts = useCallback(
    async (signal) => {
      // 1. Discover which data tables exist for this site
      const { data } = await axios.get(`${baseUrl}/data`, {
        ...authConfig,
        signal,
      });
      const available = Array.isArray(data)
        ? data.filter((name) => RESOURCE_META[name])
        : [];

      // 2. Fetch each list in parallel (tolerate individual failures)
      const results = await Promise.allSettled(
        available.map((name) =>
          axios.get(`${baseUrl}/data/${name}`, {
            ...authConfig,
            signal,
          }),
        ),
      );

      if (signal?.aborted) return {};

      const counts = {};
      results.forEach((result, i) => {
        const name = available[i];
        if (result.status === "fulfilled") {
          const rows = result.value.data;
          counts[name] = Array.isArray(rows) ? rows.length : 0;
        } else {
          counts[name] = 0;
        }
      });
      return counts;
    },
    [authConfig, baseUrl],
  );

  /* -------------------- initial load -------------------- */
  useEffect(() => {
    const controller = new AbortController();

    fetchEmployees(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setEmployees(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setEmployees([]);
          setEmployeesError(
            error.response?.data?.message || "Could not load site employees.",
          );
        }
      });

    fetchResourceCounts(controller.signal)
      .then((counts) => {
        if (!controller.signal.aborted) setResourceCounts(counts);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResourceCounts({});
          setCountsError(
            error.response?.data?.message || "Could not load site data counts.",
          );
        }
      });

    return () => controller.abort();
  }, [fetchEmployees, fetchResourceCounts]);

  /* -------------------- derived values -------------------- */
  const employeesLoading = employees === null;
  const activeEmployees = (employees || []).filter(
    (employee) => employee.status === "active",
  ).length;

  // Only resources the admin has actually populated (count > 0),
  // sorted by RESOURCE_ORDER for a stable layout.
  const populatedResources = useMemo(() => {
    if (!resourceCounts) return [];
    return Object.entries(resourceCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => {
        const ai = RESOURCE_ORDER.indexOf(a[0]);
        const bi = RESOURCE_ORDER.indexOf(b[0]);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
  }, [resourceCounts]);

  const countsLoading = resourceCounts === null;
  const totalRecords = populatedResources.reduce(
    (sum, [, count]) => sum + count,
    0,
  );

  /* -------------------- refresh handler -------------------- */
  const refresh = async () => {
    setRefreshing(true);
    setEmployeesError("");
    setCountsError("");
    try {
      const [, employeeData, countsData] = await Promise.all([
        reloadSite(),
        fetchEmployees(),
        fetchResourceCounts(),
      ]);
      setEmployees(employeeData);
      setResourceCounts(countsData);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Could not refresh dashboard.";
      setEmployeesError(msg);
      setCountsError(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const goToData = () => navigate(`${siteBasePath}/data`);

  /* -------------------- render -------------------- */
  return (
    <Stack spacing={3}>
      {/* ---------- Page header ---------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Site dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Overview of{" "}
            <Box component="span" fontWeight={600} color="text.primary">
              {site?.siteName || "your site"}
            </Box>
            .
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={refresh}
          disabled={employeesLoading || refreshing}
          startIcon={
            employeesLoading || refreshing ? (
              <CircularProgress size={16} thickness={5} />
            ) : (
              <RefreshIcon size={18} />
            )
          }
          sx={{ borderRadius: 2, alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          Refresh
        </Button>
      </Stack>

      {siteError && <Alert severity="error">{siteError}</Alert>}
      {employeesError && <Alert severity="error">{employeesError}</Alert>}
      {countsError && <Alert severity="error">{countsError}</Alert>}

      {/* ---------- KPI cards ---------- */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <SummaryCard
            title="Pages"
            value={pages.length}
            caption="Pages on this site"
            accent={theme.palette.primary.main}
            icon={<PagesIcon size={22} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <SummaryCard
            title="Employees"
            value={employeesLoading ? "…" : employees.length}
            caption={
              employeesLoading ? "Loading employees" : `${activeEmployees} active`
            }
            accent={theme.palette.success.main}
            icon={<EmployeesIcon size={22} />}
          />
        </Grid>

        {/* Only show a Data KPI when the admin has actually added records */}
        {!countsLoading && populatedResources.length > 0 && (
          <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
            <SummaryCard
              title="Data records"
              value={totalRecords}
              caption={`Across ${populatedResources.length} table${
                populatedResources.length === 1 ? "" : "s"
              }`}
              accent={theme.palette.info.main}
              icon={<DatabaseIcon size={22} />}
            />
          </Grid>
        )}

        {/* Placeholder while counts are still loading */}
        {countsLoading && (
          <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                minHeight: 120,
              }}
            >
              <CircularProgress size={28} />
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ---------- Site details ---------- */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <IdIcon size={18} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Site details
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<LayersIcon size={18} />}
                label="Template category"
                value={site?.categoryName || "—"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<PaletteIcon size={18} />}
                label="Theme"
                value={site?.themeName || "—"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<IdIcon size={18} />}
                label="Site ID"
                value={site?.siteId || "—"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<CalendarIcon size={18} />}
                label="Expires"
                value={formatDate(site?.expiresAt)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ---------- Your data (only populated resources) ---------- */}
      {!countsLoading && populatedResources.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                    }}
                  >
                    <DatabaseIcon size={18} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    Your data
                  </Typography>
                </Stack>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  {totalRecords} record{totalRecords === 1 ? "" : "s"} across{" "}
                  {populatedResources.length} table
                  {populatedResources.length === 1 ? "" : "s"}.
                </Typography>
              </Box>
              <Button
                variant="contained"
                disableElevation
                onClick={goToData}
                sx={{ borderRadius: 2 }}
              >
                Manage data
              </Button>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={2}>
              {populatedResources.map(([name, count]) => {
                const meta = RESOURCE_META[name];
                return (
                  <Grid key={name} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      variant="outlined"
                      onClick={goToData}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        borderColor: alpha(meta.color, 0.25),
                        transition:
                          "transform .18s ease, box-shadow .18s ease, background-color .18s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          bgcolor: alpha(meta.color, 0.04),
                          boxShadow: `0 8px 20px ${alpha(meta.color, 0.15)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight={600}
                              noWrap
                            >
                              {meta.label}
                            </Typography>
                            <Typography
                              variant="h5"
                              fontWeight={800}
                              sx={{ color: meta.color, mt: 0.25 }}
                            >
                              {count}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${count} record${count === 1 ? "" : "s"}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(meta.color, 0.4),
                              color: meta.color,
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ---------- Empty-state hint ---------- */}
      {!countsLoading && populatedResources.length === 0 && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderStyle: "dashed",
            bgcolor: alpha(theme.palette.info.main, 0.02),
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 1.5,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
              }}
            >
              <DatabaseIcon size={26} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              No data yet
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ maxWidth: 420, mx: "auto", mb: 2 }}
            >
              Once you add records in <strong>Site data</strong>, a summary of
              each populated table will appear here.
            </Typography>
            <Button
              variant="contained"
              disableElevation
              onClick={goToData}
              sx={{ borderRadius: 2 }}
            >
              Go to Site data
            </Button>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}