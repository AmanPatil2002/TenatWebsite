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

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatPrice = (price, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(price || 0));

// MySQL JSON columns normally arrive parsed; handle a string just in case
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

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template || null;

  const themes = useMemo(() => asArray(template?.themes), [template]);
  const pages = useMemo(() => asArray(template?.pages), [template]);
  const currency = template?.currency || "INR";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [templateAlreadyPurchased, setTemplateAlreadyPurchased] = useState(false);
  const [siteName, setSiteName] = useState(template?.name || "");
  const [subdomain, setSubdomain] = useState("");

  const [themeId, setThemeId] = useState(null);
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [quote, setQuote] = useState(null); // server-calculated price

  // ---------- auth + already-purchased check ----------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!template) {
      setError("No template selected. Please choose a template before checkout.");
      return;
    }

    axios
      .get(`${API}/site`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        const alreadyPurchased =
          Array.isArray(response.data) &&
          response.data.some((site) => Number(site.templateId) === Number(template.templateId));
        setTemplateAlreadyPurchased(alreadyPurchased);
        if (alreadyPurchased) {
          setError("This template has already been purchased by your account.");
        }
      })
      .catch(() => {
        // Ignore listing errors here; checkout still validates server-side.
      });
  }, [navigate, template]);

  // ---------- local total (instant) ----------
  const localPagesAmount = useMemo(
    () =>
      pages
        .filter((p) => selectedPageIds.includes(p.pagesId))
        .reduce((sum, p) => sum + Number(p.pagePrice || 0), 0),
    [pages, selectedPageIds]
  );
  const localBaseAmount = Number(template?.price || 0);

  // ---------- server quote (source of truth) ----------
  useEffect(() => {
    if (!template || !themeId || selectedPageIds.length === 0) {
      setQuote(null);
      return;
    }

    const token = localStorage.getItem("token");
    let cancelled = false;

    axios
      .post(
        `${API}/payments/quote`,
        { templateId: template.templateId, themeId, pageIds: selectedPageIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (!cancelled) setQuote(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setQuote(null);
          setError(err.response?.data?.message || "Could not calculate price.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [template, themeId, selectedPageIds]);

  const baseAmount = quote ? quote.baseAmount : localBaseAmount;
  const pagesAmount = quote ? quote.pagesAmount : localPagesAmount;
  const total = quote ? quote.amount : localBaseAmount + localPagesAmount;

  // ---------- handlers ----------
  const togglePage = (pagesId) => {
    setError("");
    setSelectedPageIds((prev) =>
      prev.includes(pagesId) ? prev.filter((id) => id !== pagesId) : [...prev, pagesId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!template) {
      setError("Choose a template before continuing.");
      return;
    }
    if (templateAlreadyPurchased) {
      setError("This template has already been purchased by your account.");
      return;
    }
    if (!siteName.trim()) {
      setError("Website name is required.");
      return;
    }
    if (!themeId) {
      setError("Please select a theme.");
      return;
    }
    if (selectedPageIds.length === 0) {
      setError("Please select at least one page.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/payments/checkout`,
        {
          templateId: template.templateId,
          themeId,
          pageIds: selectedPageIds,
          siteName: siteName.trim(),
          subdomain: subdomain.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canPay =
    !loading && template && !templateAlreadyPurchased && themeId && selectedPageIds.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ p: { xs: 3, md: 5 }, background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)" }}>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Payment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a theme and the pages you need, then complete your purchase.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success ? (
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "success.light" }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>
                  Payment successful
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your website is now being provisioned with the selected template, theme and pages.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
                  <Chip label={`Site ID: ${success.siteId || "-"}`} color="success" variant="outlined" />
                  <Chip
                    label={`Payment ID: ${success.paymentId || "-"}`}
                    color="success"
                    variant="outlined"
                  />
                  {success.invoiceId && (
                    <Chip label={`Invoice ID: ${success.invoiceId}`} color="success" variant="outlined" />
                  )}
                  {success.transactionId && (
                    <Chip
                      label={`Transaction: ${success.transactionId}`}
                      color="success"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    label={`Paid: ${formatPrice(success.amount, success.currency || currency)}`}
                    color="success"
                  />
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button variant="contained" onClick={() => navigate(`/mysite/${success.siteId}`)}>
                    Customize your site
                  </Button>
                  <Button variant="outlined" onClick={() => navigate("/mysite")}>
                    My sites
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={4}>
              {/* ---------- LEFT: summary ---------- */}
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="overline" color="text.secondary">
                      Selected template
                    </Typography>

                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                      {template?.name || "Template preview"}
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                      {template?.language && <Chip label={template.language} size="small" />}
                      {template?.validityDays && (
                        <Chip label={`${template.validityDays} days`} size="small" />
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {template?.shortDescription || "Professional website template ready to launch."}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Price of template</Typography>
                        <Typography fontWeight={600}>{formatPrice(baseAmount, currency)}</Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">
                          Pages ({selectedPageIds.length})
                        </Typography>
                        <Typography fontWeight={600}>{formatPrice(pagesAmount, currency)}</Typography>
                      </Box>

                      <Divider />

                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography fontWeight={700}>Total</Typography>
                        <Typography fontWeight={700}>{formatPrice(total, currency)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* ---------- RIGHT: choices + billing ---------- */}
              <Grid item xs={12} md={7}>
                <Stack spacing={3}>
                  {/* Theme: exactly one */}
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
                          value={themeId === null ? "" : String(themeId)}
                          onChange={(e) => {
                            setError("");
                            setThemeId(Number(e.target.value));
                          }}
                        >
                          {themes.map((t) => (
                            <FormControlLabel
                              key={t.themeId}
                              value={String(t.themeId)}
                              control={<Radio />}
                              label={
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 36,
                                      height: 22,
                                      borderRadius: 1,
                                      border: "1px solid #d1d5db",
                                      background: t.background || "#fff",
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
                                        background: t.color || "#000",
                                      }}
                                    />
                                  </Box>
                                  <Typography>{t.name}</Typography>
                                </Stack>
                              }
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pages: multiple */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Select pages
                      </Typography>

                      {pages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No pages are available for this template.
                        </Typography>
                      ) : (
                        <Stack divider={<Divider flexItem />} spacing={1}>
                          {pages.map((p) => (
                            <Box
                              key={p.pagesId}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedPageIds.includes(p.pagesId)}
                                    onChange={() => togglePage(p.pagesId)}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography fontWeight={600}>{p.title}</Typography>
                                    {p.description && (
                                      <Typography variant="caption" color="text.secondary">
                                        {p.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                              <Typography fontWeight={600} sx={{ whiteSpace: "nowrap" }}>
                                {formatPrice(p.pagePrice, currency)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* Billing */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Billing details
                      </Typography>

                      <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={2.5}>
                          <TextField
                            fullWidth
                            label="Website name"
                            value={siteName}
                            onChange={(event) => setSiteName(event.target.value)}
                            placeholder="My Portfolio Site"
                            required
                          />

                          <TextField
                            fullWidth
                            label="Subdomain (optional)"
                            value={subdomain}
                            onChange={(event) => setSubdomain(event.target.value.toLowerCase())}
                            placeholder="myportfolio"
                            helperText="Use only lowercase letters, numbers, and hyphens. Example: myportfolio"
                          />

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Button variant="outlined" onClick={() => navigate("/viewtemp")}>
                              Cancel
                            </Button>
                            <Button type="submit" variant="contained" disabled={!canPay}>
                              {loading
                                ? "Processing..."
                                : templateAlreadyPurchased
                                ? "Already purchased"
                                : `Pay ${formatPrice(total, currency)}`}
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