import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const getTemplates = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.templates)) return data.templates;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getPageId = (page) => page.pagesId ?? page.id;

const getOrderedPages = (template) =>
  (Array.isArray(template?.pages) ? template.pages : [])
    .slice()
    .sort(
      (first, second) =>
        Number(first.sortOrder ?? 0) - Number(second.sortOrder ?? 0),
    );

export default function ArrangeTemplatePages() {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => String(template.templateId ?? template.id) === selectedId,
      ),
    [templates, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getToken();
        const { data } = await axios.get(`${API_URL}/templates/admin/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (cancelled) return;
        const list = getTemplates(data);
        setTemplates(list);
        const firstTemplate = list[0];
        const firstId = firstTemplate
          ? String(firstTemplate.templateId ?? firstTemplate.id)
          : "";
        setSelectedId(firstId);
        setPages(getOrderedPages(firstTemplate));
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Could not load templates. Check your admin access and try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTemplate = (event) => {
    const id = event.target.value;
    const template = templates.find(
      (item) => String(item.templateId ?? item.id) === id,
    );
    setSelectedId(id);
    setPages(getOrderedPages(template));
    setDirty(false);
    setError("");
    setNotice("");
  };

  const movePage = (index, offset) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];
    setPages(reordered);
    setDirty(true);
    setError("");
    setNotice("");
  };

  const saveOrder = async () => {
    if (!selectedTemplate || !dirty || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/templates/${selectedId}/pages/order`,
        { pageIds: pages.map((page) => String(getPageId(page))) },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      setTemplates((current) =>
        current.map((template) =>
          String(template.templateId ?? template.id) === selectedId
            ? {
                ...template,
                pages: pages.map((page, sortOrder) => ({
                  ...page,
                  sortOrder,
                })),
              }
            : template,
        ),
      );
      setDirty(false);
      setNotice("Template page order saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save this template's page order.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Arrange template pages
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose a template and arrange its pages. This order appears to clients
        when they view the template and is used when a site is purchased.
        Clients can later reorder pages in their site admin panel.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          <TextField
            select
            label="Template"
            value={selectedId}
            onChange={selectTemplate}
            disabled={!templates.length || saving}
            fullWidth
          >
            {templates.map((template) => {
              const id = String(template.templateId ?? template.id);
              return (
                <MenuItem key={id} value={id}>
                  {template.name || `Template ${id}`}
                </MenuItem>
              );
            })}
          </TextField>

          {!templates.length ? (
            <Alert severity="info">
              No templates are available to arrange yet.
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedTemplate?.name} pages
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reordering does not change which pages are included or
                    optional.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  onClick={saveOrder}
                  disabled={!dirty || saving}
                >
                  {saving ? "Saving..." : "Save order"}
                </Button>
              </Stack>

              {pages.length ? (
                <Stack spacing={1}>
                  {pages.map((page, index) => {
                    const id = getPageId(page);
                    const isDefault =
                      page.isDefault === true ||
                      page.isDefault === 1 ||
                      page.isDefault === "1";
                    return (
                      <Paper
                        key={id}
                        variant="outlined"
                        sx={{ p: 1.5 }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Typography
                            color="text.secondary"
                            sx={{ minWidth: 32, textAlign: "center" }}
                          >
                            {index + 1}
                          </Typography>
                          <Typography sx={{ flexGrow: 1, minWidth: 0 }}>
                            {page.title || "Untitled page"}
                          </Typography>
                          <Chip
                            size="small"
                            color={isDefault ? "primary" : "default"}
                            label={isDefault ? "Included" : "Optional"}
                          />
                          <Stack>
                            <IconButton
                              size="small"
                              aria-label={`Move ${page.title} up`}
                              disabled={saving || index === 0}
                              onClick={() => movePage(index, -1)}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              aria-label={`Move ${page.title} down`}
                              disabled={saving || index === pages.length - 1}
                              onClick={() => movePage(index, 1)}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  This template has no pages assigned.
                </Typography>
              )}
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
}
