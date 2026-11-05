import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUploadOutlined,
  Delete as DeleteIcon,
  DeleteOutlineOutlined,
  Edit as EditIcon,
  ImageOutlined,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const TEMPLATES_URL = `${API_URL}/templates`;
const CATEGORIES_URL = `${API_URL}/categories`;
const THEMES_URL = `${API_URL}/theme`;
const PAGES_URL = `${API_URL}/pages`;
const IMAGE_UPLOAD_URL = `${API_URL}/uploads/ckeditor`;
const PAGES_PER_REQUEST = 100;

const getHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getPayload = (response) =>
  response?.data?.data ?? response?.data?.template ?? response?.data;

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

const getTemplateId = (t) => t?.templateId ?? t?.id;
const getCategoryId = (t) =>
  t?.categoryId ?? t?.category?.categoryId ?? t?.category?.id ?? "";
const getId = (item) =>
  item?.id ?? item?.pagesId ?? item?.themeId ?? item?.categoryId;
const getPageCategoryId = (page) =>
  page?.categoryId ?? page?.category_id ?? page?.pageCategoryId ?? null;

const parsePhotos = (photos) => {
  if (Array.isArray(photos))
    return photos.filter((p) => typeof p === "string" && p.trim());
  if (typeof photos !== "string" || !photos.trim()) return [];
  try {
    const parsed = JSON.parse(photos);
    if (Array.isArray(parsed))
      return parsed.filter((p) => typeof p === "string" && p.trim());
    if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    return [];
  } catch {
    return /^https?:\/\/\S+$/i.test(photos.trim()) ? [photos.trim()] : [];
  }
};

const pagesToMap = (templatePages) => {
  const map = {};
  for (const p of templatePages || []) {
    const id = String(p.pagesId ?? p.id ?? "");
    if (!id) continue;
    map[id] = {
      isDefault:
        p.isDefault === true || p.isDefault === 1 || p.isDefault === "1"
          ? 1
          : 0,
      sortOrder: Number(p.sortOrder ?? 0),
    };
  }
  return map;
};

const themeIdsFromTemplate = (templateThemes) =>
  (templateThemes || [])
    .map((t) => String(t.themeId ?? t.id ?? ""))
    .filter(Boolean);

const defaultThemeIdFromTemplate = (templateThemes) => {
  const def = (templateThemes || []).find(
    (t) => t.isDefault === true || t.isDefault === 1 || t.isDefault === "1",
  );
  return def ? String(def.themeId ?? def.id ?? "") : "";
};

const EMPTY_FORM = {
  name: "",
  categoryId: "",
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
  defaultThemeId: "",
  pages: {},
};

/* ------------------------------- UI helpers ------------------------------- */

function SectionTitle({ children, hint }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={700}>
        {children}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function StatusChip({ status }) {
  const color =
    status === "published"
      ? "success"
      : status === "archived"
        ? "default"
        : "warning";
  return (
    <Chip
      label={(status || "draft").toUpperCase()}
      color={color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700, letterSpacing: 0.4, minWidth: 92 }}
    />
  );
}

function ThemeSwatch({ theme, size = 28 }) {
  const bg = theme?.background || "#ffffff";
  const fg = theme?.color || "#111111";
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        color: fg,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      Aa
    </Box>
  );
}

/* ----------------------------- Thumbnail field ---------------------------- */

