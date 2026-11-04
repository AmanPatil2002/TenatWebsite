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
  caption: "",
  altText: "",
  sortOrder: "0",
  status: "active",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function SiteAdminGalary() {
  const { baseUrl, authConfig } = useOutletContext();
  const galleryUrl = `${baseUrl}/galleries`;
  const uploadUrl = `${baseUrl}/media/upload`;

  // Locally uploaded images are stored as "/uploads/sites/<id>/<file>", so they
  // must be loaded from the API server's origin, not the frontend's.
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

  const loadGallery = useCallback(async () => {
    try {
      const { data } = await axios.get(galleryUrl, authConfig);
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load gallery.");
    } finally {
      setLoading(false);
    }
  }, [authConfig, galleryUrl]);

  useEffect(() => {
    let cancelled = false;
    const loadInitialGallery = async () => {
      try {
        const { data } = await axios.get(galleryUrl, authConfig);
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message || "Could not load gallery.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInitialGallery();
    return () => {
      cancelled = true;
    };
  }, [authConfig, galleryUrl]);

  const updateField = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setNotice("");
  };

  const editImage = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      imageUrl: item.imageUrl || "",
      caption: item.caption || "",
      altText: item.altText || "",
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status || "active",
    });
    setError("");
    setNotice("");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WEBP or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
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
      setNotice("Image uploaded. Save to add it to the gallery.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not upload this image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const saveImage = async (event) => {
    event.preventDefault();
    if (!form.imageUrl) {
      setError("Upload an image before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder || 0),
    };

    try {
      if (editingId) {
        await axios.put(`${galleryUrl}/${editingId}`, payload, authConfig);
      } else {
        await axios.post(galleryUrl, payload, authConfig);
      }
      await loadGallery();
      startNew();
      setNotice(editingId ? "Gallery image updated." : "Gallery image added.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save this gallery image.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async (item) => {
    const name = item.title || "gallery image";
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeletingId(item.id);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${galleryUrl}/${item.id}`, authConfig);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) startNew();
      setNotice("Gallery image deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not delete this gallery image.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const busy = saving || uploading;

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
          onSubmit={saveImage}
          sx={{ p: { xs: 2, md: 3 } }}
        >
          <Typography variant="h5" fontWeight={700}>
            {editingId ? "Edit gallery image" : "Add gallery image"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Add and arrange images for your website gallery.
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={updateField("title")}
              inputProps={{ maxLength: 150 }}
              fullWidth
            />

            {/* Images must be uploaded; users cannot enter external URLs. */}
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
              label="Caption"
              value={form.caption}
              onChange={updateField("caption")}
              multiline
              minRows={2}
              inputProps={{ maxLength: 500 }}
              fullWidth
            />
            <TextField
              label="Alt text"
              value={form.altText}
              onChange={updateField("altText")}
              inputProps={{ maxLength: 255 }}
              fullWidth
            />
            <TextField
              label="Display order"
              type="number"
              value={form.sortOrder}
              onChange={updateField("sortOrder")}
              inputProps={{ min: 0, step: 1 }}
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
                    : "Add gallery image"}
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
            Existing gallery
          </Typography>
          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
              No gallery images yet. Add the first one using the form.
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
                        alt={item.altText || item.title || ""}
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
                      <Typography variant="caption" color="text.secondary">
                        Order: {item.sortOrder ?? 0}
                      </Typography>
                    </Box>

                    <Stack direction="row" justifyContent="flex-end">
                      <IconButton
                        aria-label={`Edit ${item.title || "gallery image"}`}
                        onClick={() => editImage(item)}
                        disabled={busy || deletingId === item.id}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${item.title || "gallery image"}`}
                        color="error"
                        onClick={() => deleteImage(item)}
                        disabled={busy || deletingId === item.id}
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