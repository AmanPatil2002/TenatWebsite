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
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

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
  if (v && typeof v === "object" && Array.isArray(v.data))
    return v.data[0] === 1;
  return false;
};

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

const DEFAULT_PAGE_KEYS = new Set([
  "home",
  "index",
  "contact",
  "contact-us",
  "contactus",
  "about",
  "about-us",
  "aboutus",
  "story",
  "our-story",
]);

const normalizeKey = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-");

const isDefaultPage = (page) =>
  DEFAULT_PAGE_KEYS.has(normalizeKey(page.pageKey)) ||
  DEFAULT_PAGE_KEYS.has(normalizeKey(pageTitle(page)));

/* ------------------------------ design tokens ------------------------------ */

const PAGE_BG = "#F6F7F9";
const CARD_RADIUS = 2;
const cardSx = {
  borderRadius: CARD_RADIUS,
  borderColor: "#E3E6EB",
  bgcolor: "#fff",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

/* --------------------------- small components --------------------------- */

function Section({ number, title, hint, children, last = false }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderBottom: last ? "none" : "1px solid #E3E6EB",
      }}
    >
      <Stack
        direction="row"
        spacing={1.75}
        sx={{ alignItems: "flex-start", mb: 2.5 }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            mt: 0.25,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: "primary.main",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {number}
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {hint && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25 }}
            >
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

