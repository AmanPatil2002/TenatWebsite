import { useCallback, useEffect, useState } from "react";
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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
const THEMES_URL = `${API_URL}/theme`;
const PAGES_URL = `${API_URL}/pages`;

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

const parsePhotos = (photos) => {
  if (Array.isArray(photos)) return photos.filter((p) => typeof p === "string" && p.trim());
  if (typeof photos !== "string" || !photos.trim()) return [];
  try {
    const parsed = JSON.parse(photos);
    if (Array.isArray(parsed)) return parsed.filter((p) => typeof p === "string" && p.trim());
    if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    return [];
  } catch {
    return /^https?:\/\/\S+$/i.test(photos.trim()) ? [photos.trim()] : [];
  }
};

// Convert templatefull `pages` array → { [pagesId]: { isDefault, sortOrder } }
const pagesToMap = (templatePages) => {
  const map = {};
  for (const p of templatePages || []) {
    const id = String(p.pagesId ?? p.id ?? "");
    if (!id) continue;
    map[id] = {
      isDefault: p.isDefault === true || p.isDefault === 1 || p.isDefault === "1" ? 1 : 0,
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
    (t) => t.isDefault === true || t.isDefault === 1 || t.isDefault === "1"
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

export default function ViewTemplate() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [themes, setThemes] = useState([]);
  const [allPages, setAllPages] = useState([]);

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
      const [tplRes, catRes, themeRes, pageRes] = await Promise.all([
        axios.get(`${TEMPLATES_URL}/admin/all`, { headers }),
        axios.get(CATEGORIES_URL, { headers }),
        axios.get(THEMES_URL, { headers }),
        axios.get(PAGES_URL, { headers }),
      ]);
      setTemplates(getArray(tplRes, ["templates"]));
      setCategories(getArray(catRes, ["categories"]));
      setThemes(getArray(themeRes, ["themes"]));
      setAllPages(getArray(pageRes, ["pages"]));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load templates."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openView = (template) => {
    setError(""); setNotice("");
    setSelectedTemplate(template);
    setViewOpen(true);
  };

  const openEdit = async (template) => {
    setError(""); setNotice(""); setSaving(true);
    try {
      const id = getTemplateId(template);
      if (id == null) throw new Error("Template ID was not found.");
      const response = await axios.get(`${TEMPLATES_URL}/admin/${id}`, { headers: getHeaders() });
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
        setError(err.response?.data?.message || err.message || "Unable to open template.");
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
    if (!Number.isFinite(price) || price <= 0) return setError("Price must be greater than 0.");
    if (!Number.isInteger(validityDays) || validityDays < 1) return setError("Validity must be a positive integer.");
    if (form.themeIds.length === 0) return setError("Select at least one theme.");
    if (!form.defaultThemeId || !form.themeIds.includes(String(form.defaultThemeId))) {
      return setError("Choose exactly one default theme.");
    }
    const defaultPageCount = Object.values(form.pages).filter((p) => p.isDefault === 1).length;
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
      photos: form.photos,
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

    setSaving(true); setError(""); setNotice("");
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
    if (id == null) { setError("Cannot delete: missing ID."); setDeleteOpen(false); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      await axios.delete(`${TEMPLATES_URL}/${id}`, { headers: getHeaders() });
      setDeleteOpen(false); setViewOpen(false); setEditOpen(false);
      setSelectedTemplate(null); setNotice("Template deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the template.");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (template) => {
    setSelectedTemplate(template); setDeleteOpen(true); setError(""); setNotice("");
  };
  const closeDelete = () => { if (!saving) setDeleteOpen(false); };

  const renderStatus = (status) => {
    const color = status === "published" ? "success" : status === "archived" ? "default" : "warning";
    return <Chip label={status || "draft"} color={color} size="small" variant="outlined" />;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Template Management</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>View, edit, and delete your website templates.</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>Refresh</Button>
          <Button variant="contained" onClick={() => navigate("/admin/templates")}>Add Template</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
            <Typography color="text.secondary" sx={{ mt: 2 }}>Loading templates...</Typography>
          </Box>
        ) : templates.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="h6">No templates found</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Create a template using the Add Template page.</Typography>
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
                    (item) => String(item.categoryId ?? item.id) === String(categoryId)
                  );
                  return (
                    <TableRow key={id ?? template.name} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {template.thumbnailUrl ? (
                            <Box component="img" src={template.thumbnailUrl} alt={template.name || "Template"}
                              sx={{ width: 64, height: 48, objectFit: "cover", borderRadius: 1, bgcolor: "action.hover" }} />
                          ) : (
                            <Box sx={{ width: 64, height: 48, borderRadius: 1, bgcolor: "action.hover", display: "grid", placeItems: "center" }}>
                              <VisibilityIcon color="disabled" />
                            </Box>
                          )}
                          <Box>
                            <Typography fontWeight={600}>{template.name || "Untitled template"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {category?.name || template.categoryName || "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{template.currency || "INR"} {Number(template.price || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>{renderStatus(template.status)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => openView(template)}>View</Button>
                          <Button size="small" color="primary" startIcon={<EditIcon />} onClick={() => openEdit(template)} disabled={saving}>Edit</Button>
                          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => openDelete(template)} disabled={saving}>Delete</Button>
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

      {/* View dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Template Details</DialogTitle>
        <DialogContent dividers>
          {selectedTemplate && (
            <Stack spacing={2}>
              {selectedTemplate.thumbnailUrl && (
                <Box component="img" src={selectedTemplate.thumbnailUrl} alt={selectedTemplate.name}
                  sx={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 2, bgcolor: "action.hover" }} />
              )}
              <Typography variant="h5" fontWeight={700}>{selectedTemplate.name}</Typography>
              <Divider />
              <Typography><strong>Category:</strong>{" "}
                {categories.find((item) => String(item.categoryId ?? item.id) === String(getCategoryId(selectedTemplate)))?.name || selectedTemplate.categoryName || "—"}
              </Typography>
              <Typography><strong>Price:</strong> {selectedTemplate.currency || "INR"} {Number(selectedTemplate.price || 0).toLocaleString("en-IN")}</Typography>
              <Typography><strong>Validity:</strong> {selectedTemplate.validityDays ?? 365} days</Typography>
              <Typography><strong>Status:</strong> {selectedTemplate.status || "draft"}</Typography>
              <Typography fontWeight={600}>Themes</Typography>
              {Array.isArray(selectedTemplate.themes) && selectedTemplate.themes.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedTemplate.themes.map((t) => (
                    <Chip key={t.themeId} label={`${t.name}${t.isDefault ? " (default)" : ""}`} variant={t.isDefault ? "filled" : "outlined"} color={t.isDefault ? "primary" : "default"} />
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No themes linked.</Typography>
              )}
              <Typography fontWeight={600}>Pages</Typography>
              {Array.isArray(selectedTemplate.pages) && selectedTemplate.pages.length > 0 ? (
                <Stack spacing={0.5}>
                  {selectedTemplate.pages.map((p) => (
                    <Box key={p.pagesId} sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography>{p.title}</Typography>
                      <Chip size="small" label={p.isDefault ? "Included" : `+${selectedTemplate.currency || "INR"} ${Number(p.pagePrice || 0).toFixed(2)}`} color={p.isDefault ? "success" : "warning"} variant="outlined" />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No pages linked.</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => { const t = selectedTemplate; setViewOpen(false); if (t) openEdit(t); }}>Edit Template</Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog — now supports themes + pages */}
      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="md">
        <Box component="form" onSubmit={saveTemplate}>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField label="Template Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} required fullWidth />
              <FormControl fullWidth required>
                <InputLabel id="edit-category-label">Category</InputLabel>
                <Select labelId="edit-category-label" label="Category" value={form.categoryId ?? ""} onChange={(e) => updateField("categoryId", e.target.value)}>
                  {categories.map((c) => {
                    const id = c.categoryId ?? c.id;
                    return <MenuItem key={id} value={String(id)}>{c.name || c.title || `Category ${id}`}</MenuItem>;
                  })}
                </Select>
              </FormControl>

              <TextField label="Short Description" value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} multiline minRows={2} fullWidth />
              <TextField label="Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} multiline minRows={4} fullWidth />
              <TextField label="Thumbnail Image URL" value={form.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} fullWidth />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Price" type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} inputProps={{ min: 0, step: "0.01" }} required fullWidth />
                <TextField label="Currency" value={form.currency} onChange={(e) => updateField("currency", e.target.value)} required fullWidth />
                <TextField label="Validity (days)" type="number" value={form.validityDays} onChange={(e) => updateField("validityDays", e.target.value)} inputProps={{ min: 1, step: 1 }} required fullWidth />
              </Stack>

              <Divider />
              <Typography variant="subtitle1" fontWeight={700}>Themes</Typography>

              <FormControl fullWidth>
                <InputLabel id="edit-themes-label">Themes</InputLabel>
                <Select
                  labelId="edit-themes-label"
                  multiple
                  value={form.themeIds}
                  label="Themes"
                  onChange={handleThemeChange}
                  renderValue={(selected) =>
                    themes.filter((t) => selected.map(String).includes(String(getId(t)))).map((t) => t.name).join(", ")
                  }
                >
                  {themes.map((theme) => (
                    <MenuItem key={getId(theme)} value={String(getId(theme))}>{theme.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {form.themeIds.length > 0 && (
                <FormControl>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Default theme</Typography>
                  <RadioGroup value={String(form.defaultThemeId)} onChange={(e) => updateField("defaultThemeId", e.target.value)}>
                    {themes
                      .filter((t) => form.themeIds.includes(String(getId(t))))
                      .map((t) => (
                        <FormControlLabel key={getId(t)} value={String(getId(t))} control={<Radio size="small" />} label={t.name} />
                      ))}
                  </RadioGroup>
                </FormControl>
              )}

              <Divider />
              <Typography variant="subtitle1" fontWeight={700}>Pages</Typography>

              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Include</TableCell>
                      <TableCell>Page</TableCell>
                      <TableCell align="right">Base price</TableCell>
                      <TableCell align="center">Default</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allPages.map((page) => {
                      const id = String(getId(page));
                      const selected = Boolean(form.pages[id]);
                      const isDefault = form.pages[id]?.isDefault === 1;
                      const price = Number(page.pagePrice ?? page.price ?? 0);
                      return (
                        <TableRow key={id} hover>
                          <TableCell padding="checkbox"><Checkbox checked={selected} onChange={() => togglePage(id)} /></TableCell>
                          <TableCell>{page.title || page.name}</TableCell>
                          <TableCell align="right">{price > 0 ? `${form.currency} ${price.toFixed(2)}` : "Free"}</TableCell>
                          <TableCell align="center">
                            <Switch size="small" checked={isDefault} disabled={!selected} onChange={(e) => setPageDefault(id, e.target.checked)} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>

              <FormControl fullWidth>
                <InputLabel id="edit-status-label">Status</InputLabel>
                <Select labelId="edit-status-label" label="Status" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <EditIcon />}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Template?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedTemplate?.name || "this template"}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDelete} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteTemplate} disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}>
            {saving ? "Deleting..." : "Delete Template"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}