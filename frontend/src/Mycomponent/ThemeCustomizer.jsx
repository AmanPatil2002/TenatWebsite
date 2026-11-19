import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  FormHelperText,
} from "@mui/material";
import { Refresh, Save, Delete } from "@mui/icons-material";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const getAuthToken = () =>
  localStorage.getItem("siteAdminToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const ThemeCustomizer = ({ siteId, onClose, isAdminContext = false }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTheme, setActiveTheme] = useState("default");
  const [defaultTheme, setDefaultTheme] = useState({});
  const [customTheme, setCustomTheme] = useState(null);

  const [editConfig, setEditConfig] = useState({});

  const apiBase = `${API_URL}/sites/client-admin/${siteId}/theme`;

  const showToast = (msg, severity) => {
    if (severity === "error") setError(msg);
    else setSuccess(msg);
    setTimeout(() => { if (severity === "error") setError(""); else setSuccess(""); }, 4000);
  };

  const fetchTheme = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await axios.get(apiBase, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setActiveTheme(data.activeTheme);
      setDefaultTheme(data.defaultTheme || {});
      setCustomTheme(data.customTheme);
      setEditConfig(data.customTheme ? { ...data.customTheme } : {});
    } catch (err) {
      console.error("fetchTheme error", err);
      showToast("Failed to load theme settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomTheme = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = getAuthToken();
      const newActive = Object.keys(editConfig).length > 0 ? "custom" : "default";

      await axios.put(
        `${apiBase}/custom`,
        {
          customTheme: Object.keys(editConfig).length > 0 ? editConfig : null,
          activeTheme: newActive,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Theme updated successfully!", "success");
      await fetchTheme();
    } catch (err) {
      console.error("save error", err);
      showToast(err.response?.data?.error || "Failed to update theme.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (newActive) => {
    if (newActive === "custom" && !customTheme) {
      showToast("Cannot activate custom theme: no custom theme configured.", "error");
      return;
    }
    setSaving(true);
    try {
      const token = getAuthToken();
      await axios.patch(
        `${apiBase}/active`,
        { activeTheme: newActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Switched to ${newActive} theme.`, "success");
      await fetchTheme();
    } catch (err) {
      console.error("toggle error", err);
      showToast(err.response?.data?.error || "Failed to switch theme.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset to default theme? This will delete your custom theme.")) return;
    setSaving(true);
    try {
      const token = getAuthToken();
      await axios.delete(`${apiBase}/custom`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Reset to default theme.", "success");
      await fetchTheme();
    } catch (err) {
      console.error("reset error", err);
      showToast(err.response?.data?.error || "Failed to reset theme.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setEditConfig((prev) => {
      const next = { ...prev, [key]: value };
      if (value === "" || value === null) delete next[key];
      return next;
    });
  };

  const effectiveTheme = activeTheme === "custom" && customTheme ? customTheme : defaultTheme;

  useEffect(() => {
    if (siteId) fetchTheme();
  }, [siteId]);

  if (loading) return <Stack sx={{ justifyContent: "center", p: 4 }}><CircularProgress /></Stack>;

  const editableFields = [
    { key: "color", label: "Primary Color", type: "color" },
    { key: "background", label: "Background", type: "color" },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: '85vh', overflowY: 'auto', width: '100%', maxWidth: 900 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}
      >
        <Typography variant="h6" fontWeight={700}>Theme Customizer</Typography>
        <Tooltip title="Refresh from server">
          <IconButton onClick={fetchTheme} disabled={saving} aria-label="refresh">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Active Theme</InputLabel>
        <Select
          value={activeTheme}
          label="Active Theme"
          onChange={(e) => handleToggleActive(e.target.value)}
          disabled={saving}
        >
          <MenuItem value="default">Default (Purchased Theme)</MenuItem>
          <MenuItem value="custom" disabled={!customTheme}>
            Custom Theme {customTheme ? "" : "(not configured)"}
          </MenuItem>
        </Select>
        <FormHelperText>
          Current: <strong>{activeTheme === "custom" ? "Custom" : "Default"}</strong>
        </FormHelperText>
      </FormControl>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        Custom Theme Configuration
      </Typography>

      <Grid container spacing={2}>
        {editableFields.map((field) => (
          <Grid size={{ xs: 12, sm: 6 }} key={field.key}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {field.type === "color" && (
                <input
                  type="color"
                  value={editConfig[field.key] || "#000000"}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: 1 }}
                />
              )}
              <TextField
                label={field.label}
                value={editConfig[field.key] || ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                size="small"
                fullWidth
                placeholder={`Default: ${defaultTheme[field.key] || "inherit"}`}
                disabled={saving}
                slotProps={{
                  input: {
                    endAdornment: editConfig[field.key] ? (
                      <IconButton onClick={() => handleConfigChange(field.key, "")} size="small">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null,
                  },
                }}
              />
            </Stack>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose} disabled={saving} color="inherit">
          Close
        </Button>
        {customTheme && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleReset}
            disabled={saving}
            startIcon={<Delete />}
          >
            Reset
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSaveCustomTheme}
          disabled={saving}
          startIcon={<Save />}
          sx={{ minWidth: 160 }}
        >
          {saving ? "Saving..." : "Save Custom"}
        </Button>
      </Stack>
    </Paper>
  );
};

const ClearIcon = ({ fontSize }) => (
  <svg width={fontSize === "small" ? 18 : 24} height={fontSize === "small" ? 18 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default ThemeCustomizer;