import { useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function SiteAdminLogin() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
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
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f5f7fb",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card variant="outlined">
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Site admin sign in
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Sign in to manage pages for site {siteId}. Theme settings are
                  not available to site admins.
                </Typography>
              </Box>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </CardContent>
          <Typography
            color="text.secondary"
            sx={{ mt: 3, mb: 2, textAlign: "center" }}
          >
            Get back to{" "}
            <Link component={RouterLink} to="/mysite" fontWeight={600}>
              My Site
            </Link>
          </Typography>
        </Card>
      </Container>
    </Box>
  );
}
