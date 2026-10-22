import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatPrice = (price, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template || null;

  const [siteName, setSiteName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!template) {
      setError("No template selected. Please choose a template before checkout.");
    }
  }, [navigate, template]);

  const totalAmount = useMemo(
    () => formatPrice(template?.price, template?.currency || "INR"),
    [template]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!template) {
      setError("Choose a template before continuing.");
      return;
    }

    const cleanSiteName = siteName.trim();
    const cleanSubdomain = subdomain.trim().toLowerCase();

    if (!cleanSiteName) {
      setError("Please enter your website name.");
      return;
    }

    if (!cleanSubdomain) {
      setError("Please enter a subdomain.");
      return;
    }

    if (!/^[a-z0-9-]{3,63}$/.test(cleanSubdomain)) {
      setError("Subdomain must be 3-63 characters and contain only lowercase letters, numbers, or hyphens.");
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
          siteName: cleanSiteName,
          subdomain: cleanSubdomain,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ p: { xs: 3, md: 5 }, background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)" }}>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Checkout
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete your purchase and launch your site with the selected template.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
                  Your website is now being provisioned with the selected template.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap>
                  <Chip label={`Site ID: ${success.siteId || "-"}`} color="success" variant="outlined" />
                  <Chip label={`Invoice ID: ${success.invoiceId || "-"}`} color="success" variant="outlined" />
                  <Chip label={`Transaction: ${success.transactionId || "-"}`} color="success" variant="outlined" />
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Button variant="contained" onClick={() => navigate("/viewtemp")}>
                  Back to templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={4}>
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
                      {template?.validityDays && <Chip label={`${template.validityDays} days`} size="small" />}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {template?.shortDescription || "Professional website template ready to launch."}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Subtotal</Typography>
                        <Typography fontWeight={600}>{totalAmount}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Platform fee</Typography>
                        <Typography>₹0</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography fontWeight={700}>Total</Typography>
                        <Typography fontWeight={700}>{totalAmount}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={7}>
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
                        />

                        <TextField
                          fullWidth
                          label="Subdomain"
                          value={subdomain}
                          onChange={(event) => setSubdomain(event.target.value)}
                          placeholder="myportfolio"
                          helperText="Use only lowercase letters, numbers, and hyphens. Example: myportfolio"
                        />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                          <Button variant="outlined" onClick={() => navigate("/viewtemp")}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="contained" disabled={loading || !template}>
                            {loading ? "Processing..." : "Pay now"}
                          </Button>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
