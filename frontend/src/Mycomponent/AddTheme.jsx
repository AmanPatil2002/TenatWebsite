import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getInitialForm = () => ({
  name: "",
  settings: "{\n  \n}",
  type: "custom",
});

const formatSettings = (settings) => {
  if (typeof settings === "string") {
    try {
      return JSON.stringify(JSON.parse(settings), null, 2);
    } catch {
      return settings;
    }
  }

  return JSON.stringify(settings ?? {}, null, 2);
};

function ThemeForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
  editing,
}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const name = formData.name.trim();
    const settingsText = formData.settings.trim();

    if (!name) errs.name = "Theme name is required";
    else if (name.length < 2 || name.length > 50) {
      errs.name = "Name must be 2–50 characters";
    }

    if (!settingsText) {
      errs.settings = "Theme settings are required";
    } else {
      try {
        JSON.parse(settingsText);
      } catch {
        errs.settings = "Enter valid JSON";
      }
    }

    if (!formData.type.trim()) errs.type = "Theme type is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      settings: JSON.parse(formData.settings),
      type: formData.type.trim(),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="name"
            label="Theme name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="settings"
            label="Theme settings (JSON)"
            multiline
            minRows={5}
            value={formData.settings}
            onChange={handleChange}
            error={!!errors.settings}
            helperText={errors.settings || "Enter valid JSON settings"}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="type"
            label="Theme type"
            value={formData.type}
            onChange={handleChange}
            error={!!errors.type}
            helperText={errors.type}
            disabled={editing}
          />
        </Grid>
        <Grid size={12}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ py: 1.25, fontSize: "0.95rem", fontWeight: "bold" }}
            >
              {submitting ? "Saving…" : submitLabel}
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                fullWidth
                disabled={submitting}
                onClick={onCancel}
                sx={{ py: 1.25, fontSize: "0.95rem" }}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function AddTheme() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [themes, setThemes] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = useCallback((message, severity = "success") => {
    setSnack({ open: true, message, severity });
  }, []);

  const fetchSites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showSnack("Please log in first.", "error");
      setLoadingSites(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/site`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const siteList = Array.isArray(response.data) ? response.data : [];
      setSites(siteList);
      setLoadingList(siteList.length > 0);
      setSiteId((currentSiteId) => {
        if (siteList.some((site) => String(site.id) === currentSiteId)) {
          return currentSiteId;
        }
        return siteList.length ? String(siteList[0].id) : "";
      });
    } catch (error) {
      showSnack(
        error.response?.data?.message || "Could not load your sites.",
        "error",
      );
    } finally {
      setLoadingSites(false);
    }
  }, [showSnack]);

  useEffect(() => {
    void Promise.resolve().then(fetchSites);
  }, [fetchSites]);

  useEffect(() => {
    if (!siteId) return undefined;

    let cancelled = false;
    const fetchThemes = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showSnack("Please log in first.", "error");
        setLoadingList(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/site/${siteId}/themes`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!cancelled) {
          setThemes(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          showSnack(
            error.response?.data?.message || "Could not load themes.",
            "error",
          );
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };

    fetchThemes();
    return () => {
      cancelled = true;
    };
  }, [siteId, showSnack]);

  const refreshThemes = async (token, fallbackMessage) => {
    try {
      const response = await axios.get(`${API_URL}/site/${siteId}/themes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setThemes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showSnack(
        error.response?.data?.message || fallbackMessage,
        "error",
      );
    }
  };

  const handleCreate = async (values) => {
    const token = localStorage.getItem("token");
    if (!token) return showSnack("Please log in first.", "error");

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/site/${siteId}/themes`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnack("Theme added successfully!");
      await refreshThemes(token, "Theme added, but themes could not be refreshed.");
    } catch (error) {
      showSnack(
        error.response?.data?.message || "Failed to add theme.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    const token = localStorage.getItem("token");
    if (!token) return showSnack("Please log in first.", "error");

    try {
      setSubmitting(true);
      await axios.put(
        `${API_URL}/site/${siteId}/themes/${editingId}`,
        { name: values.name, settings: values.settings },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showSnack("Theme updated successfully!");
      setEditingId(null);
      await refreshThemes(
        token,
        "Theme updated, but themes could not be refreshed.",
      );
    } catch (error) {
      showSnack(
        error.response?.data?.message || "Failed to update theme.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (theme) => {
    const token = localStorage.getItem("token");
    if (!token) return showSnack("Please log in first.", "error");

    try {
      setActiveId(theme.id);
      await axios.patch(
        `${API_URL}/site/${siteId}/themes/${theme.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showSnack("Theme activated.");
      await refreshThemes(
        token,
        "Theme activated, but themes could not be refreshed.",
      );
    } catch (error) {
      showSnack(
        error.response?.data?.message || "Failed to activate theme.",
        "error",
      );
    } finally {
      setActiveId(null);
    }
  };

  const editingTheme =
    editingId != null
      ? themes.find((theme) => theme.id === editingId)
      : null;

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: 1200, mx: "auto" }}>
        <Grid size={12}>
          <FormControl
            fullWidth
            size="small"
            disabled={loadingSites || submitting || activeId != null}
          >
            <InputLabel id="theme-site-label">Site</InputLabel>
            <Select
              labelId="theme-site-label"
              value={siteId}
              label="Site"
              onChange={(event) => {
                setThemes([]);
                setEditingId(null);
                setLoadingList(true);
                setSiteId(event.target.value);
              }}
            >
              {sites.map((site) => (
                <MenuItem key={site.id} value={String(site.id)}>
                  {site.siteName} ({site.subdomain})
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {loadingSites
                ? "Loading your sites…"
                : sites.length
                  ? "Choose the site whose themes you want to manage."
                  : "No sites are available for your account."}
            </FormHelperText>
          </FormControl>
        </Grid>

        {siteId && (
          <>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                  }}
                >
                  {editingTheme ? "Edit theme" : "Add theme"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Manage the themes available for this site.
                </Typography>

                <ThemeForm
                  key={`${siteId}-${editingTheme ? editingTheme.id : "new"}`}
                  initialValues={
                    editingTheme
                      ? {
                          name: editingTheme.name || "",
                          settings: formatSettings(editingTheme.settings),
                          type: editingTheme.type || "custom",
                        }
                      : getInitialForm()
                  }
                  submitLabel={editingTheme ? "Save changes" : "Add theme"}
                  onSubmit={editingTheme ? handleUpdate : handleCreate}
                  onCancel={
                    editingTheme ? () => setEditingId(null) : undefined
                  }
                  submitting={submitting}
                  editing={!!editingTheme}
                />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  Existing themes
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {loadingList ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : themes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No themes yet. Add your first theme using the form.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Settings</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {themes.map((theme) => {
                          const isActive = Number(theme.isActive) === 1;
                          return (
                            <TableRow
                              key={theme.id}
                              hover
                              selected={editingId === theme.id}
                            >
                              <TableCell>{theme.name}</TableCell>
                              <TableCell>{theme.type}</TableCell>
                              <TableCell sx={{ maxWidth: 220 }}>
                                <Box
                                  component="pre"
                                  sx={{
                                    m: 0,
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {formatSettings(theme.settings)}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {isActive ? "Active" : "Inactive"}
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Edit">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => setEditingId(theme.id)}
                                      disabled={
                                        submitting || activeId === theme.id
                                      }
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip
                                  title={isActive ? "Active theme" : "Activate"}
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleActivate(theme)}
                                      disabled={
                                        isActive ||
                                        submitting ||
                                        activeId === theme.id
                                      }
                                    >
                                      {activeId === theme.id ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <CheckIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
