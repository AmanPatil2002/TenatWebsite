import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const statusColor = (status) => {
  if (status === "active") return "success";
  if (status === "expired") return "error";
  return "default";
};

const headCellSx = {
  fontWeight: 700,
  whiteSpace: "nowrap",
  color: "text.secondary",
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: 0.5,
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
};

export default function SiteAdminAccess() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const token = getToken();
    let cancelled = false;
    axios
      .get(`${API_URL}/sites/admin/sites`, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(({ data }) => {
        if (!cancelled) setSites(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              (token ? "Could not load purchased sites." : "Please log in first."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSites = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((site) =>
      [
        site.siteName,
        site.ownerName,
        site.ownerEmail,
        site.templateName,
        site.siteAdminEmail,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [sites, search]);

  const visibleSites = filteredSites.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const openDialog = (site) => {
    setSelectedSite(site);
    setEmail(site.siteAdminEmail || site.ownerEmail || "");
    setError("");
    setNotice("");
  };

  const sendCredentials = async (event) => {
    event.preventDefault();
    if (!selectedSite || sending) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.post(
        `${API_URL}/sites/admin/sites/${selectedSite.siteId}/credentials`,
        { email: email.trim() },
        { headers: { Authorization: "Bearer " + getToken() } },
      );
      setNotice(data.message || "Site-admin credentials emailed.");
      setSites((current) =>
        current.map((site) =>
          site.siteId === selectedSite.siteId
            ? { ...site, siteAdminEmail: email.trim() }
            : site,
        ),
      );
      setSelectedSite(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not send site-admin credentials.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        {/* Page header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <AdminPanelSettingsOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Site Admin Access
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email a site-specific login. The recipient can edit and create
                pages for that purchased site, but cannot change its theme.
              </Typography>
            </Box>
          </Stack>

          <TextField
            size="small"
            placeholder="Search sites, owners, emails..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 320 }, bgcolor: "background.paper" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {error && !selectedSite && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 1.5 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}
        {notice && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: 1.5 }}
            onClose={() => setNotice("")}
          >
            {notice}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <TableContainer sx={{ maxHeight: 620 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Site</TableCell>
                    <TableCell sx={headCellSx}>Purchased by</TableCell>
                    <TableCell sx={headCellSx}>Expires</TableCell>
                    <TableCell sx={headCellSx}>Status</TableCell>
                    <TableCell sx={headCellSx}>Site-admin email</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 160 }} align="right">
                      Access
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleSites.map((site) => {
                    const active = site.currentStatus === "active";
                    return (
                      <TableRow
                        key={site.siteId}
                        hover
                        sx={{ "& td": { verticalAlign: "middle", py: 1.75 } }}
                      >
                        <TableCell sx={{ minWidth: 180 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {site.siteName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Site #{site.siteId}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 220 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: 13,
                                bgcolor: "primary.main",
                              }}
                            >
                              {getInitials(site.ownerName)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {site.ownerName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                display="block"
                              >
                                {site.ownerEmail}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(site.expiresAt)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={site.currentStatus || "unknown"}
                            color={statusColor(site.currentStatus)}
                            variant="outlined"
                            sx={{ textTransform: "capitalize", fontWeight: 600 }}
                          />
                        </TableCell>

                        <TableCell sx={{ maxWidth: 240 }}>
                          {site.siteAdminEmail ? (
                            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                              {site.siteAdminEmail}
                            </Typography>
                          ) : (
                            <Chip
                              size="small"
                              label="Not granted"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Button
                            size="small"
                            variant={site.siteAdminEmail ? "outlined" : "contained"}
                            disableElevation
                            disabled={!active}
                            startIcon={<VpnKeyOutlinedIcon fontSize="small" />}
                            onClick={() => openDialog(site)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: 1.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {site.siteAdminEmail ? "Resend / update" : "Grant access"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!visibleSites.length && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {sites.length ? "No matching sites" : "No sites found"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {sites.length
                            ? "Try a different search term."
                            : "Captured purchases will appear here."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredSites.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: 1, borderColor: "divider" }}
            />
          </Paper>
        )}
      </Box>

      {/* Grant access dialog */}
      <Dialog
        open={Boolean(selectedSite)}
        onClose={() => !sending && setSelectedSite(null)}
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={sendCredentials}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1, pr: 6 }}>
            Grant page-management access
            <IconButtonLikeClose
              disabled={sending}
              onClose={() => setSelectedSite(null)}
            />
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2.5 }}>
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon fontSize="small" />}
              sx={{ mb: 2.5, borderRadius: 1.5, alignItems: "flex-start" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {selectedSite?.siteName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A generated password will be emailed to the address below.
                Sending again replaces the previous password.
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
                {error}
              </Alert>
            )}

            <TextField
              autoFocus
              label="Client admin email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 190 } }}
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
            <Button
              onClick={() => setSelectedSite(null)}
              disabled={sending}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={sending}
              startIcon={
                sending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <VpnKeyOutlinedIcon fontSize="small" />
                )
              }
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
            >
              {sending ? "Sending…" : "Email login"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

/* Small close button for the dialog title (kept out of the icon-button
   trap by using a plain styled Box, not an MUI Tooltip/IconButton combo). */
function IconButtonLikeClose({ onClose, disabled }) {
  return (
    <Box
      component="button"
      type="button"
      aria-label="Close dialog"
      onClick={onClose}
      disabled={disabled}
      sx={{
        position: "absolute",
        right: 12,
        top: 12,
        border: 0,
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "text.secondary",
        display: "grid",
        placeItems: "center",
        p: 0.5,
        borderRadius: 1,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <CloseIcon fontSize="small" />
    </Box>
  );
}