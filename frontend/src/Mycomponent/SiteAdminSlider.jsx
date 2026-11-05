import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
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

const AddIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);
const DeleteIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </SvgIcon>
);
const EditIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </SvgIcon>
);
const UploadIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </SvgIcon>
);
const SliderIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10v4M18 10v4M12 10v4" />
  </SvgIcon>
);
const ImageIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 18 5-5 4 4 3-3 4 4" />
  </SvgIcon>
);
const PlayIcon = (p) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4V8Z" />
  </SvgIcon>
);

const EMPTY_FORM = {
  title: "",
  imageUrl: "",
  sortOrder: "0",
  status: "active",
};

export default function SiteAdminSlider() {
  const theme = useTheme();
  const { baseUrl, authConfig } = useOutletContext();
  const sliderUrl = `${baseUrl}/slider`;
  const uploadUrl = `${baseUrl}/media/upload`;
  const assetOrigin = new URL(baseUrl, window.location.origin).origin;
  const resolveImage = (url) =>
    url && url.startsWith("/uploads/") ? `${assetOrigin}${url}` : url;
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSlides = useCallback(async () => {
    try {
      const { data } = await axios.get(sliderUrl, authConfig);
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not load slider.",
      );
    } finally {
      setLoading(false);
    }
  }, [authConfig, sliderUrl]);

  useEffect(() => {
    let cancelled = false;
    const loadInitialSlides = async () => {
      try {
        const { data } = await axios.get(sliderUrl, authConfig);
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message || "Could not load slider.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInitialSlides();
    return () => {
      cancelled = true;
    };
  }, [authConfig, sliderUrl]);

  const updateField = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setNotice("");
  };

  const editSlide = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      imageUrl: item.imageUrl || "",
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status || "active",
    });
    setError("");
    setNotice("");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP or GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const body = new FormData();
    body.append("image", file);

    setUploading(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.post(uploadUrl, body, {
        ...authConfig,
        headers: {
          ...authConfig?.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setForm((current) => ({ ...current, imageUrl: data.imageUrl }));
      setNotice("Image uploaded. Save to add it to the slider.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not upload this image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const saveSlide = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!form.imageUrl) {
      setError("Upload an image before saving.");
      return;
    }
    setSaving(true);

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder || 0),
    };

    try {
      if (editingId) {
        await axios.put(`${sliderUrl}/${editingId}`, payload, authConfig);
      } else {
        await axios.post(sliderUrl, payload, authConfig);
      }
      await loadSlides();
      startNew();
      setNotice(editingId ? "Slide updated." : "Slide added.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save this slide.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSlide = async (item) => {
    const name = item.title || "slide";
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeletingId(item.id);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${sliderUrl}/${item.id}`, authConfig);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) startNew();
      setNotice("Slide deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not delete this slide.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const busy = saving || uploading;
  const sortedItems = [...items].sort(
    (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
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
            Slider
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage the banner slides shown at the top of your website.
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          <Chip
            icon={<SliderIcon size={14} />}
            label={`${items.length} slide${items.length === 1 ? "" : "s"}`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
            }}
          />
          <Chip
            icon={<PlayIcon size={14} />}
            label={`${items.filter((i) => i.status === "active").length} live`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              "& .MuiChip-icon": { color: "success.main", ml: 0.5 },
            }}
          />
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
      {notice && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(320px, 0.85fr) minmax(0, 1.15fr)",
          },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        {/* ---------------- Form ---------------- */}
        <Paper
          component="form"
          variant="outlined"
          onSubmit={saveSlide}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            position: { lg: "sticky" },
            top: { lg: 88 },
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ mb: 0.5 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              {editingId ? <EditIcon size={18} /> : <AddIcon size={18} />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {editingId ? "Edit slide" : "Add slide"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingId
                  ? "Update the details below and save."
                  : "Upload a wide banner image and fill in its details."}
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            {/* Image upload — wide 16:9 preview suits banners */}
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
                Slide image{" "}
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleFileChange}
              />

              {form.imageUrl ? (
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: "action.hover",
                    aspectRatio: "16 / 9",
                  }}
                >
                  <Box
                    component="img"
                    src={resolveImage(form.imageUrl)}
                    alt="Selected preview"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ position: "absolute", bottom: 8, right: 8 }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                      startIcon={
                        uploading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <UploadIcon size={14} />
                        )
                      }
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      {uploading ? "Uploading…" : "Replace"}
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  sx={{
                    aspectRatio: "16 / 9",
                    borderRadius: 2,
                    borderStyle: "dashed",
                    flexDirection: "column",
                    gap: 0.75,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "text.secondary",
                    "&:hover": {
                      borderStyle: "dashed",
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    {uploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <UploadIcon size={20} />
                    )}
                  </Box>
                  <span>{uploading ? "Uploading…" : "Upload slide image"}</span>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={400}
                  >
                    Wide banner · JPG, PNG, WEBP or GIF · max 5 MB
                  </Typography>
                </Button>
              )}
            </Box>

            <TextField
              label="Title"
              value={form.title}
              onChange={updateField("title")}
              inputProps={{ maxLength: 150 }}
              fullWidth
              size="small"
              helperText="Optional — used as the slide's accessible label."
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Display order"
                type="number"
                value={form.sortOrder}
                onChange={updateField("sortOrder")}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                size="small"
                sx={{ flex: 1 }}
                helperText="Lower numbers appear first."
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={updateField("status")}
                fullWidth
                size="small"
                sx={{ flex: 1 }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                type="submit"
                variant="contained"
                disableElevation
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : editingId ? (
                    <EditIcon size={16} />
                  ) : (
                    <AddIcon size={16} />
                  )
                }
                disabled={busy}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  boxShadow: `0 4px 12px ${alpha(
                    theme.palette.primary.main,
                    0.25,
                  )}`,
                }}
              >
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Add slide"}
              </Button>
              {editingId && (
                <Button
                  variant="outlined"
                  disabled={busy}
                  onClick={startNew}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* ---------------- Slide list ---------------- */}
        <Paper
          variant="outlined"
          sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, minWidth: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Slides in slider
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {items.length} total
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Shown in display order. Click edit to update, or delete to remove.
          </Typography>
          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box
              sx={{
                py: 6,
                px: 2,
                textAlign: "center",
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mx: "auto",
                  mb: 1.5,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                }}
              >
                <SliderIcon size={24} />
              </Box>
              <Typography fontWeight={600}>No slides yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Add your first slide using the form.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {sortedItems.map((item, index) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    transition:
                      "border-color .15s ease, box-shadow .15s ease",
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      boxShadow: `0 6px 18px ${alpha(
                        theme.palette.primary.main,
                        0.1,
                      )}`,
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "stretch" }}
                  >
                    {/* Wide banner thumbnail with fixed aspect ratio */}
                    <Box
                      sx={{
                        position: "relative",
                        width: { xs: "100%", sm: 200 },
                        flexShrink: 0,
                        aspectRatio: { xs: "16 / 9", sm: "16 / 10" },
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {item.imageUrl ? (
                        <Box
                          component="img"
                          src={resolveImage(item.imageUrl)}
                          alt={item.title || ""}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <ImageIcon
                          size={26}
                          color={theme.palette.text.secondary}
                        />
                      )}
                      {/* Order badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          width: 24,
                          height: 24,
                          borderRadius: 1.5,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: alpha("#000", 0.6),
                          color: "#fff",
                          fontSize: 11.5,
                          fontWeight: 800,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Chip
                        size="small"
                        label={item.status}
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          textTransform: "capitalize",
                          fontWeight: 700,
                          fontSize: 10.5,
                          height: 20,
                          bgcolor:
                            item.status === "active"
                              ? "success.main"
                              : "grey.500",
                          color: "#fff",
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                    </Box>

                    {/* Details + actions */}
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        p: 1.75,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.75,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap variant="body1">
                          {item.title || "Untitled slide"}
                        </Typography>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mt: 0.5 }}
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Order #${item.sortOrder ?? 0}`}
                            sx={{
                              fontSize: 10.5,
                              height: 20,
                              fontWeight: 600,
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                          {item.createdAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Added {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      <Divider sx={{ my: 0.25 }} />

                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        sx={{ mt: "auto" }}
                      >
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => editSlide(item)}
                          disabled={busy || deletingId === item.id}
                          startIcon={<EditIcon size={15} />}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 600,
                            color: "text.secondary",
                            "&:hover": {
                              color: "primary.main",
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => deleteSlide(item)}
                          disabled={busy || deletingId === item.id}
                          startIcon={
                            deletingId === item.id ? (
                              <CircularProgress size={14} color="error" />
                            ) : (
                              <DeleteIcon size={15} />
                            )
                          }
                          sx={{
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 600,
                            color: "text.secondary",
                            "&:hover": {
                              color: "error.main",
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}