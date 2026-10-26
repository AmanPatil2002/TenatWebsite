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
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const NEW_PAGE = {
  title: "",
  slug: "",
  pageType: "custom",
  parentId: "",
  pageLink: "",
  content: "[]",
  isPublished: true,
};
const NEW_THEME = {
  name: "",
  type: "custom",
  settings: '{\n  "primary": "#1976d2",\n  "background": "#ffffff"\n}',
};

const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const decodeJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function SiteEditor() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [themes, setThemes] = useState([]);
  const [pageForm, setPageForm] = useState(NEW_PAGE);
  const [themeForm, setThemeForm] = useState(NEW_THEME);
  const [editingPage, setEditingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const userRole = localStorage.getItem("role") || "client";
  const canManageSiteAssets = userRole === "admin" || userRole === "superadmin";

  const loadSiteData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [siteResponse, pagesResponse, themesResponse] = await Promise.all([
        axios.get(`${API}/site/${siteId}`, { headers: auth() }),
        axios.get(`${API}/site/${siteId}/pages`, { headers: auth() }),
        axios.get(`${API}/site/${siteId}/themes`, { headers: auth() }),
      ]);
      setSite(siteResponse.data);
      setPages(Array.isArray(pagesResponse.data) ? pagesResponse.data : []);
      setThemes(Array.isArray(themesResponse.data) ? themesResponse.data : []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Could not load your site settings.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadSiteData();
  }, [loadSiteData]);

  const savePage = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
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
      pageType: pageForm.pageType.trim() || "custom",
      content,
      pageLink: pageForm.pageLink.trim() || null,
      isPublished: pageForm.isPublished,
    };
    if (!payload.title || !payload.slug) {
      setError("Page title and slug are required.");
      return;
    }
    setSavingPage(true);
    try {
      const endpoint = editingPage
        ? `${API}/site/${siteId}/${editingPage.recordType === "subPage" ? "sub-pages" : "pages"}/${editingPage.id}`
        : pageForm.parentId
          ? `${API}/site/${siteId}/sub-pages`
          : `${API}/site/${siteId}/pages`;
      if (editingPage) {
        await axios.put(endpoint, payload, { headers: auth() });
      } else {
        await axios.post(endpoint, { ...payload, parentId: pageForm.parentId || null }, { headers: auth() });
      }
      setPageForm(NEW_PAGE);
      setEditingPage(null);
      setMessage(editingPage ? "Page updated." : "Page added to your site.");
      await loadSiteData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Could not save this page.");
    } finally {
      setSavingPage(false);
    }
  };

  const saveTheme = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
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
    setSavingTheme(true);
    try {
      const response = await axios.post(
        `${API}/site/${siteId}/themes`,
        { ...themeForm, name: themeForm.name.trim(), settings },
        { headers: auth() },
      );
      await axios.patch(
        `${API}/site/${siteId}/themes/${response.data.id}/activate`,
        {},
        { headers: auth() },
      );
      setThemeForm(NEW_THEME);
      setMessage("Your custom theme was created and activated.");
      await loadSiteData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Could not create the theme.");
    } finally {
      setSavingTheme(false);
    }
  };

  const activateTheme = async (theme) => {
    setError("");
    setMessage("");
    setActivatingId(theme.id);
    try {
      await axios.patch(
        `${API}/site/${siteId}/themes/${theme.id}/activate`,
        {},
        { headers: auth() },
      );
      setMessage(`${theme.name} is now active.`);
      await loadSiteData();
    } catch (activationError) {
      setError(activationError.response?.data?.message || "Could not change the active theme.");
    } finally {
      setActivatingId(null);
    }
  };

  const editPage = (page) => {
    setEditingPage(page);
    setPageForm({
      title: page.title || "",
      slug: page.slug || "",
      pageType: page.pageType || "custom",
      parentId: page.parentId == null ? "" : String(page.parentId),
      pageLink: page.pageLink || "",
      content: JSON.stringify(decodeJson(page.content, []), null, 2),
      isPublished: Boolean(page.isPublished),
    });
  };

  const deletePage = async (page) => {
    if (!window.confirm(`Delete "${page.title}"?`)) return;
    setError("");
    setMessage("");
    try {
      const section = page.recordType === "subPage" ? "sub-pages" : "pages";
      await axios.delete(`${API}/site/${siteId}/${section}/${page.id}`, { headers: auth() });
      if (editingPage && String(editingPage.id) === String(page.id)) {
        setEditingPage(null);
        setPageForm(NEW_PAGE);
      }
      setMessage("Page deleted.");
      await loadSiteData();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Could not delete this page.");
    }
  };

  if (loading) {
    return <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ bgcolor: "#f7f8fb", minHeight: "100vh", py: { xs: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>{site?.name || "Manage site"}</Typography>
            <Typography color="text.secondary">Customize the theme and pages for this site.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate(`/mysite/${siteId}/preview`)}>Preview site</Button>
            <Button variant="outlined" onClick={() => navigate("/mysite")}>Back to my sites</Button>
          </Stack>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Choose a theme</Typography>
              {!themes.length ? (
                <Typography color="text.secondary">There are no available themes yet.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {themes.map((theme) => (
                    <Paper key={theme.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Box>
                          <Typography fontWeight={600}>{theme.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{theme.type}</Typography>
                        </Box>
                        {Boolean(theme.isActive) ? <Chip label="Active" color="success" size="small" /> : (
                          <Button size="small" variant="outlined" disabled={activatingId != null} onClick={() => activateTheme(theme)}>
                            {String(activatingId) === String(theme.id) ? "Applying…" : "Use theme"}
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
              {!canManageSiteAssets && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Purchased clients can select and apply an available theme for this site. Theme creation stays with the admin.
                </Typography>
              )}
            </Paper>

            {canManageSiteAssets && (
              <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700}>Create a custom theme</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Add a theme configuration and activate it for this site.</Typography>
                <Box component="form" onSubmit={saveTheme}>
                  <Stack spacing={2}>
                    <TextField label="Theme name" required value={themeForm.name} onChange={(event) => setThemeForm({ ...themeForm, name: event.target.value })} />
                    <TextField select label="Theme type" value={themeForm.type} onChange={(event) => setThemeForm({ ...themeForm, type: event.target.value })}>
                      {["default", "dark", "custom"].map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                    </TextField>
                    <TextField label="Settings (JSON)" multiline minRows={5} value={themeForm.settings} onChange={(event) => setThemeForm({ ...themeForm, settings: event.target.value })} slotProps={{ input: { sx: { fontFamily: "monospace" } } }} />
                    <Button type="submit" variant="contained" disabled={savingTheme}>{savingTheme ? "Saving…" : "Create and activate theme"}</Button>
                  </Stack>
                </Box>
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            {canManageSiteAssets ? (
              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>{editingPage ? "Edit page" : "Add a page"}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>New pages are private to this site and do not change the original template.</Typography>
                <Box component="form" onSubmit={savePage}>
                  <Stack spacing={2}>
                    <TextField label="Page title" required value={pageForm.title} onChange={(event) => setPageForm({ ...pageForm, title: event.target.value })} />
                    <TextField label="Slug" required value={pageForm.slug} onChange={(event) => setPageForm({ ...pageForm, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} helperText="Use lowercase letters, numbers, and hyphens." />
                    {!editingPage && (
                      <TextField select label="Parent page (optional)" value={pageForm.parentId} onChange={(event) => setPageForm({ ...pageForm, parentId: event.target.value })}>
                        <MenuItem value="">Top-level page</MenuItem>
                        {pages.filter((page) => page.recordType === "page").map((page) => <MenuItem key={page.id} value={String(page.id)}>{page.title}</MenuItem>)}
                      </TextField>
                    )}
                    <TextField label="Page type" value={pageForm.pageType} onChange={(event) => setPageForm({ ...pageForm, pageType: event.target.value })} />
                    <TextField label="Page link (optional)" value={pageForm.pageLink} onChange={(event) => setPageForm({ ...pageForm, pageLink: event.target.value })} />
                    <TextField label="Content (JSON)" multiline minRows={5} value={pageForm.content} onChange={(event) => setPageForm({ ...pageForm, content: event.target.value })} slotProps={{ input: { sx: { fontFamily: "monospace" } } }} />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Published</Typography>
                      <Switch checked={pageForm.isPublished} onChange={(event) => setPageForm({ ...pageForm, isPublished: event.target.checked })} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button type="submit" variant="contained" disabled={savingPage}>{savingPage ? "Saving…" : editingPage ? "Save page" : "Add page"}</Button>
                      {editingPage && <Button onClick={() => { setEditingPage(null); setPageForm(NEW_PAGE); }}>Cancel edit</Button>}
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Site pages</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Purchased clients can select the available page set for this site. New page creation remains admin-managed.
                </Typography>
              </Paper>
            )}

            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Site pages</Typography>
              {!pages.length ? <Typography color="text.secondary">No pages found for this site.</Typography> : (
                <Stack divider={<Divider flexItem />} spacing={1}>
                  {pages.map((page) => (
                    <Stack key={`${page.recordType}:${page.id}`} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1} sx={{ py: 1 }}>
                      <Box>
                        <Typography fontWeight={600}>{page.recordType === "subPage" ? "↳ " : ""}{page.title}</Typography>
                        <Typography variant="body2" color="text.secondary">/{page.slug} · {page.pageType}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={page.isPublished ? "Published" : "Draft"} size="small" color={page.isPublished ? "success" : "default"} />
                        {canManageSiteAssets && (
                          <>
                            <Button size="small" onClick={() => editPage(page)}>Edit</Button>
                            <Button size="small" color="error" onClick={() => deletePage(page)}>Delete</Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
