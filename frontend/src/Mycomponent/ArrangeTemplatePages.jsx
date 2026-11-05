import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

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
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.2, color: "text.secondary" }}
        >
          Admin · Templates
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          Arrange Template Pages
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Choose a template and arrange its pages. This order appears to clients
          when they view the template and is used when a site is purchased.
          Clients can later reorder pages in their site admin panel.
        </Typography>
      </Box>

      {/* Alerts */}
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

      {loading ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 260,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Template selector card */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <TextField
              select
              label="Select template"
              value={selectedId}
              onChange={selectTemplate}
              disabled={!templates.length || saving}
              fullWidth
              size="small"
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
          </Paper>

          {!templates.length ? (
            <Alert severity="info">
              No templates are available to arrange yet.
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              {/* Card header / action bar */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                  px: 2,
                  py: 1.75,
                  bgcolor: "grey.50",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <FormatListNumberedIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      noWrap
                      sx={{ minWidth: 0 }}
                    >
                      {selectedTemplate?.name || "Template"} pages
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Reordering does not change which pages are included or
                    optional.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                  }}
                >
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={saveOrder}
                    disabled={!dirty || saving}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {saving ? "Saving..." : "Save order"}
                  </Button>
                </Box>
              </Box>

              <Divider />

              {/* Page list */}
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {pages.length ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {pages.map((page, index) => {
                      const id = getPageId(page);
                      return (
                        <Box
                          key={id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 1, sm: 1.5 },
                            px: { xs: 1, sm: 1.5 },
                            py: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1.5,
                            bgcolor: "background.paper",
                            transition: "background-color 120ms ease",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          {/* Index badge */}
                          <Box
                            sx={{
                              flex: "0 0 auto",
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {index + 1}
                          </Box>

                          {/* Title */}
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            sx={{
                              flex: "1 1 auto",
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {page.title || "Untitled page"}
                          </Typography>

                          {/* Move controls */}
                          <Box
                            sx={{
                              flex: "0 0 auto",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="Move up">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`Move ${
                                    page.title || "page"
                                  } up`}
                                  disabled={saving || index === 0}
                                  onClick={() => movePage(index, -1)}
                                  sx={{
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                  }}
                                >
                                  <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move down">
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`Move ${
                                    page.title || "page"
                                  } down`}
                                  disabled={
                                    saving || index === pages.length - 1
                                  }
                                  onClick={() => movePage(index, 1)}
                                  sx={{
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                  }}
                                >
                                  <ArrowDownwardIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body2">
                      This template has no pages assigned.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}