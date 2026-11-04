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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const EMPTY_FORM = {
  title: "",
  imageUrl: "",
  content: "",
  status: "active",
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function SiteAdminNews() {
  const { baseUrl, authConfig } = useOutletContext();
  const newsUrl = `${baseUrl}/news`;
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
  const busy = saving || uploading;

  const loadNews = useCallback(async () => {
    try {
      const { data } = await axios.get(newsUrl, authConfig);
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load news.");
    } finally {
      setLoading(false);
    }
  }, [authConfig, newsUrl]);

  useEffect(() => {
    let cancelled = false;
    const loadInitialNews = async () => {
      try {
        const { data } = await axios.get(newsUrl, authConfig);
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Could not load news.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInitialNews();
    return () => {
      cancelled = true;
    };
  }, [authConfig, newsUrl]);

  const updateField = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setNotice("");
  };

  const editNews = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      imageUrl: item.imageUrl || "",
      content: item.content || "",
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
      setNotice("Image uploaded. Save to add it to the news article.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not upload this image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const saveNews = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    setSaving(true);

    const payload = {
      ...form,
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : null,
    };

    try {
      if (editingId) {
        await axios.put(`${newsUrl}/${editingId}`, payload, authConfig);
      } else {
        await axios.post(newsUrl, payload, authConfig);
      }
      await loadNews();
      startNew();
      setNotice(editingId ? "News article updated." : "News article added.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save this news article.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNews = async (item) => {
    const name = item.title || "news article";
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeletingId(item.id);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${newsUrl}/${item.id}`, authConfig);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) startNew();
      setNotice("News article deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not delete this news article.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(300px, 0.8fr) minmax(0, 1.2fr)",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Form */}
        <Paper
          component="form"
          variant="outlined"
          onSubmit={saveNews}
          sx={{ p: { xs: 2, md: 3 } }}
        >
          <Typography variant="h5" fontWeight={700}>
            {editingId ? "Edit news article" : "Add news article"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Share news and updates on your website.
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={updateField("title")}
              required
              inputProps={{ maxLength: 150 }}
              fullWidth
            />
            <Stack spacing={1}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                startIcon={
                  uploading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <CloudUploadOutlinedIcon />
                  )
                }
                sx={{ alignSelf: "flex-start", whiteSpace: "nowrap" }}
              >
                {uploading ? "Uploading..." : "Upload image"}
              </Button>

              {form.imageUrl && (
                <Box
                  component="img"
                  src={resolveImage(form.imageUrl)}
                  alt="Selected preview"
                  sx={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 1,
                    bgcolor: "action.hover",
                  }}
                />
              )}
            </Stack>
            <TextField
              label="Content"
              value={form.content}
              onChange={updateField("content")}
              required
              multiline
              minRows={5}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={updateField("status")}
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={busy}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add news article"}
              </Button>
              {editingId && (
                <Button variant="outlined" disabled={busy} onClick={startNew}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* List */}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700}>
            Existing news
          </Typography>
          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
              No news yet. Add the first article using the form.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {items.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    {item.imageUrl && (
                      <Box
                        component="img"
                        src={resolveImage(item.imageUrl)}
                        alt={item.title || ""}
                        sx={{
                          width: { xs: "100%", sm: 100 },
                          height: 76,
                          objectFit: "cover",
                          borderRadius: 1,
                          bgcolor: "action.hover",
                        }}
                      />
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography fontWeight={700} noWrap>
                          {item.title || "Untitled"}
                        </Typography>
                        <Chip
                          size="small"
                          label={item.status}
                          color={item.status === "active" ? "success" : "default"}
                        />
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.content || "No additional details"}
                      </Typography>
                      {item.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          Created:{" "}
                          {formatDateInput(item.createdAt).replace("T", " ")}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" justifyContent="flex-end">
                      <IconButton
                        aria-label={`Edit ${item.title || "news article"}`}
                        onClick={() => editNews(item)}
                        disabled={saving || deletingId === item.id}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${item.title || "news article"}`}
                        color="error"
                        onClick={() => deleteNews(item)}
                        disabled={saving || deletingId === item.id}
                      >
                        {deletingId === item.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </Stack>
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