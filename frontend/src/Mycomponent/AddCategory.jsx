import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  ListSubheader,
  MenuItem,
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

/* ------------------------------------------------------------------ *
 * PACK CATALOG — single source of truth.
 *  - `key`   : the raw value stored in categories.packKey (API contract)
 *  - `label` : human-friendly label shown in the dropdown and chips
 *  - `group` : subheader used to group the dropdown into sections
 * Ordered by domain so the dropdown reads naturally.
 * ------------------------------------------------------------------ */

const PACK_CATALOG = [
  // --- Education -------------------------------------------------
  { key: "school",          label: "School / Education",     group: "Education" },
  { key: "daycare",         label: "Daycare / Preschool",    group: "Education" },

  // --- Health & Medical ------------------------------------------
  { key: "medical",         label: "Medical / Clinic",       group: "Health & Medical" },
  { key: "dental",          label: "Dental Clinic",          group: "Health & Medical" },
  { key: "petcare",         label: "Pet Care / Veterinary",  group: "Health & Medical" },

  // --- Wellness & Beauty -----------------------------------------
  { key: "spa",             label: "Spa & Massage",          group: "Wellness & Beauty" },
  { key: "salon",           label: "Beauty & Salon",         group: "Wellness & Beauty" },
  { key: "gym",             label: "Fitness & Gym",          group: "Wellness & Beauty" },

  // --- Commerce & Retail -----------------------------------------
  { key: "ecommerce",       label: "E-commerce / Shopping",  group: "Commerce & Retail" },
  { key: "grocery",         label: "Grocery & Supermarket",  group: "Commerce & Retail" },
  { key: "jewelry",         label: "Jewelry & Accessories",  group: "Commerce & Retail" },
  { key: "furniture",       label: "Furniture & Home Decor", group: "Commerce & Retail" },
  { key: "agriculture",     label: "Agriculture & Farming",  group: "Commerce & Retail" },

  // --- Food & Hospitality ----------------------------------------
  { key: "restaurant",      label: "Restaurant & Food",      group: "Food & Hospitality" },
  { key: "cafe",            label: "Café & Coffee Shop",     group: "Food & Hospitality" },
  { key: "hotel",           label: "Hotel & Resort",         group: "Food & Hospitality" },

  // --- Professional Services -------------------------------------
  { key: "lawfirm",         label: "Legal / Law Firm",       group: "Professional Services" },
  { key: "consulting",      label: "Consulting & Business",  group: "Professional Services" },
  { key: "finance",         label: "Finance & Banking",      group: "Professional Services" },
  { key: "marketing",       label: "Digital Marketing",      group: "Professional Services" },
  { key: "realestate",      label: "Real Estate & Property", group: "Professional Services" },
  { key: "interiordesign",  label: "Interior Design",        group: "Professional Services" },

  // --- Events & Media --------------------------------------------
  { key: "eventmanagement", label: "Wedding & Events",       group: "Events & Media" },
  { key: "news",            label: "News & Magazine",        group: "Events & Media" },
  { key: "blog",            label: "Blog & Personal",        group: "Events & Media" },
  { key: "portfolio",       label: "Portfolio & Creative",   group: "Events & Media" },
  { key: "music",           label: "Music & Entertainment",  group: "Events & Media" },
  { key: "streaming",       label: "Movies & Streaming",     group: "Events & Media" },
  { key: "gaming",          label: "Gaming & Esports",       group: "Events & Media" },

  // --- Apps & Technology -----------------------------------------
  { key: "mobileapps",      label: "Mobile Applications",    group: "Apps & Technology" },

  // --- Community -------------------------------------------------
  { key: "ngo",             label: "Non-profit & Charity",   group: "Community" },
];

/* Fast lookups derived once from the catalog. */
const PACK_BY_KEY = new Map(PACK_CATALOG.map((p) => [p.key, p]));
const PACK_GROUPS = (() => {
  const order = [];
  const map = new Map();
  for (const p of PACK_CATALOG) {
    if (!map.has(p.group)) {
      map.set(p.group, []);
      order.push(p.group);
    }
    map.get(p.group).push(p);
  }
  return order.map((group) => ({ group, items: map.get(group) }));
})();

/* Turn a raw key into a display label. Falls back to a prettified
 * version of the key so legacy values (e.g. "generic") still render. */
const titleCase = (s) =>
  s
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const packLabel = (key) => {
  if (!key) return null;
  const hit = PACK_BY_KEY.get(key);
  return hit ? hit.label : titleCase(key);
};

// Limits mirror the controller and the categories table columns.
const NAME_MAX = 190; // name    VARCHAR(190)
const PACK_KEY_MAX = 30; // packKey VARCHAR(30)
const TAG_MAX = 500; // tag     VARCHAR(500)

const getInitialForm = () => ({ name: "", packKey: "", tag: "" });

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 } };

