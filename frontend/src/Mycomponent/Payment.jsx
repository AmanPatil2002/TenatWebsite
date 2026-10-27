import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const formatPrice = (price, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(price || 0));

const asArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const getId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const isDefaultPage = (page) =>
  page.isDefault === true ||
  page.isDefault === "true" ||
  Number(page.isDefault) === 1;

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const template = location.state?.template || null;

  const themes = useMemo(() => asArray(template?.themes), [template]);
  const pages = useMemo(() => asArray(template?.pages), [template]);

  const currency = template?.currency || "INR";

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [siteName, setSiteName] = useState(template?.name || "");
  const [subdomain, setSubdomain] = useState("");

  const [themeId, setThemeId] = useState("");
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [quote, setQuote] = useState(null);

  // ---------- Authentication and initial validation ----------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!template) {
      setError(
        "No template selected. Please select a template before checkout."
      );
      return;
    }

    setError("");
  }, [navigate, template]);

  // ---------- Normalize pages: default (included) vs additional (paid) ----------
  const normalizedPages = useMemo(
    () =>
      pages
        .map((page) => ({
          ...page,
          pageKey: getId(page.pagesId ?? page.pageId),
          pagePrice: Number(page.pagePrice ?? page.price ?? 0),
          isDefault: isDefaultPage(page),
        }))
        .filter((page) => page.pageKey !== null),
    [pages]
  );

  const defaultPages = useMemo(
    () => normalizedPages.filter((page) => page.isDefault),
    [normalizedPages]
  );

  const additionalPages = useMemo(
    () => normalizedPages.filter((page) => !page.isDefault),
    [normalizedPages]
  );

  // Reset the selection when the template changes.
  // A single theme is preselected because only one can be chosen anyway.
  useEffect(() => {
    setSelectedExtraIds([]);
    setQuote(null);

    setThemeId(
      themes.length === 1 && getId(themes[0].themeId)
        ? String(themes[0].themeId)
        : ""
    );
  }, [template, themes]);

  const selectedThemeId = getId(themeId);

  // Only valid additional page ids can ever be selected.
  const additionalPageIds = useMemo(() => {
    const valid = new Set(additionalPages.map((page) => page.pageKey));
    return [...new Set(selectedExtraIds.map(getId).filter(Boolean))].filter(
      (id) => valid.has(id)
    );
  }, [selectedExtraIds, additionalPages]);

  // ---------- Local estimate for display only ----------
  const localPagesAmount = useMemo(
    () =>
      additionalPages
        .filter((page) => additionalPageIds.includes(page.pageKey))
        .reduce((sum, page) => sum + page.pagePrice, 0),
    [additionalPages, additionalPageIds]
  );

  const localBaseAmount = Number(
    template?.price ?? template?.baseAmount ?? 0
  );

  // ---------- Server-calculated quote ----------
  // A quote is needed as soon as a theme is chosen; additional pages are optional.
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !getId(template?.templateId) || !selectedThemeId) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }

    let cancelled = false;

    const fetchQuote = async () => {
      setQuoteLoading(true);
      setError("");
      setQuote(null);

      try {
        const response = await axios.post(
          `${API}/payments/quote`,
          {
            templateId: getId(template.templateId),
            themeId: selectedThemeId,
            pageIds: additionalPageIds, // additional pages only
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!cancelled) setQuote(response.data);
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(getErrorMessage(err, "Could not calculate the price."));
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };

    fetchQuote();

    return () => {
      cancelled = true;
    };
  }, [template?.templateId, selectedThemeId, additionalPageIds]);

  const baseAmount = quote ? Number(quote.baseAmount) : localBaseAmount;
  const pagesAmount = quote ? Number(quote.pagesAmount) : localPagesAmount;
  const total = quote
    ? Number(quote.amount)
    : localBaseAmount + localPagesAmount;

  // ---------- Additional page selection ----------
  const toggleExtraPage = (rawId) => {
    const id = getId(rawId);
    if (!id) return;

    setError("");
    setQuote(null);

    setSelectedExtraIds((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : [...previous, id]
    );
  };

  // ---------- Checkout ----------
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    const token = localStorage.getItem("token");
    const templateId = getId(template?.templateId);

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!templateId) {
      setError("Invalid template. Please select a template again.");
      return;
    }

    if (!siteName.trim()) {
      setError("Website name is required.");
      return;
    }

    if (siteName.trim().length > 150) {
      setError("Website name must be 150 characters or fewer.");
      return;
    }

    if (!selectedThemeId) {
      setError("Please select a theme.");
      return;
    }

    if (
      subdomain.trim() &&
      !/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(
        subdomain.trim().toLowerCase()
      )
    ) {
      setError(
        "Invalid subdomain. Use lowercase letters, numbers and hyphens."
      );
      return;
    }

    // Never submit using an old or failed quote.
    if (quoteLoading || !quote) {
      setError("Please wait for the server to calculate the price.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/payments/checkout`,
        {
          templateId,
          themeId: selectedThemeId,
          pageIds: additionalPageIds, // default pages are added by the server
          siteName: siteName.trim(),
          subdomain: subdomain.trim() ? subdomain.trim().toLowerCase() : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Checkout failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const canPay =
    !loading &&
    !quoteLoading &&
    Boolean(quote) &&
    Boolean(template) &&
    Boolean(selectedThemeId);

  // ---------- UI ----------
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          }}
        >
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Payment
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Choose one theme. Default pages are included; add extra pages if
            you need them.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success ? (
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, borderColor: "success.light" }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="success.main"
                  gutterBottom
                >
                  Purchase successful
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your website has been submitted for provisioning.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {success.siteId != null && (
                    <Chip
                      label={`Site ID: ${success.siteId}`}
                      color="success"
                      variant="outlined"
                    />
                  )}

                  {success.paymentId != null && (
                    <Chip
                      label={`Payment ID: ${success.paymentId}`}
                      color="success"
                      variant="outlined"
                    />
                  )}

                  {success.invoiceId != null && (
                    <Chip
                      label={`Invoice ID: ${success.invoiceId}`}
                      color="success"
                      variant="outlined"
                    />
                  )}

                  {success.transactionId && (
                    <Chip
                      label={`Transaction: ${success.transactionId}`}
                      color="success"
                      variant="outlined"
                    />
                  )}

                  {success.amount != null && (
                    <Chip
                      label={`Amount: ${formatPrice(
                        success.amount,
                        success.currency || currency
                      )}`}
                      color="success"
                    />
                  )}
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="contained"
                    onClick={() =>
                      success.siteId != null
                        ? navigate(`/mysite/${success.siteId}`)
                        : navigate("/mysite")
                    }
                  >
                    View your site
                  </Button>

                  <Button variant="outlined" onClick={() => navigate("/mysite")}>
                    My sites
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={4}>
              {/* LEFT: template and price summary */}
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="overline" color="text.secondary">
                      Selected template
                    </Typography>

                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                      {template?.name || "Template preview"}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 2 }}
                    >
                      {template?.language && (
                        <Chip label={template.language} size="small" />
                      )}

                      {template?.validityDays && (
                        <Chip
                          label={`${template.validityDays} days`}
                          size="small"
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      {template?.shortDescription ||
                        "Professional website template ready to launch."}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary">
                            Template price
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Includes {defaultPages.length} default page
                            {defaultPages.length === 1 ? "" : "s"}
                          </Typography>
                        </Box>

                        <Typography fontWeight={600}>
                          {formatPrice(baseAmount, currency)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography color="text.secondary">
                          Additional pages ({additionalPageIds.length})
                        </Typography>

                        <Typography fontWeight={600}>
                          {formatPrice(pagesAmount, currency)}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography fontWeight={700}>Total</Typography>

                        <Typography fontWeight={700}>
                          {formatPrice(total, currency)}
                        </Typography>
                      </Box>

                      {quoteLoading && (
                        <Typography variant="caption" color="text.secondary">
                          Calculating server price...
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* RIGHT: theme, pages and billing */}
              <Grid item xs={12} md={7}>
                <Stack spacing={3}>
                  {/* Theme selection (single) */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Select a theme
                      </Typography>

                      {themes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No themes are available for this template.
                        </Typography>
                      ) : (
                        <RadioGroup
                          value={String(themeId)}
                          onChange={(event) => {
                            setError("");
                            setQuote(null);
                            setThemeId(event.target.value);
                          }}
                        >
                          {themes.map((theme) => (
                            <FormControlLabel
                              key={theme.themeId}
                              value={String(theme.themeId)}
                              control={<Radio />}
                              label={
                                <Stack
                                  direction="row"
                                  spacing={1.5}
                                  alignItems="center"
                                >
                                  <Box
                                    sx={{
                                      width: 36,
                                      height: 22,
                                      borderRadius: 1,
                                      border: "1px solid #d1d5db",
                                      background: theme.background || "#fff",
                                      position: "relative",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: "40%",
                                        background: theme.color || "#000",
                                      }}
                                    />
                                  </Box>

                                  <Typography>
                                    {theme.name || `Theme ${theme.themeId}`}
                                  </Typography>
                                </Stack>
                              }
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>

                  {/* Default pages (locked) */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Included pages
                      </Typography>

                      {defaultPages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          This template has no default pages.
                        </Typography>
                      ) : (
                        <Stack divider={<Divider flexItem />} spacing={1}>
                          {defaultPages.map((page) => (
                            <Box
                              key={page.pageKey}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <FormControlLabel
                                sx={{ flex: 1, mr: 1 }}
                                control={<Checkbox checked disabled />}
                                label={
                                  <Box>
                                    <Typography fontWeight={600}>
                                      {page.title ||
                                        page.name ||
                                        `Page ${page.pageKey}`}
                                    </Typography>

                                    {page.description && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {page.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />

                              <Chip label="Included" size="small" color="success" />
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional pages (paid) */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Add more pages
                      </Typography>

                      {additionalPages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No additional pages are available for this template.
                        </Typography>
                      ) : (
                        <Stack divider={<Divider flexItem />} spacing={1}>
                          {additionalPages.map((page) => (
                            <Box
                              key={page.pageKey}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <FormControlLabel
                                sx={{ flex: 1, mr: 1 }}
                                control={
                                  <Checkbox
                                    checked={additionalPageIds.includes(
                                      page.pageKey
                                    )}
                                    onChange={() => toggleExtraPage(page.pageKey)}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography fontWeight={600}>
                                      {page.title ||
                                        page.name ||
                                        `Page ${page.pageKey}`}
                                    </Typography>

                                    {page.description && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {page.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />

                              <Typography
                                fontWeight={600}
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                + {formatPrice(page.pagePrice, currency)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* Billing and checkout */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Website details
                      </Typography>

                      <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={2.5}>
                          <TextField
                            fullWidth
                            label="Website name"
                            value={siteName}
                            onChange={(event) => setSiteName(event.target.value)}
                            placeholder="My Portfolio Site"
                            inputProps={{ maxLength: 150 }}
                            required
                          />

                          <TextField
                            fullWidth
                            label="Subdomain (optional)"
                            value={subdomain}
                            onChange={(event) =>
                              setSubdomain(event.target.value.toLowerCase().trim())
                            }
                            placeholder="myportfolio"
                            helperText="Use lowercase letters, numbers and hyphens. Example: myportfolio"
                          />

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Button
                              variant="outlined"
                              onClick={() => navigate("/viewtemp")}
                              disabled={loading}
                            >
                              Cancel
                            </Button>

                            <Button
                              type="submit"
                              variant="contained"
                              disabled={!canPay}
                            >
                              {loading
                                ? "Processing..."
                                : quoteLoading
                                  ? "Calculating..."
                                  : `Continue — ${formatPrice(total, currency)}`}
                            </Button>
                          </Box>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
}