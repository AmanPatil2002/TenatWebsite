import { useState } from "react";
import axios from "axios";
import {
  useNavigate,
  useLocation,
  Link as RouterLink,
} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
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

const EMAIL_MAX = 190; // matches users.email
const EMAIL_RE = /^\S+@\S+\.\S+$/; // same pattern as the backend

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
    setNotice("");
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
                            aria-label={showPassword ? "Hide password" : "Show password"}
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
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default Login;