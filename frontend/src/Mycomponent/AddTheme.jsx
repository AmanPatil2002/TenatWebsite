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

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const THEME_URL = `${API_URL}/theme`;

const getInitialForm = () => ({
  name: "",
  color: "",
  background: "",
});

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Read the token using the same storage key as your login code.
const getToken = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

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

function ThemeForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [formData, setFormData] = useState(
    initialValues || getInitialForm()
  );
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
      nextErrors.background =
        "Enter a valid hex color, e.g. #121212";
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
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name || "e.g. Dark, Light"}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="color"
            label="Text Color"
            value={formData.color}
            onChange={handleChange}
            error={!!errors.color}
            helperText={errors.color || "e.g. #ffffff"}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="background"
            label="Background Color"
            value={formData.background}
            onChange={handleChange}
            error={!!errors.background}
            helperText={errors.background || "e.g. #121212"}
          />
        </Grid>

        <Grid size={12}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{
                py: 1.25,
                fontSize: "0.95rem",
                fontWeight: "bold",
              }}
            >
              {submitting ? "Saving..." : submitLabel}
            </Button>

            {onCancel && (
              <Button
                type="button"
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
        "error"
      );
      return;
    }

    try {
      setLoadingList(true);

      const response = await axios.get(THEME_URL, config);

      setThemes(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      setThemes([]);
      showSnack(
        getErrorMessage(error, "Could not load themes."),
        "error"
      );
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
      showSnack(
        getErrorMessage(error, "Failed to add theme."),
        "error"
      );
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

      await axios.put(
        `${THEME_URL}/${editingId}`,
        values,
        config
      );

      showSnack("Theme updated successfully!");
      setEditingId(null);
      await fetchThemes();

      return true;
    } catch (error) {
      showSnack(
        getErrorMessage(error, "Failed to update theme."),
        "error"
      );
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

      await axios.delete(
        `${THEME_URL}/${theme.themeId}`,
        config
      );

      showSnack("Theme deleted successfully!");

      if (String(editingId) === String(theme.themeId)) {
        setEditingId(null);
      }

      await fetchThemes();
    } catch (error) {
      showSnack(
        getErrorMessage(error, "Failed to delete theme."),
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const editingTheme =
    editingId !== null
      ? themes.find(
          (theme) =>
            String(theme.themeId) === String(editingId)
        )
      : null;

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        sx={{ maxWidth: 1200, mx: "auto" }}
      >
        {/* Add / Edit Theme */}
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
              {editingTheme ? "Edit Theme" : "Add Theme"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Create and manage website color themes.
            </Typography>

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
              submitLabel={
                editingTheme ? "Save Changes" : "Add Theme"
              }
              onSubmit={
                editingTheme ? handleUpdate : handleCreate
              }
              onCancel={
                editingTheme
                  ? () => setEditingId(null)
                  : undefined
              }
              submitting={submitting}
            />
          </Paper>
        </Grid>

        {/* Existing Themes */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Existing Themes
              </Typography>

              <Button
                size="small"
                onClick={fetchThemes}
                disabled={loadingList}
              >
                Refresh
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 3,
                }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : themes.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2 }}
              >
                No themes available. Log in with a valid account
                and add your first theme.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Colors</TableCell>
                      <TableCell align="right">
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
                          String(editingId) ===
                          String(theme.themeId)
                        }
                      >
                        <TableCell
                          sx={{
                            maxWidth: 180,
                            overflowWrap: "anywhere",
                            verticalAlign: "middle",
                          }}
                        >
                          <Typography variant="body2">
                            {theme.name}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ verticalAlign: "middle" }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {/* Text color square */}
                            <Tooltip
                              title={`Text color: ${theme.color}`}
                              placement="top"
                            >
                              <Box
                                aria-label={`Text color ${theme.color}`}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  minWidth: 28,
                                  backgroundColor: theme.color,
                                  border: "1px solid #bdbdbd",
                                  borderRadius: 1,
                                  boxShadow: 1,
                                }}
                              />
                            </Tooltip>

                            {/* Background preview with text color */}
                            <Tooltip
                              title={`Background: ${theme.background}`}
                              placement="top"
                            >
                              <Box
                                sx={{
                                  width: 38,
                                  height: 28,
                                  minWidth: 38,
                                  backgroundColor: theme.background,
                                  color: theme.color,
                                  border: "1px solid #bdbdbd",
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

                            <Stack spacing={0.25}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600 }}
                              >
                                {theme.color}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
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
                          <Tooltip title="Edit theme">
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Edit ${theme.name}`}
                                onClick={() =>
                                  setEditingId(theme.themeId)
                                }
                                disabled={
                                  submitting ||
                                  deletingId === theme.themeId
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Delete theme">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Delete ${theme.name}`}
                                onClick={() => handleDelete(theme)}
                                disabled={
                                  submitting ||
                                  deletingId === theme.themeId
                                }
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
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}