const headCellSx = {
  fontWeight: 700,
  bgcolor: alpha(BRAND.indigo, 0.04),
  color: BRAND.ink,
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

/* Pretty chip that renders a pack key using its label. */
function PackChip({ packKey }) {
  if (!packKey) {
    return (
      <Typography variant="caption" sx={{ color: BRAND.muted }}>
        No pack key
      </Typography>
    );
  }
  return (
    <Chip
      size="small"
      variant="outlined"
      label={packLabel(packKey)}
      title={packKey} /* hover shows the raw key */
      sx={{
        mt: 0.5,
        maxWidth: "100%",
        borderColor: alpha(BRAND.indigo, 0.35),
        color: BRAND.indigoDeep,
        fontWeight: 600,
        fontSize: "0.72rem",
        "& .MuiChip-label": {
          display: "block",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          py: 0.25,
        },
      }}
    />
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
    const packKey = formData.packKey.trim();
    const tag = formData.tag.trim();

    if (!name) errs.name = "Category name is required";
    else if (name.length > NAME_MAX)
      errs.name = `Name must be ${NAME_MAX} characters or fewer`;

    if (packKey.length > PACK_KEY_MAX)
      errs.packKey = `Pack key must be ${PACK_KEY_MAX} characters or fewer`;

    if (tag.length > TAG_MAX)
      errs.tag = `Tag must be ${TAG_MAX} characters or fewer`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    onSubmit({
      name: formData.name.trim(),
      packKey: formData.packKey.trim(),
      tag: formData.tag.trim(),
    });
  };

  /* If the current value isn't in the catalog (legacy row), surface it
   * under a "Legacy" group so admins can see/fix it. */
  const legacyValue =
    formData.packKey && !PACK_BY_KEY.has(formData.packKey)
      ? formData.packKey
      : null;

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
          autoComplete="off"
          sx={fieldSx}
        />

        <TextField
          select
          fullWidth
          size="small"
          name="packKey"
          label="Pack key"
          value={formData.packKey}
          onChange={handleChange}
          error={!!errors.packKey}
          helperText={
            errors.packKey || "Template pack used to build this category's site"
          }
          sx={fieldSx}
          slotProps={{
            select: {
              displayEmpty: true,
              inputProps: { "aria-label": "Template pack key" },
              renderValue: (v) =>
                v ? packLabel(v) : <em style={{ color: BRAND.muted }}>None</em>,
              MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
            },
            inputLabel: { shrink: true },
          }}
        >
          {/* <MenuItem value="">
            <em>None</em>
          </MenuItem> */}

          {legacyValue && (
            <ListSubheader sx={{ bgcolor: "background.paper" }}>
              Legacy
            </ListSubheader>
          )}
          {legacyValue && (
            <MenuItem value={legacyValue}>
              {titleCase(legacyValue)}{" "}
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 1, color: BRAND.muted }}
              >
                ({legacyValue})
              </Typography>
            </MenuItem>
          )}

          {PACK_GROUPS.map(({ group, items }) => [
            <ListSubheader
              key={`grp-${group}`}
              sx={{ bgcolor: "background.paper", fontWeight: 700 }}
            >
              {group}
            </ListSubheader>,
            ...items.map((p) => (
              <MenuItem key={p.key} value={p.key}>
                {p.label}
              </MenuItem>
            )),
          ])}
        </TextField>

        <TextField
          fullWidth
          size="small"
          name="tag"
          label="Tag (optional)"
          value={formData.tag}
          onChange={handleChange}
          error={!!errors.tag}
          helperText={errors.tag || "Comma-separated, e.g. education, courses"}
          autoComplete="off"
          slotProps={{ htmlInput: { maxLength: TAG_MAX } }}
          sx={fieldSx}
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
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const token = getToken();
    if (!token) {
      showSnack("Please log in first.", "error");
      setDeleteTarget(null);
      return;
    }

    try {
      setDeletingId(deleteTarget.categoryId);
      await axios.delete(`${API_URL}/categories/${deleteTarget.categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnack("Category deleted successfully.");
      if (editingId === deleteTarget.categoryId) setEditingId(null);
      setDeleteTarget(null);
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

  const editingCategory = useMemo(
    () =>
      editingId != null
        ? categories.find((c) => c.categoryId === editingId)
        : null,
    [categories, editingId],
  );

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
                    sx={{
                      fontWeight: 700,
                      color: BRAND.ink,
                      lineHeight: 1.25,
                    }}
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
                        packKey: editingCategory.packKey || "",
                        tag: editingCategory.tag || "",
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
              <Box sx={{ mb: 2 }}>
                <SectionLabel>Existing categories</SectionLabel>
                <Typography variant="body2" sx={{ color: BRAND.muted }}>
                  {categories.length > 0
                    ? `${categories.length} categor${
                        categories.length === 1 ? "y" : "ies"
                      } available`
                    : "No categories yet."}
                </Typography>
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
                    sx={{ minWidth: 720, tableLayout: "auto" }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 100, ...headCellSx }}>
                          Name
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            minWidth: 100,
                            whiteSpace: "nowrap",
                            ...headCellSx,
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
                              minWidth: 180,
                              overflowWrap: "anywhere",
                              verticalAlign: "middle",
                              py: 1.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: BRAND.ink,
                                overflowWrap: "anywhere",
                              }}
                            >
                              {c.name}
                            </Typography>
                            <PackChip packKey={c.packKey} />
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
                                    width: 44,
                                    height: 44,
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
                                  onClick={() => setDeleteTarget(c)}
                                  disabled={
                                    submitting || deletingId === c.categoryId
                                  }
                                  sx={{
                                    width: 44,
                                    height: 44,
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
          role="status"
          aria-live="polite"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deletingId && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Category?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ overflowWrap: "anywhere" }}>
            Delete <strong>{deleteTarget?.name}</strong>? Templates linked to
            this category may be affected. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={Boolean(deletingId)}
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={Boolean(deletingId)}
            startIcon={
              deletingId ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}
          >
            {deletingId ? "Deleting…" : "Delete Category"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}