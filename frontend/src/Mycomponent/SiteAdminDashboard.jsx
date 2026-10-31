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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PagesOutlinedIcon from "@mui/icons-material/PagesOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/* ---------- Reusable pieces ---------- */

function StatCard({ title, value, caption, icon, color = "primary", onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={(theme) => ({
        p: 2.5,
        height: "100%",
        cursor: "pointer",
        transition: "all .2s ease",
        "&:hover": {
          borderColor: theme.palette[color].main,
          boxShadow: `0 4px 16px ${alpha(theme.palette[color].main, 0.15)}`,
          transform: "translateY(-2px)",
        },
      })}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 0.8, lineHeight: 1.5 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ lineHeight: 1.2, my: 0.5 }}
          >
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        </Box>
        <Avatar
          variant="rounded"
          sx={(theme) => ({
            width: 52,
            height: 52,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
          })}
        >
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );
}

function SectionCard({ title, subtitle, actionLabel, onAction, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ px: 2.5, py: 2 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actionLabel && (
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={onAction}
            sx={{ flexShrink: 0 }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
      <Divider />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Paper>
  );
}

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ flexGrow: 1, py: 5, px: 2, textAlign: "center" }}
    >
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {actionLabel && (
        <Button size="small" variant="outlined" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ px: 2.5, py: 1.5 }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right" noWrap>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

/* ---------- Page ---------- */

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
        setEmployees(
          Array.isArray(employeeResponse.data) ? employeeResponse.data : [],
        );
        setEntries(Array.isArray(entryResponse.data) ? entryResponse.data : []);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Could not load dashboard data.",
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
  const go = (path) => () => navigate(`${siteBasePath}/${path}`);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Banner */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: { xs: 3, md: 4 },
          mb: 3,
          color: "common.white",
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        })}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={3}
        >
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="overline"
              sx={{ opacity: 0.8, letterSpacing: 1 }}
            >
              Site dashboard
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1.5 }}>
              {site?.siteName || "Your site"}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {site?.categoryName && (
                <Chip
                  size="small"
                  label={site.categoryName}
                  sx={{
                    bgcolor: "rgba(255,255,255,.18)",
                    color: "common.white",
                  }}
                />
              )}
              {site?.themeName && (
                <Chip
                  size="small"
                  icon={
                    <LockOutlinedIcon sx={{ color: "inherit !important" }} />
                  }
                  label={`Theme: ${site.themeName}`}
                  sx={{
                    bgcolor: "rgba(255,255,255,.18)",
                    color: "common.white",
                  }}
                />
              )}
            </Stack>
          </Box>

          <Button
            variant="outlined"
            startIcon={<PreviewOutlinedIcon />}
            onClick={go("preview")}
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "flex-end", sm: "center" },
              color: "common.white",
              borderColor: "rgba(255,255,255,.6)",
              "&:hover": {
                borderColor: "common.white",
                bgcolor: "rgba(255,255,255,.1)",
              },
            }}
          >
            Preview site
          </Button>
        </Stack>
      </Paper>

      {(siteError || error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {siteError || error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Stats */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                title="Site pages"
                value={pages.length}
                caption="Purchased and custom pages"
                icon={<PagesOutlinedIcon />}
                color="primary"
                onClick={go("manage")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                title="Employees"
                value={employees.length}
                caption={`${activeEmployees} active`}
                icon={<GroupsOutlinedIcon />}
                color="success"
                onClick={go("employees")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                title="Business data"
                value={entries.length}
                caption={`${activeEntries} active`}
                icon={<Inventory2OutlinedIcon />}
                color="warning"
                onClick={go("page-data")}
              />
            </Grid>
          </Grid>
          <br/><br/>
          {/* Pages + Site details */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="Your pages"
                subtitle="In the order they appear on your site"
                actionLabel="Manage"
                onAction={go("manage")}
              >
                {pages.length ? (
                  <List disablePadding>
                    {pages.slice(0, 6).map((page, index) => (
                      <Box key={page.sitePageId}>
                        {index > 0 && <Divider component="li" />}
                        <ListItem sx={{ px: 2.5, py: 1.25 }}>
                          <ListItemAvatar sx={{ minWidth: 48 }}>
                            <Avatar
                              sx={(theme) => ({
                                width: 32,
                                height: 32,
                                fontSize: 14,
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.12,
                                ),
                                color: "primary.main",
                              })}
                            >
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={page.title}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              noWrap: true,
                            }}
                          />
                        </ListItem>
                      </Box>
                    ))}
                    {pages.length > 6 && (
                      <>
                        <Divider />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ px: 2.5, py: 1.5 }}
                        >
                          +{pages.length - 6} more pages
                        </Typography>
                      </>
                    )}
                  </List>
                ) : (
                  <EmptyState
                    message="No pages yet."
                    actionLabel="Add a page"
                    onAction={go("manage")}
                  />
                )}
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Site details">
                <InfoRow label="Site name" value={site?.siteName} />
                <Divider />
                <InfoRow label="Category" value={site?.categoryName} />
                <Divider />
                <InfoRow label="Theme" value={site?.themeName} />
                <Divider />
                <Box sx={{ px: 2.5, py: 2, mt: "auto" }}>
                  <Alert
                    severity="info"
                    icon={<LockOutlinedIcon fontSize="small" />}
                    sx={{ py: 0 }}
                  >
                    The purchased theme is fixed and can’t be changed here.
                  </Alert>
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          {/* Employees + Page data */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="Latest employees"
                subtitle={`${employees.length} total`}
                actionLabel="View all"
                onAction={go("employees")}
              >
                {employees.length ? (
                  <List disablePadding>
                    {employees.slice(0, 5).map((employee, index) => (
                      <Box key={employee.id}>
                        {index > 0 && <Divider component="li" />}
                        <ListItem
                          sx={{ px: 2.5, py: 1.25 }}
                          secondaryAction={
                            <Chip
                              size="small"
                              label={employee.status}
                              color={
                                employee.status === "active"
                                  ? "success"
                                  : "default"
                              }
                              variant="outlined"
                            />
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              {getInitials(employee.name)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={employee.name}
                            secondary={employee.jobTitle}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              noWrap: true,
                            }}
                            secondaryTypographyProps={{ noWrap: true }}
                            sx={{ pr: 8 }}
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                ) : (
                  <EmptyState
                    message="No employees added yet."
                    actionLabel="Add employee"
                    onAction={go("employees")}
                  />
                )}
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="Latest page data"
                subtitle={`${entries.length} total`}
                actionLabel="View all"
                onAction={go("page-data")}
              >
                {entries.length ? (
                  <List disablePadding>
                    {entries.slice(0, 5).map((entry, index) => (
                      <Box key={entry.id}>
                        {index > 0 && <Divider component="li" />}
                        <ListItem
                          sx={{ px: 2.5, py: 1.25 }}
                          secondaryAction={
                            <Typography variant="body2" fontWeight={600}>
                              {entry.price != null && entry.price !== ""
                                ? entry.price
                                : ""}
                            </Typography>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              variant="rounded"
                              sx={(theme) => ({
                                bgcolor: alpha(
                                  theme.palette.warning.main,
                                  0.12,
                                ),
                                color: "warning.main",
                              })}
                            >
                              <Inventory2OutlinedIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={entry.name}
                            secondary={entry.pageTitle}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              noWrap: true,
                            }}
                            secondaryTypographyProps={{ noWrap: true }}
                            sx={{ pr: 8 }}
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                ) : (
                  <EmptyState
                    message="No business data added yet."
                    actionLabel={pages.length ? "Add data" : undefined}
                    onAction={go("page-data")}
                  />
                )}
              </SectionCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
