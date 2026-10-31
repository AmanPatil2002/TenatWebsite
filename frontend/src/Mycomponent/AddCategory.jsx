import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Limits mirror the backend and the categories table (VARCHAR(500)).
const NAME_MAX = 500;
const TAG_MAX = 500;

const getInitialForm = () => ({ name: "", tag: "", content: "" });

// The API returns `content` as parsed JSON (or null). Show it as editable text.
const contentToText = (content) => {
  if (content === null || content === undefined) return "";
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
};

// The API only accepts a JSON object/array (or empty) for `content`.
// Returns { value } (null when empty) or { error }.
const parseContent = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return { value: null };
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { error: "Content is not valid JSON" };
  }
  if (parsed === null) return { value: null };
  if (typeof parsed !== "object") {
    return { error: "Content must be a JSON object or array" };
  }
  return { value: parsed };
};

const errorMessage = (error, fallback) => {
  if (error.response?.status === 403) {
    return "Only admins can manage categories.";
  }
  return error.response?.data?.message || fallback;
};

// 409 = category still has templates; a warning fits better than an error.
const errorSeverity = (error) =>
  error.response?.status === 409 ? "warning" : "error";

// ---- Shared form (add + edit) -------------------------------------------
// The parent gives this form a new `key` whenever the record being edited
// changes (or after a successful add), so no reset effect is needed here.
function CategoryForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const name = formData.name.trim();
    const tag = formData.tag.trim();

    if (!name) errs.name = "Category name is required";
    else if (name.length > NAME_MAX)
      errs.name = `Name must be ${NAME_MAX} characters or fewer`;

    if (tag.length > TAG_MAX)
      errs.tag = `Tag must be ${TAG_MAX} characters or fewer`;

    const content = parseContent(formData.content);
    if (content.error) errs.content = content.error;

    setErrors(errs);
    return { ok: Object.keys(errs).length === 0, content: content.value };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    const { ok, content } = validate();
    if (!ok) return;
    onSubmit({
      name: formData.name.trim(),
      tag: formData.tag.trim(), // empty string is stored as NULL by the API
      content, // parsed JSON, or null when empty
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
            label="Category name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
            required
            autoFocus
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="tag"
            label="Tag (optional)"
            value={formData.tag}
            onChange={handleChange}
            error={!!errors.tag}
            helperText={errors.tag || "A short label, e.g. portfolio"}
            slotProps={{ htmlInput: { maxLength: TAG_MAX } }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="content"
            label="Content (optional, JSON)"
            multiline
            minRows={4}
            maxRows={12}
            value={formData.content}
            onChange={handleChange}
            error={!!errors.content}
            helperText={
              errors.content || 'A JSON object or array, e.g. {"icon": "store"}'
            }
            slotProps={{
              htmlInput: {
                spellCheck: false,
                style: { fontFamily: "monospace", fontSize: "0.85rem" },
              },
            }}
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

// ---- Main page ----------------------------------------------------------
export default function AddCategory() {
  const [categories, setCategories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [createKey, setCreateKey] = useState(0); // bump to clear the add form
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = useCallback(
    (message, severity = "success") =>
      setSnack({ open: true, message, severity }),
    [],
  );

  const getToken = () => localStorage.getItem("token");

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      showSnack(errorMessage(error, "Could not load categories."), "error");
    } finally {
      setLoadingList(false);
    }
  }, [showSnack]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (values) => {
    const token = getToken();
    if (!token) return showSnack("Please log in first.", "error");

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/categories`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnack("Category added successfully!");
      setCreateKey((k) => k + 1); // fresh, empty form
      fetchCategories();
    } catch (error) {
      showSnack(
        errorMessage(error, "Failed to add category."),
        errorSeverity(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    const token = getToken();
    if (!token) return showSnack("Please log in first.", "error");

    try {
      setSubmitting(true);
      await axios.put(`${API_URL}/categories/${editingId}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnack("Category updated successfully!");
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      showSnack(
        errorMessage(error, "Failed to update category."),
        errorSeverity(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    const token = getToken();
    if (!token) return showSnack("Please log in first.", "error");

    try {
      setDeletingId(category.categoryId);
      await axios.delete(`${API_URL}/categories/${category.categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnack("Category deleted.");
      if (editingId === category.categoryId) setEditingId(null);
      fetchCategories();
    } catch (error) {
      // 409 message from the API: "Category has templates. Move or delete them first"
      showSnack(
        errorMessage(error, "Failed to delete category."),
        errorSeverity(error),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const editingCategory =
    editingId != null
      ? categories.find((c) => c.categoryId === editingId)
      : null;

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 1 },
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        sx={{ maxWidth: 1200, mx: "auto" }}
      >
        {/* -------- Form card -------- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 0.5,
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
              }}
            >
              {editingCategory ? "Edit category" : "Add category"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Categories group templates in the storefront dropdown.
            </Typography>

            <CategoryForm
              key={
                editingCategory
                  ? `edit-${editingCategory.categoryId}`
                  : `new-${createKey}`
              }
              initialValues={
                editingCategory
                  ? {
                      name: editingCategory.name || "",
                      tag: editingCategory.tag || "",
                      content: contentToText(editingCategory.content),
                    }
                  : getInitialForm()
              }
              submitLabel={editingCategory ? "Save changes" : "Add category"}
              onSubmit={editingCategory ? handleUpdate : handleCreate}
              onCancel={editingCategory ? () => setEditingId(null) : undefined}
              submitting={submitting}
            />
          </Paper>
        </Grid>

        {/* -------- Table card -------- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Existing categories
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : categories.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No categories yet. Add your first one using the form.
              </Typography>
            ) : (
              <TableContainer
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                  borderRadius: 1,
                  height: 600,
                }}
              >
                <Table
                 
                  sx={{
                    minWidth: 800,
                    tableLayout: "auto",
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 180, fontWeight: "bold" }}>
                        Name
                      </TableCell>

                      <TableCell sx={{ minWidth: 200, fontWeight: "bold" }}>
                        Tag
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          minWidth: 80,
                          whiteSpace: "nowrap",
                          fontWeight: "bold",
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {categories.map((c) => (
                      <TableRow
                        key={c.categoryId}
                        hover
                        selected={editingId === c.categoryId}
                      >
                        <TableCell
                          sx={{
                            minWidth: 180,
                            overflowWrap: "anywhere",
                            verticalAlign: "middle",
                          }}
                        >
                          {c.name}
                        </TableCell>

                        <TableCell
                          sx={{
                            minWidth: 200,
                            verticalAlign: "middle",
                          }}
                        >
                          {c.tag ? (
                            <Chip
                              size="small"
                              label={c.tag}
                              sx={{
                                maxWidth: "100%",
                                height: "auto",
                                "& .MuiChip-label": {
                                  display: "block",
                                  whiteSpace: "normal",
                                  overflowWrap: "anywhere",
                                  py: 0.5,
                                },
                              }}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            minWidth: 80,
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                          }}
                        >
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Edit ${c.name}`}
                                onClick={() => setEditingId(c.categoryId)}
                                disabled={
                                  submitting || deletingId === c.categoryId
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Delete ${c.name}`}
                                onClick={() => handleDelete(c)}
                                disabled={
                                  submitting || deletingId === c.categoryId
                                }
                              >
                                {deletingId === c.categoryId ? (
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
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSnack((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
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
