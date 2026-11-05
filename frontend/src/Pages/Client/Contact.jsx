import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOnOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CONTACT_URL = `${API_URL}/contact/acontact`;

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

// One labelled row: soft tinted icon tile + label + value (optionally a link)
const InfoRow = ({ icon, label, value, href, external }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start">
    <Box
      sx={{
        width: 44,
        height: 44,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: 2,
        color: BRAND.indigo,
        bgcolor: alpha(BRAND.indigo, 0.08),
        "& .MuiSvgIcon-root": { fontSize: "1.3rem" },
      }}
    >
      {icon}
    </Box>

    {/* minWidth: 0 lets long emails/addresses wrap instead of overflowing */}
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.6, letterSpacing: 1, fontWeight: 600, fontSize: "0.7rem" }}
      >
        {label}
      </Typography>

      {href ? (
        <Link
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          underline="hover"
          color="text.primary"
          variant="body1"
          sx={{
            fontWeight: 500,
            wordBreak: "break-word",
            fontSize: "0.95rem",
            transition: "color 0.2s ease",
            "&:hover": { color: BRAND.indigo },
          }}
        >
          {value}
        </Link>
      ) : (
        <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: "break-word", fontSize: "0.95rem" }}>
          {value}
        </Typography>
      )}
    </Box>
  </Stack>
);

const ContactCard = ({ contact, index, showIndex }) => {
  const phone = String(contact.contact ?? "").trim();
  const email = String(contact.email ?? "").trim();
  const address = String(contact.address ?? "").trim();

  // Build only the rows that have a value
  const rows = [];
  if (phone) {
    rows.push(
      <InfoRow
        key="phone"
        icon={<PhoneIcon />}
        label="Phone"
        value={phone}
        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
      />,
    );
  }
  if (email) {
    rows.push(
      <InfoRow
        key="email"
        icon={<EmailIcon />}
        label="Email"
        value={email}
        href={`mailto:${email}`}
      />,
    );
  }
  if (address) {
    rows.push(
      <InfoRow
        key="address"
        icon={<LocationOnIcon />}
        label="Address"
        value={address}
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
        external
      />,
    );
  }

  if (rows.length === 0) return null;

  return (
    <Card
      component="article"
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: alpha(BRAND.indigo, 0.4),
          boxShadow: `0 16px 40px ${alpha(BRAND.indigo, 0.08)}`,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {showIndex && (
          <Typography
            variant="overline"
            component="h2"
            color="primary"
            sx={{ display: "block", mb: 2, fontWeight: 700, letterSpacing: 1.2, fontSize: "0.7rem" }}
          >
            Contact {String(index + 1).padStart(2, "0")}
          </Typography>
        )}

        <Stack spacing={2.5} divider={<Divider flexItem sx={{ borderColor: "divider" }} />}>
          {rows}
        </Stack>
      </CardContent>
    </Card>
  );
};

const CardSkeleton = () => (
  <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Stack spacing={3}>
        {[0, 1, 2].map((i) => (
          <Stack key={i} direction="row" spacing={2}>
            <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="30%" height={12} />
              <Skeleton width="75%" height={18} />
            </Box>
          </Stack>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

export default function Contact() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(CONTACT_URL, { signal: controller.signal });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load contact info");
        }
        setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const single = contacts.length === 1;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 6, sm: 8, md: 12 }, px: { xs: 2, sm: 3 } }}>
        {/* ---- Header ---- */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 2.5,
              bgcolor: alpha(BRAND.indigo, 0.1),
              color: BRAND.indigo,
              mb: 2.5,
            }}
          >
            <SupportAgentOutlinedIcon fontSize="medium" />
          </Box>

          <Typography
            variant="overline"
            sx={{ display: "block", fontWeight: 700, letterSpacing: "0.12em", color: BRAND.indigo }}
          >
            Contact Us
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              mt: 0.5,
              mb: 2,
              letterSpacing: "-0.02em",
              color: BRAND.ink,
              fontSize: { xs: "1.9rem", sm: "2.4rem", md: "2.9rem" },
            }}
          >
            Get in touch
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 520,
              mx: "auto",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.7,
            }}
          >
            We'd be glad to hear from you. Reach our team using the details below.
          </Typography>
        </Box>

        {/* ---- States ---- */}
        {error && (
          <Alert
            severity="error"
            sx={{ maxWidth: 560, mx: "auto", borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={retry} sx={{ fontWeight: 600 }}>
                Try again
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading && (
          <Box
            aria-busy="true"
            sx={{
              display: "grid",
              gap: { xs: 2, md: 3 },
              gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <CardSkeleton />
            <CardSkeleton />
          </Box>
        )}

        {!loading && !error && contacts.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: { xs: 5, md: 7 },
              px: 3,
              maxWidth: 480,
              mx: "auto",
              bgcolor: "background.paper",
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Contact information is not available at the moment.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please check back later.
            </Typography>
          </Box>
        )}

        {/* ---- Cards ---- */}
        {!loading && contacts.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gap: { xs: 2, md: 3 },
              gridTemplateColumns: single
                ? "minmax(0, 1fr)"
                : { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
              maxWidth: single ? 520 : "none",
              mx: "auto",
            }}
          >
            {contacts.map((c, i) => (
              <ContactCard key={c.contactId ?? i} contact={c} index={i} showIndex={!single} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}