function ThumbnailField({ value, onChange, disabled }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [value]);

  const hasValue = Boolean((value || "").trim());

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Thumbnail
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Main image shown in listings. Paste a URL or upload below.
      </Typography>

      <Box
        sx={{
          mt: 1,
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(0, 1fr) 220px",
          },
          alignItems: "start",
        }}
      >
        <Stack spacing={1}>
          <TextField
            label="Thumbnail Image URL"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            placeholder="https://example.com/thumbnail.jpg"
            disabled={disabled}
          />
          {hasValue && (
            <Box>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineOutlined />}
                onClick={() => onChange("")}
                disabled={disabled}
              >
                Remove thumbnail
              </Button>
            </Box>
          )}
        </Stack>

        {/* Preview */}
        <Box
          sx={{
            width: "100%",
            aspectRatio: "4 / 3",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {hasValue && !imgError ? (
            <Box
              component="img"
              src={value}
              alt="Thumbnail preview"
              onError={() => setImgError(true)}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box sx={{ textAlign: "center", color: "text.disabled", p: 1 }}>
              <ImageOutlined fontSize="large" />
              <Typography variant="caption" display="block">
                {hasValue && imgError ? "Could not load image" : "No preview"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ---------------------------- Photos uploader ----------------------------- */

function PhotoUploader({ value = [], onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const photos = useMemo(() => parsePhotos(value), [value]);

  const handleFiles = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      if (!files.length) return;

      const invalidFile = files.find((f) => !f.type.startsWith("image/"));
      if (invalidFile) {
        setError("Please select image files only.");
        return;
      }
      const oversizedFile = files.find((f) => f.size > 10 * 1024 * 1024);
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
          const response = await axios.post(IMAGE_UPLOAD_URL, body, {
            headers: getHeaders(),
          });
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
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Additional Photos
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Upload one or more gallery images. Each is saved to the template.
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
          mt: 1,
          border: "1.5px dashed",
          borderColor: "divider",
          borderRadius: 2,
          p: 2.5,
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
            width: 44,
            height: 44,
            borderRadius: "50%",
            bgcolor: "background.paper",
            mb: 1,
            boxShadow: 1,
          }}
        >
          {uploading ? (
            <CircularProgress size={20} />
          ) : (
            <CloudUploadOutlined color="primary" fontSize="small" />
          )}
        </Box>
        <Typography variant="body2" fontWeight={600}>
          {uploading ? "Uploading photos…" : "Click to upload photos"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PNG, JPG, WEBP · max 10 MB each
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {photos.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 1.25,
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
                  height: 96,
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
                  py: 0.25,
                }}
              >
                <Typography variant="caption" color="text.secondary" noWrap>
                  Photo {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => removePhoto(index)}
                  disabled={disabled || uploading}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <FormHelperText>
        {photos.length} photo{photos.length === 1 ? "" : "s"}
      </FormHelperText>
    </Box>
  );
}

/* ------------------------------- Main page -------------------------------- */

export default function ViewTemplate() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [themes, setThemes] = useState([]);
  const [allPages, setAllPages] = useState([]);
  const [loadedPagesCategoryId, setLoadedPagesCategoryId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = getHeaders();
      const [tplRes, catRes, themeRes] = await Promise.all([
        axios.get(`${TEMPLATES_URL}/admin/all`, { headers }),
        axios.get(CATEGORIES_URL, { headers }),
        axios.get(THEMES_URL, { headers }),
      ]);
      setTemplates(getArray(tplRes, ["templates"]));
      setCategories(getArray(catRes, ["categories"]));
      setThemes(getArray(themeRes, ["themes"]));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load templates.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!editOpen || !form.categoryId) {
      return undefined;
    }

    const controller = new AbortController();
    const loadCategoryPages = async () => {
      try {
        const pages = [];
        let totalPages = 1;

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          const response = await axios.get(PAGES_URL, {
            headers: getHeaders(),
            params: {
              categoryId: form.categoryId,
              page: pageNumber,
              limit: PAGES_PER_REQUEST,
            },
            signal: controller.signal,
          });
          pages.push(...getArray(response, ["pages"]));
          totalPages = Math.ceil(
            Number(response.data?.total) / PAGES_PER_REQUEST,
          );
        }

        if (!controller.signal.aborted) {
          setAllPages(pages);
          setLoadedPagesCategoryId(String(form.categoryId));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setAllPages([]);
        setLoadedPagesCategoryId(String(form.categoryId));
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load pages for the selected category.",
        );
      }
    };

    loadCategoryPages();
    return () => controller.abort();
  }, [editOpen, form.categoryId]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openEdit = async (template) => {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const id = getTemplateId(template);
      if (id == null) throw new Error("Template ID was not found.");
      const response = await axios.get(`${TEMPLATES_URL}/admin/${id}`, {
        headers: getHeaders(),
      });
      const full = getPayload(response);

      setSelectedTemplate(full);
      setForm({
        name: full.name ?? "",
        categoryId: String(getCategoryId(full) ?? ""),
        language: full.language ?? "",
        shortDescription: full.shortDescription ?? "",
        description: full.description ?? "",
        thumbnailUrl: full.thumbnailUrl ?? "",
        photos: parsePhotos(full.photos),
        price: full.price ?? "",
        currency: full.currency ?? "INR",
        validityDays: full.validityDays ?? 365,
        status: full.status ?? "draft",
        themeIds: themeIdsFromTemplate(full.themes),
        defaultThemeId: defaultThemeIdFromTemplate(full.themes),
        pages: pagesToMap(full.pages),
      });
      setEditOpen(true);
    } catch (err) {
      if (getTemplateId(template) != null) {
        setSelectedTemplate(template);
        setForm({
          name: template.name ?? "",
          categoryId: String(getCategoryId(template) ?? ""),
          language: template.language ?? "",
          shortDescription: template.shortDescription ?? "",
          description: template.description ?? "",
          thumbnailUrl: template.thumbnailUrl ?? "",
          photos: parsePhotos(template.photos),
          price: template.price ?? "",
          currency: template.currency ?? "INR",
          validityDays: template.validityDays ?? 365,
          status: template.status ?? "draft",
          themeIds: themeIdsFromTemplate(template.themes),
          defaultThemeId: defaultThemeIdFromTemplate(template.themes),
          pages: pagesToMap(template.pages),
        });
        setEditOpen(true);
        setError("Full template details couldn't load — using list data.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to open template.",
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

  const handleThemeChange = (event) => {
    const values = event.target.value;
    const themeIds = typeof values === "string" ? values.split(",") : values;
    setForm((prev) => {
      const stillValid =
        themeIds.length === 0
          ? ""
          : themeIds.includes(String(prev.defaultThemeId))
            ? prev.defaultThemeId
            : String(themeIds[0]);
      return { ...prev, themeIds, defaultThemeId: stillValid };
    });
  };

  const togglePage = (pagesId) => {
    setForm((prev) => {
      const id = String(pagesId);
      const next = { ...prev.pages };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = {
          isDefault: Object.keys(prev.pages).length === 0 ? 1 : 0,
          sortOrder: Object.keys(prev.pages).length,
        };
      }
      return { ...prev, pages: next };
    });
  };

  const setPageDefault = (pagesId, isDefault) => {
    setForm((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [String(pagesId)]: {
          ...prev.pages[String(pagesId)],
          isDefault: isDefault ? 1 : 0,
        },
      },
    }));
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    const id = getTemplateId(selectedTemplate);
    if (id == null) return setError("Template ID is missing.");

    if (!form.name.trim()) return setError("Template name is required.");
    if (!form.categoryId) return setError("Category is required.");
    const price = Number(form.price);
    const validityDays = Number(form.validityDays);
    if (!Number.isFinite(price) || price <= 0)
      return setError("Price must be greater than 0.");
    if (!Number.isInteger(validityDays) || validityDays < 1)
      return setError("Validity must be a positive integer.");
    if (form.themeIds.length === 0)
      return setError("Select at least one theme.");
    if (
      !form.defaultThemeId ||
      !form.themeIds.includes(String(form.defaultThemeId))
    ) {
      return setError("Choose exactly one default theme.");
    }
    const defaultPageCount = Object.values(form.pages).filter(
      (p) => p.isDefault === 1,
    ).length;
    if (form.status === "published" && defaultPageCount === 0) {
      return setError("Published templates need a default page.");
    }

    const payload = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      language: form.language.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      description: form.description.trim() || null,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      photos: parsePhotos(form.photos),
      price,
      currency: form.currency.trim().toUpperCase(),
      validityDays,
      status: form.status,
      themeIds: form.themeIds.map(Number),
      defaultThemeId: Number(form.defaultThemeId),
      pages: Object.entries(form.pages).map(([pagesId, meta]) => ({
        pagesId: Number(pagesId),
        isDefault: meta.isDefault,
        sortOrder: meta.sortOrder ?? 0,
      })),
    };

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await axios.put(`${TEMPLATES_URL}/${id}`, payload, {
        headers: { ...getHeaders(), "Content-Type": "application/json" },
      });
      setEditOpen(false);
      setSelectedTemplate(null);
      setForm(EMPTY_FORM);
      setNotice("Template updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update the template.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async () => {
    const id = getTemplateId(selectedTemplate);
    if (id == null) {
      setError("Cannot delete: missing ID.");
      setDeleteOpen(false);
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${TEMPLATES_URL}/${id}`, { headers: getHeaders() });
      setDeleteOpen(false);
      setEditOpen(false);
      setSelectedTemplate(null);
      setNotice("Template deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the template.");
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
    if (!saving) setDeleteOpen(false);
  };

  const selectedPageIds = new Set(Object.keys(form.pages));
  const pagesById = new Map(
    (selectedTemplate?.pages || []).map((page) => [
      String(getId(page)),
      page,
    ]),
  );
  allPages.forEach((page) => pagesById.set(String(getId(page)), page));
  const editPages = Array.from(pagesById.values()).filter(
    (page) =>
      selectedPageIds.has(String(getId(page))) ||
      String(getPageCategoryId(page)) === String(form.categoryId),
  );
  const pagesLoading =
    editOpen &&
    form.categoryId &&
    String(loadedPagesCategoryId) !== String(form.categoryId);

  const selectedThemeObjects = themes.filter((t) =>
    form.themeIds.map(String).includes(String(getId(t))),
  );

  const grid3 = {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      md: "repeat(3, minmax(0, 1fr))",
    },
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 4, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 1.2, color: "text.secondary" }}
          >
            Admin · Templates
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Template Management
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Edit and delete your website templates.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
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
            startIcon={<AddIcon />}
            onClick={() => navigate("/admin/templates")}
          >
            Add Template
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="success" onClose={() => setNotice("")}>
            {notice}
          </Alert>
        )}
      </Box>

      {/* Table card */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box
            sx={{
              py: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">Loading templates…</Typography>
          </Box>
        ) : templates.length === 0 ? (
          <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "action.hover",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <ImageOutlined color="disabled" />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              No templates found
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Create a template using the Add Template page.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/templates")}
            >
              Add Template
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "50%" }}>Template</TableCell>
                  <TableCell sx={{ width: "18%" }} align="right">
                    Price
                  </TableCell>
                  <TableCell sx={{ width: "16%" }}>Status</TableCell>
                  <TableCell sx={{ width: "16%" }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => {
                  const id = getTemplateId(template);
                  const categoryId = getCategoryId(template);
                  const category = categories.find(
                    (item) =>
                      String(item.categoryId ?? item.id) === String(categoryId),
                  );
                  return (
                    <TableRow key={id ?? template.name} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            minWidth: 0,
                          }}
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
                                flex: "0 0 auto",
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
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: "0 0 auto",
                              }}
                            >
                              <ImageOutlined
                                fontSize="small"
                                sx={{ color: "text.disabled" }}
                              />
                            </Box>
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={600} noWrap>
                              {template.name || "Untitled template"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              component="div"
                            >
                              {category?.name ||
                                template.categoryName ||
                                "Uncategorized"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>
                          {template.currency || "INR"}{" "}
                          {Number(template.price || 0).toLocaleString("en-IN")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={template.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEdit(template)}
                                disabled={saving}
                                aria-label="Edit template"
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
                                onClick={() => openDelete(template)}
                                disabled={saving}
                                aria-label="Delete template"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ----------------------------- Edit dialog ---------------------------- */}
      <Dialog
        open={editOpen}
        onClose={closeEdit}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <Box component="form" onSubmit={saveTemplate}>
          <DialogTitle sx={{ pr: 6 }}>
            Edit Template
            <IconButton
              onClick={closeEdit}
              disabled={saving}
              sx={{ position: "absolute", right: 8, top: 8 }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {/* Basics */}
              <Box>
                <SectionTitle hint="Core details of the template.">
                  Basics
                </SectionTitle>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Template Name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    fullWidth
                  />
                  <FormControl fullWidth required>
                    <InputLabel id="edit-category-label">Category</InputLabel>
                    <Select
                      labelId="edit-category-label"
                      label="Category"
                      value={form.categoryId ?? ""}
                      onChange={(e) =>
                        updateField("categoryId", e.target.value)
                      }
                    >
                      {categories.map((c) => {
                        const id = c.categoryId ?? c.id;
                        return (
                          <MenuItem key={id} value={String(id)}>
                            {c.name || c.title || `Category ${id}`}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Short Description"
                    value={form.shortDescription}
                    onChange={(e) =>
                      updateField("shortDescription", e.target.value)
                    }
                    multiline
                    minRows={2}
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    multiline
                    minRows={4}
                    fullWidth
                  />
                </Box>
              </Box>

              <Divider />

              {/* Media — thumbnail preview + additional photos */}
              <Box>
                <SectionTitle hint="Thumbnail preview and gallery images.">
                  Media
                </SectionTitle>
                <Stack spacing={3}>
                  <ThumbnailField
                    value={form.thumbnailUrl}
                    onChange={(val) => updateField("thumbnailUrl", val)}
                    disabled={saving}
                  />
                  <PhotoUploader
                    value={form.photos}
                    onChange={(photos) => updateField("photos", photos)}
                    disabled={saving}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Pricing */}
              <Box>
                <SectionTitle hint="Price, currency, and validity window.">
                  Pricing
                </SectionTitle>
                <Box sx={grid3}>
                  <TextField
                    label="Price"
                    type="number"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    inputProps={{ min: 0, step: "0.01" }}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Currency"
                    value={form.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Validity (days)"
                    type="number"
                    value={form.validityDays}
                    onChange={(e) =>
                      updateField("validityDays", e.target.value)
                    }
                    inputProps={{ min: 1, step: 1 }}
                    required
                    fullWidth
                  />
                </Box>
              </Box>

              <Divider />

              {/* Themes */}
              <Box>
                <SectionTitle hint="Pick themes and set exactly one as the default.">
                  Themes
                </SectionTitle>

                <FormControl fullWidth>
                  <InputLabel id="edit-themes-label">Themes</InputLabel>
                  <Select
                    labelId="edit-themes-label"
                    multiple
                    value={form.themeIds}
                    label="Themes"
                    onChange={handleThemeChange}
                    renderValue={() => (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.75,
                          alignItems: "center",
                        }}
                      >
                        {selectedThemeObjects.length === 0 ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ py: 0.25 }}
                          >
                            Select themes…
                          </Typography>
                        ) : (
                          selectedThemeObjects.map((t) => {
                            const id = String(getId(t));
                            const isDefault =
                              String(form.defaultThemeId) === id;
                            return (
                              <Box
                                key={id}
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 1,
                                  border: "1px solid",
                                  borderColor: isDefault
                                    ? "primary.main"
                                    : "divider",
                                  bgcolor: "background.paper",
                                  maxWidth: "100%",
                                }}
                              >
                                <ThemeSwatch theme={t} size={20} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: isDefault ? 700 : 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 140,
                                  }}
                                >
                                  {t.name || `Theme ${id}`}
                                </Typography>
                                {isDefault && (
                                  <Chip
                                    size="small"
                                    label="Default"
                                    color="primary"
                                    sx={{ height: 18, fontSize: 10 }}
                                  />
                                )}
                              </Box>
                            );
                          })
                        )}
                      </Box>
                    )}
                  >
                    {themes.map((theme) => {
                      const id = String(getId(theme));
                      const checked = form.themeIds
                        .map(String)
                        .includes(id);
                      const isDefault =
                        String(form.defaultThemeId) === id && checked;
                      return (
                        <MenuItem
                          key={id}
                          value={id}
                          sx={{ gap: 1.25, minHeight: 52 }}
                        >
                          <Checkbox
                            size="small"
                            checked={checked}
                            tabIndex={-1}
                            disableRipple
                            sx={{ p: 0.25, mr: 0.25 }}
                          />
                          <ThemeSwatch theme={theme} size={32} />
                          <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                            >
                              {theme.name || `Theme ${id}`}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              component="div"
                            >
                              {theme.background || "#ffffff"} ·{" "}
                              {theme.color || "#111111"}
                            </Typography>
                          </Box>
                          {isDefault && (
                            <Chip
                              size="small"
                              label="Default"
                              color="primary"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          )}
                        </MenuItem>
                      );
                    })}
                    {themes.length === 0 && (
                      <MenuItem disabled value="">
                        No themes available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>

                {selectedThemeObjects.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Default theme
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.25,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                          md: "repeat(3, minmax(0, 1fr))",
                        },
                      }}
                    >
                      {selectedThemeObjects.map((theme) => {
                        const id = String(getId(theme));
                        const active = String(form.defaultThemeId) === id;
                        return (
                          <Box
                            key={id}
                            role="button"
                            tabIndex={0}
                            onClick={() => updateField("defaultThemeId", id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                updateField("defaultThemeId", id);
                              }
                            }}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.25,
                              p: 1.25,
                              borderRadius: 2,
                              border: "2px solid",
                              borderColor: active
                                ? "primary.main"
                                : "divider",
                              bgcolor: active
                                ? "action.selected"
                                : "background.paper",
                              cursor: "pointer",
                              transition:
                                "border-color 120ms ease, background-color 120ms ease",
                              "&:hover": {
                                borderColor: active
                                  ? "primary.main"
                                  : "text.disabled",
                                bgcolor: active
                                  ? "action.selected"
                                  : "action.hover",
                              },
                              "&:focus-visible": {
                                outline: "2px solid",
                                outlineColor: "primary.main",
                                outlineOffset: 2,
                              },
                            }}
                          >
                            <ThemeSwatch theme={theme} size={40} />
                            <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                              >
                                {theme.name || `Theme ${id}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                component="div"
                              >
                                {active ? "Selected as default" : "Set default"}
                              </Typography>
                            </Box>
                            {active && (
                              <Chip
                                size="small"
                                label="Default"
                                color="primary"
                                sx={{ height: 22, fontSize: 11 }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Pages */}
              <Box>
                <SectionTitle hint="Choose the pages that belong to this template.">
                  Pages
                </SectionTitle>
                <Paper
                  variant="outlined"
                  sx={{ borderRadius: 2, overflow: "hidden" }}
                >
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" sx={{ width: 64 }}>
                            Include
                          </TableCell>
                          <TableCell>Page</TableCell>
                          <TableCell align="right" sx={{ width: 140 }}>
                            Base price
                          </TableCell>
                          <TableCell align="center" sx={{ width: 100 }}>
                            Default
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editPages.map((page) => {
                          const id = String(getId(page));
                          const selected = Boolean(form.pages[id]);
                          const isDefault = form.pages[id]?.isDefault === 1;
                          const price = Number(
                            page.pagePrice ?? page.price ?? 0,
                          );
                          return (
                            <TableRow key={id} hover>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selected}
                                  onChange={() => togglePage(id)}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap>
                                  {page.title || page.name || "Untitled page"}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {price > 0
                                  ? `${form.currency} ${price.toFixed(2)}`
                                  : "Free"}
                              </TableCell>
                              <TableCell align="center">
                                <Switch
                                  size="small"
                                  checked={isDefault}
                                  disabled={!selected}
                                  onChange={(e) =>
                                    setPageDefault(id, e.target.checked)
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {editPages.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Box sx={{ py: 3 }}>
                                <Typography color="text.secondary">
                                  {pagesLoading
                                    ? "Loading pages…"
                                    : "No pages available for this category."}
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>

              <Divider />

              {/* Status */}
              <Box>
                <SectionTitle hint="Control whether this template is live.">
                  Status
                </SectionTitle>
                <Box sx={{ maxWidth: 320 }}>
                  <FormControl fullWidth>
                    <InputLabel id="edit-status-label">Status</InputLabel>
                    <Select
                      labelId="edit-status-label"
                      label="Status"
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
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
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ---------------------------- Delete dialog --------------------------- */}
      <Dialog open={deleteOpen} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          Delete Template?
          <IconButton
            onClick={closeDelete}
            disabled={saving}
            sx={{ position: "absolute", right: 8, top: 8 }}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedTemplate?.name || "this template"}</strong>? This
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
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
            {saving ? "Deleting…" : "Delete Template"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}