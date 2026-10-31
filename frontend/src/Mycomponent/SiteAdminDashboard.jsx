import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PagesOutlinedIcon from "@mui/icons-material/PagesOutlined";

function SummaryCard({ title, value, caption, icon, onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{ p: 2.5, height: "100%", cursor: onClick ? "pointer" : "default" }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.50", color: "primary.main" }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value || "—"}
      </Typography>
    </Stack>
  );
}

export default function SiteAdminDashboard() {
  const { site, pages, siteError, baseUrl, authConfig, siteBasePath } =
    useOutletContext();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      axios.get(`${baseUrl}/employees`, authConfig),
      axios.get(`${baseUrl}/entries`, authConfig),
    ])
      .then(([employeeResponse, entryResponse]) => {
        if (cancelled) return;
        setEmployees(Array.isArray(employeeResponse.data) ? employeeResponse.data : []);
        setEntries(Array.isArray(entryResponse.data) ? entryResponse.data : []);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message || "Could not load dashboard data.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baseUrl, authConfig]);

  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const activeEntries = entries.filter((e) => e.status === "active").length;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700}>
        Site dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        A quick overview of {site?.siteName || "your site"}.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        You can manage this site’s pages, employees, and page data. The purchased
        theme is fixed and cannot be changed here.
      </Alert>
      {(siteError || error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {siteError || error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SummaryCard
                title="Site pages"
                value={pages.length}
                caption="Purchased and custom pages"
                icon={<PagesOutlinedIcon />}
                onClick={() => navigate(`${siteBasePath}/manage`)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SummaryCard
                title="Employees"
                value={employees.length}
                caption={`${activeEmployees} active`}
                icon={<GroupsOutlinedIcon />}
                onClick={() => navigate(`${siteBasePath}/employees`)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SummaryCard
                title="Business data"
                value={entries.length}
                caption={`${activeEntries} active`}
                icon={<Inventory2OutlinedIcon />}
                onClick={() => navigate(`${siteBasePath}/page-data`)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Site details
                </Typography>
                <InfoRow label="Site name" value={site?.siteName} />
                <Divider />
                <InfoRow label="Category" value={site?.categoryName} />
                <Divider />
                <InfoRow label="Purchased theme" value={site?.themeName ? `${site.themeName} (locked)` : ""} />
                <Divider />
                <InfoRow label="Site ID" value={site?.siteId ? `#${site.siteId}` : ""} />
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined" onClick={() => navigate(`${siteBasePath}/preview`)}>
                    Preview site
                  </Button>
                  <Button size="small" variant="contained" onClick={() => navigate(`${siteBasePath}/manage`)}>
                    Manage pages
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Your pages
                </Typography>
                {pages.length ? (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {pages.map((page) => (
                      <Chip key={page.sitePageId} label={page.title} variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No pages yet. Go to Manage pages to add one.
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Latest employees
                </Typography>
                {employees.slice(0, 4).map((employee) => (
                  <Typography key={employee.id} variant="body2" sx={{ py: 0.25 }}>
                    {employee.name}{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      · {employee.jobTitle}
                    </Typography>
                  </Typography>
                ))}
                {!employees.length && (
                  <Typography variant="body2" color="text.secondary">
                    No employees added yet.
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Latest page data
                </Typography>
                {entries.slice(0, 4).map((entry) => (
                  <Typography key={entry.id} variant="body2" sx={{ py: 0.25 }}>
                    {entry.name}{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      · {entry.pageTitle}
                    </Typography>
                  </Typography>
                ))}
                {!entries.length && (
                  <Typography variant="body2" color="text.secondary">
                    No business data added yet.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}