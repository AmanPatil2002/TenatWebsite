import { useEffect, useState } from "react";
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
const MAX_URL_LENGTH = 255;

const getInitialForm = () => ({
  categoryId: "",
  name: "",
  language: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  demoUrl: "",
  demoDomain: "",
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

// Each label is 1-63 chars, no leading/trailing hyphen, TLD of letters only
const DOMAIN_RE =
  /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const normalizeDomain = (v) =>
  v
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

const normalizeLanguages = (v) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

export default function AddTemplate() {
  const [formData, setFormData] = useState(getInitialForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
    axios
      .get(`${API_URL}/categories`)
      .then((res) => {
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) showSnack("Could not load categories.", "error");
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const validate = () => {
    const errs = {};
    const f = formData;
    const name = f.name.trim();
    const language = normalizeLanguages(f.language);
    const short = f.shortDescription.trim();
    const desc = f.description.trim();
    const thumbnailUrl = f.thumbnailUrl.trim();
    const demoUrl = f.demoUrl.trim();
    const domain = normalizeDomain(f.demoDomain);

    if (!f.categoryId) errs.categoryId = "Select a category";

    if (!name) errs.name = "Name is required";
    else if (name.length < 3 || name.length > 100)
      errs.name = "Name must be 3–100 characters";

    if (!language) errs.language = "Add at least one language or framework";
    else if (language.length > 100)
      errs.language = "Keep this under 100 characters";

    if (!short) errs.shortDescription = "Short description is required";
    else if (short.length < 10 || short.length > 150)
      errs.shortDescription = "Short description must be 10–150 characters";

    if (!desc) errs.description = "Description is required";
    else if (desc.length < 20 || desc.length > 2000)
      errs.description = "Description must be 20–2000 characters";

    if (!thumbnailUrl) errs.thumbnailUrl = "Thumbnail URL is required";
    else if (!isValidUrl(thumbnailUrl))
      errs.thumbnailUrl = "Enter a valid URL starting with http:// or https://";
    else if (thumbnailUrl.length > MAX_URL_LENGTH)
      errs.thumbnailUrl = `URL must be ${MAX_URL_LENGTH} characters or fewer`;

    if (!demoUrl) errs.demoUrl = "Demo URL is required";
    else if (!isValidUrl(demoUrl))
      errs.demoUrl = "Enter a valid URL starting with http:// or https://";
    else if (demoUrl.length > MAX_URL_LENGTH)
      errs.demoUrl = `URL must be ${MAX_URL_LENGTH} characters or fewer`;

    if (!domain) errs.demoDomain = "Demo domain is required";
    else if (!DOMAIN_RE.test(domain))
      errs.demoDomain = "Enter a domain like demo.example.com";

    const price = Number(f.price);
    if (f.price === "" || Number.isNaN(price)) errs.price = "Enter a price";
    else if (price <= 0) errs.price = "Price must be greater than 0";
    else if (!/^\d+(\.\d{1,2})?$/.test(String(f.price).trim()))
      errs.price = "Use at most 2 decimal places";

    const days = Number(f.validityDays);
    if (!Number.isInteger(days) || days < 1)
      errs.validityDays = "Enter a whole number of days (1 or more)";

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
      categoryId: Number(formData.categoryId),
      name: formData.name.trim(),
      language: normalizeLanguages(formData.language),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      thumbnailUrl: formData.thumbnailUrl.trim(),
      demoUrl: formData.demoUrl.trim(),
      demoDomain: normalizeDomain(formData.demoDomain),
      price: Number(formData.price),
      currency: "INR", // the server also forces INR
      validityDays: Number(formData.validityDays),
      status: formData.status,
    };

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/templates`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnack("Template added successfully!");
      resetForm();
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
          Add template
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fill in the details below. Only published templates appear in the
          public listing.
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
                  disabled={loadingCategories}
                  endAdornment={
                    loadingCategories ? (
                      <CircularProgress size={16} sx={{ mr: 3 }} />
                    ) : null
                  }
                >
                  {categories.map((c) => (
                    <MenuItem key={c.categoryId} value={c.categoryId}>
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
                helper: `${formData.shortDescription.trim().length}/150`,
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
                helper: "Direct link to an image, e.g. https://…/preview.jpg",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("demoUrl", "Demo URL", {
                helper: "e.g. https://demo.example.com",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("demoDomain", "Demo domain", {
                helper: "e.g. demo.example.com",
              })}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              {textField("price", "Price (INR)", {
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
                  {submitting ? "Saving…" : "Add template"}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={submitting}
                  onClick={resetForm}
                  sx={{ py: 1.25, fontSize: "0.95rem" }}
                >
                  Clear form
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