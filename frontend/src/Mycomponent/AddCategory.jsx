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
import { alpha } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

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

const errorSeverity = (error) =>
  error.response?.status === 409 ? "warning" : "error";

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

// ---- Shared form (add + edit) -------------------------------------------
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
      tag: formData.tag.trim(),
      content,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          name="name"
          label="Category name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name || " "}
          slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
          required
          autoFocus
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
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
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
        <TextField
          fullWidth
          size="small"
          name="content"
          label="Content (optional, JSON)"
          multiline
          minRows={5}
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
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
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

// ---- Main page ----------------------------------------------------------
export default function AddCategory() {
  const [categories, setCategories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [createKey, setCreateKey] = useState(0);
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
      setCreateKey((k) => k + 1);
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
            Catalog
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
            {editingCategory ? "Edit category" : "Add category"}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 520, mx: "auto" }}
          >
            Categories group templates in the storefront dropdown.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {/* -------- Form card -------- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                borderColor: "divider",
                boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                // No height: "100%" — let it size to its content
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
                  <CategoryOutlinedIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: BRAND.ink, lineHeight: 1.25 }}
                  >
                    {editingCategory ? "Edit category" : "New category"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND.muted }}>
                    {editingCategory
                      ? "Update the details below."
                      : "Fill in the details below."}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

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
                onCancel={
                  editingCategory ? () => setEditingId(null) : undefined
                }
                submitting={submitting}
              />
            </Paper>
          </Grid>

          {/* -------- Table card -------- */}
          <Grid size={{ xs: 12, md: 8 }}>
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
                  <SectionLabel>Existing categories</SectionLabel>
                  <Typography variant="body2" sx={{ color: BRAND.muted }}>
                    {categories.length > 0
                      ? `${categories.length} categor${
                          categories.length === 1 ? "y" : "ies"
                        } available`
                      : "No categories yet."}
                  </Typography>
                </Box>
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
                    aria-label="Loading categories"
                  />
                </Box>
              ) : categories.length === 0 ? (
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
                  <Typography fontWeight={700} color={BRAND.ink} gutterBottom>
                    No categories yet
                  </Typography>
                  <Typography color="text.secondary">
                    Add your first category using the form on the left.
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
                  <Table
                    size="small"
                    stickyHeader
                    sx={{ minWidth: 520, tableLayout: "auto" }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            minWidth: 200,
                            fontWeight: 700,
                            bgcolor: alpha(BRAND.indigo, 0.04),
                            color: BRAND.ink,
                          }}
                        >
                          Name
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            minWidth: 100,
                            whiteSpace: "nowrap",
                            fontWeight: 700,
                            bgcolor: alpha(BRAND.indigo, 0.04),
                            color: BRAND.ink,
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
                              minWidth: 200,
                              overflowWrap: "anywhere",
                              verticalAlign: "middle",
                              py: 1.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: BRAND.ink }}
                            >
                              {c.name}
                            </Typography>
                            {c.tag ? (
                              <Chip
                                size="small"
                                label={c.tag}
                                sx={{
                                  mt: 0.75,
                                  maxWidth: "100%",
                                  height: "auto",
                                  bgcolor: alpha(BRAND.indigo, 0.08),
                                  color: BRAND.indigo,
                                  fontWeight: 600,
                                  fontSize: "0.72rem",
                                  "& .MuiChip-label": {
                                    display: "block",
                                    whiteSpace: "normal",
                                    overflowWrap: "anywhere",
                                    py: 0.5,
                                  },
                                }}
                              />
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{ color: BRAND.muted }}
                              >
                                No tag
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              minWidth: 100,
                              whiteSpace: "nowrap",
                              verticalAlign: "middle",
                            }}
                          >
                            <Tooltip title="Edit" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`Edit ${c.name}`}
                                  onClick={() => setEditingId(c.categoryId)}
                                  disabled={
                                    submitting || deletingId === c.categoryId
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

                            <Tooltip title="Delete" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Delete ${c.name}`}
                                  onClick={() => handleDelete(c)}
                                  disabled={
                                    submitting || deletingId === c.categoryId
                                  }
                                  sx={{
                                    "&:hover": {
                                      bgcolor: alpha("#dc2626", 0.08),
                                    },
                                  }}
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
      </Box>

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
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
