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
      });

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
        justifyContent: "center",
        bgcolor: "#F8FAFC",
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)",
        py: { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm" disableGutters>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack spacing={3}>
            {/* Header */}
            <Box textAlign="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  bgcolor: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  sx={{ width: 24, height: 24, color: "#6366F1" }}
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Box>
              </Box>
              <Typography
                variant="h5"
                component="h1"
                fontWeight={600}
                color="#1E293B"
                sx={{ letterSpacing: "-0.01em" }}
              >
                Change your password
              </Typography>
              <Typography
                variant="body2"
                color="#64748B"
                sx={{ mt: 0.75, fontSize: "0.875rem" }}
              >
                Enter the code and set a new password for your account.
              </Typography>
            </Box>

            {checking ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} sx={{ color: "#6366F1" }} />
              </Box>
            ) : validLink ? (
              <form onSubmit={submitReset} noValidate>
                <Stack spacing={2.5}>
                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: 2,
                        fontSize: "0.875rem",
                        "& .MuiAlert-icon": { fontSize: 20 },
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="#64748B"
                      sx={{ fontSize: "0.8rem", lineHeight: 1.5 }}
                    >
                      The 6‑digit code and this link expire after 10 minutes.
                    </Typography>
                  </Box>

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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#CBD5E1" },
                        "&.Mui-focused fieldset": {
                          borderColor: "#6366F1",
                          borderWidth: "1.5px",
                        },
                      },
                      "& .MuiInputLabel-root": { color: "#64748B" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#6366F1" },
                    }}
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#CBD5E1" },
                        "&.Mui-focused fieldset": {
                          borderColor: "#6366F1",
                          borderWidth: "1.5px",
                        },
                      },
                      "& .MuiInputLabel-root": { color: "#64748B" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#6366F1" },
                    }}
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#CBD5E1" },
                        "&.Mui-focused fieldset": {
                          borderColor: "#6366F1",
                          borderWidth: "1.5px",
                        },
                      },
                      "& .MuiInputLabel-root": { color: "#64748B" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#6366F1" },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={loading}
                    fullWidth
                    sx={{
                      mt: 0.5,
                      py: 1.25,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      bgcolor: "#6366F1",
                      "&:hover": { bgcolor: "#4F46E5" },
                      "&.Mui-disabled": { bgcolor: "#C7D2FE", color: "#FFFFFF" },
                    }}
                  >
                    {loading ? "Changing password..." : "Change password"}
                  </Button>
                </Stack>
              </form>
            ) : (
              <Stack spacing={2.5}>
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: 2,
                    fontSize: "0.875rem",
                    "& .MuiAlert-icon": { fontSize: 20 },
                  }}
                >
                  {error ||
                    linkError ||
                    "This reset link has expired. Request a new one from the login page."}
                </Alert>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    bgcolor: "#6366F1",
                    "&:hover": { bgcolor: "#4F46E5" },
                  }}
                >
                  Return to login
                </Button>
              </Stack>
            )}

            {validLink && (
              <Box textAlign="center">
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{
                    color: "#6366F1",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    "&:hover": { color: "#4F46E5" },
                  }}
                >
                  Return to login
                </Link>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Footer */}
        <Typography
          variant="caption"
          color="#94A3B8"
          textAlign="center"
          display="block"
          sx={{ mt: 3, fontSize: "0.75rem" }}
        >
          Your security is important to us. Never share your password or code.
        </Typography>
      </Container>
    </Box>
  );
}

export default ResetPassword;