import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  LinearProgress,
} from "@mui/material";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Limits mirror the backend (postAuth) and the users table.
const NAME_MAX = 120;
const EMAIL_MAX = 190;
const PHONE_MAX = 10; // backend rejects > 10; the column allows 20, so raise both together
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // bcrypt only uses the first 72 bytes
const EMAIL_RE = /^\S+@\S+\.\S+$/; // same pattern as the backend

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

/** Password strength scoring (0-4) */
const getPasswordStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = ["error.main", "warning.main", "info.main", "success.light", "success.main"];

const theme = createTheme({
  palette: {
    primary: { main: BRAND.indigo },
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: BRAND.ink, secondary: BRAND.muted },
    divider: "#e2e8f0",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#fff",
        },
      },
    },
  },
});

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  address: "",
};

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, phone: false, password: false, address: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!name) next.name = "Name is required";
    else if (name.length > NAME_MAX)
      next.name = `Name must be ${NAME_MAX} characters or fewer`;

    if (!email) next.email = "Email is required";
    else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email))
      next.email = "Enter a valid email";

    if (!phone) next.phone = "Phone is required";
    else if (phone.length > PHONE_MAX)
      next.phone = `Phone must be exactly ${PHONE_MAX} characters`;
    else if (!/^\d+$/.test(phone))
      next.phone = "Phone must contain only numbers";

    if (!address) next.address = "Address is required";

    if (!form.password) next.password = "Password is required";
    else if (form.password.length < PASSWORD_MIN)
      next.password = `Password must be at least ${PASSWORD_MIN} characters`;
    else if (form.password.length > PASSWORD_MAX)
      next.password = `Password must be ${PASSWORD_MAX} characters or fewer`;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    setServerError("");
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        address: form.address.trim(),
      });

      if (data.verificationRequired) {
        navigate("/verify-email", {
          replace: true,
          state: { email: form.email.trim() },
        });
        return;
      }

      // The API also returns a token, but we send the user to log in
      // instead of starting a session here.
      navigate("/login", {
        replace: true,
        state: { message: "Account created. Please log in." },
      });
    } catch (err) {
      if (err.response?.data?.verificationRequired) {
        navigate("/verify-email", {
          replace: true,
          state: { email: form.email.trim() },
        });
        return;
      }
      const message =
        err.response?.data?.message || "Register failed. Please try again.";

      // Show the duplicate-email error next to the email field.
      if (err.response?.status === 400 && /email/i.test(message)) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else {
        setServerError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          minHeight: "100vh",
          "@supports (height: 100dvh)": { minHeight: "100dvh" },
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 3, sm: 6 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Card
            elevation={0}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
              maxWidth: 1000,
              mx: "auto",
            }}
          >
            {/* Brand panel – hidden on mobile */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                justifyContent: "space-between",
                p: 5,
                color: "#fff",
                background: `linear-gradient(145deg, ${BRAND.indigoDeep} 0%, ${BRAND.indigo} 60%, #6366f1 100%)`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -80,
                  right: -80,
                  width: 240,
                  height: 240,
                  borderRadius: "50%",
                  bgcolor: "#fff",
                  opacity: 0.06,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -100,
                  left: -60,
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  bgcolor: "#fff",
                  opacity: 0.05,
                }}
              />

              <Box sx={{ position: "relative" }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ mb: 6 }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#fff",
                      color: BRAND.indigoDeep,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 18,
                    }}
                  >
                    T
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, letterSpacing: "0.02em" }}
                  >
                    Tenant Website
                  </Typography>
                </Stack>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.2,
                    mb: 2,
                    fontSize: { md: "1.9rem", lg: "2.25rem" },
                  }}
                >
                  Start building today.
                </Typography>
                <Typography
                  sx={{ opacity: 0.85, lineHeight: 1.7, maxWidth: 360 }}
                >
                  Create your account to browse premium templates, manage
                  purchases, and launch high-performing websites faster.
                </Typography>

                <Box sx={{ mt: 5 }}>
                  <Stack spacing={1.5}>
                    {[
                      "Access the full template library",
                      "Save and manage your purchases",
                      "Get dedicated support",
                    ].map((item) => (
                      <Stack
                        key={item}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "#fff",
                            opacity: 0.8,
                          }}
                        />
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>

              <Box sx={{ position: "relative" }}>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", mb: 2 }} />
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  © {new Date().getFullYear()} Tenant Website. All rights
                  reserved.
                </Typography>
              </Box>
            </Box>

            {/* Form panel */}
            <Box
              sx={{ p: { xs: 3, sm: 5, md: 6 }, bgcolor: "background.paper" }}
            >
              <Box sx={{ maxWidth: 400, mx: "auto" }}>
                {/* Mobile brand mark */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  sx={{ mb: 3, display: { xs: "flex", md: "none" } }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: "primary.main",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    T
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Tenant Website
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: alpha(BRAND.indigo, 0.1),
                    color: BRAND.indigo,
                    mb: 2,
                  }}
                >
                  <PersonAddOutlinedIcon fontSize="small" />
                </Box>

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ mb: 0.5, fontSize: { xs: "1.6rem", sm: "1.9rem" } }}
                >
                  Create account
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mb: 3, fontSize: "0.95rem" }}
                >
                  Fill in your details to get started.
                </Typography>

                <form onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2.25}>
                    {serverError && (
                      <Alert
                        severity="error"
                        role="alert"
                        aria-live="assertive"
                        sx={{ borderRadius: 2 }}
                      >
                        {serverError}
                      </Alert>
                    )}

                    <TextField
                      label="Name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter name"
                      inputProps={{ maxLength: NAME_MAX }}
                      error={Boolean(errors.name)}
                      helperText={touched.name ? errors.name : undefined}
                      autoComplete="name"
                      autoFocus
                      required
                      fullWidth
                    />

                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="you@example.com"
                      inputProps={{ maxLength: EMAIL_MAX, inputMode: "email" }}
                      error={Boolean(errors.email)}
                      helperText={touched.email ? errors.email : undefined}
                      autoComplete="email"
                      required
                      fullWidth
                    />

                    <TextField
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter phone"
                      inputProps={{ maxLength: PHONE_MAX, inputMode: "tel" }}
                      error={Boolean(errors.phone)}
                      helperText={touched.phone ? errors.phone : undefined}
                      autoComplete="tel"
                      required
                      fullWidth
                    />

                    <TextField
                      label="Address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter address"
                      error={Boolean(errors.address)}
                      helperText={touched.address ? errors.address : undefined}
                      autoComplete="street-address"
                      multiline
                      minRows={2}
                      required
                      fullWidth
                    />

                    <TextField
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter password"
                      inputProps={{ maxLength: PASSWORD_MAX }}
                      error={Boolean(errors.password)}
                      helperText={
                        touched.password
                          ? errors.password
                          : `At least ${PASSWORD_MIN} characters`
                      }
                      autoComplete="new-password"
                      required
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                                aria-pressed={showPassword}
                                onClick={() => setShowPassword((prev) => !prev)}
                                onMouseDown={(event) => event.preventDefault()}
                                edge="end"
                                sx={{
                                  color: "text.secondary",
                                  minWidth: 44,
                                  minHeight: 44,
                                }}
                              >
                                {showPassword ? (
                                  <VisibilityOff fontSize="small" />
                                ) : (
                                  <Visibility fontSize="small" />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    {form.password && (
                      <Box sx={{ mt: -1 }}>
                        <Stack spacing={0.5} sx={{ mb: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={(strength / 4) * 100}
                              color={STRENGTH_COLORS[strength]}
                              sx={{ flex: 1, height: 4, borderRadius: 2 }}
                            />
                            <Typography variant="caption" sx={{ color: STRENGTH_COLORS[strength], fontWeight: 600, minWidth: 90 }}>
                              {STRENGTH_LABELS[strength]}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {strength < 3 && "Tip: Add uppercase, numbers, or symbols to strengthen"}
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disableElevation
                      disabled={loading}
                      fullWidth
                      sx={{
                        py: 1.35,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: "0 8px 20px rgba(79,70,229,0.25)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          boxShadow: "0 12px 26px rgba(79,70,229,0.35)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      {loading ? "Creating account…" : "Create account"}
                    </Button>
                  </Stack>
                </form>

                <Divider sx={{ my: 3 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ px: 1 }}
                  >
                    OR
                  </Typography>
                </Divider>

                <Typography
                  color="text.secondary"
                  sx={{ textAlign: "center", fontSize: "0.9rem" }}
                >
                  Already have an account?{" "}
                  <Link
                    component={RouterLink}
                    to="/login"
                    fontWeight={700}
                    underline="hover"
                  >
                    Log in
                  </Link>
                </Typography>

                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Link
                    component={RouterLink}
                    to="/"
                    underline="none"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "text.secondary",
                      transition: "color 0.2s ease",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    Back to home
                  </Link>
                </Box>
              </Box>
            </Box>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default Register;