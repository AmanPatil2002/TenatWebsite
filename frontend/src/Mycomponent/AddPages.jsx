

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
  description: "",
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
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";

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
    error.response?.data?.message ||
    error.message ||
    "Something went wrong."
  );
};

const getCategoryId = (category) =>
  category.categoryId ?? category.id ?? "";

const getCategoryName = (category) =>
  category.categoryName ??
  category.name ??
  category.title ??
  `Category ${getCategoryId(category)}`;

const getPageId = (page) => page.pagesId ?? page.id;

const getInitialForm = (page = null) => ({
  title: page?.title ?? "",
  categoryId:
    page?.categoryId != null ? String(page.categoryId) : "",
  pagePrice: page?.pagePrice != null ? String(page.pagePrice) : "",
  description: page?.description ?? "",
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
  const [formData, setFormData] = useState(() =>
    getInitialForm(initialValues)
  );

  const [errors, setErrors] = useState({});
  const [editorReady, setEditorReady] = useState(false);

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
    const descriptionText = getPlainText(formData.description);
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

    if (!descriptionText) {
      nextErrors.description = "Page description is required.";
    } else if (descriptionText.length > 400) {
      nextErrors.description =
        "Description cannot exceed 400 visible characters.";
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
      description: formData.description,
    });

    if (succeeded && !isEditing) {
      setFormData({ ...EMPTY_FORM });
      setErrors({});
      setEditorReady(false);
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
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {isEditing ? "Edit page" : "Create a page"}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add a title, category, price, and formatted description.
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
          alignItems="flex-start"
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
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ mb: 1 }}
          >
            Page description *
          </Typography>

          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              "& .cke": {
                width: "100% !important",
                boxSizing: "border-box",
              },
              "& .cke_contents": {
                minHeight: "250px",
              },
            }}
          >
            <CKEditor
              editorUrl="https://cdn.ckeditor.com/4.22.1/standard-all/ckeditor.js"
              initData={formData.description}
              config={{
                height: 250,
                language: "en",
                allowedContent: true,
                toolbar: [
                  {
                    name: "document",
                    items: ["Source", "Preview"],
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
                    items: [
                      "Bold",
                      "Italic",
                      "Underline",
                      "Strike",
                      "RemoveFormat",
                    ],
                  },
                  {
                    name: "paragraph",
                    items: [
                      "NumberedList",
                      "BulletedList",
                      "Outdent",
                      "Indent",
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
                    items: ["Table", "HorizontalRule"],
                  },
                ],
              }}
              onInstanceReady={() => setEditorReady(true)}
              onChange={(event) => {
                const html = event.editor.getData();

                setFormData((previous) => ({
                  ...previous,
                  description: html,
                }));

                setErrors((previous) => ({
                  ...previous,
                  description: "",
                }));
              }}
            />
          </Box>

          {errors.description && (
            <Typography color="error" variant="caption">
              {errors.description}
            </Typography>
          )}

          <Typography
            variant="caption"
            color={
              getPlainText(formData.description).length > 400
                ? "error"
                : "text.secondary"
            }
            sx={{ display: "block", mt: 1 }}
          >
            Maximum 400 visible characters:{" "}
            {getPlainText(formData.description).length}/400
            {!editorReady && " · Loading editor…"}
          </Typography>
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
              onClick={onCancelEdit}
              disabled={submitting}
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
  const [totalPages, setTotalPages] = useState(0);
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
        getAuthConfig()
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
        "error"
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
        Number(body.total ?? body.totalRows ?? body.count ?? list.length)
      );
      setTotalPages(Number(body.totalPages ?? 0));
    } catch (error) {
      setPages([]);
      setTotalRows(0);
      setTotalPages(0);

      showNotice(
        `Unable to load pages. ${getErrorMessage(error)}`,
        "error"
      );
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

        await axios.put(
          `${API_URL}/pages/${id}`,
          formData,
          getAuthConfig()
        );

        showNotice("Page updated successfully.");
        setEditingPage(null);
      } else {
        await axios.post(
          `${API_URL}/pages`,
          formData,
          getAuthConfig()
        );

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
        getAuthConfig()
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
      (item) => String(getCategoryId(item)) === String(categoryId)
    );

    return category ? getCategoryName(category) : "—";
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#f5f6fa",
        minHeight: "100vh",
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
            lg: "minmax(360px, 0.9fr) minmax(0, 1.3fr)",
          },
          alignItems: "start",
          gap: 3,
        }}
      >
        {/* LEFT: CREATE / EDIT FORM */}
        <Box>
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
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            minWidth: 0,
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

            <Tooltip title="Refresh pages">
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => setRefreshKey((previous) => previous + 1)}
              >
                Refresh
              </Button>
            </Tooltip>
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
                      <Typography fontWeight={600}>
                        No pages found.
                      </Typography>

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
                    <TableRow
                      hover
                      key={getPageId(page)}
                    >
                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography fontWeight={600}>
                          {page.title}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Created: {formatDate(page.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {getCategoryLabel(page.categoryId)}
                      </TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        ₹{Number(page.pagePrice || 0).toFixed(2)}
                      </TableCell>

                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          <Tooltip title="Edit page">
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(page)}
                              aria-label={`Edit ${page.title}`}
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                          </Tooltip>

                          <Tooltip title="Delete page">
                            <Button
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(page)}
                              aria-label={`Delete ${page.title}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                        </Stack>
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

          {totalPages > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "right" }}
            >
              API pages: {totalPages}
            </Typography>
          )}
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
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
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
