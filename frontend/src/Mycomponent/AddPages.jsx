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

import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const PAGE_LIMIT = 5;

const EMPTY_FORM = {
  title: "",
  categoryId: "",
  pagePrice: "",
  page: "",
};

// Convert CKEditor HTML to visible text for character counting.
const getPlainText = (html = "") => {
  if (typeof document === "undefined") {
    return String(html)
      .replace(/<[^>]*>/g, "")
      .trim();
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
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
  // Changing this key remounts CKEditor so it really clears after a create
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    setFormData(getInitialForm(initialValues));
    setErrors({});
    setEditorReady(false);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    const title = formData.title.trim();
    const pageText = getPlainText(formData.page);
    const price = formData.pagePrice.trim();

    if (!title) {
      nextErrors.title = "Page title is required.";
    } else if (title.length > 150) {
      nextErrors.title = "Title cannot exceed 150 characters.";
    }

    if (!formData.categoryId) {
      nextErrors.categoryId = "Please select a category.";
    }

    if (!price) {
      nextErrors.pagePrice = "Page price is required.";
    } else if (
      !/^\d{1,8}(\.\d{1,2})?$/.test(price) ||
      !Number.isFinite(Number(price))
    ) {
      nextErrors.pagePrice =
        "Enter a valid price, with up to 2 decimal places.";
    } else if (Number(price) < 0) {
      nextErrors.pagePrice = "Price cannot be negative.";
    }

    if (!pageText) {
      nextErrors.page = "Page content is required.";
    }
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
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {isEditing ? "Edit page" : "Create a page"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add a title, category, price, and formatted page content.
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          label="Page title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(errors.title)}
          helperText={errors.title || "Maximum 150 characters"}
          inputProps={{ maxLength: 150 }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-start" }}
        >
          <TextField
            select
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            fullWidth
            error={Boolean(errors.categoryId)}
            helperText={errors.categoryId || "Select a category"}
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
            error={Boolean(errors.pagePrice)}
            helperText={errors.pagePrice || "Enter amount in rupees"}
            inputProps={{
              min: 0,
              step: "0.01",
              max: 99999999.99,
            }}
          />
        </Stack>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Page content *
          </Typography>

          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
              "& .cke, & .cke_chrome, & .cke_inner, & .cke_contents": {
                width: "100% !important",
                maxWidth: "100%",
                boxSizing: "border-box",
              },
              "& .cke_top": {
                whiteSpace: "normal",
              },
              "& .cke_contents": {
                minHeight: "250px",
              },
            }}
          >
            <CKEditor
              key={editorKey}
              editorUrl="https://cdn.ckeditor.com/4.22.1/standard-all/ckeditor.js"
              initData={formData.page}
              config={{
                height: 350,
                language: "en",
                allowedContent: true,
                extraPlugins: "uploadimage",
                uploadUrl: `${API_URL}/uploads/ckeditor`,
                imageUploadUrl: `${API_URL}/uploads/ckeditor`,
                toolbar: [
                  {
                    name: "document",
                    items: ["Source", "Preview", "Maximize"],
                  },
                  {
                    name: "clipboard",
                    items: ["Undo", "Redo"],
                  },
                  {
                    name: "styles",
                    items: ["Format", "FontSize"],
                  },
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
                  {
                    name: "links",
                    items: ["Link", "Unlink"],
                  },
                  {
                    name: "insert",
                    items: ["Image", "Table", "HorizontalRule"],
                  },
                ],
              }}
              onInstanceReady={() => setEditorReady(true)}
              onChange={(event) => {
                const html = event.editor.getData();

                setFormData((prev) => ({
                  ...prev,
                  page: html,
                }));
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
            size="large"
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : isEditing ? (
                <EditIcon />
              ) : (
                <AddIcon />
              )
            }
            disabled={submitting || categories.length === 0}
            fullWidth
            sx={{ py: 1.4, fontWeight: 700 }}
          >
            {submitting
              ? "Saving..."
              : isEditing
                ? "Update page"
                : "Create page"}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="outlined"
              size="large"
              onClick={onCancelEdit}
              disabled={submitting}
              sx={{ py: 1.4, px: 4 }}
            >
              Cancel
            </Button>
          )}
        </Stack>

        {categories.length === 0 && (
          <Alert severity="warning">
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

  // TablePagination is zero-based; the API page number is one-based.
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
    setNotice({
      open: true,
      message,
      severity,
    });
  };

  const closeNotice = () => {
    setNotice((previous) => ({
      ...previous,
      open: false,
    }));
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
      const params = {
        page: pageNo + 1,
        limit: PAGE_LIMIT,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterCategory) {
        params.categoryId = filterCategory;
      }

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

      // Refresh the list even if the current page and filters did not change.
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      // Reload current table and total count.
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
        p: { xs: 2, md: 3 },
        backgroundColor: "#f5f6fa",
      }}
    >
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Pages Management
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            xl: "minmax(0, 5fr) minmax(0, 5fr)",
          },
          alignItems: "start",
          gap: 3,
        }}
      >
        {/* LEFT: CREATE / EDIT FORM */}
        <Box sx={{ minWidth: 0 }}>
          {loadingCategories ? (
            <Paper
              sx={{
                p: 5,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Paper>
          ) : (
            <PageForm
              key={
                editingPage ? `edit-${getPageId(editingPage)}` : "create-page"
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
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Existing pages
            </Typography>

            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => setRefreshKey((previous) => previous + 1)}
            >
              Refresh
            </Button>
          </Stack>

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
            />

            <TextField
              select
              label="Filter category"
              value={filterCategory}
              onChange={handleCategoryFilterChange}
              size="small"
              sx={{ minWidth: { sm: 190 } }}
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

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Title</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Category</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Price</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loadingPages ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Loading pages...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight={600}>No pages found.</Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Create your first page using the form.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((page) => (
                    <TableRow hover key={getPageId(page)}>
                      <TableCell
                        sx={{
                          minWidth: 140,
                          maxWidth: 260,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <Typography fontWeight={600}>{page.title}</Typography>

                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(page.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell>{getCategoryLabel(page.categoryId)}</TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        ₹{Number(page.pagePrice || 0).toFixed(2)}
                      </TableCell>

                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit page">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(page)}
                            aria-label={`Edit ${page.title}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete page">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(page)}
                            aria-label={`Delete ${page.title}`}
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
          />
        </Paper>
      </Box>

      {/* DELETE CONFIRMATION */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
      >
        <DialogTitle>Delete page?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.title}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
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
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NOTIFICATIONS */}
      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={closeNotice}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeNotice}
          severity={notice.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
