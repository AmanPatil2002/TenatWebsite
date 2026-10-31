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
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Site admin access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email a site-specific login. The recipient can edit and create pages
            for that purchased site, but cannot change its theme.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search sites, owners, emails..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: "100%", sm: 300 } }}
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 560 }}>
            <Table stickyHeader size="medium" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellSx}>Site</TableCell>
                  <TableCell sx={headCellSx}>Purchased by</TableCell>
                  <TableCell sx={headCellSx}>Template</TableCell>
                  <TableCell sx={headCellSx}>Expires</TableCell>
                  <TableCell sx={headCellSx}>Status</TableCell>
                  <TableCell sx={headCellSx}>Site-admin email</TableCell>
                  <TableCell sx={headCellSx} align="right">
                    Access
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleSites.map((site) => {
                  const active = site.currentStatus === "active";
                  return (
                    <TableRow key={site.siteId} hover>
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

                      <TableCell>{site.templateName || "—"}</TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(site.expiresAt)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={site.currentStatus || "unknown"}
                          color={statusColor(site.currentStatus)}
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>

                      <TableCell>
                        {site.siteAdminEmail ? (
                          <Typography variant="body2">
                            {site.siteAdminEmail}
                          </Typography>
                        ) : (
                          <Chip size="small" label="Not granted" />
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          variant={site.siteAdminEmail ? "outlined" : "contained"}
                          disabled={!active}
                          onClick={() => openDialog(site)}
                        >
                          {site.siteAdminEmail ? "Resend / update" : "Grant access"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!visibleSites.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        {sites.length
                          ? "No sites match your search."
                          : "No captured purchases found."}
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

      <Dialog
        open={Boolean(selectedSite)}
        onClose={() => !sending && setSelectedSite(null)}
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={sendCredentials}>
          <DialogTitle>Grant page-management access</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A generated password will be emailed for{" "}
              <strong>{selectedSite?.siteName}</strong>. Sending again replaces
              the previous password.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              label="Client admin email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              inputProps={{ maxLength: 190 }}
              required
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSelectedSite(null)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={sending}>
              {sending ? "Sending..." : "Email login"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}