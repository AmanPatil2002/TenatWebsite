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

const getInitialForm = () => ({ name: "", tag: "", content: "" });

// ---- Shared form (add + edit) -------------------------------------------
function CategoryForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [formData, setFormData] = useState(initialValues || getInitialForm());
  const [errors, setErrors] = useState({});

  // Reset whenever the caller swaps the record being edited
  useEffect(() => {
    setFormData(initialValues || getInitialForm());
    setErrors({});
  }, [initialValues]);

  const validate = () => {
    const errs = {};
    const name = formData.name.trim();
    const tag = formData.tag.trim();

    if (!name) errs.name = "Category name is required";
    else if (name.length < 2 || name.length > 50)
      errs.name = "Name must be 2–50 characters";
    if (tag.length > 30) errs.tag = "Tag must be 30 characters or fewer";
    if (formData.content.length > 100)
      errs.content = "Content must be 100 characters or fewer";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: formData.name.trim(),
      tag: formData.tag.trim(),
      content: formData.content.trim(),
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
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="content"
            label="Content (optional)"
            multiline
            rows={3}
            value={formData.content}
            onChange={handleChange}
            error={!!errors.content}
            helperText={errors.content || `${formData.content.length}/100`}
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
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const getToken = () => localStorage.getItem("token");

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      showSnack("Could not load categories.", "error");
    } finally {
      setLoadingList(false);
    }
  }, []);

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
      fetchCategories();
    } catch (error) {
      showSnack(
        error.response?.data?.message || "Failed to add category.",
        "error",
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
        error.response?.data?.message || "Failed to update category.",
        "error",
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
      showSnack(
        error.response?.data?.message || "Failed to delete category.",
        "error",
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
      sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", backgroundColor: "#f5f5f5" }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* -------- Form card -------- */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.5, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
              {editingCategory ? "Edit category" : "Add category"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Categories group templates in the storefront dropdown.
            </Typography>

            <CategoryForm
              key={editingCategory ? editingCategory.categoryId : "new"}
              initialValues={
                editingCategory
                  ? {
                      name: editingCategory.name || "",
                      tag: editingCategory.tag || "",
                      content: editingCategory.content || "",
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
        <Grid size={{ xs: 12, md: 7 }}>
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
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Tag</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((c) => (
                      <TableRow
                        key={c.categoryId}
                        hover
                        selected={editingId === c.categoryId}
                      >
                        <TableCell>{c.name}</TableCell>
                        <TableCell>
                          {c.tag ? <Chip size="small" label={c.tag} /> : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => setEditingId(c.categoryId)}
                                disabled={submitting || deletingId === c.categoryId}
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
                                onClick={() => handleDelete(c)}
                                disabled={submitting || deletingId === c.categoryId}
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
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
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