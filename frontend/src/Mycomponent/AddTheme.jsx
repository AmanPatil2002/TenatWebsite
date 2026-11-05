import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
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
import { alpha } from "@mui/material/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const THEME_URL = `${API_URL}/theme`;

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

const getInitialForm = () => ({
  name: "",
  color: "",
  background: "",
});

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Read the token using the same storage key as your login code.
const getToken = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  return token?.replace(/^Bearer\s+/i, "").trim() || "";
};

const getErrorMessage = (error, fallback) => {
  if (error.response?.status === 401) {
    return "Session expired or token is invalid. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "Access denied. Platform administrator permission is required.";
  }

  return error.response?.data?.message || fallback;
};

/* Section label helper */
function SectionLabel({ children }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: BRAND.indigo,
        lineHeight: 1.6,
      }}
    >
      {children}
    </Typography>
  );
}

function ThemeForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [formData, setFormData] = useState(initialValues || getInitialForm());
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    } else if (formData.name.trim().length > 190) {
      nextErrors.name = "Name must be 190 characters or fewer";
    }

    if (!formData.color.trim()) {
      nextErrors.color = "Color is required";
    } else if (!HEX.test(formData.color.trim())) {
      nextErrors.color = "Enter a valid hex color, e.g. #ffffff";
    }

    if (!formData.background.trim()) {
      nextErrors.background = "Background is required";
    } else if (!HEX.test(formData.background.trim())) {
      nextErrors.background = "Enter a valid hex color, e.g. #121212";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      color: formData.color.trim(),
      background: formData.background.trim(),
    };

    const success = await onSubmit(payload);

    if (success && !initialValues?.name) {
      setFormData(getInitialForm());
      setErrors({});
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          name="name"
          label="Name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name || "e.g. Dark, Light"}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />

        <TextField
          fullWidth
          size="small"
          name="color"
          label="Text Color"
          value={formData.color}
          onChange={handleChange}
          error={!!errors.color}
          helperText={errors.color || "e.g. #ffffff"}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          InputProps={{
            startAdornment: formData.color && HEX.test(formData.color.trim()) ? (
              <Box
                aria-hidden="true"
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.75,
                  bgcolor: formData.color.trim(),
                  border: "1px solid",
                  borderColor: "divider",
                  mr: 1,
                  flexShrink: 0,
                }}
              />
            ) : null,
          }}
        />

        <TextField
          fullWidth
          size="small"
          name="background"
          label="Background Color"
          value={formData.background}
          onChange={handleChange}
          error={!!errors.background}
          helperText={errors.background || "e.g. #121212"}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          InputProps={{
            startAdornment:
              formData.background && HEX.test(formData.background.trim()) ? (
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 0.75,
                    bgcolor: formData.background.trim(),
                    border: "1px solid",
                    borderColor: "divider",
                    mr: 1,
                    flexShrink: 0,
                  }}
                />
              ) : null,
          }}
        />

        {/* Live preview */}
        <Box
          sx={{
            p: 1.75,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(BRAND.indigo, 0.03),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: BRAND.muted,
              fontWeight: 600,
              letterSpacing: "0.05em",
              display: "block",
              mb: 1,
            }}
          >
            PREVIEW
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor:
                formData.background && HEX.test(formData.background.trim())
                  ? formData.background.trim()
                  : "#f1f5f9",
              color:
                formData.color && HEX.test(formData.color.trim())
                  ? formData.color.trim()
                  : BRAND.ink,
              border: "1px solid",
              borderColor: "divider",
              fontWeight: 700,
              fontSize: "0.95rem",
              textAlign: "center",
            }}
          >
            Aa — The quick brown fox
          </Box>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ pt: 0.5 }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              flex: 1,
              py: 1.1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              bgcolor: BRAND.indigo,
              boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.25)}`,
              "&:hover": {
                bgcolor: BRAND.indigoDeep,
                boxShadow: `0 10px 24px ${alpha(BRAND.indigo, 0.32)}`,
              },
              "&.Mui-disabled": {
                bgcolor: alpha(BRAND.indigo, 0.35),
                color: "#fff",
              },
            }}
          >
            {submitting ? "Saving…" : submitLabel}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outlined"
              disabled={submitting}
              onClick={onCancel}
              sx={{
                flex: 1,
                py: 1.1,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                borderColor: alpha(BRAND.indigo, 0.35),
                color: BRAND.indigo,
                "&:hover": {
                  borderColor: BRAND.indigo,
                  bgcolor: alpha(BRAND.indigo, 0.04),
                },
              }}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function AddTheme() {
  const [themes, setThemes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = useCallback((message, severity = "success") => {
    setSnack({
      open: true,
      message,
      severity,
    });
  }, []);

  const authConfig = useCallback(() => {
    const token = getToken();

    if (!token) {
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  const fetchThemes = useCallback(async () => {
    const config = authConfig();

    if (!config) {
      setThemes([]);
      setLoadingList(false);
      showSnack(
        "Please log in first. No authentication token was found.",
        "error",
      );
      return;
    }

    try {
      setLoadingList(true);

      const response = await axios.get(THEME_URL, config);

      setThemes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setThemes([]);
      showSnack(getErrorMessage(error, "Could not load themes."), "error");
    } finally {
      setLoadingList(false);
    }
  }, [authConfig, showSnack]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleCreate = async (values) => {
    const config = authConfig();

    if (!config) {
      showSnack("Please log in before adding a theme.", "error");
      return false;
    }

    try {
      setSubmitting(true);

      await axios.post(THEME_URL, values, config);

      showSnack("Theme added successfully!");
      await fetchThemes();

      return true;
    } catch (error) {
      showSnack(getErrorMessage(error, "Failed to add theme."), "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    const config = authConfig();

    if (!config) {
      showSnack("Please log in before updating a theme.", "error");
      return false;
    }

    try {
      setSubmitting(true);

      await axios.put(`${THEME_URL}/${editingId}`, values, config);

      showSnack("Theme updated successfully!");
      setEditingId(null);
      await fetchThemes();

      return true;
    } catch (error) {
      showSnack(getErrorMessage(error, "Failed to update theme."), "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (theme) => {
    if (!window.confirm(`Delete the theme "${theme.name}"?`)) {
      return;
    }

    const config = authConfig();

    if (!config) {
      showSnack("Please log in before deleting a theme.", "error");
      return;
    }

    try {
      setDeletingId(theme.themeId);

      await axios.delete(`${THEME_URL}/${theme.themeId}`, config);

      showSnack("Theme deleted successfully!");

      if (String(editingId) === String(theme.themeId)) {
        setEditingId(null);
      }

      await fetchThemes();
    } catch (error) {
      showSnack(getErrorMessage(error, "Failed to delete theme."), "error");
    } finally {
      setDeletingId(null);
    }
  };

  const editingTheme =
    editingId !== null
      ? themes.find((theme) => String(theme.themeId) === String(editingId))
      : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        background:
          "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3 } }}>
        {/* Page header */}
        <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: "center" }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: BRAND.indigo,
            }}
          >
            Design system
          </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: BRAND.ink,
              mt: 0.5,
            }}
          >
            {editingTheme ? "Edit theme" : "Add theme"}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 520, mx: "auto" }}
          >
            Create and manage website color themes.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="flex-start">
          {/* Add / Edit Theme */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                borderColor: "divider",
                boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  mb: 2,
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2,
                    color: BRAND.indigo,
                    bgcolor: alpha(BRAND.indigo, 0.08),
                    "& .MuiSvgIcon-root": { fontSize: "1.25rem" },
                  }}
                >
                  <PaletteOutlinedIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: BRAND.ink, lineHeight: 1.25 }}
                  >
                    {editingTheme ? "Edit theme" : "New theme"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND.muted }}>
                    {editingTheme
                      ? "Update the colors below."
                      : "Define colors for your storefront."}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              <ThemeForm
                key={editingTheme?.themeId ?? "new"}
                initialValues={
                  editingTheme
                    ? {
                        name: editingTheme.name || "",
                        color: editingTheme.color || "",
                        background: editingTheme.background || "",
                      }
                    : getInitialForm()
                }
                submitLabel={editingTheme ? "Save changes" : "Add theme"}
                onSubmit={editingTheme ? handleUpdate : handleCreate}
                onCancel={editingTheme ? () => setEditingId(null) : undefined}
                submitting={submitting}
              />
            </Paper>
          </Grid>

          {/* Existing Themes */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                borderColor: "divider",
                boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <SectionLabel>Existing themes</SectionLabel>
                  <Typography variant="body2" sx={{ color: BRAND.muted }}>
                    {themes.length > 0
                      ? `${themes.length} theme${
                          themes.length === 1 ? "" : "s"
                        } available`
                      : "No themes yet."}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={fetchThemes}
                  disabled={loadingList}
                  sx={{
                    flexShrink: 0,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: alpha(BRAND.indigo, 0.35),
                    color: BRAND.indigo,
                    "&:hover": {
                      borderColor: BRAND.indigo,
                      bgcolor: alpha(BRAND.indigo, 0.04),
                    },
                  }}
                >
                  Refresh
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {loadingList ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 6,
                  }}
                >
                  <CircularProgress
                    size={28}
                    sx={{ color: BRAND.indigo }}
                    aria-label="Loading themes"
                  />
                </Box>
              ) : themes.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    px: 2,
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: alpha(BRAND.indigo, 0.25),
                    bgcolor: alpha(BRAND.indigo, 0.03),
                  }}
                >
                  <Typography
                    fontWeight={700}
                    color={BRAND.ink}
                    gutterBottom
                  >
                    No themes available
                  </Typography>
                  <Typography color="text.secondary">
                    Log in with a valid account and add your first theme.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    maxHeight: 560,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    "&::-webkit-scrollbar": { width: 6, height: 6 },
                    "&::-webkit-scrollbar-thumb": {
                      bgcolor: alpha(BRAND.indigo, 0.25),
                      borderRadius: 3,
                    },
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 520 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(BRAND.indigo, 0.04),
                            color: BRAND.ink,
                          }}
                        >
                          Name
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(BRAND.indigo, 0.04),
                            color: BRAND.ink,
                          }}
                        >
                          Colors
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(BRAND.indigo, 0.04),
                            color: BRAND.ink,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {themes.map((theme) => (
                        <TableRow
                          key={theme.themeId}
                          hover
                          selected={
                            String(editingId) === String(theme.themeId)
                          }
                          sx={{
                            "&.Mui-selected": {
                              bgcolor: alpha(BRAND.indigo, 0.06),
                            },
                            "&.Mui-selected:hover": {
                              bgcolor: alpha(BRAND.indigo, 0.1),
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              maxWidth: 180,
                              overflowWrap: "anywhere",
                              verticalAlign: "middle",
                              py: 1.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: BRAND.ink }}
                            >
                              {theme.name}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ verticalAlign: "middle" }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Tooltip
                                title={`Text color: ${theme.color}`}
                                placement="top"
                                arrow
                              >
                                <Box
                                  aria-label={`Text color ${theme.color}`}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    minWidth: 28,
                                    backgroundColor: theme.color,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    boxShadow: `0 2px 6px ${alpha(
                                      "#0f172a",
                                      0.08,
                                    )}`,
                                  }}
                                />
                              </Tooltip>

                              <Tooltip
                                title={`Background: ${theme.background}`}
                                placement="top"
                                arrow
                              >
                                <Box
                                  sx={{
                                    width: 38,
                                    height: 28,
                                    minWidth: 38,
                                    backgroundColor: theme.background,
                                    color: theme.color,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    overflow: "hidden",
                                  }}
                                >
                                  Aa
                                </Box>
                              </Tooltip>

                              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: BRAND.ink,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {theme.color}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: BRAND.muted,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {theme.background}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              whiteSpace: "nowrap",
                              verticalAlign: "middle",
                            }}
                          >
                            <Tooltip title="Edit theme" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`Edit ${theme.name}`}
                                  onClick={() => setEditingId(theme.themeId)}
                                  disabled={
                                    submitting || deletingId === theme.themeId
                                  }
                                  sx={{
                                    color: BRAND.indigo,
                                    "&:hover": {
                                      bgcolor: alpha(BRAND.indigo, 0.08),
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Delete theme" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Delete ${theme.name}`}
                                  onClick={() => handleDelete(theme)}
                                  disabled={
                                    submitting || deletingId === theme.themeId
                                  }
                                  sx={{
                                    "&:hover": {
                                      bgcolor: alpha("#dc2626", 0.08),
                                    },
                                  }}
                                >
                                  {deletingId === theme.themeId ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnack((previous) => ({
            ...previous,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={() =>
            setSnack((previous) => ({
              ...previous,
              open: false,
            }))
          }
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}