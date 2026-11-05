import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  CloudUploadOutlined,
  SaveOutlined,
  DeleteOutlineOutlined,
  CategoryOutlined,
  PaletteOutlined,
  DescriptionOutlined,
  PaymentsOutlined,
  ImageOutlined,
} from "@mui/icons-material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TEMPLATES_URL = `${API_URL}/templates`;
const CATEGORIES_URL = `${API_URL}/categories`;
const THEMES_URL = `${API_URL}/theme`;
const PAGES_URL = `${API_URL}/pages`;
const IMAGE_UPLOAD_URL = `${API_URL}/uploads/ckeditor`;
const PAGES_PER_REQUEST = 100;

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

const getPageCategoryId = (page) =>
  page?.categoryId ?? page?.category_id ?? page?.pageCategoryId ?? null;

/* ---------------------------------- UI bits --------------------------------- */

function SectionHeader({ icon, title, description }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          bgcolor: "primary.50",
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

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
      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        accept="image/*"
        onChange={handleFiles}
        disabled={disabled || uploading}
      />

      {/* Dropzone-style clickable area */}
      <Box
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !uploading) {
            inputRef.current?.click();
          }
        }}
        sx={{
          border: "1.5px dashed",
          borderColor: "divider",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          cursor: disabled || uploading ? "not-allowed" : "pointer",
          bgcolor: "grey.50",
          transition: "all 120ms ease",
          "&:hover": {
            bgcolor: disabled || uploading ? "grey.50" : "action.hover",
            borderColor: disabled || uploading ? "divider" : "primary.main",
          },
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "background.paper",
            mb: 1,
            boxShadow: 1,
          }}
        >
          {uploading ? (
            <CircularProgress size={22} />
          ) : (
            <CloudUploadOutlined color="primary" />
          )}
        </Box>
        <Typography variant="subtitle2" fontWeight={600}>
          {uploading ? "Uploading photos..." : "Click to upload photos"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Multiple images supported · PNG, JPG, WEBP · max 10 MB each
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {photos.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {photos.map((photo, index) => (
            <Paper
              key={`${photo}-${index}`}
              variant="outlined"
              sx={{ overflow: "hidden", borderRadius: 2 }}
            >
              <Box
                component="img"
                src={photo}
                alt={`Template photo ${index + 1}`}
                sx={{
                  display: "block",
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  bgcolor: "grey.100",
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1,
                  py: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary" noWrap>
                  Photo {index + 1}
                </Typography>
                <Button
                  color="error"
                  size="small"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => removePhoto(index)}
                  disabled={disabled || uploading}
                  sx={{ minWidth: 32, p: 0.5 }}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <FormHelperText sx={{ mt: 1 }}>
        {photos.length} photo{photos.length === 1 ? "" : "s"} selected
      </FormHelperText>
    </Box>
  );
}

/* ------------------------------- Main component ----------------------------- */

export default function AddTemplate() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [themes, setThemes] = useState([]);
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, themeResponse] = await Promise.all([
        axios.get(CATEGORIES_URL, authConfig()),
        axios.get(THEMES_URL, authConfig()),
      ]);

      setCategories(getArray(categoryResponse));
      setThemes(getArray(themeResponse));
    } catch (err) {
      console.error("Failed to load template form data:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load categories or themes. Check your API routes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!form.categoryId) return undefined;

    const controller = new AbortController();
    const loadCategoryPages = async () => {
      try {
        const firstResponse = await axios.get(PAGES_URL, {
          ...authConfig(),
          params: {
            categoryId: form.categoryId,
            page: 1,
            limit: PAGES_PER_REQUEST,
          },
          signal: controller.signal,
        });
        const allPages = getArray(firstResponse);
        const totalPages = Math.ceil(
          Number(firstResponse.data?.total) / PAGES_PER_REQUEST,
        );

        for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
          const response = await axios.get(PAGES_URL, {
            ...authConfig(),
            params: {
              categoryId: form.categoryId,
              page: pageNumber,
              limit: PAGES_PER_REQUEST,
            },
            signal: controller.signal,
          });
          allPages.push(...getArray(response));
        }

        if (!controller.signal.aborted) setPages(allPages);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Failed to load pages for the selected category:", err);
        setPages([]);
        setError(
          err.response?.data?.message ||
            "Unable to load pages for the selected category.",
        );
      } finally {
        if (!controller.signal.aborted) setPagesLoading(false);
      }
    };

    loadCategoryPages();
    return () => controller.abort();
  }, [form.categoryId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCategoryChange = (event) => {
    const { value } = event.target;
    setForm((previous) => ({
      ...previous,
      categoryId: value,
      pageIds: [],
    }));
    setPages([]);
    setPagesLoading(Boolean(value));
    setError("");
  };

  const handlePhotoChange = (photos) => {
    setForm((previous) => ({ ...previous, photos }));
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

  const filteredPages = useMemo(() => {
    if (!form.categoryId) return [];
    return pages.filter(
      (page) => String(getPageCategoryId(page)) === String(form.categoryId),
    );
  }, [pages, form.categoryId]);

  const selectedPages = useMemo(
    () =>
      filteredPages.filter((page) =>
        form.pageIds.map(String).includes(String(getId(page))),
      ),
    [filteredPages, form.pageIds],
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
        photos: parsePhotos(form.photos),
        price: Number(form.price),
        currency: form.currency.trim().toUpperCase(),
        validityDays: Number(form.validityDays),
        status: form.status,
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
      setPages([]);
      setPagesLoading(false);
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

  const handleReset = () => {
    setForm({ ...EMPTY_FORM });
    setPages([]);
    setPagesLoading(false);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading template form…</Typography>
      </Box>
    );
  }

  /* Shared grid template for field rows */
  const gridSx = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      md: "repeat(3, minmax(0, 1fr))",
    },
  };

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.2, color: "text.secondary" }}
        >
          Admin · Templates
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          Add Template
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Create a template, upload photos, and select its category, themes, and
          pages.
        </Typography>
      </Box>

      {/* Alerts */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}
      </Box>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        variant="outlined"
        sx={{ borderRadius: 2, overflow: "hidden" }}
      >
        <Stack spacing={0}>
          {/* ------------------------- Section: Basic info ------------------------ */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <SectionHeader
              icon={<DescriptionOutlined fontSize="small" />}
              title="Basic Information"
              description="Category, name, and short summary of this template."
            />

            <Box sx={gridSx}>
              <FormControl fullWidth required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="categoryId"
                  value={form.categoryId}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  {categories.map((category) => (
                    <MenuItem key={getId(category)} value={getId(category)}>
                      {getName(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Template Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ maxLength: 150 }}
              />

              <TextField
                label="Currency"
                name="currency"
                value="INR"
                disabled
                fullWidth
              />

              <TextField
                label="Language"
                name="language"
                value={form.language}
                onChange={handleChange}
                fullWidth
              />

              <Box sx={{ gridColumn: { xs: "auto", sm: "span 2" } }}>
                <TextField
                  label="Short Description"
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ maxLength: 300 }}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={4}
              />
            </Box>
          </Box>

          <Divider />

          {/* -------------------------- Section: Media --------------------------- */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <SectionHeader
              icon={<ImageOutlined fontSize="small" />}
              title="Media"
              description="Main thumbnail plus additional gallery photos."
            />

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
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Box
                  component="img"
                  src={form.thumbnailUrl}
                  alt="Template thumbnail preview"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  sx={{
                    width: "100%",
                    maxWidth: 360,
                    maxHeight: 200,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <MultiplePhotoUpload
                value={form.photos}
                onChange={handlePhotoChange}
                disabled={saving}
              />
            </Box>
          </Box>

          <Divider />

          {/* ----------------------- Section: Associations ----------------------- */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <SectionHeader
              icon={<CategoryOutlined fontSize="small" />}
              title="Associations"
              description="Attach themes and pages that belong to the selected category."
            />

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
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
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.75,
                          alignItems: "center",
                        }}
                      >
                        {chosen.map((theme) => (
                          <Box
                            key={getId(theme)}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: theme.background || "#fff",
                              color: theme.color || "#111",
                              fontSize: 11,
                              fontWeight: 700,
                              maxWidth: "100%",
                            }}
                          >
                            <PaletteOutlined sx={{ fontSize: 12 }} />
                            <Box
                              component="span"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getName(theme)}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    );
                  }}
                >
                  {themes.map((theme) => (
                    <MenuItem key={getId(theme)} value={String(getId(theme))}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          aria-hidden
                          sx={{
                            width: 36,
                            height: 24,
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
                            flex: "0 0 auto",
                          }}
                        >
                          Theme
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getName(theme)}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select one or more themes.</FormHelperText>
              </FormControl>

              <Box>
                <FormControl
                  fullWidth
                  disabled={!form.categoryId || pagesLoading}
                >
                  <InputLabel id="pages-label">Pages</InputLabel>
                  <Select
                    labelId="pages-label"
                    multiple
                    name="pageIds"
                    value={form.pageIds}
                    label="Pages"
                    onChange={handlePageChange}
                    renderValue={(selected) =>
                      filteredPages
                        .filter((page) =>
                          selected.map(String).includes(String(getId(page))),
                        )
                        .map(getName)
                        .join(", ")
                    }
                  >
                    {filteredPages.length === 0 && (
                      <MenuItem disabled value="">
                        {pagesLoading
                          ? "Loading pages..."
                          : "No pages found for this category"}
                      </MenuItem>
                    )}
                    {filteredPages.map((page) => (
                      <MenuItem key={getId(page)} value={String(getId(page))}>
                        {getName(page)}
                        {getPagePrice(page) > 0
                          ? ` — ${form.currency} ${getPagePrice(page).toFixed(
                              2,
                            )}`
                          : ""}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {form.categoryId
                      ? pagesLoading
                        ? "Loading all pages for this category..."
                        : "Only pages added to this category are shown."
                      : "Select a category first to see its pages."}
                  </FormHelperText>
                </FormControl>

                {form.pageIds.length > 0 && (
                  <Alert severity="info" sx={{ mt: 1.5 }}>
                    Selected page total: {form.currency}{" "}
                    {calculatedPagePrice.toFixed(2)}
                  </Alert>
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* ----------------------- Section: Pricing & Status ------------------- */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <SectionHeader
              icon={<PaymentsOutlined fontSize="small" />}
              title="Pricing & Publishing"
              description="Set price, validity, and publication status."
            />

            <Box sx={gridSx}>
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
            </Box>
          </Box>

          {/* Footer actions */}
          <Divider />
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1.5,
              bgcolor: "grey.50",
            }}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={handleReset}
              disabled={saving}
              fullWidth={false}
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
              disabled={saving || loading || pagesLoading}
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}