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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (avoids any MUI icon import / tree-shaking issue) */
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
  const [refreshing, setRefreshing] = useState(false);
  const [employeesError, setEmployeesError] = useState("");

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
    return () => controller.abort();
  }, [fetchEmployees]);

  const entries = useMemo(
    () => pages.flatMap((page) => page.entries || []),
    [pages],
  );
  const employeesLoading = employees === null;
  const activeEmployees = (employees || []).filter(
    (employee) => employee.status === "active",
  ).length;

  const refresh = async () => {
    setRefreshing(true);
    setEmployeesError("");
    try {
      const [, employeeData] = await Promise.all([
        reloadSite(),
        fetchEmployees(),
      ]);
      setEmployees(employeeData);
    } catch (error) {
      setEmployeesError(
        error.response?.data?.message || "Could not load site employees.",
      );
    } finally {
      setRefreshing(false);
    }
  };

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
              employeesLoading
                ? "Loading employees"
                : `${activeEmployees} active`
            }
            accent={theme.palette.success.main}
            icon={<EmployeesIcon size={22} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
          <SummaryCard
            title="Entries"
            value={employeesLoading ? "…" : entries.length}
            caption="Total content entries"
            accent={theme.palette.info.main}
            icon={<LayersIcon size={22} />}
          />
        </Grid>
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

      {/* ---------- Pages table ---------- */}
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
              <Typography variant="h6" fontWeight={700}>
                Your pages
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Manage the pages and content available on this site.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                disableElevation
                onClick={() => navigate(`${siteBasePath}/manage`)}
                sx={{ borderRadius: 2 }}
              >
                Manage pages
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`${siteBasePath}/employees`)}
                sx={{ borderRadius: 2 }}
              >
                Employees
              </Button>
            </Stack>
          </Stack>

          {pages.length ? (
            <Box
              sx={{
                overflowX: "auto",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Table size="small" sx={{ minWidth: 420 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Page</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>
                      Entries
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow
                      key={page.sitePageId}
                      hover
                      sx={{ "&:last-child td": { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: 1.5,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: theme.palette.primary.main,
                              flexShrink: 0,
                            }}
                          >
                            <PagesIcon size={16} />
                          </Box>
                          <Typography fontWeight={600} variant="body2" noWrap>
                            {page.title}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={(page.entries || []).length}
                          variant="outlined"
                          sx={{ fontWeight: 600, minWidth: 40 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box
              sx={{
                py: 5,
                px: 2,
                textAlign: "center",
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mx: "auto",
                  mb: 1.5,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              >
                <PagesIcon size={24} />
              </Box>
              <Typography fontWeight={600}>No pages yet</Typography>
              <Typography color="text.secondary" variant="body2">
                No pages have been added to this site yet.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}