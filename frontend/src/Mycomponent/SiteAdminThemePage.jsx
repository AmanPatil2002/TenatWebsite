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
  Grid,
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

/* ------------------------------------------------------------------ */
/*  CVD-Safe Palette Preview Component                                */
/* ------------------------------------------------------------------ */

const PaletteSwatch = ({ color, label, size = 36 }) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 1.5,
        bgcolor: color,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      }}
      aria-label={`${label}: ${color}`}
    />
    <Box sx={{ minWidth: 0, overflow: "hidden" }}>
      <Typography
        variant="body2"
        fontWeight={600}
        noWrap
        sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        fontFamily="monospace"
        sx={{ fontSize: 11 }}
      >
        {color.toUpperCase()}
      </Typography>
    </Box>
  </Stack>
);


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
        helperText={invalid ? "Use a hex value like #2a78d6" : " "}
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
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const defaultEntries = Object.entries(defaultTheme || {}).filter(
    ([, value]) => typeof value === "string" && value,
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        mx: "auto",
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 3,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
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
        <FormControl
          fullWidth
          disabled={saving}
        >
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
        <br/>

        <Divider sx={{ mb: 3 }} />

        <Grid
          container
          spacing={2}
          sx={{ alignItems: "flex-start" }}
        >
          {/* ───────────────── Left: Custom theme editor ───────────────── */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, textAlign: { xs: "center", lg: "left" } }}
            >
              Custom Theme Configuration
            </Typography>
            <Stack
              direction="column"
              spacing={1.5}
              sx={{
                p: 1.5,
                minWidth: 0,
                overflow: "hidden",
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
            </Stack>

            {/* Action row */}
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={2}
              sx={{
                mt: 3,
                justifyContent: "flex-end",
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || !isDirty || hasInvalidValue}
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Save />
                  )
                }
                sx={{
                  minWidth: { sm: 160 },
                  width: { xs: "100%", sm: "auto", md: "auto" },
                }}
              >
                {saving ? "Saving..." : "Save Custom"}
              </Button>

              {customTheme && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReset}
                  disabled={saving}
                  startIcon={<Delete />}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Reset
                </Button>
              )}
            </Stack>
          </Grid>

          {/* ───────────────── Right: Purchased theme colors ───────────────── */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, paddingBottom: 2, textAlign: { xs: "center", lg: "left" } }}
            >
              Purchased Theme Colors
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
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
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
                        minWidth: 0,
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Box sx={{ flexShrink: 0 }}>
                        <Swatch color={value} size={44} />
                      </Box>

                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={label}
                        >
                          {label}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={String(value)}
                        >
                          {value}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}