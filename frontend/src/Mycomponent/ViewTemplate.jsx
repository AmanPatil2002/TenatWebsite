
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const TEMPLATES_URL = `${API_URL}/templates`;
const CATEGORIES_URL = `${API_URL}/categories`;

const EMPTY_FORM = {
  name: "",
  categoryId: "",
  language: "English",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  photos: [],
  price: "",
  currency: "INR",
  validityDays: 30,
  status: "draft",
};

const getHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getPayload = (response) =>
  response?.data?.data ??
  response?.data?.template ??
  response?.data;

const getArray = (response, keys = []) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  return [];
};

const getTemplateId = (template) =>
  template?.templateId ?? template?.id;

const getCategoryId = (template) =>
  template?.categoryId ??
  template?.category?.categoryId ??
  template?.category?.id ??
  "";

const normalizeTemplate = (template) => ({
  ...EMPTY_FORM,
  ...template,
  categoryId: getCategoryId(template),
  language: template?.language ?? "",
  shortDescription: template?.shortDescription ?? "",
  description: template?.description ?? "",
  thumbnailUrl: template?.thumbnailUrl ?? "",
  currency: template?.currency ?? "INR",
  photos: Array.isArray(template?.photos)
    ? template.photos
    : typeof template?.photos === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(template.photos);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return template.photos
              .split("\n")
              .map((url) => url.trim())
              .filter(Boolean);
          }
        })()
      : [],
  price: template?.price ?? "",
  validityDays: template?.validityDays ?? 30,
  status: template?.status ?? "draft",
});

