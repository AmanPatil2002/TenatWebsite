import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const getCustomFields = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const emptyEntry = {
  sitePageId: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  status: "active",
  customFields: [],
};

export default function SiteAdminPageData() {
  const { pages, baseUrl, authConfig } = useOutletContext();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entryId, setEntryId] = useState(null);
  const [form, setForm] = useState(emptyEntry);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/entries`, authConfig);
      setEntries(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load page data.");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authConfig]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const updateCustomField = (index, key, value) =>
    setForm((current) => ({
      ...current,
      customFields: current.customFields.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));

  const openDialog = (entry) => {
    setEntryId(entry?.id ?? null);
    setForm(
      entry
        ? {
            ...entry,
            price: entry.price ?? "",
            customFields: Object.entries(getCustomFields(entry.customFields)).map(
              ([key, value]) => ({ key, value: String(value) }),
            ),
          }
        : { ...emptyEntry, sitePageId: pages[0] ? String(pages[0].sitePageId) : "" },
    );
    setDialogOpen(true);
    setError("");
  };

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!form.sitePageId) {
      setError("Create or add a page before adding business data.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...form,
      price: form.price === "" ? null : form.price,
      customFields: Object.fromEntries(
        form.customFields
          .filter((field) => field.key.trim())
          .map((field) => [field.key.trim(), field.value]),
      ),
    };
    try {
      if (entryId) {
        await axios.put(`${baseUrl}/entries/${entryId}`, payload, authConfig);
      } else {
        await axios.post(`${baseUrl}/entries`, payload, authConfig);
      }
      await loadEntries();
      setDialogOpen(false);
      setNotice(entryId ? "Business data updated." : "Business data added.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save business data.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`Remove "${entry.name}" from ${entry.pageTitle}?`)) return;
    try {
      await axios.delete(`${baseUrl}/entries/${entry.id}`, authConfig);
      setEntries((current) => current.filter((row) => row.id !== entry.id));
      setNotice("Business data removed.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not remove business data.");
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {error && !dialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700}>
              Page business data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add page-specific records such as bakery menu items or products,
              including custom fields.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!pages.length}
            onClick={() => openDialog(null)}
            sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
          >
            Add data
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.pageTitle}</TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>{entry.description || "—"}</TableCell>
                    <TableCell>{entry.price ?? "—"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={entry.status} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label={`Edit ${entry.name}`} onClick={() => openDialog(entry)}>
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${entry.name}`}
                        color="error"
                        onClick={() => deleteEntry(entry)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!entries.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {pages.length
                        ? "No business data yet. Add menu items, products, or other page content."
                        : "Add a page before creating page-specific data."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={saveEntry}>
          <DialogTitle>{entryId ? "Edit page data" : "Add page data"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                select
                label="Site page"
                value={form.sitePageId}
                onChange={(e) => updateForm("sitePageId", e.target.value)}
                required
                fullWidth
              >
                {pages.map((sitePage) => (
                  <MenuItem key={sitePage.sitePageId} value={String(sitePage.sitePageId)}>
                    {sitePage.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                inputProps={{ maxLength: 190 }}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Price (optional)"
                    type="number"
                    value={form.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    label="Status"
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <TextField
                label="Image URL (optional)"
                value={form.imageUrl}
                onChange={(e) => updateForm("imageUrl", e.target.value)}
                inputProps={{ maxLength: 1000 }}
                fullWidth
              />
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={600}>Custom fields</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      customFields: [...current.customFields, { key: "", value: "" }],
                    }))
                  }
                >
                  Add field
                </Button>
              </Stack>
              {form.customFields.map((field, index) => (
                <Grid container spacing={1} key={index}>
                  <Grid size={{ xs: 5 }}>
                    <TextField
                      label="Field name"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, "key", e.target.value)}
                      inputProps={{ maxLength: 60 }}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <TextField
                      label="Value"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, "value", e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : entryId ? "Save data" : "Add data"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}