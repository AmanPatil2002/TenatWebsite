import { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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

// Limits mirror the backend (postAuth) and the users table.
const NAME_MAX = 120;
const EMAIL_MAX = 190;
const PHONE_MAX = 10; // backend rejects > 10; the column allows 20, so raise both together
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // bcrypt only uses the first 72 bytes
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) next.name = "Name is required";
    else if (name.length > NAME_MAX)
      next.name = `Name must be ${NAME_MAX} characters or fewer`;

    if (!email) next.email = "Email is required";
    else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email))
      next.email = "Enter a valid email";

    if (phone.length > PHONE_MAX)
      next.phone = `Phone must be ${PHONE_MAX} characters or fewer`;

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
        phone: form.phone.trim() || null,
        password: form.password,
        address: form.address.trim() || null,
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
                  Register
                </Typography>
              </Box>

              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2.5}>
                  {serverError && <Alert severity="error">{serverError}</Alert>}

                  <TextField
                    label="Name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    inputProps={{ maxLength: NAME_MAX }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
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
                    placeholder="Enter email"
                    inputProps={{ maxLength: EMAIL_MAX }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    autoComplete="email"
                    required
                    fullWidth
                  />

                  <TextField
                    label="Phone (optional)"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone"
                    inputProps={{ maxLength: PHONE_MAX, inputMode: "tel" }}
                    error={Boolean(errors.phone)}
                    helperText={errors.phone}
                    autoComplete="tel"
                    fullWidth
                  />

                  <TextField
                    label="Address (optional)"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    error={Boolean(errors.address)}
                    helperText={errors.address}
                    autoComplete="street-address"
                    multiline
                    minRows={3}
                    fullWidth
                  />

                  <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    inputProps={{ maxLength: PASSWORD_MAX }}
                    error={Boolean(errors.password)}
                    helperText={errors.password || `At least ${PASSWORD_MIN} characters`}
                    autoComplete="new-password"
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
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </Stack>
              </form>

              <Typography
                color="text.secondary"
                sx={{ mt: 3, textAlign: "center" }}
              >
                Already have an account?{" "}
                <Link component={RouterLink} to="/login" fontWeight={600}>
                  Log in
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default Register;