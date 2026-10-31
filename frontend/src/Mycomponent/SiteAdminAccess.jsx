import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

export default function SiteAdminAccess() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Site admin access
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Email a site-specific login. The recipient can edit and create pages for
        that purchased site, but cannot change its theme.
      </Typography>
      {error && !selectedSite && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Site</TableCell>
                <TableCell>Purchased by</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Site-admin email</TableCell>
                <TableCell align="right">Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sites.map((site) => {
                const active = site.currentStatus === "active";
                return (
                  <TableRow key={site.siteId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {site.siteName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Site #{site.siteId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {site.ownerName}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {site.ownerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>{site.templateName}</TableCell>
                    <TableCell>{formatDate(site.expiresAt)}</TableCell>
                    <TableCell>{site.siteAdminEmail || "Not granted"}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!active}
                        onClick={() => openDialog(site)}
                      >
                        {site.siteAdminEmail ? "Resend / update" : "Grant access"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!sites.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No captured purchases found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
