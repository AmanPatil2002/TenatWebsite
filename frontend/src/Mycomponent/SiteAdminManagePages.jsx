import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function SiteAdminManagePages() {
  const { baseUrl, authConfig } = useOutletContext();
  const pagesUrl = `${baseUrl}/pages`;

  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [pageOptions, setPageOptions] = useState([]);
  const [selectedStarter, setSelectedStarter] = useState("");
  const [addingStarter, setAddingStarter] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPages = async (keepSelectedId = "") => {
    const { data } = await axios.get(pagesUrl, authConfig);
    const list = Array.isArray(data.pages) ? data.pages : [];
    setSite(data);
    setPages(list);

    const selected =
      list.find((page) => String(page.sitePageId) === String(keepSelectedId)) ||
      list[0];
    setSelectedId(selected ? String(selected.sitePageId) : "");
    setTitle(selected?.title || "");
    setContent(selected?.page || "");
    setCreating(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [pagesResponse, optionsResponse] = await Promise.all([
          axios.get(pagesUrl, authConfig),
          axios.get(`${baseUrl}/page-options`, authConfig),
        ]);
        if (cancelled) return;
        const list = Array.isArray(pagesResponse.data.pages)
          ? pagesResponse.data.pages
          : [];
        setSite(pagesResponse.data);
        setPages(list);
        setPageOptions(
          Array.isArray(optionsResponse.data) ? optionsResponse.data : [],
        );
        setSelectedId(list[0] ? String(list[0].sitePageId) : "");
        setTitle(list[0]?.title || "");
        setContent(list[0]?.page || "");
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Could not load pages for this site.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, pagesUrl, authConfig]);

  const selectPage = (page) => {
    setSelectedId(String(page.sitePageId));
    setTitle(page.title);
    setContent(page.page);
    setCreating(false);
    setError("");
    setSuccess("");
  };

  const movePage = async (index, offset) => {
    const targetIndex = index + offset;
    if (reordering || targetIndex < 0 || targetIndex >= pages.length) return;

    const reorderedPages = [...pages];
    [reorderedPages[index], reorderedPages[targetIndex]] = [
      reorderedPages[targetIndex],
      reorderedPages[index],
    ];

    setReordering(true);
    setError("");
    setSuccess("");
    try {
      await axios.put(
        `${pagesUrl}/order`,
        { pageIds: reorderedPages.map((page) => String(page.sitePageId)) },
        authConfig,
      );
      setPages(reorderedPages);
      setSuccess("Page order saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not update page order.",
      );
    } finally {
      setReordering(false);
    }
  };

  const startNewPage = () => {
    setSelectedId("");
    setTitle("");
    setContent("");
    setCreating(true);
    setError("");
    setSuccess("");
  };

  const addCategoryPage = async () => {
    if (!selectedStarter || addingStarter) return;
    setAddingStarter(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post(
        pagesUrl,
        { sourcePagesId: selectedStarter },
        authConfig,
      );
      await loadPages(data.sitePageId);
      setPageOptions((current) =>
        current.filter((page) => String(page.pagesId) !== String(selectedStarter)),
      );
      setSelectedStarter("");
      setSuccess(
        `Added a ${site?.categoryName || "category"} page. You can edit it now.`,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not add this category page.",
      );
    } finally {
      setAddingStarter(false);
    }
  };

  const savePage = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Enter a page title and content before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (creating) {
        const { data } = await axios.post(
          pagesUrl,
          { title, page: content },
          authConfig,
        );
        await loadPages(data.sitePageId);
        setSuccess("Custom page created.");
      } else {
        await axios.put(
          `${pagesUrl}/${selectedId}`,
          { title, page: content },
          authConfig,
        );
        await loadPages(selectedId);
        setSuccess("Page changes saved.");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save this page.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
            gap: 2,
            alignItems: "start",
          }}
        >
          {/* Pages list */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" fontWeight={700}>
                Pages
              </Typography>
              <Button size="small" onClick={startNewPage}>
                Add custom page
              </Button>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              Use the arrows to change the order pages appear on your site.
            </Typography>

            {pageOptions.length > 0 && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                <TextField
                  select
                  size="small"
                  label={`Add a ${site?.categoryName || "category"} page`}
                  value={selectedStarter}
                  onChange={(event) => setSelectedStarter(event.target.value)}
                >
                  {pageOptions.map((option) => (
                    <MenuItem key={option.pagesId} value={String(option.pagesId)}>
                      {option.title}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={addCategoryPage}
                  disabled={!selectedStarter || addingStarter}
                >
                  {addingStarter ? "Adding..." : "Add category page"}
                </Button>
              </Stack>
            )}

            <Divider sx={{ mb: 1 }} />
            {pages.map((page, index) => (
              <Stack
                key={page.sitePageId}
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ mb: 0.5 }}
              >
                <Button
                  fullWidth
                  variant={
                    !creating && selectedId === String(page.sitePageId)
                      ? "contained"
                      : "text"
                  }
                  onClick={() => selectPage(page)}
                  sx={{ justifyContent: "flex-start", textAlign: "left" }}
                >
                  {page.title}
                </Button>
                <Stack>
                  <IconButton
                    size="small"
                    aria-label={`Move ${page.title} up`}
                    disabled={reordering || index === 0}
                    onClick={() => movePage(index, -1)}
                  >
                    <ArrowUpwardIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Move ${page.title} down`}
                    disabled={reordering || index === pages.length - 1}
                    onClick={() => movePage(index, 1)}
                  >
                    <ArrowDownwardIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
            {!pages.length && (
              <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>
                No pages are available yet. Add a custom page to get started.
              </Typography>
            )}
          </Paper>

          {/* Editor */}
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                {creating ? "Create a custom page" : "Edit page"}
              </Typography>
              <TextField
                label="Page title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                inputProps={{ maxLength: 150 }}
                fullWidth
              />
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
                  "& .cke_contents": { minHeight: "250px" },
                }}
              >
                <CKEditor
                  key={creating ? "new" : selectedId}
                  editorUrl="https://cdn.ckeditor.com/4.22.1/standard-all/ckeditor.js"
                  initData={content}
                  config={{
                    height: 350,
                    language: "en",
                    allowedContent: true,
                    extraPlugins: "uploadimage",
                    uploadUrl: `${API_URL}/uploads/ckeditor`,
                    imageUploadUrl: `${API_URL}/uploads/ckeditor`,
                    toolbar: [
                      { name: "document", items: ["Source", "Preview", "Maximize"] },
                      { name: "clipboard", items: ["Undo", "Redo"] },
                      { name: "styles", items: ["Format", "FontSize"] },
                      { name: "basicstyles", items: ["Bold", "Italic", "Underline", "Strike"] },
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
                      { name: "insert", items: ["Image", "Table", "HorizontalRule", "SpecialChar"] },
                      { name: "links", items: ["Link", "Unlink"] },
                    ],
                  }}
                  onChange={(event) => setContent(event.editor.getData())}
                />
              </Box>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={savePage}
                  disabled={saving || !title.trim() || !content.trim()}
                >
                  {saving ? "Saving..." : creating ? "Create page" : "Save changes"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}