function SummaryRow({ label, caption, value, muted = false }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "start",
        columnGap: 2,
        width: "100%",
      }}
    >
      {/* Left: Label and caption */}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          color={muted ? "text.secondary" : "text.primary"}
          sx={{
            fontWeight: 400,
            overflowWrap: "anywhere",
          }}
        >
          {label}
        </Typography>

        {caption && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mt: 0.35,
              lineHeight: "1.5",
            }}
          >
            {caption}
          </Typography>
        )}
      </Box>

      {/* Right: Price or value */}
      <Typography
        variant="body2"
        fontWeight={600}
        color={muted ? "text.secondary" : "text.primary"}
        sx={{
          whiteSpace: "nowrap",
          textAlign: "right",
          ...numeric,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
function TrustItem({ icon, children }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        color: "text.secondary",
        width: "100%",
        textAlign: "center",
      }}
    >
      <Box sx={{ display: "flex", flexShrink: 0 }}>{icon}</Box>

      <Typography
        variant="caption"
        sx={{
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

/* -------------------------------- page -------------------------------- */

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const passedTemplate = location.state?.template || null;
  const initialThemeId = location.state?.themeId ?? null;

  const [fullTemplate, setFullTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);

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
          isDefault:
            page.isDefault == null
              ? isDefaultPage(page)
              : toFlag(page.isDefault),
        }))
        .filter((page) => page.pageKey !== null)
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    [pages],
  );

  const defaultPages = useMemo(
    () => normalizedPages.filter((p) => p.isDefault),
    [normalizedPages],
  );

  const additionalPages = useMemo(
    () => normalizedPages.filter((p) => !p.isDefault),
    [normalizedPages],
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
        })(),
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
      (t) => String(t.themeId ?? t.id) === String(themeId),
    );
    if (!exists) {
      const def = themes.find(isDefaultTheme) || themes[0];
      setThemeId(String(def.themeId ?? def.id));
    }
  }, [themes, themeId]);

  const selectedThemeId = getId(themeId);
  const templateId = getId(template?.templateId ?? template?.id);

  const additionalPageIds = useMemo(() => {
    const valid = new Set(additionalPages.map((p) => p.pageKey));
    return [...new Set(selectedExtraIds.map(getId).filter(Boolean))].filter(
      (id) => valid.has(id),
    );
  }, [selectedExtraIds, additionalPages]);

  const selectedExtras = useMemo(
    () => additionalPages.filter((p) => additionalPageIds.includes(p.pageKey)),
    [additionalPages, additionalPageIds],
  );

  const selectableExtraPages = useMemo(
    () => additionalPages.filter((page) => !isDefaultPage(page)),
    [additionalPages],
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
          { headers: authHeaders({ "Content-Type": "application/json" }) },
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

  const selectedTheme = themes.find(
    (t) => String(t.themeId ?? t.id) === String(themeId),
  );

  const toggleExtraPage = (rawId) => {
    const id = getId(rawId);
    if (!id) return;
    setError("");
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
        { headers: authHeaders({ "Content-Type": "application/json" }) },
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
      <Box sx={{ bgcolor: PAGE_BG, minHeight: "100vh" }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 10 } }}>
          <Paper variant="outlined" sx={{ ...cardSx, p: { xs: 3, md: 5 } }}>
            <Stack
              spacing={1.5}
              sx={{ alignItems: "center", textAlign: "center", mb: 4 }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: (t) => alpha(t.palette.success.main, 0.12),
                }}
              >
                <CheckCircleIcon color="success" sx={{ fontSize: 44 }} />
              </Box>
              <Typography variant="h5" fontWeight={700}>
                Payment successful
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ maxWidth: 380, textAlign: "center" }}
              >
                Your website has been created. You can view and manage it in My
                Sites.
              </Typography>
            </Stack>

            <Box
              sx={{
                border: "1px solid #E3E6EB",
                borderRadius: 1.5,
                bgcolor: "#FAFBFC",
              }}
            >
              {rows.map(([label, value], i) => (
                <Stack
                  key={label}
                  direction="row"
                  spacing={2}
                  sx={{
                    justifyContent: "space-between",
                    px: 2.5,
                    py: 1.5,
                    borderTop: i === 0 ? "none" : "1px solid #E3E6EB",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      overflowWrap: "anywhere",
                      textAlign: "right",
                      ...numeric,
                    }}
                  >
                    {value}
                  </Typography>
                </Stack>
              ))}
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: 4 }}
            >
              <Button
                fullWidth
                variant="outlined"
                size="large"
                sx={{ py: 1.3, fontWeight: 600, textTransform: "none" }}
                onClick={() => navigate("/mysite")}
              >
                My sites
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  /* ------------------------------ checkout ------------------------------ */

  return (
    <Box sx={{ bgcolor: PAGE_BG, minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/templates")}
          disabled={paying}
          sx={{ mb: 1, ml: -1, textTransform: "none", color: "text.secondary" }}
        >
          Back to templates
        </Button>

        <Stack
          spacing={1}
          sx={{
            mb: 3.5,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
              Checkout
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Pick a theme, add any extra pages, and review your order.
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 1.5 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {!template ? (
          <Paper
            variant="outlined"
            sx={{ ...cardSx, p: 5, textAlign: "center" }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No template selected
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Choose a template first, then come back to check out.
            </Typography>
            <Button
              variant="contained"
              disableElevation
              sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={() => navigate("/templates")}
            >
              Browse templates
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
            {/* ------------------------- LEFT: steps ------------------------- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ ...cardSx, overflow: "hidden" }}>
                <Section
                  number={1}
                  title="Choose a theme"
                  hint="Pick one. The colors apply to every page of your site."
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
                      <Grid container spacing={1.5} sx={{ flexWrap: "wrap" }}>
                        {themes.map((theme) => {
                          const value = String(theme.themeId ?? theme.id);
                          const selected = value === String(themeId);
                          const name = theme.name || `Theme ${value}`;

                          return (
                            <Grid
                              key={value}
                              size={{ xs: 12, sm: 6 }}
                              sx={{ display: "flex" }}
                            >
                              <FormControlLabel
                                value={value}
                                control={<Radio size="small" sx={{ p: 0.5 }} />}
                                sx={{
                                  m: 0,
                                  flex: 1,
                                  minWidth: 0,
                                  boxSizing: "border-box",
                                  alignItems: "center",
                                  gap: 1,
                                  px: 1.5,
                                  py: 1.25,
                                  border: "1.5px solid",
                                  borderColor: selected
                                    ? "primary.main"
                                    : "#E3E6EB",
                                  borderRadius: 1.5,
                                  bgcolor: selected
                                    ? (t) => alpha(t.palette.primary.main, 0.05)
                                    : "#fff",
                                  transition:
                                    "border-color .15s, background-color .15s",
                                  "&:hover": {
                                    borderColor: selected
                                      ? "primary.main"
                                      : "#C5CAD3",
                                  },
                                  "& .MuiFormControlLabel-label": {
                                    flex: 1,
                                    minWidth: 0,
                                  },
                                }}
                                label={
                                  <Stack
                                    direction="row"
                                    spacing={1.25}
                                    sx={{ alignItems: "center", width: "100%" }}
                                  >
                                    <Box
                                      aria-hidden
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        flexShrink: 0,
                                        borderRadius: 1,
                                        border: "1px solid #E3E6EB",
                                        backgroundColor:
                                          theme.background || "#fff",
                                        color: theme.color || "#111",
                                        display: "grid",
                                        placeItems: "center",
                                        fontSize: 15,
                                        fontWeight: 800,
                                      }}
                                    >
                                      Aa
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      noWrap
                                      sx={{ flex: 1, minWidth: 0 }}
                                    >
                                      {name}
                                    </Typography>
                                    {isDefaultTheme(theme) && (
                                      <Chip
                                        size="small"
                                        label="Default"
                                        sx={{
                                          flexShrink: 0,
                                          height: 22,
                                          fontSize: 11,
                                          fontWeight: 600,
                                          bgcolor: "#EEF0F4",
                                        }}
                                      />
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
                </Section>

                <Section
                  number={2}
                  title="Add more pages"
                  hint="Optional. Each extra page is added to your total."
                  last
                >
                  {templateLoading && selectableExtraPages.length === 0 ? (
                    <CircularProgress size={20} />
                  ) : selectableExtraPages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No additional pages are available for this template.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {selectableExtraPages.map((page) => {
                        const checked = additionalPageIds.includes(
                          page.pageKey,
                        );
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
                              boxSizing: "border-box",
                              pr: 2,
                              py: 0.5,
                              border: "1.5px solid",
                              borderColor: checked ? "primary.main" : "#E3E6EB",
                              borderRadius: 1.5,
                              bgcolor: checked
                                ? (t) => alpha(t.palette.primary.main, 0.05)
                                : "#fff",
                              transition:
                                "border-color .15s, background-color .15s",
                              "&:hover": {
                                borderColor: checked
                                  ? "primary.main"
                                  : "#C5CAD3",
                              },
                              "& .MuiFormControlLabel-label": {
                                flex: 1,
                                minWidth: 0,
                              },
                            }}
                            label={
                              <Stack
                                direction="row"
                                spacing={2}
                                sx={{
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography variant="body2" fontWeight={600}>
                                  {pageTitle(page)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="text.secondary"
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
                </Section>
              </Paper>
            </Grid>

            {/* ---------------------- RIGHT: order summary ---------------------- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  ...cardSx,
                  overflow: "hidden",
                  position: { md: "sticky" },
                  top: { md: 24 },
                }}
              >
                <Box
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header */}
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="overline"
                      color="primary.main"
                      sx={{
                        lineHeight: 1.5,
                        letterSpacing: 1.2,
                        fontWeight: 600,
                      }}
                    >
                      Order Summary
                    </Typography>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ lineHeight: "1.3" }}
                    >
                      {template.name || "Website template"}
                    </Typography>

                    {template.validityDays && (
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          If purchased today, valid until{" "}
                          {new Date(
                            Date.now() +
                              template.validityDays * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </Typography>

                        <Chip
                          size="small"
                          label={`Valid for ${template.validityDays} days`}
                          sx={{
                            mt: 0.5,
                            bgcolor: "#EEF0F4",
                            fontWeight: 500,
                            height: 24,
                          }}
                        />
                      </>
                    )}
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Price Breakdown */}
                  <Stack spacing={2} sx={{ width: "100%" }}>
                    {/* Template */}
                    <SummaryRow
                      label="Template"
                      caption={
                        defaultPages.length > 0
                          ? `Includes ${defaultPages.length} default page${
                              defaultPages.length > 1 ? "s" : ""
                            }`
                          : undefined
                      }
                      value={formatPrice(templatePrice, currency)}
                    />

                    {/* Selected Theme */}
                    {selectedTheme && (
                      <SummaryRow
                        label="Theme"
                        value={selectedTheme.name || undefined}
                        muted
                      />
                    )}

                    {/* Selected Additional Pages */}
                    {selectedExtras.map((page) => (
                      <SummaryRow
                        key={page.pageKey}
                        label={pageTitle(page)}
                        value={formatPrice(page.pagePrice, currency)}
                      />
                    ))}

                    {/* No Additional Pages */}
                    {selectedExtras.length === 0 && (
                      <SummaryRow label="Additional pages" value="None" muted />
                    )}
                  </Stack>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Total */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      gap: 2,
                    }}
                  >
                    <Typography variant="body1" fontWeight={700}>
                      Total
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", flexShrink: 0 }}
                    >
                      {quoteLoading && <CircularProgress size={14} />}

                      <Typography
                        variant="h5"
                        fontWeight={800}
                        letterSpacing="-0.02em"
                        sx={{
                          whiteSpace: "nowrap",
                          textAlign: "right",
                          ...numeric,
                        }}
                      >
                        {formatPrice(total, currency)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Payment Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disableElevation
                    onClick={handlePay}
                    disabled={!canPay}
                    startIcon={
                      paying ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <LockOutlinedIcon sx={{ fontSize: 18 }} />
                      )
                    }
                    sx={{
                      mt: 3,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: 16,
                      textTransform: "none",
                      borderRadius: 1.5,
                    }}
                  >
                    {paying
                      ? "Processing…"
                      : quoteLoading || templateLoading
                        ? "Calculating price…"
                        : canPay
                          ? `Pay ${formatPrice(total, currency)}`
                          : "Select a theme to continue"}
                  </Button>

                  {/* Trust Information */}
                  <Stack
                    spacing={1.25}
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      mt: 2.5,
                      width: "100%",
                    }}
                  >
                    <TrustItem
                      icon={<BoltOutlinedIcon sx={{ fontSize: 16 }} />}
                    >
                      Your website is created as soon as the order is placed.
                    </TrustItem>

                    <TrustItem
                      icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 16 }} />}
                    >
                      The final price is calculated and verified on the server.
                    </TrustItem>
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
