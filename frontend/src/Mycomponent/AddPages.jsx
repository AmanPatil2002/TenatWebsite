import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  Refresh as RefreshIcon,
  ArticleOutlined as ArticleIcon,
} from "@mui/icons-material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

const PAGE_LIMIT = 10;

const EMPTY_FORM = {
  title: "",
  categoryId: "",
  pagePrice: "",
  page: "",
};

// Convert CKEditor HTML to visible text for character counting.
const getPlainText = (html = "") => {
  if (typeof document === "undefined") {
    return String(html).replace(/<[^>]*>/g, "").trim();
  }
  const element = document.createElement("div");
  element.innerHTML = html;
  return (element.textContent || element.innerText || "")
    .replace(/\u00a0/g, " ")
    .trim();
};

const getToken = () => {
  const storedToken =
    localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
  return storedToken.replace(/^Bearer\s+/i, "").trim();
};

const getAuthConfig = () => {
  const token = getToken();
  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

const getErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }
  return (
    error.response?.data?.message || error.message || "Something went wrong."
  );
};

const getCategoryId = (category) => category.categoryId ?? category.id ?? "";
const getCategoryName = (category) =>
  category.categoryName ??
  category.name ??
  category.title ??
  `Category ${getCategoryId(category)}`;
const getPageId = (page) => page.pagesId ?? page.id;

const getInitialForm = (page = null) => ({
  title: page?.title ?? "",
  categoryId: page?.categoryId != null ? String(page.categoryId) : "",
  pagePrice: page?.pagePrice != null ? String(page.pagePrice) : "",
  page: page?.page ?? "",
});

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

