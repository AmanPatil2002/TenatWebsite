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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CONTACT_URL = `${API_URL}/contact/acontact`;

// One labelled row: soft tinted icon tile + label + value (optionally a link)
const InfoRow = ({ icon, label, value, href, external }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start">
    <Box
      sx={(theme) => ({
        width: 44,
        height: 44,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: 2,
        color: "primary.main",
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        "& .MuiSvgIcon-root": { fontSize: "1.35rem" },
      })}
    >
      {icon}
    </Box>

    {/* minWidth: 0 lets long emails/addresses wrap instead of overflowing */}
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.6, letterSpacing: 1, fontWeight: 600 }}
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
          sx={{ fontWeight: 500, wordBreak: "break-word", "&:hover": { color: "primary.main" } }}
        >
          {value}
        </Link>
      ) : (
        <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
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
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        bgcolor: "background.paper",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 8px 24px rgba(16, 24, 40, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {showIndex && (
          <Typography
            variant="subtitle2"
            component="h2"
            color="text.secondary"
            sx={{ mb: 2, fontWeight: 600, letterSpacing: 0.3 }}
          >
            Contact {String(index + 1).padStart(2, "0")}
          </Typography>
        )}

        <Stack spacing={2.5} divider={<Divider flexItem />}>
          {rows}
        </Stack>
      </CardContent>
    </Card>
  );
};

const CardSkeleton = () => (
  <Card variant="outlined" sx={{ borderRadius: 3 }}>
    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Stack spacing={3}>
        {[0, 1, 2].map((i) => (
          <Stack key={i} direction="row" spacing={2}>
            <Skeleton variant="rounded" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="30%" />
              <Skeleton width="75%" />
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
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: { xs: 6, sm: 8, md: 12 }, px: { xs: 2, sm: 3 } }}>
        {/* ---- Header ---- */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700, letterSpacing: 2 }}
          >
            Contact Us
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              mt: 0.5,
              mb: 2,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
            }}
          >
            Get in touch
          </Typography>
          <Box
            sx={{ width: 48, height: 3, borderRadius: 2, bgcolor: "primary.main", mx: "auto", mb: 2.5 }}
          />
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 560, mx: "auto", fontSize: { xs: "0.95rem", sm: "1.05rem" }, lineHeight: 1.7 }}
          >
            We’d be glad to hear from you. Reach our team using the details below.
          </Typography>
        </Box>

        {/* ---- States ---- */}
        {error && (
          <Alert
            severity="error"
            sx={{ maxWidth: 560, mx: "auto" }}
            action={
              <Button color="inherit" size="small" onClick={retry}>
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
          <Box sx={{ textAlign: "center", py: { xs: 4, md: 6 } }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
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