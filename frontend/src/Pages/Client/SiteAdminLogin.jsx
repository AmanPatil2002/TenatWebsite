import { useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { useTheme, alpha } from "@mui/material/styles";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function SiteAdminLogin() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = "Enter a valid email";

    if (!password) next.password = "Password is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(`${API_URL}/sites/admin/login`, {
        siteId,
        email: email.trim(),
        password,
      });
      localStorage.setItem("siteAdminToken", data.token);
      localStorage.setItem("siteAdminSiteId", String(data.siteId));
      localStorage.setItem("siteAdminSiteName", data.siteName || "");
      navigate(`/site-admin/${data.siteId}/panel`, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not sign in. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "95vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: `linear-gradient(160deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.04)} 45%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: "divider",
            boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`,
            overflow: "hidden",
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* Top accent bar */}
          <Box
            sx={{
              height: 4,
              width: "100%",
              background: `linear-gradient(90deg, ${primary} 0%, ${primaryDark} 100%)`,
            }}
          />
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
              {/* Header */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ mb: 0.5, letterSpacing: "-0.01em", color: theme.palette.text.primary }}
                >
                  Site Admin
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ lineHeight: 1.5 }}
                >
                  Sign in to manage pages for your site
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Form fields */}
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="username"
                  required
                  fullWidth
                  size="medium"
                  placeholder="you@example.com"
                  error={Boolean(errors.email)}
                  helperText={touched.email ? errors.email : undefined}
                />
                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="current-password"
                  required
                  fullWidth
                  size="medium"
                  placeholder="Enter your password"
                  error={Boolean(errors.password)}
                  helperText={touched.password ? errors.password : undefined}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.35,
                  borderRadius: 2,
                  boxShadow: `0 6px 16px ${alpha(primary, 0.22)}`,
                  bgcolor: primary,
                  "&:hover": {
                    bgcolor: primaryDark,
                    boxShadow: `0 8px 20px ${alpha(primary, 0.30)}`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: alpha(primary, 0.12),
                    color: alpha(primary, 0.4),
                    boxShadow: "none",
                  },
                }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>

              <Divider />

              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ textAlign: "center" }}
              >
                Get back to{" "}
                <Link
                  component={RouterLink}
                  to="/mysite"
                  fontWeight={600}
                  underline="hover"
                >
                  My Site
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Subtle footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 2.5 }}
        >
          Secure admin access · Authorized personnel only
        </Typography>
      </Container>
    </Box>
  );
}
