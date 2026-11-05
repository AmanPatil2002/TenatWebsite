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
import { alpha } from "@mui/material/styles";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

/**
 * Arranges items into rows for a 2‑column grid on `sm` and up.
 * - `fullWidth` items always span both columns.
 * - A lone card at the end of a row is stretched to fill the remaining space.
 */
const computeSpans = (items) => {
  const result = items.map((item) => ({ ...item, span: !!item.fullWidth }));
  let col = 0; // 0 = start of row, 1 = one card already placed

  result.forEach((item, i) => {
    if (item.fullWidth) {
      // If the previous row had an odd number of cards, stretch the last one
      if (col === 1 && i > 0) result[i - 1].span = true;
      col = 0;
    } else {
      col = col === 0 ? 1 : 0;
    }
  });

  // Stretch the last card if it sits alone in its row
  if (col === 1) result[result.length - 1].span = true;

  return result;
};

function InfoItem({ icon, label, value }) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: alpha(BRAND.indigo, 0.35),
          boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.06)}`,
        },
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
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: 2,
            color: BRAND.indigo,
            bgcolor: alpha(BRAND.indigo, 0.08),
            "& .MuiSvgIcon-root": { fontSize: "1.2rem" },
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{
              display: "block",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: 1,
              lineHeight: 1.6,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: BRAND.ink,
              wordBreak: "break-word",
              fontSize: "0.95rem",
            }}
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
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress
          aria-label="Loading account information"
          size={36}
          sx={{ color: BRAND.indigo }}
        />
      </Box>
    );
  }

  /* ----- Error ----- */
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: { xs: 6, md: 10 } }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/login", { replace: true })}
              sx={{ fontWeight: 600 }}
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

  // Build the list of fields to show, then compute column spans
  const rawFields = [
    {
      key: "email",
      label: "Email",
      icon: <EmailOutlinedIcon />,
      value: user?.email,
    },
    {
      key: "phone",
      label: "Contact",
      icon: <PhoneOutlinedIcon />,
      value: user?.phone,
      optional: true,
    },
    {
      key: "address",
      label: "Address",
      icon: <HomeOutlinedIcon />,
      value: user?.address,
      optional: true,
      fullWidth: true,
    },
  ].filter((f) => !f.optional || f.value);

  const fields = computeSpans(rawFields);

  /* ----- UI ----- */
  return (
    <Box
      sx={{
        minHeight: "80vh",
        py: { xs: 4, md: 8 },
        background:
          "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
          }}
        >
          {/* Header banner */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${BRAND.indigoDeep} 0%, ${BRAND.indigo} 60%, #6366f1 100%)`,
              py: { xs: 5, md: 7 },
              px: { xs: 2, md: 4 },
              textAlign: "center",
              color: "#fff",
            }}
          >
            {/* decorative circles – purely visual */}
            <Box
              sx={{
                position: "absolute",
                top: -60,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                bgcolor: "#fff",
                opacity: 0.06,
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -70,
                left: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                bgcolor: "#fff",
                opacity: 0.05,
                pointerEvents: "none",
              }}
            />

            <Box sx={{ position: "relative" }}>
              <Avatar
                sx={{
                  width: { xs: 84, md: 104 },
                  height: { xs: 84, md: 104 },
                  mx: "auto",
                  mb: { xs: 2, md: 2.5 },
                  bgcolor: "#fff",
                  color: BRAND.indigoDeep,
                  fontSize: { xs: 34, md: 40 },
                  fontWeight: 800,
                  border: "4px solid",
                  borderColor: alpha("#ffffff", 0.25),
                  boxShadow: "0 12px 30px rgba(15,23,42,0.25)",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>

              <Typography
                component="h1"
                variant="h5"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  wordBreak: "break-word",
                }}
              >
                {displayName}
              </Typography>

              {user?.email && (
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.85, mt: 0.5, wordBreak: "break-word" }}
                >
                  {user.email}
                </Typography>
              )}

              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  mt: 2,
                  px: 1.75,
                  py: 0.5,
                  borderRadius: 99,
                  bgcolor: alpha("#ffffff", 0.15),
                  border: `1px solid ${alpha("#ffffff", 0.25)}`,
                }}
              >
                <VerifiedUserOutlinedIcon
                  sx={{ fontSize: 15, color: "#fff" }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, letterSpacing: "0.03em" }}
                >
                  {user?.role ? String(user.role).toUpperCase() : "MEMBER"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Details section */}
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: BRAND.indigo,
                }}
              >
                Account Details
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Your personal information on file.
              </Typography>
            </Box>

            <Divider sx={{ mb: 3, borderColor: "divider" }} />

            {/* Grid of info cards — responsive, equal-height, aligned */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: { xs: 2, md: 2.5 },
                alignItems: "stretch",
                
              }}
            >
              {fields.map((f) => (
                <Box
                  key={f.key}
                  sx={{
                    gridColumn: { xs: "auto", sm: f.span ? "1 / -1" : "auto" },
                    minWidth: 0,
                    display: "flex",
                    "& > *": { width: "100%" },
                    height:50,
                    padding: 2,
                    marginBottom: 2
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
