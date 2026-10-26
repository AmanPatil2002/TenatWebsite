import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const EMPTY_PAGE = {
  title: "",
  slug: "",
  pageType: "custom",
  parentId: "",
  content: "[]",
};
const EMPTY_THEME = {
  name: "",
  type: "default",
  settings: '{\n  "primary": "#1976d2",\n  "background": "#ffffff"\n}',
  isDefault: false,
};

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function TemplateContentEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [pages, setPages] = useState([]);
  const [themes, setThemes] = useState([]);
  const [pageForm, setPageForm] = useState(EMPTY_PAGE);
  const [themeForm, setThemeForm] = useState(EMPTY_THEME);
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingThemeId, setEditingThemeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const auth = headers();
      const [templateResponse, pagesResponse, themesResponse] =
        await Promise.all([
          axios.get(`${API}/templates/admin/${templateId}`, { headers: auth }),
          axios.get(`${API}/templates/${templateId}/pages`, { headers: auth }),
          axios.get(`${API}/templates/${templateId}/themes`, { headers: auth }),
        ]);
      setTemplate(templateResponse.data);
      setPages(Array.isArray(pagesResponse.data) ? pagesResponse.data : []);
      setThemes(Array.isArray(themesResponse.data) ? themesResponse.data : []);
    } catch (loadError) {
      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Could not load template content.",
      );
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const savePage = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    let content;
    try {
      content = JSON.parse(pageForm.content || "[]");
    } catch {
      setError("Page content must be valid JSON.");
      return;
    }
    const payload = {
      title: pageForm.title.trim(),
      slug: pageForm.slug.trim().toLowerCase(),
      pageType: pageForm.pageType.trim(),
      parentId: pageForm.parentId || null,
      content,
    };
    if (!payload.title || !payload.slug || !payload.pageType) {
      setError("Title, slug, and page type are required.");
      return;
    }
    setSaving(true);
    try {
      const url = `${API}/templates/${templateId}/pages`;
      if (editingPageId) {
        await axios.put(`${url}/${editingPageId}`, payload, {
          headers: headers(),
        });
      } else {
        await axios.post(url, payload, { headers: headers() });
      }
      setPageForm(EMPTY_PAGE);
      setEditingPageId(null);
      setNotice(
        editingPageId ? "Template page updated." : "Template page added.",
      );
      await loadData();
    } catch (saveError) {
      setError(
        saveError.response?.data?.message || "Could not save this page.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveTheme = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    let settings;
    try {
      settings = JSON.parse(themeForm.settings || "{}");
    } catch {
      setError("Theme settings must be valid JSON.");
      return;
    }
    if (!settings || Array.isArray(settings) || typeof settings !== "object") {
      setError("Theme settings must be a JSON object.");
      return;
    }
    if (!themeForm.name.trim()) {
      setError("Theme name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: themeForm.name.trim(),
        settings,
        type: themeForm.type,
        isDefault: themeForm.isDefault,
      };
      const url = `${API}/templates/${templateId}/themes`;
      if (editingThemeId) {
        await axios.put(`${url}/${editingThemeId}`, payload, {
          headers: headers(),
        });
      } else {
        await axios.post(url, payload, { headers: headers() });
      }
      setThemeForm(EMPTY_THEME);
      setEditingThemeId(null);
      setNotice(
        editingThemeId ? "Template theme updated." : "Template theme added.",
      );
      await loadData();
    } catch (saveError) {
      setError(
        saveError.response?.data?.message || "Could not save this theme.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (kind, item) => {
    if (!window.confirm(`Delete ${kind} "${item.title || item.name}"?`)) return;
    setError("");
    setNotice("");
    try {
      await axios.delete(
        `${API}/templates/${templateId}/${kind === "page" ? "pages" : "themes"}/${item.id}`,
        { headers: headers() },
      );
      if (kind === "page" && String(editingPageId) === String(item.id)) {
        setEditingPageId(null);
        setPageForm(EMPTY_PAGE);
      }
      if (kind === "theme" && String(editingThemeId) === String(item.id)) {
        setEditingThemeId(null);
        setThemeForm(EMPTY_THEME);
      }
      setNotice(`${kind === "page" ? "Page" : "Theme"} deleted.`);
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError.response?.data?.message || `Could not delete this ${kind}.`,
      );
    }
  };

  const editPage = (page) => {
    setEditingPageId(page.id);
    setPageForm({
      title: page.title || "",
      slug: page.slug || "",
      pageType: page.pageType || "custom",
      parentId: page.parentId == null ? "" : String(page.parentId),
      content: JSON.stringify(parseJson(page.content, []), null, 2),
    });
  };

  const editTheme = (theme) => {
    setEditingThemeId(theme.id);
    setThemeForm({
      name: theme.name || "",
      type: theme.type || "default",
      settings: JSON.stringify(parseJson(theme.settings, {}), null, 2),
      isDefault: Boolean(theme.isDefault),
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Template content
          </Typography>
          <Typography color="text.secondary">
            {template?.name} · add the pages and themes copied to each purchased
            site.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/admin/projects")}>
          Back to templates
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              {editingPageId ? "Edit page" : "Add a page"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use a parent page to create a one-level subpage.
            </Typography>
            <Box component="form" onSubmit={savePage}>
              <Stack spacing={2}>
                <TextField
                  label="Page title"
                  required
                  value={pageForm.title}
                  onChange={(event) =>
                    setPageForm({ ...pageForm, title: event.target.value })
                  }
                />
                <TextField
                  label="Slug"
                  required
                  value={pageForm.slug}
                  onChange={(event) =>
                    setPageForm({
                      ...pageForm,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  helperText="Lowercase letters, numbers, and hyphens."
                />
                <TextField
                  select
                  label="Parent page"
                  value={pageForm.parentId}
                  onChange={(event) =>
                    setPageForm({ ...pageForm, parentId: event.target.value })
                  }
                >
                  <MenuItem value="">Top-level page</MenuItem>
                  {pages
                    .filter(
                      (page) =>
                        page.parentId == null &&
                        String(page.id) !== String(editingPageId),
                    )
                    .map((page) => (
                      <MenuItem key={page.id} value={String(page.id)}>
                        {page.title}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  label="Page type"
                  value={pageForm.pageType}
                  onChange={(event) =>
                    setPageForm({ ...pageForm, pageType: event.target.value })
                  }
                />
                <TextField
                  label="Page content (JSON)"
                  multiline
                  minRows={6}
                  value={pageForm.content}
                  onChange={(event) =>
                    setPageForm({ ...pageForm, content: event.target.value })
                  }
                  slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : editingPageId
                        ? "Save page"
                        : "Add page"}
                  </Button>
                  {editingPageId && (
                    <Button
                      onClick={() => {
                        setEditingPageId(null);
                        setPageForm(EMPTY_PAGE);
                      }}
                    >
                      Cancel edit
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Paper>

          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Template pages
            </Typography>
            {!pages.length ? (
              <Typography color="text.secondary">No pages yet.</Typography>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {pages.map((page) => (
                  <Stack
                    key={page.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={600}>
                        {page.parentId ? "↳ " : ""}
                        {page.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /{page.slug} · {page.pageType}
                      </Typography>
                    </Box>
                    <Stack direction="row">
                      <Button
                        size="small"
                        aria-label={`Edit ${page.title}`}
                        onClick={() => editPage(page)}
                      >
                        <EditIcon fontSize="small" />
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        aria-label={`Delete ${page.title}`}
                        onClick={() => deleteItem("page", page)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              Themes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The default theme becomes active when a client buys this template.
            </Typography>
            <Box component="form" onSubmit={saveTheme}>
              <Stack spacing={2}>
                <TextField
                  label="Theme name"
                  required
                  value={themeForm.name}
                  onChange={(event) =>
                    setThemeForm({ ...themeForm, name: event.target.value })
                  }
                />
                <TextField
                  select
                  label="Theme type"
                  value={themeForm.type}
                  onChange={(event) =>
                    setThemeForm({ ...themeForm, type: event.target.value })
                  }
                >
                  {["default", "dark", "custom"].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Theme settings (JSON)"
                  multiline
                  minRows={6}
                  value={themeForm.settings}
                  onChange={(event) =>
                    setThemeForm({ ...themeForm, settings: event.target.value })
                  }
                  slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={themeForm.isDefault}
                      onChange={(event) =>
                        setThemeForm({
                          ...themeForm,
                          isDefault: event.target.checked,
                        })
                      }
                    />
                  }
                  label="Default theme for new sites"
                />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : editingThemeId
                        ? "Save theme"
                        : "Add theme"}
                  </Button>
                  {editingThemeId && (
                    <Button
                      onClick={() => {
                        setEditingThemeId(null);
                        setThemeForm(EMPTY_THEME);
                      }}
                    >
                      Cancel edit
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Paper>

          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Template themes
            </Typography>
            {!themes.length ? (
              <Typography color="text.secondary">
                No themes yet. Add one before publishing if you want buyers to
                choose styles.
              </Typography>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {themes.map((theme) => (
                  <Stack
                    key={theme.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={600}>{theme.name}</Typography>
                        {Boolean(theme.isDefault) && (
                          <Chip size="small" color="primary" label="Default" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {theme.type}
                      </Typography>
                    </Box>
                    <Stack direction="row">
                      <Button
                        size="small"
                        aria-label={`Edit ${theme.name}`}
                        onClick={() => editTheme(theme)}
                      >
                        <EditIcon fontSize="small" />
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        aria-label={`Delete ${theme.name}`}
                        onClick={() => deleteItem("theme", theme)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
