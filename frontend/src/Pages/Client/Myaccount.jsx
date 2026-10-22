import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@mui/material";

import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import PhoneIcon from "@mui/icons-material/Phone";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const withSpans = (items) => {
  const result = items.map((item) => ({ ...item, span: item.fullWidth }));
  let col = 0; // 0 = start of a row, 1 = one card already placed in the row

  result.forEach((item, i) => {
    if (item.fullWidth) {
      // A lone card right before a full-width card gets stretched
      if (col === 1) result[i - 1].span = true;
      col = 0;
    } else {
      col = col === 0 ? 1 : 0;
    }
  });

  // Last card alone in its row
  if (col === 1 && result.length) result[result.length - 1].span = true;

  return result;
};


function InfoItem({ icon, label, value }) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "background.paper",
        padding:2
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: { xs: 1.5, md: 2 },
          alignItems: "flex-start",
          
        }}
      >
        <Box
          aria-hidden="true"
          sx={{ color: "primary.main", display: "flex", pt: 0.5 }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          >
            {label}
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ wordBreak: "break-word" }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/* ---------- Page ---------- */

export default function Myaccount() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in. Please log in to view your account.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        // Supports both `{ ...user }` and `{ user: { ...user } }` responses
        setUser(data?.user ?? data);
      } catch (err) {
        if (axios.isCancel(err)) return;

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load account information.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchUser();
    return () => controller.abort();
  }, []);

  /* ----- Loading ----- */
  if (loading) {
    return (
      <Box
        sx={{
          py: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress aria-label="Loading account information" />
      </Box>
    );
  }

  /* ----- Error ----- */
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to login
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  /* ----- Data ----- */
  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  const fields = withSpans(
    [
      { key: "email", label: "Email", icon: <EmailIcon />, value: user?.email },
      {
        key: "phone",
        label: "Contact",
        icon: <PhoneIcon />,
        value: user?.phone,
        optional: true,
      },
      {
        key: "address",
        label: "Address",
        icon: <HomeIcon />,
        value: user?.address,
        optional: true,
        fullWidth: true,
      },
    ].filter((f) => !f.optional || f.value),
  );

  /* ----- UI ----- */
  return (
    <Box sx={{ py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Card elevation={4} sx={{ borderRadius: 4, overflow: "hidden" }}>
          {/* Header */}
          <Box
            sx={{
              background: (t) =>
                `linear-gradient(135deg, ${t.palette.primary.dark}, ${t.palette.primary.light})`,
              py: { xs: 4, md: 6 },
              px: { xs: 2, md: 4 },
              textAlign: "center",
              color: "primary.contrastText",
            }}
          >
            <Avatar
              sx={{
                width: { xs: 80, md: 100 },
                height: { xs: 80, md: 100 },
                mx: "auto",
                mb: { xs: 2, md: 3 },
                bgcolor: "background.paper",
                color: "primary.main",
                fontSize: { xs: 40, md: 45 },
                border: 2,
                borderColor: "primary.contrastText",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>

            <Typography
              component="h1"
              variant="h5"
              fontWeight="bold"
              sx={{ wordBreak: "break-word" }}
            >
              {displayName}
            </Typography>
          </Box>

          {/* Details */}
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography
              component="h2"
              variant="h6"
              fontWeight={600}
              textAlign="center"
              sx={{ mb: 0.5 }}
            >
              My Profile
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 3, fontSize: { xs: "0.875rem", md: "1rem" } }}
            >
              Your current account details
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* CSS grid works the same on every MUI version */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: { xs: 2, md: 3 },
              }}
            >
              {fields.map((f) => (
                <Box
                  key={f.key}
                  sx={{
                    gridColumn: { xs: "auto", sm: f.span ? "1 / -1" : "auto" },
                    minWidth: 0,
                  }}
                >
                  <InfoItem
                    icon={f.icon}
                    label={f.label}
                    value={f.value || "Not available"}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
