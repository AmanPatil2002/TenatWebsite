import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Clear, Delete, Refresh, Save } from "@mui/icons-material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const EDITABLE_FIELDS = [
  { key: "color", label: "Primary Color" },
  { key: "background", label: "Background" },
];

const getAuthToken = () =>
  localStorage.getItem("siteAdminToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

// <input type="color"> only accepts 6-digit hex values
const toPickerValue = (value, fallback = "#000000") => {
  const candidate = HEX_REGEX.test(value || "") ? value : fallback;
  if (!HEX_REGEX.test(candidate || "")) return "#000000";
  if (candidate.length === 4) {
    const [, r, g, b] = candidate;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return candidate;
};

const isValidColor = (value) => !value || HEX_REGEX.test(value);

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const Swatch = ({ color, size = 40 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 1,
      bgcolor: color || "transparent",
      border: "1px solid",
      borderColor: "divider",
    }}
  />
);

const ColorField = ({ field, value, defaultValue, disabled, onChange }) => {
  const invalid = !isValidColor(value);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Box
        component="input"
        type="color"
        value={toPickerValue(value, defaultValue)}
        onChange={(e) => onChange(field.key, e.target.value)}
        disabled={disabled}
        aria-label={`${field.label} picker`}
        sx={{
          width: 40,
          height: 40,
          p: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          flexShrink: 0,
        }}
      />
      <TextField
        label={field.label}
        value={value || ""}
        onChange={(e) => onChange(field.key, e.target.value.trim())}
        size="small"
        fullWidth
        disabled={disabled}
        error={invalid}
        helperText={invalid ? "Use a hex value like #1976d2" : " "}
        placeholder={`Default: ${defaultValue || "inherit"}`}
        slotProps={{
          input: {
            endAdornment: value ? (
              <IconButton
                size="small"
                edge="end"
                onClick={() => onChange(field.key, "")}
                disabled={disabled}
                aria-label={`Clear ${field.label}`}
              >
                <Clear fontSize="small" />
              </IconButton>
            ) : null,
          },
        }}
      />
    </Stack>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SiteAdminThemePage() {
  const { siteId, reloadSite } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error", message }

  const [activeTheme, setActiveTheme] = useState("default");
  const [defaultTheme, setDefaultTheme] = useState({});
  const [customTheme, setCustomTheme] = useState(null);
  const [editConfig, setEditConfig] = useState({});

  const apiBase = `${API_URL}/sites/client-admin/${siteId}/theme`;

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });

  // auto-hide notices
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const showNotice = (message, type = "success") =>
    setNotice({ type, message });

  const fetchTheme = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      try {
        const { data } = await axios.get(apiBase, authConfig());
        setActiveTheme(data.activeTheme || "default");
        setDefaultTheme(data.defaultTheme || {});
        setCustomTheme(data.customTheme || null);
        setEditConfig(data.customTheme ? { ...data.customTheme } : {});
      } catch (err) {
        console.error("fetchTheme error", err);
        showNotice(
          err.response?.data?.error || "Failed to load theme settings.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiBase],
  );

  useEffect(() => {
    if (siteId) fetchTheme();
  }, [siteId, fetchTheme]);

  const notifyParent = () => {
    if (typeof reloadSite === "function") reloadSite();
  };

  const handleConfigChange = (key, value) => {
    setEditConfig((prev) => {
      const next = { ...prev, [key]: value };
      if (!value) delete next[key];
      return next;
    });
  };

  const hasInvalidValue = EDITABLE_FIELDS.some(
    (f) => !isValidColor(editConfig[f.key]),
  );

  const isDirty = useMemo(
    () =>
      EDITABLE_FIELDS.some(
        (f) =>
          (editConfig[f.key] || "") !==
          ((customTheme && customTheme[f.key]) || ""),
      ),
    [editConfig, customTheme],
  );

  const handleSave = async () => {
    if (hasInvalidValue) {
      showNotice("Please fix the invalid color values first.", "error");
      return;
    }

    // The server merges keys, so removed fields must be sent as null to be deleted.
    const payload = {};
    EDITABLE_FIELDS.forEach((f) => {
      payload[f.key] = editConfig[f.key] || null;
    });
    const hasAnyValue = Object.values(payload).some(Boolean);

    setSaving(true);
    try {
      await axios.put(
        `${apiBase}/custom`,
        {
          customTheme: payload,
          activeTheme: hasAnyValue ? "custom" : "default",
        },
        authConfig(),
      );
      showNotice("Theme updated successfully!");
      await fetchTheme(false);
      notifyParent();
    } catch (err) {
      console.error("save error", err);
      showNotice(
        err.response?.data?.error || "Failed to update theme.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (newActive) => {
    if (newActive === activeTheme) return;
    if (newActive === "custom" && !customTheme) {
      showNotice(
        "Cannot activate custom theme: no custom theme configured.",
        "error",
      );
      return;
    }
    setSaving(true);
    try {
      await axios.patch(
        `${apiBase}/active`,
        { activeTheme: newActive },
        authConfig(),
      );
      showNotice(`Switched to ${newActive} theme.`);
      await fetchTheme(false);
      notifyParent();
    } catch (err) {
      console.error("toggle error", err);
      showNotice(
        err.response?.data?.error || "Failed to switch theme.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Reset to default theme? This will delete your custom theme.",
      )
    )
      return;
    setSaving(true);
    try {
      await axios.delete(`${apiBase}/custom`, authConfig());
      showNotice("Reset to default theme.");
      await fetchTheme(false);
      notifyParent();
    } catch (err) {
      console.error("reset error", err);
      showNotice(
        err.response?.data?.error || "Failed to reset theme.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------- render ---------------------------- */

  if (loading) {
    return (
      <Stack sx={{ alignItems: "center", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const defaultEntries = Object.entries(defaultTheme || {}).filter(
    ([, value]) => typeof value === "string" && value,
  );

  return (
    <Box sx={{ maxWidth: 800, width: "100%" }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        {/* Header */}
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Theme Customizer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Override the colors of your purchased theme.
            </Typography>
          </Box>
          <Tooltip title="Refresh from server">
            <span>
              <IconButton
                onClick={() => fetchTheme()}
                disabled={saving}
                aria-label="refresh"
              >
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {notice && (
          <Alert
            severity={notice.type}
            sx={{ mb: 3 }}
            onClose={() => setNotice(null)}
          >
            {notice.message}
          </Alert>
        )}

        {/* Active theme */}
        <FormControl fullWidth sx={{ mb: 3 }} disabled={saving}>
          <InputLabel id="active-theme-label">Active Theme</InputLabel>
          <Select
            labelId="active-theme-label"
            value={activeTheme}
            label="Active Theme"
            onChange={(e) => handleToggleActive(e.target.value)}
          >
            <MenuItem value="default">Default (Purchased Theme)</MenuItem>
            <MenuItem value="custom" disabled={!customTheme}>
              Custom Theme {customTheme ? "" : "(not configured)"}
            </MenuItem>
          </Select>
          <FormHelperText>
            Currently using:{" "}
            <strong>{activeTheme === "custom" ? "Custom" : "Default"}</strong>
          </FormHelperText>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Custom theme editor */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Custom Theme Configuration
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          {EDITABLE_FIELDS.map((field) => (
            <ColorField
              key={field.key}
              field={field}
              value={editConfig[field.key]}
              defaultValue={defaultTheme[field.key]}
              disabled={saving}
              onChange={handleConfigChange}
            />
          ))}
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "flex-end", mt: 2 }}
        >
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
            onClick={handleSave}
            disabled={saving || !isDirty || hasInvalidValue}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <Save />
            }
            sx={{ minWidth: 160 }}
          >
            {saving ? "Saving..." : "Save Custom"}
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Purchased default colors (read-only) */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Purchased Theme Colors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These come with your purchased theme and cannot be edited.
        </Typography>

        {defaultEntries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No default colors available.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            {defaultEntries.map(([key, value]) => {
              const label =
                EDITABLE_FIELDS.find((f) => f.key === key)?.label || key;
              return (
                <Stack
                  key={key}
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "action.hover",
                  }}
                >
                  <Swatch color={value} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {value}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
