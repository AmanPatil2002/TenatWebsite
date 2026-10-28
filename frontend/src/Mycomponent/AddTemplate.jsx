import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  CloudUploadOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TEMPLATES_URL = `${API_URL}/templates`;
const CATEGORIES_URL = `${API_URL}/categories`;
const THEMES_URL = `${API_URL}/theme`;
const PAGES_URL = `${API_URL}/pages`;
const IMAGE_UPLOAD_URL = `${API_URL}/uploads/ckeditor`;

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  language: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  photos: [],
  price: "",
  currency: "INR",
  validityDays: 365,
  status: "draft",
  themeIds: [],
  pageIds: [],
};

const authConfig = (extraHeaders = {}) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  };
};

const getId = (item) =>
  item?.id ??
  item?.pagesId ??
  item?.themeId ??
  item?.categoryId ??
  item?.templateId;

const getName = (item) =>
  item?.name ?? item?.title ?? item?.pageName ?? item?.themeName ?? "";

const getArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.themes)) return data.themes;
  if (Array.isArray(data?.pages)) return data.pages;
  if (Array.isArray(data?.templates)) return data.templates;

  return [];
};

const parsePhotos = (photos) => {
  if (Array.isArray(photos)) {
    return photos.filter((photo) => typeof photo === "string" && photo.trim());
  }

  if (typeof photos !== "string" || !photos.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(photos);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (photo) => typeof photo === "string" && photo.trim(),
      );
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }

    return [];
  } catch {
    return /^https?:\/\//i.test(photos.trim()) ? [photos.trim()] : [];
  }
};

const getPagePrice = (page) =>
  Number(page?.price ?? page?.pagePrice ?? page?.amount ?? 0) || 0;

