import { useEffect, useState } from "react";
import axios from "axios";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const [linkResult, setLinkResult] = useState(null);
  const currentResult = linkResult?.email === email ? linkResult : null;
  const checking = Boolean(email) && !currentResult;
  const validLink = Boolean(currentResult?.valid);
  const linkError = !email
    ? "This reset link is invalid. Request a new one from the login page."
    : currentResult?.error || "";
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!email) return undefined;

    axios
      .get(`${API_URL}/auth/reset-password/status`, { params: { email } })
      .then(() => {
        if (active) setLinkResult({ email, valid: true, error: "" });
      })
      .catch((err) => {
        if (active) {
          setLinkResult({
            email,
            valid: false,
            error:
              err.response?.data?.message ||
              "Could not verify this reset link. Please try again.",
          });
        }
      })

    return () => {
      active = false;
    };
  }, [email]);

  const submitReset = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        code,
        newPassword,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. Please log in." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "#F4F6F8",
        py: 3,
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={1} sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Typography variant="h5" component="h1" textAlign="center">
              Change your password
            </Typography>
            {checking ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={28} aria-label="Checking reset link" />
              </Box>
            ) : validLink ? (
              <form onSubmit={submitReset} noValidate>
                <Stack spacing={2}>
                  {error && <Alert severity="error">{error}</Alert>}
                  <Typography variant="body2" color="text.secondary">
                    Enter the 6-digit code sent to your email and choose a new
                    password. The code and this link expire after 10 minutes.
                  </Typography>
                  <TextField
                    label="6-digit code"
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                    }}
                    inputProps={{ inputMode: "numeric", maxLength: 6 }}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    fullWidth
                  />
                  <TextField
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    required
                    fullWidth
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    required
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? "Changing password..." : "Change password"}
                  </Button>
                </Stack>
              </form>
            ) : (
              <>
                <Alert severity="error">
                  {error ||
                    linkError ||
                    "This reset link has expired. Request a new one from the login page."}
                </Alert>
                <Button component={RouterLink} to="/login" variant="contained">
                  Return to login
                </Button>
              </>
            )}
            {validLink && (
              <Link component={RouterLink} to="/login" textAlign="center">
                Return to login
              </Link>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default ResetPassword;
