import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

/* ------------------------------ helpers ------------------------------ */

const formatPrice = (price, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(price || 0));
  } catch {
    return `${currency || "INR"} ${Number(price || 0).toFixed(2)}`;
  }
};

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
  error?.response?.data?.message || error?.message || fallback;

const getId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Accepts true/1/"1"/"true", snake_case, and MySQL BIT(1) buffers
// ({ type: "Buffer", data: [1] }).
const toFlag = (v) => {
  if (v === true || v === 1 || v === "1" || v === "true") return true;
  if (v && typeof v === "object" && Array.isArray(v.data)) return v.data[0] === 1;
  return false;
};

const isDefaultPage = (page) => toFlag(page?.isDefault ?? page?.is_default);
const isDefaultTheme = (theme) => toFlag(theme?.isDefault ?? theme?.is_default);

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const pageTitle = (page) => page.title || page.name || `Page ${page.pageKey}`;

const numeric = { fontVariantNumeric: "tabular-nums" };

/* --------------------------- small components --------------------------- */

// A numbered step: checkout really is a sequence (theme -> pages -> pay).
function Step({ number, title, hint, children }) {
  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {number}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
            {title}
          </Typography>
          {hint && (
            <Typography variant="body2" color="text.secondary">
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
      <Box sx={{ pl: { sm: 6 } }}>{children}</Box>
    </Box>
  );
}

function SummaryRow({ label, caption, value, strong = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          color={strong ? "text.primary" : "text.secondary"}
          fontWeight={strong ? 700 : 400}
          sx={{ overflowWrap: "anywhere" }}
        >
          {label}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Box>
      <Typography
        variant="body2"
        fontWeight={strong ? 700 : 600}
        sx={{ whiteSpace: "nowrap", ...numeric }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* -------------------------------- page -------------------------------- */

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  // Template passed from the list/card. It may be a light version without
  // pages[].isDefault, so we re-fetch the full template below.
  const passedTemplate = location.state?.template || null;
  const initialThemeId = location.state?.themeId ?? null;

  const [fullTemplate, setFullTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Prefer the full template once loaded; fall back to what was passed in.
  const template = fullTemplate || passedTemplate;

  const themes = useMemo(() => asArray(template?.themes), [template]);
  const pages = useMemo(() => asArray(template?.pages), [template]);

  const currency = template?.currency || "INR";

  const normalizedPages = useMemo(
    () =>
      pages
        .map((page) => ({
          ...page,
          pageKey: getId(page.pagesId ?? page.pageId ?? page.id),
          pagePrice: Number(page.pagePrice ?? page.price ?? 0),
          isDefault: isDefaultPage(page),
        }))
        .filter((page) => page.pageKey !== null)
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    [pages]
  );

  // Pages marked "Default" in Edit Template: already included in the price.
  const defaultPages = useMemo(
    () => normalizedPages.filter((p) => p.isDefault),
    [normalizedPages]
  );

  // Everything else: optional, priced, selectable.
  const additionalPages = useMemo(
    () => normalizedPages.filter((p) => !p.isDefault),
    [normalizedPages]
  );

  // ---- state ----
  const [themeId, setThemeId] = useState(() =>
    initialThemeId != null
      ? String(initialThemeId)
      : (() => {
          const def =
            asArray(passedTemplate?.themes).find(isDefaultTheme) ||
            asArray(passedTemplate?.themes)[0];
          return def ? String(def.themeId ?? def.id) : "";
        })()
  );

  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    if (!passedTemplate) {
      setError("No template selected. Please select a template first.");
    }
  }, [navigate, passedTemplate]);

  // Load the full template so pages[].isDefault is always present.
  useEffect(() => {
    const templateId = getId(passedTemplate?.templateId ?? passedTemplate?.id);
    if (!templateId) return;

    let cancelled = false;

    const loadFull = async () => {
      setTemplateLoading(true);
      try {
        const res = await axios.get(`${API}/templates/${templateId}`, {
          headers: authHeaders(),
        });
        const data = res?.data?.data ?? res?.data?.template ?? res?.data;
        if (!cancelled && data && typeof data === "object") {
          // Keep any fields the list version had, overlay the full version.
          setFullTemplate({ ...passedTemplate, ...data });
        }
      } catch {
        // Fall back to the passed template silently.
      } finally {
        if (!cancelled) setTemplateLoading(false);
      }
    };

    loadFull();

    return () => {
      cancelled = true;
    };
  }, [passedTemplate]);

  // Once themes are known, make sure the selected theme is valid.
  useEffect(() => {
    if (themes.length === 0) return;
    const exists = themes.some(
      (t) => String(t.themeId ?? t.id) === String(themeId)
    );
    if (!exists) {
      const def = themes.find(isDefaultTheme) || themes[0];
      setThemeId(String(def.themeId ?? def.id));
    }
  }, [themes, themeId]);

  const selectedThemeId = getId(themeId);
  const templateId = getId(template?.templateId ?? template?.id);

  // Only additional (non-default) pages can ever be sent to the server.
  const additionalPageIds = useMemo(() => {
    const valid = new Set(additionalPages.map((p) => p.pageKey));
    return [...new Set(selectedExtraIds.map(getId).filter(Boolean))].filter(
      (id) => valid.has(id)
    );
  }, [selectedExtraIds, additionalPages]);

  const selectedExtras = useMemo(
    () => additionalPages.filter((p) => additionalPageIds.includes(p.pageKey)),
    [additionalPages, additionalPageIds]
  );

  // ---- server quote ----
  useEffect(() => {
    const token = getToken();

    if (!token || !templateId || !selectedThemeId) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }

    let cancelled = false;

    const fetchQuote = async () => {
      setQuoteLoading(true);
      setError("");
      try {
        const { data } = await axios.post(
          `${API}/payments/quote`,
          { templateId, themeId: selectedThemeId, additionalPageIds },
          { headers: authHeaders({ "Content-Type": "application/json" }) }
        );
        if (!cancelled) setQuote(data);
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
  }, [templateId, selectedThemeId, additionalPageIds]);

  const templatePrice = quote
    ? Number(quote.baseAmount)
    : Number(template?.price ?? 0);

  const extrasAmount = quote
    ? Number(quote.pagesAmount)
    : selectedExtras.reduce((sum, p) => sum + p.pagePrice, 0);

  const total = quote ? Number(quote.total) : templatePrice + extrasAmount;

  const toggleExtraPage = (rawId) => {
    const id = getId(rawId);
    if (!id) return;
    setError("");
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---- purchase: one call saves payment, pages, invoice and site ----
  const handlePay = async () => {
    if (paying) return;
    setError("");
    setSuccess(null);

    if (!templateId) return setError("Invalid template.");
    if (!selectedThemeId) return setError("Please select a theme.");
    if (quoteLoading || !quote) {
      return setError("Please wait for the price to be calculated.");
    }

    setPaying(true);
    try {
      const { data } = await axios.post(
        `${API}/payments`,
        {
          templateId,
          themeId: selectedThemeId,
          additionalPageIds,
          method: "manual",
        },
        { headers: authHeaders({ "Content-Type": "application/json" }) }
      );

      setSuccess({
        siteId: data.siteId,
        invoiceNumber: data.invoiceNumber,
        paymentId: data.id,
        transactionId: data.transactionId,
        amount: data.totalAmount,
        currency: data.currency,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Purchase could not be completed."));
    } finally {
      setPaying(false);
    }
  };

  const canPay =
    !paying &&
    !quoteLoading &&
    !templateLoading &&
    Boolean(quote) &&
    Boolean(template) &&
    Boolean(selectedThemeId);

  /* ------------------------------ success ------------------------------ */

  if (success) {
    const rows = [
      success.siteId != null && ["Site ID", success.siteId],
      success.invoiceNumber && ["Invoice", success.invoiceNumber],
      success.transactionId && ["Transaction", success.transactionId],
      success.amount != null && [
        "Total paid",
        formatPrice(success.amount, success.currency || currency),
      ],
    ].filter(Boolean);

    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
          <Stack alignItems="center" spacing={1} sx={{ textAlign: "center", mb: 3 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
            <Typography variant="h5" fontWeight={700}>
              Purchase successful
            </Typography>
            <Typography color="text.secondary">
              Your website has been created. You can view and manage it in My
              Sites.
            </Typography>
          </Stack>

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
            {rows.map(([label, value], i) => (
              <Stack
                key={label}
                direction="row"
                justifyContent="space-between"
                spacing={2}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderTop: i === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ overflowWrap: "anywhere", textAlign: "right", ...numeric }}
                >
                  {value}
                </Typography>
              </Stack>
            ))}
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() =>
                success.siteId != null
                  ? navigate(`/mysite/${success.siteId}`)
                  : navigate("/mysite")
              }
            >
              View your site
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate("/mysite")}
            >
              My sites
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  /* ------------------------------ checkout ------------------------------ */

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/templates")}
        disabled={paying}
        sx={{ mb: 1, ml: -1 }}
      >
        Back to templates
      </Button>

      <Typography variant="h4" fontWeight={700}>
        Checkout
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        Pick a theme, add any extra pages, and review your order.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!template ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No template selected
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Choose a template first, then come back to check out.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/templates")}>
            Browse templates
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} alignItems="flex-start">
          {/* ------------------------- LEFT: steps ------------------------- */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              {/* 1. Theme */}
              <Step
                number={1}
                title="Choose a theme"
                hint="You can only pick one. Colors apply to every page of your site."
              >
                {themes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No themes are available for this template.
                  </Typography>
                ) : (
                  <RadioGroup
                    value={String(themeId)}
                    onChange={(e) => {
                      setError("");
                      setThemeId(e.target.value);
                    }}
                  >
                    <Grid container spacing={1.5}>
                      {themes.map((theme) => {
                        const value = String(theme.themeId ?? theme.id);
                        const selected = value === String(themeId);
                        return (
                          <Grid key={value} size={{ xs: 12, sm: 6 }}>
                            <FormControlLabel
                              value={value}
                              control={<Radio size="small" />}
                              sx={{
                                m: 0,
                                width: "100%",
                                px: 1.5,
                                py: 1,
                                border: "1px solid",
                                borderColor: selected ? "primary.main" : "divider",
                                borderRadius: 1.5,
                                bgcolor: selected
                                  ? (t) => alpha(t.palette.primary.main, 0.06)
                                  : "transparent",
                                "& .MuiFormControlLabel-label": { flex: 1, minWidth: 0 },
                              }}
                              label={
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Box
                                    aria-hidden
                                    sx={{
                                      width: 40,
                                      height: 28,
                                      flexShrink: 0,
                                      borderRadius: 1,
                                      border: "1px solid",
                                      borderColor: "divider",
                                      backgroundColor: theme.background || "#fff",
                                      color: theme.color || "#111",
                                      display: "grid",
                                      placeItems: "center",
                                      fontSize: 12,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Aa
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    noWrap
                                    sx={{ flex: 1 }}
                                  >
                                    {theme.name || `Theme ${value}`}
                                  </Typography>
                                  {isDefaultTheme(theme) && (
                                    <Chip size="small" label="Default" variant="outlined" />
                                  )}
                                </Stack>
                              }
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                )}
              </Step>

              <Divider />

              
              {/* @. Additional pages: the only selectable ones */}
              <Step
                number={2}
                title="Add more pages"
                hint="Optional. Each extra page is added to the price."
              >
                {templateLoading && additionalPages.length === 0 ? (
                  <CircularProgress size={20} />
                ) : additionalPages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No additional pages are available for this template.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {additionalPages.map((page) => {
                      const checked = additionalPageIds.includes(page.pageKey);
                      return (
                        <FormControlLabel
                          key={page.pageKey}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={() => toggleExtraPage(page.pageKey)}
                            />
                          }
                          sx={{
                            m: 0,
                            width: "100%",
                            pr: 2,
                            py: 0.25,
                            border: "1px solid",
                            borderColor: checked ? "primary.main" : "divider",
                            borderRadius: 1.5,
                            bgcolor: checked
                              ? (t) => alpha(t.palette.primary.main, 0.06)
                              : "transparent",
                            "& .MuiFormControlLabel-label": { flex: 1, minWidth: 0 },
                          }}
                          label={
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={2}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {pageTitle(page)}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ whiteSpace: "nowrap", ...numeric }}
                              >
                                + {formatPrice(page.pagePrice, currency)}
                              </Typography>
                            </Stack>
                          }
                        />
                      );
                    })}
                  </Stack>
                )}
              </Step>
            </Paper>
          </Grid>

          {/* ---------------------- RIGHT: order summary ---------------------- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 2,
                p: 3,
                position: { md: "sticky" },
                top: { md: 24 },
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Order summary
              </Typography>

              {template.thumbnailUrl && (
                <Box
                  component="img"
                  src={template.thumbnailUrl}
                  alt={template.name || "Template preview"}
                  sx={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 2,
                  }}
                />
              )}

              <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
                {template.name || "Website template"}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {template.language && <Chip size="small" label={template.language} />}
                {template.validityDays && (
                  <Chip size="small" label={`Valid for ${template.validityDays} days`} />
                )}
              </Stack>

              {template.shortDescription && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {template.shortDescription}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.25}>
                <SummaryRow
                  label="Template"
                  caption={`Includes ${defaultPages.length} page${
                    defaultPages.length === 1 ? "" : "s"
                  }`}
                  value={formatPrice(templatePrice, currency)}
                />

                {selectedExtras.map((page) => (
                  <SummaryRow
                    key={page.pageKey}
                    label={pageTitle(page)}
                    value={formatPrice(page.pagePrice, currency)}
                  />
                ))}

                {selectedExtras.length === 0 && (
                  <SummaryRow label="Additional pages" value="None" />
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontWeight={700}>Total</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {quoteLoading && <CircularProgress size={14} />}
                  <Typography variant="h5" fontWeight={700} sx={numeric}>
                    {formatPrice(total, currency)}
                  </Typography>
                </Stack>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePay}
                disabled={!canPay}
                startIcon={
                  paying ? <CircularProgress size={18} color="inherit" /> : null
                }
                sx={{ mt: 2.5, py: 1.4, fontWeight: 700 }}
              >
                {paying
                  ? "Processing…"
                  : quoteLoading || templateLoading
                  ? "Calculating price…"
                  : canPay
                  ? `Pay ${formatPrice(total, currency)}`
                  : "Select a theme to continue"}
              </Button>

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 1.5, color: "text.secondary" }}
              >
                <LockOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">
                  Your website is created as soon as the order is placed.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}