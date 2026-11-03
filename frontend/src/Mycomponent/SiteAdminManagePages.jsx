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
    // If there are no pages left, go straight to the "create" form
    setCreating(!selected);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get(pagesUrl, authConfig);
        if (cancelled) return;
        const list = Array.isArray(data.pages) ? data.pages : [];
        setSite(data);
        setPages(list);
        setSelectedId(list[0] ? String(list[0].sitePageId) : "");
        setTitle(list[0]?.title || "");
        setContent(list[0]?.page || "");
        setCreating(list.length === 0);
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
  }, [pagesUrl, authConfig]);

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
            {site && (
              <Paper
                variant="outlined"
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: site.background || "#ffffff",
                  color: site.color || "#222222",
                  borderColor: site.color || "divider",
                }}
              >
                <Box>
                  <Typography fontWeight={700}>
                    {site.themeName || "Purchased theme"}
                  </Typography>
                  <Typography variant="body2">
                    This purchased theme is applied to all pages on this site.
                  </Typography>
                </Box>
                <br />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    aria-label={`Theme background ${site.background || "#ffffff"}`}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: site.background || "#ffffff",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                  <Typography variant="caption">
                    Background {site.background || "#ffffff"}
                  </Typography>
                  <Box
                    aria-label={`Theme text color ${site.color || "#222222"}`}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: site.color || "#222222",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                  <Typography variant="caption">
                    Text {site.color || "#222222"}
                  </Typography>
                </Stack>
              </Paper>
            )}
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
                                  {
                                    method: "POST",
                                    // credentials: "include",                          // if you use cookies
                                    // headers: { Authorization: `Bearer ${token}` },   // if you use a token
                                    body,
                                  },
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
                      {
                        name: "insert",
                        items: [
                          "Image",
                          "LocalVideo",
                          "Table",
                          "HorizontalRule",
                          "SpecialChar",
                        ],
                      },
                      { name: "links", items: ["Link", "Unlink"] },
                    ],
                  }}
                  onInstanceReady={(event) => {
                    event.editor.document.getBody().setStyles({
                      backgroundColor: site?.background || "#ffffff",
                      color: site?.color || "#222222",
                    });
                  }}
                  onChange={(event) => setContent(event.editor.getData())}
                />
              </Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Button
                  variant="contained"
                  onClick={savePage}
                  disabled={saving || !title.trim() || !content.trim()}
                >
                  {saving
                    ? "Saving..."
                    : creating
                      ? "Create page"
                      : "Save changes"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