function MultiplePhotoUpload({ value = [], onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const photos = useMemo(() => parsePhotos(value), [value]);

  const handleFiles = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";

      if (!files.length) return;

      const invalidFile = files.find((file) => !file.type.startsWith("image/"));

      if (invalidFile) {
        setError("Please select image files only.");
        return;
      }

      const oversizedFile = files.find((file) => file.size > 10 * 1024 * 1024);

      if (oversizedFile) {
        setError("Each image must be 10 MB or smaller.");
        return;
      }

      setError("");
      setUploading(true);

      try {
        const uploadedUrls = [];

        for (const file of files) {
          const body = new FormData();
          body.append("upload", file);

          const response = await axios.post(
            IMAGE_UPLOAD_URL,
            body,
            authConfig(),
          );

          const data = response.data;

          const imageUrl =
            data?.url ||
            data?.data?.url ||
            data?.file?.url ||
            data?.data?.file?.url;

          if (
            typeof imageUrl !== "string" ||
            !/^https?:\/\/\S+$/i.test(imageUrl.trim())
          ) {
            throw new Error(
              `The upload response did not contain a valid URL for "${file.name}".`,
            );
          }

          uploadedUrls.push(imageUrl.trim());
        }

        onChange([...photos, ...uploadedUrls]);
      } catch (err) {
        console.error("Photo upload failed:", err);

        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to upload photos.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onChange, photos],
  );

  const removePhoto = (index) => {
    onChange(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Additional Template Photos
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select multiple images. Each image is uploaded and its URL is saved with
        the template.
      </Typography>

      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        accept="image/*"
        onChange={handleFiles}
        disabled={disabled || uploading}
      />

      <Button
        variant="outlined"
        startIcon={
          uploading ? <CircularProgress size={18} /> : <CloudUploadOutlined />
        }
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? "Uploading photos..." : "Choose Photos"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {photos.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {photos.map((photo, index) => (
            <Grid item xs={6} sm={4} md={3} key={`${photo}-${index}`}>
              <Paper
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <Box
                  component="img"
                  src={photo}
                  alt={`Template photo ${index + 1}`}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: 130,
                    objectFit: "cover",
                  }}
                />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ p: 1 }}
                >
                  <Typography variant="caption" noWrap>
                    Photo {index + 1}
                  </Typography>

                  <Button
                    color="error"
                    size="small"
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => removePhoto(index)}
                    disabled={disabled || uploading}
                    sx={{ minWidth: 36 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <FormHelperText>
        {photos.length} photo{photos.length === 1 ? "" : "s"} selected
      </FormHelperText>
    </Box>
  );
}

export default function AddTemplate() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [themes, setThemes] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, themeResponse, pageResponse] = await Promise.all(
        [
          axios.get(CATEGORIES_URL, authConfig()),
          axios.get(THEMES_URL, authConfig()),
          axios.get(PAGES_URL, authConfig()),
        ],
      );

      setCategories(getArray(categoryResponse));
      setThemes(getArray(themeResponse));
      setPages(getArray(pageResponse));
    } catch (err) {
      console.error("Failed to load template form data:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load categories, themes, or pages. Check your API routes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (photos) => {
    setForm((previous) => ({
      ...previous,
      photos,
    }));
  };

  const handleThemeChange = (event) => {
    const values = event.target.value;

    setForm((previous) => ({
      ...previous,
      themeIds: typeof values === "string" ? values.split(",") : values,
    }));
  };

  const handlePageChange = (event) => {
    const values = event.target.value;

    setForm((previous) => ({
      ...previous,
      pageIds: typeof values === "string" ? values.split(",") : values,
    }));
  };

  const selectedPages = useMemo(
    () =>
      pages.filter((page) =>
        form.pageIds.map(String).includes(String(getId(page))),
      ),
    [pages, form.pageIds],
  );

  const calculatedPagePrice = useMemo(
    () => selectedPages.reduce((total, page) => total + getPagePrice(page), 0),
    [selectedPages],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a template name.");
      return;
    }

    if (form.price === "" || !(Number(form.price) > 0)) {
      setError("Please enter a template price greater than 0.");
      return;
    }

    if (
      !Number.isInteger(Number(form.validityDays)) ||
      Number(form.validityDays) < 1
    ) {
      setError("Validity must be a positive whole number of days.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        categoryId: Number(form.categoryId),
        name: form.name.trim(),
        language: form.language.trim() || null,
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim() || null,
        thumbnailUrl: form.thumbnailUrl.trim() || null,

        // IMPORTANT: Send an array. The backend validates each URL
        // and serializes the array before storing it in MySQL.
        photos: parsePhotos(form.photos),

        price: Number(form.price),
        currency: form.currency.trim().toUpperCase(),
        validityDays: Number(form.validityDays),
        status: form.status,

        // Included for APIs that support template-theme/page associations.
        themeIds: form.themeIds.map(Number),
        pageIds: form.pageIds.map(Number),
      };

      const response = await axios.post(
        TEMPLATES_URL,
        payload,
        authConfig({ "Content-Type": "application/json" }),
      );

      setSuccess(response.data?.message || "Template created successfully.");

      setForm({ ...EMPTY_FORM });
    } catch (err) {
      console.error("Create template failed:", err);

      const responseData = err.response?.data;

      setError(
        responseData?.message ||
          responseData?.error ||
          (Array.isArray(responseData?.errors)
            ? responseData.errors.join(", ")
            : "") ||
          "Failed to create template. Please check the form and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 250,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Loading template form...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Add Template
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Create a template, upload its photos, and select its category, themes,
        and pages.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={2}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700}>
            Basic Information
          </Typography>

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <Grid size={{ xs: 2, sm: 4, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="categoryId"
                  value={form.categoryId}
                  label="Category"
                  onChange={handleChange}
                >
                  {categories.map((category) => (
                    <MenuItem key={getId(category)} value={getId(category)}>
                      {getName(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 2, sm: 4, md: 6 }}>
              <TextField
                label="Template Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ maxLength: 150 }}
              />
            </Grid>
          </Grid>

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <Grid size={{ xs: 2, sm: 4, md: 6 }}>
              <TextField
                label="Language"
                name="language"
                value={form.language}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 2, sm: 4, md: 6 }}>
              <TextField
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ maxLength: 3 }}
                helperText="Use a three-letter code, e.g. INR"
              />
            </Grid>
          </Grid>

          <TextField
            label="Short Description"
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
            inputProps={{ maxLength: 300 }}
          />

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={4}
          />

          <Divider />

          <Typography variant="h6" fontWeight={700}>
            Template Images
          </Typography>

          <TextField
            label="Thumbnail URL"
            name="thumbnailUrl"
            value={form.thumbnailUrl}
            onChange={handleChange}
            fullWidth
            placeholder="https://example.com/thumbnail.jpg"
            helperText="Optional main image URL. Additional photos can be uploaded below."
          />

          {form.thumbnailUrl && (
            <Box
              component="img"
              src={form.thumbnailUrl}
              alt="Template thumbnail preview"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              sx={{
                width: "100%",
                maxWidth: 400,
                maxHeight: 220,
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          )}

          <MultiplePhotoUpload
            value={form.photos}
            onChange={handlePhotoChange}
            disabled={saving}
          />

          <Divider />

          <Typography variant="h6" fontWeight={700}>
            Themes and Pages
          </Typography>
          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <Grid size={{ xs: 2, sm: 4, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="themes-label">Themes</InputLabel>
                <Select
                  labelId="themes-label"
                  multiple
                  name="themeIds"
                  value={form.themeIds}
                  label="Themes"
                  onChange={handleThemeChange}
                  renderValue={(selected) => {
                    const chosen = themes.filter((theme) =>
                      selected.map(String).includes(String(getId(theme))),
                    );

                    if (!chosen.length) return "";

                    return (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {chosen.map((theme) => (
                          <Stack
                            key={getId(theme)}
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            <Box
                              aria-hidden
                              sx={{
                                width: 18,
                                height: 18,
                                minWidth: 18,
                                borderRadius: 0.5,
                                backgroundColor: theme.background || "#fff",
                                color: theme.color || "#111",
                                border: "1px solid",
                                borderColor: "divider",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            >
                              Aa
                            </Box>
                            <Typography variant="body2" component="span">
                              {getName(theme)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    );
                  }}
                >
                  {themes.map((theme) => (
                    <MenuItem key={getId(theme)} value={String(getId(theme))}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          aria-hidden
                          sx={{
                            width: 50,
                            height: 35,
                            minWidth: 20,
                            borderRadius: 0.5,
                            backgroundColor: theme.background || "#fff",
                            color: theme.color || "#111",
                            border: "1px solid",
                            borderColor: "divider",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                        >
                          Theme
                        </Box>
                        <span>{getName(theme)}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select one or more themes.</FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 2, sm: 4, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="pages-label">Pages</InputLabel>
                <Select
                  labelId="pages-label"
                  multiple
                  name="pageIds"
                  value={form.pageIds}
                  label="Pages"
                  onChange={handlePageChange}
                  renderValue={(selected) =>
                    pages
                      .filter((page) =>
                        selected.map(String).includes(String(getId(page))),
                      )
                      .map(getName)
                      .join(", ")
                  }
                >
                  {pages.map((page) => (
                    <MenuItem key={getId(page)} value={String(getId(page))}>
                      {getName(page)}
                      {getPagePrice(page) > 0
                        ? ` — ${form.currency} ${getPagePrice(page).toFixed(2)}`
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select the pages included in this template.
                </FormHelperText>
              </FormControl>

              {form.pageIds.length > 0 && (
                <Alert severity="info">
                  Selected page total: {form.currency}{" "}
                  {calculatedPagePrice.toFixed(2)}
                </Alert>
              )}
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="h6" fontWeight={700}>
            Pricing and Publishing
          </Typography>

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            columns={{ xs: 6, sm: 12, md: 12 }}
          >
            <Grid size={{ xs: 2, sm: 4, md: 4 }}>
              <TextField
                label="Template Price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            <Grid size={{ xs: 2, sm: 4, md: 4 }}>
              <TextField
                label="Validity (days)"
                name="validityDays"
                type="number"
                value={form.validityDays}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 2, sm: 4, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleChange}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
          >
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setError("");
                setSuccess("");
              }}
              disabled={saving}
            >
              Reset
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveOutlined />
                )
              }
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