// -----------------------------------------------------
// PAGE CREATION / EDITING FORM
// -----------------------------------------------------
function PageForm({
  categories,
  initialValues,
  isEditing,
  submitting,
  onSubmit,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(() => getInitialForm(initialValues));
  const [errors, setErrors] = useState({});
  const [editorReady, setEditorReady] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    setFormData(getInitialForm(initialValues));
    setErrors({});
    setEditorReady(false);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    const title = formData.title.trim();
    const pageText = getPlainText(formData.page);
    const price = formData.pagePrice.trim();

    if (!title) nextErrors.title = "Page title is required.";
    else if (title.length > 150)
      nextErrors.title = "Title cannot exceed 150 characters.";

    if (!formData.categoryId)
      nextErrors.categoryId = "Please select a category.";

    if (!price) nextErrors.pagePrice = "Page price is required.";
    else if (
      !/^\d{1,8}(\.\d{1,2})?$/.test(price) ||
      !Number.isFinite(Number(price))
    )
      nextErrors.pagePrice =
        "Enter a valid price, with up to 2 decimal places.";
    else if (Number(price) < 0)
      nextErrors.pagePrice = "Price cannot be negative.";

    if (!pageText) nextErrors.page = "Page content is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const succeeded = await onSubmit({
      title: formData.title.trim(),
      categoryId: Number(formData.categoryId),
      pagePrice: Number(formData.pagePrice),
      page: formData.page,
    });

    if (succeeded && !isEditing) {
      setFormData({ ...EMPTY_FORM });
      setErrors({});
      setEditorReady(false);
      setEditorKey((previous) => previous + 1);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        borderColor: "divider",
        boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
        width: "100%",
        boxSizing: "border-box",
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
          <ArticleIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: BRAND.ink, lineHeight: 1.25 }}
          >
            {isEditing ? "Edit page" : "Create a page"}
          </Typography>
          <Typography variant="body2" sx={{ color: BRAND.muted }}>
            Add a title, category, price, and formatted page content.
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      <Stack spacing={2.5}>
        <TextField
          label="Page title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          fullWidth
          size="small"
          error={Boolean(errors.title)}
          helperText={errors.title || "Maximum 150 characters"}
          inputProps={{ maxLength: 150 }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            fullWidth
            size="small"
            error={Boolean(errors.categoryId)}
            helperText={errors.categoryId || "Select a category"}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            {categories.map((category) => (
              <MenuItem
                key={getCategoryId(category)}
                value={String(getCategoryId(category))}
              >
                {getCategoryName(category)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Page price (₹)"
            name="pagePrice"
            type="number"
            value={formData.pagePrice}
            onChange={handleChange}
            required
            fullWidth
            size="small"
            error={Boolean(errors.pagePrice)}
            helperText={errors.pagePrice || "Enter amount in rupees"}
            inputProps={{ min: 0, step: "0.01", max: 99999999.99 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Stack>

        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: BRAND.ink }}
            >
              Page content <span style={{ color: "#dc2626" }}>*</span>
            </Typography>
            {editorReady && (
              <Typography variant="caption" sx={{ color: BRAND.muted }}>
                Rich text editor
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              "& .cke, & .cke_chrome, & .cke_inner, & .cke_contents": {
                width: "100% !important",
                maxWidth: "100%",
                boxSizing: "border-box",
              },
              "& .cke_chrome": {
                border: "none !important",
                boxShadow: "none !important",
              },
              "& .cke_top": { whiteSpace: "normal" },
              "& .cke_contents": { minHeight: "250px" },
            }}
          >
            <CKEditor
              key={editorKey}
              editorUrl="https://cdn.ckeditor.com/4.22.1/standard-all/ckeditor.js"
              initData={formData.page}
              onBeforeLoad={(CKEDITOR) => {
                if (CKEDITOR.plugins.get("localvideo")) return;
                CKEDITOR.plugins.add("localvideo", {
                  init(editor) {
                    editor.addCommand("localvideoCmd", {
                      exec() {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/mp4,video/webm,video/ogg";
                        input.onchange = async () => {
                          const file = input.files?.[0];
                          if (!file) return;
                          const body = new FormData();
                          body.append("upload", file);
                          try {
                            const res = await fetch(
                              `${API_URL}/uploads/ckeditor-video`,
                              { method: "POST", body },
                            );
                            const data = await res.json();
                            if (!data.uploaded) {
                              throw new Error(
                                data.error?.message || "Upload failed",
                              );
                            }
                            editor.insertHtml(
                              `<video controls style="max-width:100%" src="${data.url}"></video><p></p>`,
                            );
                          } catch (err) {
                            alert(err.message);
                          }
                        };
                        input.click();
                      },
                    });
                    editor.ui.addButton("LocalVideo", {
                      label: "Insert video",
                      command: "localvideoCmd",
                      toolbar: "insert",
                      icon:
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent(
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#444" d="M4 5h11a2 2 0 0 1 2 2v3l5-3v10l-5-3v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>',
                        ),
                    });
                  },
                });
              }}
              config={{
                height: 350,
                language: "en",
                allowedContent: true,
                extraPlugins: "uploadimage,localvideo",
                uploadUrl: `${API_URL}/uploads/ckeditor`,
                imageUploadUrl: `${API_URL}/uploads/ckeditor`,
                filebrowserImageUploadUrl: `${API_URL}/uploads/ckeditor`,
                toolbar: [
                  {
                    name: "document",
                    items: ["Source", "Preview", "Maximize"],
                  },
                  { name: "clipboard", items: ["Undo", "Redo"] },
                  { name: "styles", items: ["Format", "FontSize"] },
                  {
                    name: "basicstyles",
                    items: ["Bold", "Italic", "Underline", "Strike"],
                  },
                  {
                    name: "paragraph",
                    items: [
                      "NumberedList",
                      "BulletedList",
                      "JustifyLeft",
                      "JustifyCenter",
                      "JustifyRight",
                    ],
                  },
                  { name: "links", items: ["Link", "Unlink"] },
                  {
                    name: "insert",
                    items: ["Image", "LocalVideo", "Table", "HorizontalRule"],
                  },
                ],
              }}
              onInstanceReady={() => setEditorReady(true)}
              onChange={(event) => {
                const html = event.editor.getData();
                setFormData((prev) => ({ ...prev, page: html }));
              }}
            />
          </Box>

          {errors.page && (
            <Typography
              color="error"
              variant="caption"
              sx={{ display: "block", mt: 0.5 }}
            >
              {errors.page}
            </Typography>
          )}
        </Box>

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || categories.length === 0}
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : isEditing ? (
                <EditIcon />
              ) : (
                <AddIcon />
              )
            }
            sx={{
              flex: 1,
              py: 1.25,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
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
            {submitting
              ? "Saving…"
              : isEditing
                ? "Update page"
                : "Create page"}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="outlined"
              onClick={onCancelEdit}
              disabled={submitting}
              sx={{
                flex: 1,
                py: 1.25,
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

        {categories.length === 0 && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            No categories are available. Create a category before creating a
            page.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

// -----------------------------------------------------
// MAIN ADD PAGES COMPONENT
// -----------------------------------------------------
export default function AddPages() {
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPages, setLoadingPages] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [pageNo, setPageNo] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const [editingPage, setEditingPage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [notice, setNotice] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showNotice = (message, severity = "success") => {
    setNotice({ open: true, message, severity });
  };

  const closeNotice = () => {
    setNotice((previous) => ({ ...previous, open: false }));
  };

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await axios.get(
        `${API_URL}/categories`,
        getAuthConfig(),
      );
      const body = response.data;
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.categories)
            ? body.categories
            : [];
      setCategories(list);
    } catch (error) {
      showNotice(
        `Unable to load categories. ${getErrorMessage(error)}`,
        "error",
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadPages = useCallback(async () => {
    setLoadingPages(true);
    try {
      const params = { page: pageNo + 1, limit: PAGE_LIMIT };
      if (search.trim()) params.search = search.trim();
      if (filterCategory) params.categoryId = filterCategory;

      const response = await axios.get(`${API_URL}/pages`, {
        ...getAuthConfig(),
        params,
      });
      const body = response.data;
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.pages)
            ? body.pages
            : [];
      setPages(list);
      setTotalRows(
        Number(body.total ?? body.totalRows ?? body.count ?? list.length),
      );
    } catch (error) {
      setPages([]);
      setTotalRows(0);
      showNotice(`Unable to load pages. ${getErrorMessage(error)}`, "error");
    } finally {
      setLoadingPages(false);
    }
  }, [pageNo, search, filterCategory, refreshKey]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleSavePage = async (formData) => {
    setSubmitting(true);
    try {
      if (editingPage) {
        const id = getPageId(editingPage);
        await axios.put(`${API_URL}/pages/${id}`, formData, getAuthConfig());
        showNotice("Page updated successfully.");
        setEditingPage(null);
      } else {
        await axios.post(`${API_URL}/pages`, formData, getAuthConfig());
        showNotice("Page created successfully.");
      }
      setPageNo(0);
      setSearch("");
      setFilterCategory("");
      setRefreshKey((previous) => previous + 1);
      return true;
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingPage(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${API_URL}/pages/${getPageId(deleteTarget)}`,
        getAuthConfig(),
      );
      showNotice("Page deleted successfully.");
      setDeleteTarget(null);
      setRefreshKey((previous) => previous + 1);
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPageNo(0);
  };

  const handleCategoryFilterChange = (event) => {
    setFilterCategory(event.target.value);
    setPageNo(0);
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find(
      (item) => String(getCategoryId(item)) === String(categoryId),
    );
    return category ? getCategoryName(category) : "—";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        background:
          "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, sm: 3 } }}>
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
            Content
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
            Pages Management
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 560, mx: "auto" }}
          >
            Create, edit, and organize the pages that make up your templates.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              xl: "minmax(0, 5fr) minmax(0, 6fr)",
            },
            alignItems: "start",
            gap: 3,
          }}
        >
          {/* LEFT: CREATE / EDIT FORM */}
          <Box sx={{ minWidth: 0 }}>
            {loadingCategories ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 6,
                  borderRadius: 3,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress
                  sx={{ color: BRAND.indigo }}
                  aria-label="Loading form"
                />
              </Paper>
            ) : (
              <PageForm
                key={
                  editingPage
                    ? `edit-${getPageId(editingPage)}`
                    : "create-page"
                }
                categories={categories}
                initialValues={editingPage}
                isEditing={Boolean(editingPage)}
                submitting={submitting}
                onSubmit={handleSavePage}
                onCancelEdit={handleCancelEdit}
              />
            )}
          </Box>

          {/* RIGHT: EXISTING PAGES */}
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              borderColor: "divider",
              boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              minWidth: 0,
              boxSizing: "border-box",
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
                <SectionLabel>Existing pages</SectionLabel>
                <Typography variant="body2" sx={{ color: BRAND.muted }}>
                  {totalRows > 0
                    ? `${totalRows} page${totalRows === 1 ? "" : "s"} total`
                    : "No pages yet."}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={loadingPages}
                sx={{
                  flexShrink: 0,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: alpha(BRAND.indigo, 0.35),
                  color: BRAND.indigo,
                  "&:hover": {
                    borderColor: BRAND.indigo,
                    bgcolor: alpha(BRAND.indigo, 0.04),
                  },
                }}
              >
                Refresh
              </Button>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <TextField
                label="Search by title"
                placeholder="Enter page title"
                value={search}
                onChange={handleSearchChange}
                fullWidth
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                select
                label="Filter category"
                value={filterCategory}
                onChange={handleCategoryFilterChange}
                size="small"
                sx={{
                  minWidth: { sm: 200 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              >
                <MenuItem value="">All categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem
                    key={getCategoryId(category)}
                    value={String(getCategoryId(category))}
                  >
                    {getCategoryName(category)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TableContainer
              sx={{
                overflowX: "auto",
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
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(BRAND.indigo, 0.04),
                        color: BRAND.ink,
                      }}
                    >
                      Title
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(BRAND.indigo, 0.04),
                        color: BRAND.ink,
                      }}
                    >
                      Category
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(BRAND.indigo, 0.04),
                        color: BRAND.ink,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Price
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(BRAND.indigo, 0.04),
                        color: BRAND.ink,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loadingPages ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <CircularProgress
                          size={28}
                          sx={{ color: BRAND.indigo }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: BRAND.muted, mt: 1 }}
                        >
                          Loading pages…
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : pages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography
                          sx={{ fontWeight: 700, color: BRAND.ink }}
                          gutterBottom
                        >
                          No pages found
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: BRAND.muted }}
                        >
                          Create your first page using the form on the left.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pages.map((page) => (
                      <TableRow
                        hover
                        key={getPageId(page)}
                        sx={{
                          "&:hover": { bgcolor: alpha(BRAND.indigo, 0.03) },
                        }}
                      >
                        <TableCell
                          sx={{
                            minWidth: 140,
                            maxWidth: 260,
                            overflowWrap: "anywhere",
                            verticalAlign: "middle",
                            py: 1.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: BRAND.ink }}
                          >
                            {page.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: BRAND.muted }}
                          >
                            {formatDate(page.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "middle" }}>
                          <Typography variant="body2">
                            {getCategoryLabel(page.categoryId)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: BRAND.ink }}
                          >
                            ₹{Number(page.pagePrice || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                          }}
                        >
                          <Tooltip title="Edit page" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(page)}
                              aria-label={`Edit ${page.title}`}
                              sx={{
                                color: BRAND.indigo,
                                "&:hover": {
                                  bgcolor: alpha(BRAND.indigo, 0.08),
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete page" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(page)}
                              aria-label={`Delete ${page.title}`}
                              sx={{
                                "&:hover": {
                                  bgcolor: alpha("#dc2626", 0.08),
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalRows}
              page={pageNo}
              rowsPerPage={PAGE_LIMIT}
              rowsPerPageOptions={[PAGE_LIMIT]}
              onPageChange={(_, newPage) => setPageNo(newPage)}
              sx={{
                "& .MuiTablePagination-toolbar": { px: 0 },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  { color: BRAND.muted, fontWeight: 500 },
              }}
            />
          </Paper>
        </Box>
      </Box>

      {/* DELETE CONFIRMATION */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete page?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.title}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: BRAND.muted,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NOTIFICATIONS */}
      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={closeNotice}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeNotice}
          severity={notice.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}