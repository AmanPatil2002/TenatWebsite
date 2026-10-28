import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@mui/material";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

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

const isDefaultPage = (page) =>
  page.isDefault === true ||
  page.isDefault === "true" ||
  Number(page.isDefault) === 1;

const isDefaultTheme = (theme) =>
  theme.isDefault === true ||
  theme.isDefault === "true" ||
  Number(theme.isDefault) === 1;

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

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const template = location.state?.template || null;
  const initialThemeId = location.state?.themeId ?? null;

  const themes = useMemo(() => asArray(template?.themes), [template]);
  const pages = useMemo(() => asArray(template?.pages), [template]);

  const currency = template?.currency || "INR";

  // Normalize pages once so all downstream logic uses the same field names.
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
    () => normalizedPages.filter((p) => p.isDefault),
    [normalizedPages]
  );

  const additionalPages = useMemo(
    () => normalizedPages.filter((p) => !p.isDefault),
    [normalizedPages]
  );

  // ---- state ----
  const [themeId, setThemeId] = useState(() =>
    initialThemeId != null
      ? String(initialThemeId)
      : (() => {
          const def = themes.find(isDefaultTheme) || themes[0];
          return def ? String(def.themeId) : "";
        })()
  );

  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Tracks whether the Razorpay handler already fired — prevents double-verify
  const verifyingRef = useRef(false);

  // Auth guard
  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    if (!template) {
      setError("No template selected. Please select a template first.");
    }
  }, [navigate, template]);

  const selectedThemeId = getId(themeId);

  const additionalPageIds = useMemo(() => {
    const valid = new Set(additionalPages.map((p) => p.pageKey));
    return [...new Set(selectedExtraIds.map(getId).filter(Boolean))].filter(
      (id) => valid.has(id)
    );
  }, [selectedExtraIds, additionalPages]);

  // ---- server quote ----
  useEffect(() => {
    const token = getToken();
    const templateId = getId(template?.templateId);

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
          {
            templateId,
            themeId: selectedThemeId,
            // FIX: correct field name
            additionalPageIds,
          },
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
  }, [template?.templateId, selectedThemeId, additionalPageIds]);

  const templatePrice = quote
    ? Number(quote.templatePrice)
    : Number(template?.price ?? 0);

  const extrasAmount = quote
    ? Number(quote.total) - Number(quote.templatePrice)
    : additionalPages
        .filter((p) => additionalPageIds.includes(p.pageKey))
        .reduce((sum, p) => sum + p.pagePrice, 0);

  const total = quote ? Number(quote.total) : templatePrice + extrasAmount;

  const toggleExtraPage = (rawId) => {
    const id = getId(rawId);
    if (!id) return;
    setError("");
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---- checkout ----
  const handlePay = async () => {
    setError("");
    setSuccess(null);
    verifyingRef.current = false;

    const templateId = getId(template?.templateId);
    if (!templateId) return setError("Invalid template.");
    if (!selectedThemeId) return setError("Please select a theme.");
    if (quoteLoading || !quote) {
      return setError("Please wait for the price to be calculated.");
    }

    setPaying(true);
    try {
      // 1. Create Razorpay order (backend stores `payments` row with status='created')
      const { data: order } = await axios.post(
        `${API}/payments`,
        {
          templateId,
          themeId: selectedThemeId,
          additionalPageIds,
        },
        { headers: authHeaders({ "Content-Type": "application/json" }) }
      );

      // 2. Load Razorpay SDK
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Razorpay checkout failed to load.");

      // 3. Open checkout
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountMinor,
        currency: order.currency,
        order_id: order.orderId,
        name: template?.name || "Template purchase",
        description: "Website template",
        theme: { color: "#1976d2" },
        handler: async (response) => {
          if (verifyingRef.current) return;
          verifyingRef.current = true;

          try {
            // 4. Verify + capture server-side
            const { data: verified } = await axios.post(
              `${API}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: authHeaders({ "Content-Type": "application/json" }) }
            );

            setSuccess({
              siteId: verified.siteId,
              invoiceNumber: verified.invoiceNumber,
              paymentId: order.id,
              amount: order.totalAmount,
              currency: order.currency,
              alreadyProcessed: verified.alreadyProcessed,
            });
          } catch (err) {
            setError(
              getErrorMessage(
                err,
                "Payment verification failed. Contact support with your payment ID."
              )
            );
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      rzp.on("payment.failed", (resp) => {
        setError(
          resp?.error?.description ||
            resp?.error?.reason ||
            "Payment failed. Please try again."
        );
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      setError(getErrorMessage(err, "Payment could not start."));
      setPaying(false);
    }
  };

  const canPay =
    !paying &&
    !quoteLoading &&
    Boolean(quote) &&
    Boolean(template) &&
    Boolean(selectedThemeId);

  // ---- UI ----
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
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Checkout
          </Typography>
          <Typography color="text.secondary">
            Choose one theme. Default pages are included; add extra pages if you
            need them.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 } }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError("")}
            >
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
                  Your website has been created. You can view and manage it in
                  “My Sites”.
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
                  {success.invoiceNumber && (
                    <Chip
                      label={`Invoice: ${success.invoiceNumber}`}
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {success.amount != null && (
                    <Chip
                      label={`Paid: ${formatPrice(
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
              {/* LEFT: summary */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card
                  variant="outlined"
                  sx={{ height: "100%", borderRadius: 3 }}
                >
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
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Includes {defaultPages.length} default page
                            {defaultPages.length === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                        <Typography fontWeight={600}>
                          {formatPrice(templatePrice, currency)}
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
                          {formatPrice(extrasAmount, currency)}
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
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <CircularProgress size={14} />
                          <Typography variant="caption" color="text.secondary">
                            Calculating server price…
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* RIGHT: theme, pages, pay */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={3}>
                  {/* Theme */}
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
                          onChange={(e) => {
                            setError("");
                            setThemeId(e.target.value);
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
                                    aria-hidden
                                    sx={{
                                      width: 36,
                                      height: 22,
                                      borderRadius: 1,
                                      border: "1px solid #d1d5db",
                                      backgroundColor: theme.background || "#fff",
                                      color: theme.color || "#111",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      lineHeight: 1,
                                    }}
                                  >
                                    Aa
                                  </Box>
                                  <Typography>
                                    {theme.name || `Theme ${theme.themeId}`}
                                    {isDefaultTheme(theme) && (
                                      <Chip
                                        size="small"
                                        label="Default"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Typography>
                                </Stack>
                              }
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>

                  {/* Default pages */}
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
                                  <Typography fontWeight={600}>
                                    {page.title ||
                                      page.name ||
                                      `Page ${page.pageKey}`}
                                  </Typography>
                                }
                              />
                              <Chip
                                label="Included"
                                size="small"
                                color="success"
                              />
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional pages */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Add more pages
                      </Typography>
                      {additionalPages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No additional pages available for this template.
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
                                    onChange={() =>
                                      toggleExtraPage(page.pageKey)
                                    }
                                  />
                                }
                                label={
                                  <Typography fontWeight={600}>
                                    {page.title ||
                                      page.name ||
                                      `Page ${page.pageKey}`}
                                  </Typography>
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

                  {/* Pay */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Payment
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        You will be redirected to Razorpay to complete the
                        payment securely.
                      </Typography>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate("/templates")}
                          disabled={paying}
                        >
                          Cancel
                        </Button>

                        <Button
                          variant="contained"
                          size="large"
                          onClick={handlePay}
                          disabled={!canPay}
                          startIcon={
                            paying ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : null
                          }
                        >
                          {paying
                            ? "Processing..."
                            : quoteLoading
                            ? "Calculating..."
                            : canPay
                            ? `Pay ${formatPrice(total, currency)}`
                            : "Waiting for price…"}
                        </Button>
                      </Stack>
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