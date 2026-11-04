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
} from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PagesOutlinedIcon from "@mui/icons-material/PagesOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";

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

function SummaryCard({ title, value, caption, icon }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
              {value}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {caption}
            </Typography>
          </Box>
          {icon}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function SiteAdminDashboard() {
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Site dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Overview of {site?.siteName || "your site"}.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={
            employeesLoading || refreshing ? (
              <CircularProgress size={16} />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={refresh}
          disabled={employeesLoading || refreshing}
        >
          Refresh
        </Button>
      </Stack>

      {siteError && <Alert severity="error">{siteError}</Alert>}
      {employeesError && <Alert severity="error">{employeesError}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <SummaryCard
            title="Pages"
            value={pages.length}
            caption="Pages on this site"
            icon={<PagesOutlinedIcon color="primary" />}
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
            icon={<GroupsOutlinedIcon color="primary" />}
          />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            Site details
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="body2">
                Template category
              </Typography>
              <Typography fontWeight={600}>
                {site?.categoryName || "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="body2">
                Theme
              </Typography>
              <Typography fontWeight={600}>
                {site?.themeName || "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="body2">
                Site ID
              </Typography>
              <Typography fontWeight={600}>{site?.siteId || "—"}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="body2">
                Expires
              </Typography>
              <Typography fontWeight={600}>
                {formatDate(site?.expiresAt)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.5}
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
            <Stack direction="row" spacing={1}>
              <Button onClick={() => navigate(`${siteBasePath}/manage`)}>
                Manage pages
              </Button>
              <Button onClick={() => navigate(`${siteBasePath}/employees`)}>
                Employees
              </Button>
            </Stack>
          </Stack>

          {pages.length ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Page</TableCell>
                    {/* <TableCell align="right">Entries</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.sitePageId}>
                      <TableCell>
                        <Typography fontWeight={600}>{page.title}</Typography>
                      </TableCell>
                      {/* <TableCell align="right">
                        <Chip
                          size="small"
                          label={(page.entries || []).length}
                          variant="outlined"
                        />
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No pages have been added to this site yet.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
