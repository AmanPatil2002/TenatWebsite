import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no MUI icon imports, no tree-shaking issues     */
/* ------------------------------------------------------------------ */
const SvgIcon = ({ children, size = 20, color = "currentColor" }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    sx={{ width: size, height: size, display: "block", color, flexShrink: 0 }}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Box>
);

const UpIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m6 15 6-6 6 6" />
  </SvgIcon>
);
const DownIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m6 9 6 6 6-6" />
  </SvgIcon>
);
const AddIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);
const PagesIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v6h6" />
    <path d="M8 13h8M8 17h5" />
  </SvgIcon>
);
const EditIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </SvgIcon>
);
const PaletteIcon = (p) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);
const SaveIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </SvgIcon>
);
const CheckIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </SvgIcon>
);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function SiteAdminManagePages() {
  const theme = useTheme();
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

  const selectedPage = pages.find((p) => String(p.sitePageId) === selectedId);
  const currentTitle = creating ? "New custom page" : selectedPage?.title || "Page";

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      {/* ---------------- Page header ---------------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Manage pages
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Edit the content of your site's pages and control their display
            order.
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          <Chip
            icon={<PagesIcon size={14} />}
            label={`${pages.length} page${pages.length === 1 ? "" : "s"}`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
            }}
          />
          {site?.themeName && (
            <Chip
              icon={<PaletteIcon size={14} />}
              label={site.themeName}
              variant="outlined"
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
              }}
            />
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          icon={<CheckIcon size={20} />}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "320px minmax(0, 1fr)",
            },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          {/* ---------------- Sidebar: theme + pages ---------------- */}
          <Stack spacing={2}>
            {/* Theme card */}
            {site && (
              <Paper
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 3, minWidth: 0 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <PaletteIcon size={17} />
                  </Box>
                  <Typography fontWeight={700} variant="subtitle2">
                    Active theme
                  </Typography>
                </Stack>

                <Typography fontWeight={700} noWrap>
                  {site.themeName || "Purchased theme"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 0.5, mb: 2 }}
                >
                  Applied to all pages on this site.
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    fontSize: 10.5,
                    mb: 1,
                  }}
                >
                  Colors
                </Typography>
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: 1,
                        bgcolor: site.background || "#ffffff",
                        border: `1px solid ${theme.palette.divider}`,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        Background
                      </Typography>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        noWrap
                      >
                        {site.background || "#ffffff"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: 1,
                        bgcolor: site.color || "#222222",
                        border: `1px solid ${theme.palette.divider}`,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        Text
                      </Typography>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        noWrap
                      >
                        {site.color || "#222222"}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>
            )}

            {/* Pages list card */}
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 3, minWidth: 0 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Pages
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon size={14} />}
                  onClick={startNewPage}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  New
                </Button>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 1.5 }}
              >
                Use the arrows to reorder.
              </Typography>

              <Divider sx={{ mb: 1.5 }} />

              <Stack spacing={0.75}>
                {pages.map((page, index) => {
                  const isActive =
                    !creating && selectedId === String(page.sitePageId);
                  return (
                    <Box
                      key={page.sitePageId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        borderRadius: 2,
                        bgcolor: isActive
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        border: `1px solid ${
                          isActive
                            ? alpha(theme.palette.primary.main, 0.25)
                            : "transparent"
                        }`,
                        transition: "background-color .15s ease",
                        "&:hover": {
                          bgcolor: isActive
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Button
                        fullWidth
                        onClick={() => selectPage(page)}
                        sx={{
                          justifyContent: "flex-start",
                          textAlign: "left",
                          textTransform: "none",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 14,
                          color: isActive ? "primary.main" : "text.primary",
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.75,
                          minWidth: 0,
                          "& .MuiButton-endIcon": { ml: "auto" },
                        }}
                        endIcon={
                          isActive ? (
                            <Chip
                              size="small"
                              label="Editing"
                              sx={{
                                height: 18,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                color: "primary.main",
                                "& .MuiChip-label": { px: 0.75 },
                              }}
                            />
                          ) : null
                        }
                      >
                        <Box
                          component="span"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {page.title}
                        </Box>
                      </Button>

                      <Stack sx={{ flexShrink: 0 }}>
                        <IconButton
                          size="small"
                          aria-label={`Move ${page.title} up`}
                          disabled={reordering || index === 0}
                          onClick={() => movePage(index, -1)}
                          sx={{ p: 0.25, borderRadius: 1 }}
                        >
                          <UpIcon size={14} />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={`Move ${page.title} down`}
                          disabled={reordering || index === pages.length - 1}
                          onClick={() => movePage(index, 1)}
                          sx={{ p: 0.25, borderRadius: 1 }}
                        >
                          <DownIcon size={14} />
                        </IconButton>
                      </Stack>
                    </Box>
                  );
                })}
                {!pages.length && (
                  <Box
                    sx={{
                      py: 3,
                      px: 1.5,
                      textAlign: "center",
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    }}
                  >
                    <Typography fontWeight={600} variant="body2">
                      No pages yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click "New" to create your first page.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>

          {/* ---------------- Editor ---------------- */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, minWidth: 0 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                {creating ? <AddIcon size={18} /> : <EditIcon size={18} />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} noWrap>
                  {creating ? "Create a custom page" : "Edit page"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {creating
                    ? "Give your page a title and add the content below."
                    : currentTitle}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <TextField
                label="Page title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                inputProps={{ maxLength: 150 }}
                fullWidth
                size="small"
                helperText="Shown in the site navigation and browser tab."
              />

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{
                    display: "block",
                    mb: 1,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  Page content
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    "& .cke, & .cke_chrome, & .cke_inner, & .cke_contents": {
                      width: "100% !important",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    },
                    "& .cke_chrome": {
                      border: "none !important",
                      borderBottom: `1px solid ${theme.palette.divider} !important`,
                    },
                    "& .cke_contents": { minHeight: "300px" },
                    "& .cke_top": {
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    },
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
                                    { method: "POST", body },
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
              </Box>

              <Divider />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1.5}
              >
                <Typography variant="caption" color="text.secondary">
                  {creating
                    ? "The new page will be added to the end of your navigation."
                    : "Changes are not published until you save."}
                </Typography>
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveIcon size={16} />
                    )
                  }
                  onClick={savePage}
                  disabled={saving || !title.trim() || !content.trim()}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2.5,
                    alignSelf: { xs: "stretch", sm: "center" },
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.primary.main,
                      0.25,
                    )}`,
                  }}
                >
                  {saving
                    ? "Saving…"
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