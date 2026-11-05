import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";



const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMAIL_MAX = 190;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

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
    MuiTextField: {
      defaultProps: { size: "medium" },
    },
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

// Two-step dialog: 1) enter email -> code is emailed, 2) enter code + new password
function ForgotPasswordDialog({ initialEmail, onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(initialEmail || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const requestCode = async (e) => {
    e?.preventDefault();
    if (loading) return;

    const value = email.trim();
    if (!value || value.length > EMAIL_MAX || !EMAIL_RE.test(value)) {
      setError("Enter a valid email");
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");
    try {
      const { data } = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: value,
      });
      setStep(2);
      setInfo(data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send the code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email: email.trim(),
        code,
        newPassword,
      });
      onDone("Password reset successfully. Please log in.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not reset password. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <form onSubmit={step === 1 ? requestCode : submitReset} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {step === 1 ? "Forgot password" : "Reset password"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            {info && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {info}
              </Alert>
            )}

            {step === 1 ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Enter your account email and we'll send you a 6-digit code.
                </Typography>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  inputProps={{ maxLength: EMAIL_MAX }}
                  autoComplete="email"
                  autoFocus
                  fullWidth
                />
              </>
            ) : (
              <>
                <TextField
                  label="6-digit code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  inputProps={{ inputMode: "numeric", maxLength: 6 }}
                  autoComplete="one-time-code"
                  autoFocus
                  fullWidth
                />
                <TextField
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword((s) => !s)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm new password"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                  fullWidth
                />
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={requestCode}
                  disabled={loading}
                  sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                >
                  Resend code
                </Link>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={loading}
            sx={{ borderRadius: 2, px: 2.5 }}
          >
            {step === 1
              ? loading
                ? "Sending..."
                : "Send code"
              : loading
                ? "Resetting..."
                : "Reset password"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  // "Account created. Please log in." is passed by the Register page.
  const [notice, setNotice] = useState(location.state?.message || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
    setNotice("");
  };

  const handleForgotDone = (message) => {
    setForgotOpen(false);
    setServerError("");
    setNotice(message);
  };

  const validate = () => {
    const next = {};
    const email = form.email.trim();

    if (!email) next.email = "Email is required";
    else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email))
      next.email = "Enter a valid email";

    if (!form.password) next.password = "Password is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    setServerError("");
    setNotice("");
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email: form.email.trim(),
        password: form.password,
      });

      const { token, user } = data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("username", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("Id", user.id);

      // Same role check as the backend's isAdmin().
      const isAdmin = ["admin", "superadmin"].includes(user.role);
      navigate(isAdmin ? "/admin" : "/home", { replace: true });
    } catch (err) {
      // Backend messages: "Invalid email or password" (401),
      // "Account is not active" (403), validation errors (400).
      setServerError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="main"
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
              maxWidth: 960,
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
                  Welcome back.
                </Typography>
                <Typography
                  sx={{ opacity: 0.85, lineHeight: 1.7, maxWidth: 360 }}
                >
                  Sign in to manage your templates, track your purchases, and
                  continue building high-performing websites.
                </Typography>
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
              <Box sx={{ maxWidth: 380, mx: "auto" }}>
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
                  <LockOutlinedIcon fontSize="small" />
                </Box>

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ mb: 0.5, fontSize: { xs: "1.6rem", sm: "1.9rem" } }}
                >
                  Sign in
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mb: 3, fontSize: "0.95rem" }}
                >
                  Enter your credentials to access your account.
                </Typography>

                <form onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2.25}>
                    {notice && (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        {notice}
                      </Alert>
                    )}
                    {serverError && (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {serverError}
                      </Alert>
                    )}

                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      inputProps={{ maxLength: EMAIL_MAX }}
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                      autoComplete="email"
                      autoFocus
                      required
                      fullWidth
                    />

                    <TextField
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      error={Boolean(errors.password)}
                      helperText={errors.password}
                      autoComplete="current-password"
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
                                onClick={() => setShowPassword((prev) => !prev)}
                                edge="end"
                                size="small"
                                sx={{ color: "text.secondary" }}
                              >
                                {showPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <Box sx={{ textAlign: "right", mt: -1 }}>
                      <Link
                        component="button"
                        type="button"
                        variant="body2"
                        fontWeight={600}
                        onClick={() => setForgotOpen(true)}
                        underline="hover"
                      >
                        Forgot password?
                      </Link>
                    </Box>

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
                      {loading ? "Signing in..." : "Sign in"}
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
                  Don't have an account?{" "}
                  <Link
                    component={RouterLink}
                    to="/register"
                    fontWeight={700}
                    underline="hover"
                  >
                    Create one
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

        {/* Rendered outside the login <form> so submits don't bubble into it */}
        {forgotOpen && (
          <ForgotPasswordDialog
            initialEmail={form.email}
            onClose={() => setForgotOpen(false)}
            onDone={handleForgotDone}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default Login;
