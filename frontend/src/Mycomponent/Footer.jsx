import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Stack,
  Skeleton,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOnOutlined";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CONTACT_URL = `${API_URL}/contact/acontact`;

/* Reusable footer info row – mirrors the InfoRow from the contact page */
const FooterInfoRow = ({ icon, label, value, href, external }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: 1.5,
        color: "#60a5fa",
        bgcolor: alpha("#3b82f6", 0.12),
        "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          lineHeight: 1.6,
          letterSpacing: 0.8,
          fontWeight: 600,
          textTransform: "uppercase",
          color: "#94a3b8",
          fontSize: "0.68rem",
        }}
      >
        {label}
      </Typography>

      {href ? (
        <Link
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          underline="hover"
          sx={{
            color: "#e2e8f0",
            fontWeight: 500,
            fontSize: "0.875rem",
            wordBreak: "break-word",
            transition: "color 0.2s ease",
            "&:hover": { color: "#60a5fa" },
          }}
        >
          {value}
        </Link>
      ) : (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: "#e2e8f0", wordBreak: "break-word", fontSize: "0.875rem" }}
        >
          {value}
        </Typography>
      )}
    </Box>
  </Stack>
);

/* Skeleton for loading state */
const FooterInfoSkeleton = () => (
  <Stack spacing={2}>
    {[0, 1, 2].map((i) => (
      <Stack key={i} direction="row" spacing={1.5}>
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: 1.5 }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="30%" sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
          <Skeleton width="75%" sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

export default function Footer() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(CONTACT_URL, { signal: controller.signal });
        const data = await res.json().catch(() => null);
        if (res.ok) setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Footer contact fetch failed:", err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // Flatten all contacts' info into a deduped list of rows
  const rows = [];
  const seen = { phone: new Set(), email: new Set(), address: new Set() };

  contacts.forEach((c) => {
    const phone = String(c.contact ?? "").trim();
    const email = String(c.email ?? "").trim();
    const address = String(c.address ?? "").trim();

    if (phone && !seen.phone.has(phone)) {
      seen.phone.add(phone);
      rows.push(
        <FooterInfoRow
          key={`phone-${phone}`}
          icon={<PhoneIcon />}
          label="Phone"
          value={phone}
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
        />,
      );
    }
    if (email && !seen.email.has(email)) {
      seen.email.add(email);
      rows.push(
        <FooterInfoRow
          key={`email-${email}`}
          icon={<EmailIcon />}
          label="Email"
          value={email}
          href={`mailto:${email}`}
        />,
      );
    }
    if (address && !seen.address.has(address)) {
      seen.address.add(address);
      rows.push(
        <FooterInfoRow
          key={`address-${address}`}
          icon={<LocationOnIcon />}
          label="Address"
          value={address}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          external
        />,
      );
    }
  });

  const hasContactInfo = rows.length > 0;

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(180deg, #111c31 0%, #0f172a 100%)",
        color: "#e2e8f0",
        mt: "auto",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 5 }} sx={{ py: { xs: 5, md: 7 } }}>
          {/* Brand + description + socials */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                }}
              >
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>T</Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#f8fafc",
                  letterSpacing: "0.02em",
                  fontSize: { xs: "1.05rem", md: "1.2rem" },
                }}
              >
                Tenant Website
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
                lineHeight: 1.8,
                maxWidth: 340,
                fontSize: "0.875rem",
              }}
            >
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Possimus nulla fugiat et
              veniam dicta? Reiciendis magnam dolores maiores repellendus molestiae!
            </Typography>

            <Stack direction="row" spacing={0.75} sx={{ mt: 3 }}>
              {[
                { icon: <LinkedInIcon fontSize="small" />, href: "https://www.linkedin.com", hover: "#0A66C2" },
                { icon: <YouTubeIcon fontSize="small" />, href: "https://www.youtube.com", hover: "#FF0000" },
                { icon: <InstagramIcon fontSize="small" />, href: "https://www.instagram.com", hover: "#E4405F" },
                { icon: <FacebookIcon fontSize="small" />, href: "https://www.facebook.com", hover: "#1877F2" },
              ].map((s, i) => (
                <IconButton
                  key={i}
                  component="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: "#94a3b8",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 1.5,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: s.hover,
                      borderColor: alpha(s.hover, 0.5),
                      backgroundColor: alpha(s.hover, 0.1),
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {s.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: "#f8fafc",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              Quick Links
            </Typography>

            <Stack spacing={1.25}>
              {[
                { name: "Home", path: "/home" },
                { name: "Contact", path: "/contact" },
                { name: "Template", path: "/viewtemp" },
                { name: "My Account", path: "/myaccount" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  underline="none"
                  sx={{
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                    transition: "color 0.2s ease",
                    "&:hover": { color: "#60a5fa" },
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Contact Information – mirrors the contact page card */}
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: "#f8fafc",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              Contact Info
            </Typography>

            {loading ? (
              <FooterInfoSkeleton />
            ) : hasContactInfo ? (
              <Stack spacing={2} divider={<Divider flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />}>
                {rows}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
                Contact information is not available at the moment.
              </Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Bottom bar */}
        <Box
          sx={{
            py: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              textAlign: { xs: "center", sm: "left" },
              fontSize: "0.8rem",
            }}
          >
            © {new Date().getFullYear()} Tenant Website. All Rights Reserved.
          </Typography>

          <Stack direction="row" spacing={2}>
            <Link
              href="/privacy"
              underline="none"
              sx={{ color: "#64748b", fontSize: "0.8rem", "&:hover": { color: "#94a3b8" } }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              underline="none"
              sx={{ color: "#64748b", fontSize: "0.8rem", "&:hover": { color: "#94a3b8" } }}
            >
              Terms of Service
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}