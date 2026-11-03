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
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMAIL_MAX = 190; 
const EMAIL_RE = /^\S+@\S+\.\S+$/; 

const theme = createTheme({
  palette: {
    primary: { main: "#2373F4" },
    background: { default: "#F4F6F8", paper: "#FFFFFF" },
    text: { primary: "#0a0a0d", secondary: "#070707" },
    divider: "#E2E6EB",
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
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
    >
      <form onSubmit={step === 1 ? requestCode : submitReset} noValidate>
        <DialogTitle>
          {step === 1 ? "Forgot password" : "Reset password"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="info">{info}</Alert>}

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
                  sx={{ alignSelf: "flex-start" }}
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
          py: { xs: 3, sm: 6 },
        }}
      >
        <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h4" component="h1">
                  Sign In
                </Typography>
              </Box>

              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2.5}>
                  {notice && <Alert severity="success">{notice}</Alert>}
                  {serverError && <Alert severity="error">{serverError}</Alert>}

                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
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

                  <Box sx={{ textAlign: "right", mt: -1 }}>
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      fontWeight={600}
                      onClick={() => setForgotOpen(true)}
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
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </Stack>
              </form>

              <Typography
                color="text.secondary"
                sx={{ mt: 3, textAlign: "center" }}
              >
                Don't have an account?{" "}
                <Link component={RouterLink} to="/register" fontWeight={600}>
                  Register
                </Link>
              </Typography>
              <Link
                component={RouterLink}
                to="/"
                fontWeight={600}
                sx={{ mt: 1, display: "block", textAlign: "center" }}
              >
                Back
              </Link>
            </CardContent>
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
