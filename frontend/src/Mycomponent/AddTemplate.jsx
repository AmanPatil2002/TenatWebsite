import { useCallback, useEffect, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
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
  price: "0",
  currency: "INR",
  validityDays: "365",
  status: "draft",
};

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

function MultiplePhotoUpload({ value, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const photos = Array.isArray(value) ? value : [];

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    setError("");

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      setError("Please select image files only.");
    }

    const validFiles = imageFiles.filter(
      (file) => file.size <= 5 * 1024 * 1024,
    );

    if (validFiles.length !== imageFiles.length) {
      setError("Each image must be 5 MB or smaller.");
    }

    if (!validFiles.length) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("images", file);

        const response = await axios.post(
          `${API_URL}/uploads/images`,
          formData,
          authConfig(),
        );

        const data = response.data;

        // Supported example response shapes:
        // { url: "..." }
        // { urls: ["...", "..."] }
        // { images: [{ url: "..." }] }
        const urls =
          data?.urls ||
          data?.images?.map((image) =>
            typeof image === "string" ? image : image.url,
          ) ||
          (data?.url ? [data.url] : []);

        uploadedUrls.push(...urls.filter(Boolean));
      }

      if (!uploadedUrls.length) {
        throw new Error("The upload endpoint did not return any image URLs.");
      }

      onChange([...photos, ...uploadedUrls]);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (indexToRemove) => {
    onChange(photos.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Template Photos
      </Typography>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderStyle: "dashed",
          textAlign: "center",
          bgcolor: "action.hover",
        }}
      >
        <CloudUploadOutlinedIcon
          sx={{ fontSize: 36, color: "text.secondary", mb: 1 }}
        />

        <Typography variant="body2" sx={{ mb: 1 }}>
          Select multiple images from your computer
        </Typography>

        <Button
          variant="outlined"
          startIcon={
            uploading ? (
              <CircularProgress size={16} />
            ) : (
              <CloudUploadOutlinedIcon />
            )
          }
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? "Uploading..." : "Choose Images"}
        </Button>

        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          JPG, PNG, WEBP · Maximum 5 MB per image
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 2 }}>
        {photos.map((photo, index) => (
          <Box
            key={`${photo}-${index}`}
            sx={{
              width: 100,
              position: "relative",
              border: 1,
              borderColor: "divider",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={photo}
              alt={`Template photo ${index + 1}`}
              sx={{
                display: "block",
                width: "100%",
                height: 80,
                objectFit: "cover",
              }}
              onError={(event) => {
                event.currentTarget.style.opacity = "0.3";
              }}
            />

            <Typography
              variant="caption"
              display="block"
              noWrap
              sx={{ px: 0.75, py: 0.5 }}
            >
              Image {index + 1}
            </Typography>

            <Button
              aria-label={`Remove image ${index + 1}`}
              title="Remove image"
              size="small"
              color="error"
              onClick={() => removePhoto(index)}
              disabled={disabled || uploading}
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 0,
                width: 26,
                height: 26,
                p: 0,
                bgcolor: "background.paper",
              }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        ))}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {photos.length} image{photos.length === 1 ? "" : "s"} selected
      </Typography>
    </Box>
  );
}

