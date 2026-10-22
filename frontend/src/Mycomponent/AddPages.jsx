import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
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
const SLUG_REGEX = /^[a-z0-9-]+$/;

const getInitialForm = () => ({
  title: "",
  slug: "",
  parentId: "",
  pageType: "custom",
  content: "[]",
  showInMenu: true,
  isPublished: false,
  sortOrder: 0,
});

// content may come back from MySQL as a parsed JSON value or as a string
const contentToText = (content) => {
  if (content == null) return "[]";
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
};

// ---- Shared form (add + edit) -------------------------------------------
function PageForm({
  initialValues,
  isEdit,
  parentOptions,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [formData, setFormData] = useState(initialValues || getInitialForm());
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const title = formData.title.trim();
    const slug = formData.slug.trim();

    if (!title) errs.title = "Title is required";
    else if (title.length < 2 || title.length > 50)
      errs.title = "Title must be 2–50 characters";

    // slug is only validated on create — the API does not update it
    if (!isEdit) {
      if (!slug) errs.slug = "Slug is required";
      else if (slug.length > 30)
        errs.slug = "Slug must be 30 characters or fewer";
      else if (!SLUG_REGEX.test(slug))
        errs.slug = "Use lowercase letters, numbers and hyphens only";
    }

    try {
      JSON.parse(formData.content || "[]");
    } catch {
      errs.content = "Content must be valid JSON";
    }

    if (Number.isNaN(Number(formData.sortOrder)))
      errs.sortOrder = "Sort order must be a number";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const content = JSON.parse(formData.content || "[]");
    const sortOrder = Number(formData.sortOrder) || 0;

    if (isEdit) {
      // PUT /site/:siteId/pages/:pageId accepts only these fields
      onSubmit({
        title: formData.title.trim(),
        content,
        showInMenu: formData.showInMenu,
        isPublished: formData.isPublished,
        sortOrder,
      });
    } else {
      // POST /site/:siteId/pages
      onSubmit({
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        parentId: formData.parentId === "" ? null : formData.parentId,
        pageType: formData.pageType.trim() || "custom",
        content,
        showInMenu: formData.showInMenu,
        sortOrder,
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="title"
            label="Title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="slug"
            label="Slug"
            value={formData.slug}
            onChange={handleChange}
            disabled={isEdit}
            error={!!errors.slug}
            helperText={
              errors.slug ||
              (isEdit ? "Slug can't be changed after the page is created." : "e.g. about-us")
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            name="parentId"
            label="Parent page"
            value={formData.parentId ?? ""}
            onChange={handleChange}
            disabled={isEdit}
            helperText={isEdit ? "Parent can't be changed after creation." : undefined}
          >
            <MenuItem value="">None (top level)</MenuItem>
            {parentOptions.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.title}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            name="pageType"
            label="Page type"
            value={formData.pageType}
            onChange={handleChange}
            disabled={isEdit}
            helperText={isEdit ? "Type can't be changed after creation." : "home, about, contact, custom…"}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            name="sortOrder"
            label="Sort order"
            value={formData.sortOrder}
            onChange={handleChange}
            error={!!errors.sortOrder}
            helperText={errors.sortOrder}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack direction="row" spacing={2} sx={{ height: "100%", alignItems: "center", flexWrap: "wrap" }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  name="showInMenu"
                  checked={!!formData.showInMenu}
                  onChange={handleToggle}
                />
              }
              label="Show in menu"
            />
            {isEdit && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    name="isPublished"
                    checked={!!formData.isPublished}
                    onChange={handleToggle}
                  />
                }
                label="Published"
              />
            )}
          </Stack>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={16}
            size="small"
            name="content"
            label="Content (JSON)"
            value={formData.content}
            onChange={handleChange}
            error={!!errors.content}
            helperText={errors.content || "Page blocks as a JSON array."}
            slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: "0.85rem" } } }}
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

export default function AddPages({ siteId: siteIdProp }) {
  const params = useParams();
  const siteId = siteIdProp ?? params.siteId;

  const [pages, setPages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
  const pagesUrl = `${API_URL}/site/${siteId}/pages`;

  const fetchPages = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !siteId) {
      setLoadingList(false);
      return;
    }
    try {
      setLoadingList(true);
      const res = await axios.get(`${API_URL}/site/${siteId}/pages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setSnack({
        open: true,
        message: error.response?.data?.message || "Could not load pages.",
        severity: "error",
      });
    } finally {
      setLoadingList(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleCreate = async (values) => {
    if (!getToken()) return showSnack("Please log in first.", "error");

    try {
      setSubmitting(true);
      await axios.post(pagesUrl, values, authHeaders());
      showSnack("Page added successfully!");
      fetchPages();
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to add page.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    if (!getToken()) return showSnack("Please log in first.", "error");

    try {
      setSubmitting(true);
      await axios.put(`${pagesUrl}/${editingId}`, values, authHeaders());
      showSnack("Page updated successfully!");
      setEditingId(null);
      fetchPages();
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to update page.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete page "${page.title}"?`)) return;
    if (!getToken()) return showSnack("Please log in first.", "error");

    try {
      setDeletingId(page.id);
      await axios.delete(`${pagesUrl}/${page.id}`, authHeaders());
      showSnack("Page deleted.");
      if (editingId === page.id) setEditingId(null);
      fetchPages();
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to delete page.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const editingPage = editingId != null ? pages.find((p) => p.id === editingId) : null;
  const parentTitle = (id) => pages.find((p) => p.id === id)?.title || "—";

  if (!siteId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No site selected. Open this page from a site.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* -------- Form card -------- */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", mb: 0.5, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
            >
              {editingPage ? "Edit page" : "Add page"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Pages appear on your website and in its menu.
            </Typography>

            <PageForm
              key={editingPage ? editingPage.id : "new"}
              isEdit={!!editingPage}
              initialValues={
                editingPage
                  ? {
                      title: editingPage.title || "",
                      slug: editingPage.slug || "",
                      parentId: editingPage.parentId ?? "",
                      pageType: editingPage.pageType || "custom",
                      content: contentToText(editingPage.content),
                      showInMenu: !!editingPage.showInMenu,
                      isPublished: !!editingPage.isPublished,
                      sortOrder: editingPage.sortOrder ?? 0,
                    }
                  : getInitialForm()
              }
              parentOptions={pages.filter((p) => p.id !== editingId)}
              submitLabel={editingPage ? "Save changes" : "Add page"}
              onSubmit={editingPage ? handleUpdate : handleCreate}
              onCancel={editingPage ? () => setEditingId(null) : undefined}
              submitting={submitting}
            />
          </Paper>
        </Grid>

        {/* -------- Table card -------- */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Existing pages
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : pages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No pages yet. Add your first one using the form.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Parent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pages.map((p) => (
                      <TableRow key={p.id} hover selected={editingId === p.id}>
                        <TableCell>{p.title}</TableCell>
                        <TableCell>{p.slug}</TableCell>
                        <TableCell>
                          {p.pageType ? <Chip size="small" label={p.pageType} /> : "—"}
                        </TableCell>
                        <TableCell>{p.parentId ? parentTitle(p.parentId) : "—"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Chip
                              size="small"
                              color={p.isPublished ? "success" : "default"}
                              label={p.isPublished ? "Published" : "Draft"}
                            />
                            {!p.showInMenu && <Chip size="small" variant="outlined" label="Hidden" />}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => setEditingId(p.id)}
                                disabled={submitting || deletingId === p.id}
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
                                onClick={() => handleDelete(p)}
                                disabled={submitting || deletingId === p.id}
                              >
                                {deletingId === p.id ? (
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