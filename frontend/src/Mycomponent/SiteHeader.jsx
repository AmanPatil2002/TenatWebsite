import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const SOCIALS = ["facebook", "instagram", "youtube", "twitter", "linkedin"];

const EMPTY_FORM = {
  siteTitle: "",
  footerText: "",
  footerAddress: "",
  footerPhone: "",
  footerEmail: "",
  copyrightText: "",
};

const emptySocials = () =>
  Object.fromEntries(SOCIALS.map((platform) => [platform, ""]));

const LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
};

const PLACEHOLDERS = {
  facebook: "https://facebook.com/yourpage",
  instagram: "https://instagram.com/yourpage",
  youtube: "https://youtube.com/@yourchannel",
  twitter: "https://x.com/yourpage",
  linkedin: "https://linkedin.com/company/yourpage",
};

const FIELD_SX = {
  "& .MuiInputBase-root": { borderRadius: 1.25 },
};

function SectionHeader({ title, description }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        letterSpacing={0.2}
        sx={{ lineHeight: 1.4 }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
  );
}

export default function SiteHeader() {
  const { baseUrl, authConfig } = useOutletContext();
  const [form, setForm] = useState(EMPTY_FORM);
  const [social, setSocial] = useState(emptySocials);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadHeader = async () => {
      try {
        const { data } = await axios.get(`${baseUrl}/header`, authConfig);
        if (cancelled) return;
        const header = data.header || {};
        setForm({
          siteTitle: header.siteTitle || "",
          footerText: header.footerText || "",
          footerAddress: header.footerAddress || "",
          footerPhone: header.footerPhone || "",
          footerEmail: header.footerEmail || "",
          copyrightText: header.copyrightText || "",
        });
        setSocial({ ...emptySocials(), ...(header.socialLinks || {}) });
        setLogoUrl(header.logoUrl || "");
        setError("");
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Could not load header and footer settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHeader();
    return () => {
      cancelled = true;
    };
  }, [authConfig, baseUrl]);

  const assetOrigin = new URL(baseUrl, window.location.origin).origin;
  const currentLogo = logoUrl?.startsWith("/uploads/")
    ? `${assetOrigin}${logoUrl}`
    : logoUrl;

  const updateForm = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const updateSocial = (event) => {
    setSocial((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("Choose a JPG, PNG, WEBP or GIF logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be 5 MB or smaller.");
      return;
    }
    setError("");
    setNotice("");
    setLogoFile(file);
  };

  const saveHeader = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let nextLogoUrl = logoUrl || null;
      if (logoFile) {
        const upload = new FormData();
        upload.append("image", logoFile);
        const { data } = await axios.post(
          `${baseUrl}/media/upload`,
          upload,
          authConfig,
        );
        nextLogoUrl = data.imageUrl;
      }

      const cleanSocialLinks = Object.fromEntries(
        Object.entries(social)
          .map(([platform, url]) => [platform, url.trim()])
          .filter(([, url]) => url),
      );
      const { data } = await axios.put(
        `${baseUrl}/header`,
        {
          ...form,
          logoUrl: nextLogoUrl,
          socialLinks: cleanSocialLinks,
        },
        authConfig,
      );
      setLogoUrl(data.header?.logoUrl || "");
      setLogoFile(null);
      setNotice(data.message || "Header and footer settings saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save header and footer settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 880,
        mx: "auto",
        px: { xs: 1.5, sm: 2 },
        pb: { xs: 14, sm: 12 },
      }}
    >
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "flex-start" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            letterSpacing={-0.3}
            sx={{ lineHeight: 1.3 }}
          >
            Header &amp; Footer
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 520 }}
          >
            Manage the branding, contact details, and social links shown across
            your site.
          </Typography>
        </Box>
        <Button
          type="submit"
          form="header-footer-form"
          variant="contained"
          disabled={saving}
          disableElevation
          size="medium"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            borderRadius: 1.5,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Box>

      {/* Feedback */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ borderRadius: 1.5, alignItems: "center" }}
          >
            {error}
          </Alert>
        )}
        {notice && (
          <Alert
            severity="success"
            onClose={() => setNotice("")}
            sx={{ borderRadius: 1.5, alignItems: "center" }}
          >
            {notice}
          </Alert>
        )}
      </Stack>

      <Box
        component="form"
        id="header-footer-form"
        onSubmit={saveHeader}
        noValidate
      >
        <Stack spacing={2.5}>
          {/* Header card */}
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              borderColor: "divider",
            }}
          >
            <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
              <SectionHeader
                title="Site Header"
                description="Logo and title displayed in the main navigation bar."
              />
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3} alignItems="flex-start">
                {/* Logo preview */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mb: 1,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      fontSize: 11,
                    }}
                  >
                    Logo preview
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      aspectRatio: "16 / 10",
                      borderRadius: 1.5,
                      border: "1px dashed",
                      borderColor: currentLogo ? "transparent" : "divider",
                      bgcolor: "grey.50",
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                      p: 1.5,
                    }}
                  >
                    {currentLogo ? (
                      <Box
                        component="img"
                        src={currentLogo}
                        alt="Site logo preview"
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        textAlign="center"
                      >
                        No logo uploaded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Logo controls + title */}
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mb: 1,
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          fontSize: 11,
                        }}
                      >
                        Logo file
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        alignItems="center"
                      >
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 1.25,
                          }}
                        >
                          {logoFile || currentLogo
                            ? "Replace logo"
                            : "Upload logo"}
                          <input
                            hidden
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={selectLogo}
                          />
                        </Button>
                        {(currentLogo || logoFile) && (
                          <Button
                            color="error"
                            size="small"
                            variant="text"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoUrl("");
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            Remove
                          </Button>
                        )}
                      </Stack>
                      {logoFile && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: "block", mt: 1, maxWidth: 360 }}
                        >
                          Selected: {logoFile.name}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        JPG, PNG, WEBP or GIF · up to 5 MB
                      </Typography>
                    </Box>

                    <TextField
                      label="Site title"
                      name="siteTitle"
                      value={form.siteTitle}
                      onChange={updateForm}
                      inputProps={{ maxLength: 150 }}
                      helperText={`${form.siteTitle.length}/150`}
                      fullWidth
                      size="small"
                      sx={FIELD_SX}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Footer card */}
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              borderColor: "divider",
            }}
          >
            <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
              <SectionHeader
                title="Site Footer"
                description="Contact details and legal text shown at the bottom of your site."
              />
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2.5}>
                <TextField
                  label="About / footer text"
                  name="footerText"
                  value={form.footerText}
                  onChange={updateForm}
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                  helperText="A short description or blurb for your business."
                  sx={FIELD_SX}
                />

                <TextField
                  label="Address"
                  name="footerAddress"
                  value={form.footerAddress}
                  onChange={updateForm}
                  inputProps={{ maxLength: 300 }}
                  fullWidth
                  size="small"
                  sx={FIELD_SX}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Phone"
                      name="footerPhone"
                      value={form.footerPhone}
                      onChange={updateForm}
                      inputProps={{ maxLength: 30 }}
                      fullWidth
                      size="small"
                      sx={FIELD_SX}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Email"
                      name="footerEmail"
                      type="email"
                      value={form.footerEmail}
                      onChange={updateForm}
                      inputProps={{ maxLength: 190 }}
                      fullWidth
                      size="small"
                      sx={FIELD_SX}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Copyright"
                  name="copyrightText"
                  value={form.copyrightText}
                  onChange={updateForm}
                  inputProps={{ maxLength: 255 }}
                  fullWidth
                  size="small"
                  helperText="e.g. © 2025 Your Company. All rights reserved."
                  sx={FIELD_SX}
                />
              </Stack>
            </Box>
          </Paper>

          {/* Social card */}
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              borderColor: "divider",
            }}
          >
            <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
              <SectionHeader
                title="Social Links"
                description="Add links to your social profiles. Leave a field blank to hide that platform."
              />
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                {SOCIALS.map((platform) => (
                  <Grid key={platform} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={LABELS[platform] || platform}
                      name={platform}
                      type="url"
                      value={social[platform] || ""}
                      onChange={updateSocial}
                      placeholder={PLACEHOLDERS[platform]}
                      inputProps={{ maxLength: 500 }}
                      fullWidth
                      size="small"
                      sx={FIELD_SX}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