function TemplateForm({
  initialValues,
  categories,
  submitting,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...initialValues,
    photos: Array.isArray(initialValues?.photos) ? initialValues.photos : [],
  });
  const [photosError, setPhotosError] = useState("");

  useEffect(() => {
    setForm({
      ...EMPTY_FORM,
      ...initialValues,
      photos: Array.isArray(initialValues?.photos) ? initialValues.photos : [],
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPhotosError("");

    if (!form.name.trim()) return;
    if (!form.categoryId) return;

    let photos = [];

    if (form.photos.trim()) {
      try {
        const parsed = JSON.parse(form.photos);
        if (!Array.isArray(parsed)) {
          throw new Error("Photos must be a JSON array.");
        }
        photos = parsed;
      } catch {
        setPhotosError(
          'Enter photos as a valid JSON array, for example: ["https://example.com/photo.jpg"]',
        );
        return;
      }
    }

    onSubmit({
      ...form,
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      shortDescription: form.shortDescription.trim(),
      description: form.description,
      thumbnailUrl: form.thumbnailUrl.trim(),
      photos: form.photos,
      price: Number(form.price || 0),
      validityDays: Number(form.validityDays || 365),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <TextField
          required
          fullWidth
          label="Template name"
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <FormControl fullWidth required>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            label="Category"
            name="categoryId"
            value={form.categoryId === "" ? "" : String(form.categoryId)}
            onChange={handleChange}
          >
            {categories.map((category) => (
              <MenuItem
                key={category.categoryId}
                value={String(category.categoryId)}
              >
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Language"
          name="language"
          value={form.language}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          label="Short description"
          name="shortDescription"
          value={form.shortDescription}
          onChange={handleChange}
          inputProps={{ maxLength: 500 }}
        />

        {/* Regular multiline description field — no CKEditor */}
        <TextField
          fullWidth
          multiline
          minRows={6}
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Enter the template description..."
          helperText="Plain text description."
        />

        <TextField
          fullWidth
          label="Thumbnail URL"
          name="thumbnailUrl"
          value={form.thumbnailUrl}
          onChange={handleChange}
          placeholder="https://example.com/thumbnail.jpg"
        />

        <MultiplePhotoUpload
          value={form.photos}
          onChange={(photos) =>
            setForm((previous) => ({ ...previous, photos }))
          }
          disabled={submitting}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label="Price"
            name="price"
            value={form.price}
            onChange={handleChange}
            inputProps={{ min: 0, step: "0.01" }}
          />

          <TextField
            fullWidth
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            type="number"
            label="Validity (days)"
            name="validityDays"
            value={form.validityDays}
            onChange={handleChange}
            inputProps={{ min: 1, step: 1 }}
          />
        </Stack>

        <FormControl fullWidth>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save template"}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outlined"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function AddTemplate() {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message, severity = "success") => {
    setSnack({ open: true, message, severity });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [categoryResponse, templateResponse] = await Promise.all([
        axios.get(CATEGORIES_URL, authConfig()),
        axios.get(`${TEMPLATES_URL}/admin/all?limit=100`, authConfig()),
      ]);

      const categoryData = categoryResponse.data;
      const templateData = templateResponse.data;

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : categoryData?.categories || categoryData?.data || [],
      );

      setTemplates(
        Array.isArray(templateData)
          ? templateData
          : templateData?.templates || templateData?.data || [],
      );
    } catch (error) {
      showSnack(
        getErrorMessage(error, "Could not load templates or categories."),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (values) => {
    setSubmitting(true);

    try {
      if (editingId !== null) {
        await axios.put(`${TEMPLATES_URL}/${editingId}`, values, authConfig());
        showSnack("Template updated successfully.");
      } else {
        await axios.post(TEMPLATES_URL, values, authConfig());
        showSnack("Template added successfully.");
      }

      setEditingId(null);
      await fetchData();
    } catch (error) {
      showSnack(
        getErrorMessage(error, "Could not save the template."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;

    try {
      await axios.delete(
        `${TEMPLATES_URL}/${template.templateId}`,
        authConfig(),
      );
      showSnack("Template deleted.");
      await fetchData();
    } catch (error) {
      showSnack(
        getErrorMessage(error, "Could not delete the template."),
        "error",
      );
    }
  };

  const editingTemplate =
    templates.find((item) => item.templateId === editingId) || null;

  const initialValues = editingTemplate
    ? {
        ...EMPTY_FORM,
        ...editingTemplate,
        categoryId: editingTemplate.categoryId ?? "",
        photos: Array.isArray(editingTemplate.photos)
          ? editingTemplate.photos
          : (() => {
              try {
                const parsed = JSON.parse(editingTemplate.photos || "[]");
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })(),
        price: String(editingTemplate.price ?? 0),
        validityDays: String(editingTemplate.validityDays ?? 365),
      }
    : EMPTY_FORM;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
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
          <Typography color="text.secondary">
            Create, update and manage website templates.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {editingTemplate ? "Edit Template" : "Add Template"}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {loading && categories.length === 0 ? (
          <CircularProgress />
        ) : (
          <TemplateForm
            key={editingId ?? "new-template"}
            initialValues={initialValues}
            categories={categories}
            submitting={submitting}
            onSubmit={handleSave}
            onCancel={editingTemplate ? () => setEditingId(null) : undefined}
          />
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Existing Templates ({templates.length})
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : templates.length === 0 ? (
          <Typography color="text.secondary">No templates found.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {templates.map((template) => (
              <Paper
                key={template.templateId}
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography fontWeight={700}>{template.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.categoryName || "Uncategorized"} ·{" "}
                    {template.status || "draft"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setEditingId(template.templateId)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDelete(template)}
                  >
                    Delete
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