export default function ViewTemplate() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const headers = getHeaders();

      const [
        templatesResponse,
        categoriesResponse,
      ] = await Promise.all([
        axios.get(`${TEMPLATES_URL}/admin/all`, { headers }),
        axios.get(CATEGORIES_URL, { headers }),
      ]);

      setTemplates(
        getArray(templatesResponse, ["templates"])
      );
      setCategories(
        getArray(categoriesResponse, ["categories"])
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load templates. Please check your server and API routes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openView = async (template) => {
    setError("");
    setNotice("");
    setSelectedTemplate(template);
    setViewOpen(true);
  };

  const openEdit = async (template) => {
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const id = getTemplateId(template);

      if (id == null) {
        throw new Error("Template ID was not found.");
      }

      // Use the admin detail route for the complete template record.
      const response = await axios.get(
        `${TEMPLATES_URL}/admin/${id}`,
        { headers: getHeaders() }
      );

      const fullTemplate = getPayload(response);

      setSelectedTemplate(fullTemplate);
      setForm(normalizeTemplate(fullTemplate));
      setEditOpen(true);
    } catch (err) {
      // Fall back to the record already returned by the list API.
      if (getTemplateId(template) != null) {
        setSelectedTemplate(template);
        setForm(normalizeTemplate(template));
        setEditOpen(true);
        setError(
          "The full template details could not be loaded. The list data has been opened instead."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to open this template for editing."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const closeEdit = () => {
    if (saving) return;

    setEditOpen(false);
    setSelectedTemplate(null);
    setForm(EMPTY_FORM);
  };

  const saveTemplate = async (event) => {
    event.preventDefault();

    const id = getTemplateId(selectedTemplate);

    if (id == null) {
      setError("Cannot update the template because its ID is missing.");
      return;
    }

    if (!form.name.trim()) {
      setError("Template name is required.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    const price = Number(form.price);
    const validityDays = Number(form.validityDays);

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid, non-negative price.");
      return;
    }

    if (
      !Number.isInteger(validityDays) ||
      validityDays < 1
    ) {
      setError("Validity days must be a positive whole number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      language: form.language.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      thumbnailUrl: form.thumbnailUrl.trim(),
      photos: form.photos,
      price,
      currency: form.currency.trim().toUpperCase(),
      validityDays,
      status: form.status,
    };

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await axios.put(`${TEMPLATES_URL}/${id}`, payload, {
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
      });

      setEditOpen(false);
      setSelectedTemplate(null);
      setForm(EMPTY_FORM);
      setNotice("Template updated successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update the template. Please check your backend validation and API route."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async () => {
    const id = getTemplateId(selectedTemplate);

    if (id == null) {
      setError("Cannot delete the template because its ID is missing.");
      setDeleteOpen(false);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await axios.delete(`${TEMPLATES_URL}/${id}`, {
        headers: getHeaders(),
      });

      setDeleteOpen(false);
      setViewOpen(false);
      setEditOpen(false);
      setSelectedTemplate(null);
      setNotice("Template deleted successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete the template. It may have related pages or themes."
      );
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (template) => {
    setSelectedTemplate(template);
    setDeleteOpen(true);
    setError("");
    setNotice("");
  };

  const closeDelete = () => {
    if (saving) return;
    setDeleteOpen(false);
  };

  const renderStatus = (status) => {
    const color =
      status === "published"
        ? "success"
        : status === "archived"
          ? "default"
          : "warning";

    return (
      <Chip
        label={status || "draft"}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Template Management
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            View, edit, and delete your website templates.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/admin/templates")}
          >
            Add Template
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {notice && (
        <Alert
          severity="success"
          onClose={() => setNotice("")}
          sx={{ mb: 2 }}
        >
          {notice}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Loading templates...
            </Typography>
          </Box>
        ) : templates.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="h6">
              No templates found
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Create a template using the Add Template page.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>Template</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {templates.map((template) => {
                  const id = getTemplateId(template);
                  const categoryId = getCategoryId(template);

                  const category = categories.find(
                    (item) =>
                      String(item.categoryId ?? item.id) ===
                      String(categoryId)
                  );

                  return (
                    <TableRow key={id ?? template.name} hover>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          {template.thumbnailUrl ? (
                            <Box
                              component="img"
                              src={template.thumbnailUrl}
                              alt={template.name || "Template"}
                              sx={{
                                width: 64,
                                height: 48,
                                objectFit: "cover",
                                borderRadius: 1,
                                bgcolor: "action.hover",
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 64,
                                height: 48,
                                borderRadius: 1,
                                bgcolor: "action.hover",
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              <VisibilityIcon color="disabled" />
                            </Box>
                          )}

                          <Box>
                            <Typography fontWeight={600}>
                              {template.name || "Untitled template"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {category?.name ||
                          template.categoryName ||
                          template.category?.name ||
                          "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        {template.currency || "INR"}{" "}
                        {Number(template.price || 0).toLocaleString(
                          "en-IN"
                        )}
                      </TableCell>

                      <TableCell>
                        {renderStatus(template.status)}
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => openView(template)}
                          >
                            View
                          </Button>

                          <Button
                            size="small"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => openEdit(template)}
                            disabled={saving}
                          >
                            Edit
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => openDelete(template)}
                            disabled={saving}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* View template details */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Template Details</DialogTitle>
        <DialogContent dividers>
          {selectedTemplate && (
            <Stack spacing={2}>
              {selectedTemplate.thumbnailUrl && (
                <Box
                  component="img"
                  src={selectedTemplate.thumbnailUrl}
                  alt={selectedTemplate.name}
                  sx={{
                    width: "100%",
                    maxHeight: 280,
                    objectFit: "contain",
                    borderRadius: 2,
                    bgcolor: "action.hover",
                  }}
                />
              )}

              <Typography variant="h5" fontWeight={700}>
                {selectedTemplate.name}
              </Typography>

              <Divider />

              <Typography>
                <strong>Category:</strong>{" "}
                {categories.find(
                  (item) =>
                    String(item.categoryId ?? item.id) ===
                    String(getCategoryId(selectedTemplate))
                )?.name ||
                  selectedTemplate.categoryName ||
                  selectedTemplate.category?.name ||
                  "—"}
              </Typography>

              <Typography>
                <strong>Language:</strong>{" "}
                {selectedTemplate.language || "English"}
              </Typography>

              <Typography>
                <strong>Short description:</strong>{" "}
                {selectedTemplate.shortDescription || "—"}
              </Typography>

              <Typography>
                <strong>Description:</strong>{" "}
                {selectedTemplate.description || "—"}
              </Typography>

              <Typography>
                <strong>Price:</strong>{" "}
                {selectedTemplate.currency || "INR"}{" "}
                {Number(selectedTemplate.price || 0).toLocaleString(
                  "en-IN"
                )}
              </Typography>

              <Typography>
                <strong>Validity:</strong>{" "}
                {selectedTemplate.validityDays ?? 30} days
              </Typography>

              <Typography>
                <strong>Status:</strong>{" "}
                {selectedTemplate.status || "draft"}
              </Typography>

              <Typography fontWeight={600}>Photos</Typography>

              {Array.isArray(selectedTemplate.photos) &&
              selectedTemplate.photos.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selectedTemplate.photos.map((photo, index) => {
                    const url =
                      typeof photo === "string"
                        ? photo
                        : photo?.url || photo?.imageUrl || "";

                    return url ? (
                      <Box
                        key={`${url}-${index}`}
                        component="img"
                        src={url}
                        alt={`Template photo ${index + 1}`}
                        sx={{
                          width: 100,
                          height: 75,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      />
                    ) : null;
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No additional photos.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>
            Close
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              const template = selectedTemplate;
              setViewOpen(false);
              if (template) openEdit(template);
            }}
          >
            Edit Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit template */}
      <Dialog
        open={editOpen}
        onClose={closeEdit}
        fullWidth
        maxWidth="md"
      >
        <Box component="form" onSubmit={saveTemplate}>
          <DialogTitle>Edit Template</DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                label="Template Name"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel id="edit-category-label">
                  Category
                </InputLabel>
                <Select
                  labelId="edit-category-label"
                  label="Category"
                  value={form.categoryId ?? ""}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                >
                  {categories.map((category) => {
                    const id = category.categoryId ?? category.id;

                    return (
                      <MenuItem key={id} value={id}>
                        {category.name || category.title || `Category ${id}`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                label="Language"
                value={form.language}
                onChange={(event) =>
                  updateField("language", event.target.value)
                }
                fullWidth
              />

              <TextField
                label="Short Description"
                value={form.shortDescription}
                onChange={(event) =>
                  updateField("shortDescription", event.target.value)
                }
                multiline
                minRows={2}
                fullWidth
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                multiline
                minRows={4}
                fullWidth
              />

              <TextField
                label="Thumbnail Image URL"
                value={form.thumbnailUrl}
                onChange={(event) =>
                  updateField("thumbnailUrl", event.target.value)
                }
                fullWidth
                helperText="Paste the existing or new image URL."
              />

              {form.thumbnailUrl && (
                <Box
                  component="img"
                  src={form.thumbnailUrl}
                  alt="Thumbnail preview"
                  sx={{
                    width: 180,
                    maxHeight: 120,
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              )}

              <TextField
                label="Additional Photo URLs"
                value={form.photos
                  .map((photo) =>
                    typeof photo === "string"
                      ? photo
                      : photo?.url || photo?.imageUrl || ""
                  )
                  .filter(Boolean)
                  .join("\n")}
                onChange={(event) =>
                  updateField(
                    "photos",
                    event.target.value
                      .split("\n")
                      .map((url) => url.trim())
                      .filter(Boolean)
                  )
                }
                multiline
                minRows={3}
                fullWidth
                helperText="Enter one image URL per line. Existing URLs are prefilled."
              />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
              >
                <TextField
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  inputProps={{ min: 0, step: "0.01" }}
                  required
                  fullWidth
                />

                <TextField
                  label="Currency"
                  value={form.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value)
                  }
                  required
                  fullWidth
                />

                <TextField
                  label="Validity (days)"
                  type="number"
                  value={form.validityDays}
                  onChange={(event) =>
                    updateField("validityDays", event.target.value)
                  }
                  inputProps={{ min: 1, step: 1 }}
                  required
                  fullWidth
                />
              </Stack>

              <FormControl fullWidth>
                <InputLabel id="edit-status-label">Status</InputLabel>
                <Select
                  labelId="edit-status-label"
                  label="Status"
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>

            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <EditIcon />
                )
              }
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteOpen}
        onClose={closeDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Template?</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>
              {selectedTemplate?.name || "this template"}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDelete} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={deleteTemplate}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {saving ? "Deleting..." : "Delete Template"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
