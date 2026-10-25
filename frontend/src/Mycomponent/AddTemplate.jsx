import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUSES = ["draft", "published", "archived"];
const MAX_URL_LENGTH = 500;

const getInitialForm = () => ({
  categoryId: "",
  name: "",
  language: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  demoUrl: "",
  domainLink: "",
  currency: "INR",
  price: "",
  validityDays: "365",
  status: "draft",
});

const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeLanguages = (v) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

export default function AddTemplate() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [formData, setFormData] = useState(getInitialForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(Boolean(templateId));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    Promise.all([
      axios.get(`${API_URL}/categories`),
      templateId
        ? axios.get(`${API_URL}/templates/admin/${templateId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : Promise.resolve(null),
    ])
      .then(([categoryResponse, templateResponse]) => {
        if (cancelled) return;
        setCategories(Array.isArray(categoryResponse.data) ? categoryResponse.data : []);
        if (templateId) {
          const existing = templateResponse?.data;
          if (!existing) {
            showSnack("Template not found.", "error");
          } else {
            setFormData({
              categoryId: String(existing.categoryId),
              name: existing.name || "",
              language: existing.language || "",
              shortDescription: existing.shortDescription || "",
              description: existing.description || "",
              thumbnailUrl: existing.thumbnailUrl || "",
              demoUrl: existing.demoUrl || "",
              domainLink: existing.domainLink || "",
              currency: existing.currency || "INR",
              price: String(existing.price ?? ""),
              validityDays: String(existing.validityDays || 365),
              status: existing.status || "draft",
            });
          }
        }
      })
      .catch((error) => {
        if (!cancelled) showSnack(error.response?.data?.message || "Could not load template form data.", "error");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCategories(false);
          setLoadingTemplate(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const validate = () => {
    const errs = {};
    const f = formData;
    const name = f.name.trim();
    const language = normalizeLanguages(f.language);
    const short = f.shortDescription.trim();
    const desc = f.description.trim();
    const thumbnailUrl = f.thumbnailUrl.trim();
    const demoUrl = f.demoUrl.trim();
    const domainLink = f.domainLink.trim();

    if (!f.categoryId) errs.categoryId = "Select a category";

    if (!name) errs.name = "Name is required";
    else if (name.length > 150)
      errs.name = "Name must be 150 characters or fewer";

    if (short.length > 300)
      errs.shortDescription = "Short description must be 300 characters or fewer";

    if (thumbnailUrl && !isValidUrl(thumbnailUrl))
      errs.thumbnailUrl = "Enter a valid URL starting with http:// or https://";
    else if (thumbnailUrl && thumbnailUrl.length > MAX_URL_LENGTH)
      errs.thumbnailUrl = `URL must be ${MAX_URL_LENGTH} characters or fewer`;

    if (demoUrl && !isValidUrl(demoUrl))
      errs.demoUrl = "Enter a valid URL starting with http:// or https://";
    else if (demoUrl && demoUrl.length > MAX_URL_LENGTH)
      errs.demoUrl = `URL must be ${MAX_URL_LENGTH} characters or fewer`;
    if (f.status === "published" && !demoUrl)
      errs.demoUrl = "A demo URL is required to publish a template";

    if (!/^[A-Za-z]{3}$/.test(f.currency.trim()))
      errs.currency = "Enter a 3-letter currency code";

    if (domainLink && domainLink.length > 255)
      errs.domainLink = "Domain link must be 255 characters or fewer";

    const price = Number(f.price);
    if (f.price === "" || Number.isNaN(price)) errs.price = "Enter a price";
    else if (price <= 0) errs.price = "Price must be greater than 0";
    else if (!/^\d+(\.\d{1,2})?$/.test(String(f.price).trim()))
      errs.price = "Use at most 2 decimal places";

    const days = Number(f.validityDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650)
      errs.validityDays = "Enter a whole number of days from 1 to 3650";

    if (!STATUSES.includes(f.status)) errs.status = "Select a status";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetForm = () => {
    setFormData(getInitialForm());
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      showSnack("You are not logged in. Please log in and try again.", "error");
      return;
    }

    const payload = {
      categoryId: formData.categoryId,
      name: formData.name.trim(),
      language: normalizeLanguages(formData.language) || null,
      shortDescription: formData.shortDescription.trim() || null,
      description: formData.description.trim() || null,
      thumbnailUrl: formData.thumbnailUrl.trim() || null,
      demoUrl: formData.demoUrl.trim() || null,
      domainLink: formData.domainLink.trim() || null,
      price: Number(formData.price),
      currency: formData.currency.trim().toUpperCase(),
      validityDays: Number(formData.validityDays),
      status: formData.status,
    };

    try {
      setSubmitting(true);
      const response = templateId
        ? await axios.put(`${API_URL}/templates/${templateId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axios.post(`${API_URL}/templates`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
      const savedTemplateId = templateId || response.data.templateId;
      showSnack(templateId ? "Template updated successfully!" : "Template added successfully!");
      navigate(`/admin/templates/${savedTemplateId}/content`);
    } catch (error) {
      const code = error.response?.status;
      let message = error.response?.data?.message;

      if (!error.response) {
        message = "Cannot reach the server. Check your connection.";
      } else if (code === 401) {
        message = "Your session has expired. Please log in again.";
      } else if (code === 403) {
        message = "You don't have permission to add templates.";
      } else if (!message) {
        message = "Failed to add template. Please try again.";
      }

      showSnack(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const textField = (name, label, extra = {}) => (
    <TextField
      fullWidth
      size="small"
      id={name}
      name={name}
      label={label}
      value={formData[name]}
      onChange={handleChange}
      error={!!errors[name]}
      helperText={errors[name] || extra.helper}
      {...extra.props}
    />
  );

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Paper
        elevation={1}
        sx={{ width: "100%", maxWidth: 820, p: { xs: 2, sm: 3 } }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            mb: 0.5,
            fontSize: { xs: "1.2rem", sm: "1.5rem" },
          }}
        >
          {templateId ? "Edit template" : "Add template"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {templateId
            ? "Update the catalog details, then manage the pages and themes included in this template."
            : "Add the catalog details first. You can add its themes and pages immediately after saving."}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" error={!!errors.categoryId}>
                <InputLabel id="categoryId-label">Category</InputLabel>
                <Select
                  labelId="categoryId-label"
                  id="categoryId"
                  name="categoryId"
                  label="Category"
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={loadingCategories || loadingTemplate}
                  endAdornment={
                    loadingCategories ? (
                      <CircularProgress size={16} sx={{ mr: 3 }} />
                    ) : null
                  }
                >
                  {categories.map((c) => (
                    <MenuItem key={c.categoryId} value={String(c.categoryId)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <FormHelperText>{errors.categoryId}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("name", "Template name")}
            </Grid>

            <Grid size={12}>
              {textField("language", "Languages / frameworks", {
                helper: "Comma separated, e.g. React, Node.js, MySQL",
              })}
            </Grid>

            <Grid size={12}>
              {textField("shortDescription", "Short description", {
                props: { multiline: true, rows: 2 },
                helper: `${formData.shortDescription.trim().length}/300`,
              })}
            </Grid>

            <Grid size={12}>
              {textField("description", "Full description", {
                props: { multiline: true, rows: 5 },
                helper: `${formData.description.trim().length}/2000`,
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("thumbnailUrl", "Thumbnail URL", {
                helper: "Optional image URL (maximum 500 characters).",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("demoUrl", "Demo URL", {
                helper: "Required when publishing; maximum 500 characters.",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("domainLink", "Domain link (optional)", {
                helper: "Optional domain associated with this template.",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("currency", "Currency", {
                helper: "Three-letter code, e.g. INR or USD.",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("price", `Price (${formData.currency || "currency"})`, {
                props: {
                  type: "number",
                  slotProps: { htmlInput: { min: 0, step: "0.01" } },
                },
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("validityDays", "Validity (days)", {
                props: {
                  type: "number",
                  slotProps: { htmlInput: { min: 1, step: 1 } },
                },
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" error={!!errors.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  label="Status"
                  value={formData.status}
                  onChange={handleChange}
                  sx={{ "& .MuiSelect-select": { textTransform: "capitalize" } }}
                >
                  {STATUSES.map((s) => (
                    <MenuItem
                      key={s}
                      value={s}
                      sx={{ textTransform: "capitalize" }}
                    >
                      {s}
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && (
                  <FormHelperText>{errors.status}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  sx={{ py: 1.25, fontSize: "0.95rem", fontWeight: "bold" }}
                >
                  {submitting ? "Saving…" : templateId ? "Save template and manage content" : "Create template and add content"}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={submitting}
                  onClick={() => templateId ? navigate("/admin/projects") : resetForm()}
                  sx={{ py: 1.25, fontSize: "0.95rem" }}
                >
                  {templateId ? "Cancel" : "Clear form"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}