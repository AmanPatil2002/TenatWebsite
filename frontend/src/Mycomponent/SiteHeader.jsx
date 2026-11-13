import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import WebOutlinedIcon from "@mui/icons-material/WebOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

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
  "& .MuiInputBase-root": { borderRadius: 1.25, bgcolor: "background.paper" },
  "& .MuiFormHelperText-root": { mt: 0.75, ml: 0.25 },
};

function CardHeader({ icon, title, description }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      sx={{ mb: 2.5 }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.25,
          display: "grid",
          placeItems: "center",
          bgcolor: "primary.50",
          color: "primary.main",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.1}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function FieldLabel({ children }) {
  return (
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
      {children}
    </Typography>
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
  const [isDragging, setIsDragging] = useState(false);

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

  const assetOrigin = useMemo(
    () => new URL(baseUrl, window.location.origin).origin,
    [baseUrl],
  );

  const currentLogo = logoUrl?.startsWith("/uploads/")
    ? `${assetOrigin}${logoUrl}`
    : logoUrl;

  const activeSocialCount = useMemo(
    () => Object.values(social).filter((v) => v.trim()).length,
    [social],
  );

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

  const validateLogoFile = (file) => {
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      return "Choose a JPG, PNG, WEBP or GIF logo.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Logo must be 5 MB or smaller.";
    }
    return null;
  };

  const handleLogoFile = (file) => {
    const validationError = validateLogoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setNotice("");
    setLogoFile(file);
  };

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) handleLogoFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoUrl("");
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
        maxWidth: 960,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        pb: { xs: 16, sm: 12 },
      }}
    >
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} letterSpacing={-0.4}>
          Header &amp; Footer
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, maxWidth: 560 }}
        >
          Manage the branding, contact details, and social links shown across
          your site.
        </Typography>
      </Box>

      {/* Feedback */}
      {(error || notice) && (
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
      )}

      <Box
        component="form"
        id="header-footer-form"
        onSubmit={saveHeader}
        noValidate
      >
        <Stack spacing={3}>
          {/* Header card */}
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "divider", overflow: "hidden" }}
          >
            <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
              <CardHeader
                icon={<WebOutlinedIcon fontSize="small" />}
                title="Site Header"
                description="The logo and title displayed in the main navigation bar."
              />
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3} alignItems="stretch">
                {/* Logo column */}
                <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ minWidth: 0 }}>
                  <Stack spacing={1.25} sx={{ height: "100%" }}>
                    <FieldLabel>Logo</FieldLabel>

                    <Box
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      sx={{
                        position: "relative", // ✅ needed for the absolutely positioned remove button
                        width: "90%",
                        height: 150,
                        flexShrink: 0, // ✅ prevent squishing in flex column
                        borderRadius: 1.5,
                        border: "1.5px dashed",
                        borderColor: isDragging ? "primary.main" : "divider",
                        bgcolor: isDragging ? "primary.50" : "grey.50",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                        p: 2,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {logoFile || currentLogo ? (
                        <>
                          <Box
                            component="img"
                            src={
                              logoFile
                                ? URL.createObjectURL(logoFile)
                                : currentLogo
                            }
                            alt="Site logo preview"
                            sx={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                          <Tooltip title="Remove logo">
                            <IconButton
                              size="small"
                              onClick={removeLogo}
                              sx={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                zIndex: 1,
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                "&:hover": { bgcolor: "grey.100" },
                              }}
                            >
                              <CloseRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Stack
                          spacing={1}
                          alignItems="center"
                          textAlign="center"
                        >
                          <CloudUploadOutlinedIcon
                            sx={{ fontSize: 28, color: "text.disabled" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Drag &amp; drop or click below
                          </Typography>
                        </Stack>
                      )}
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        startIcon={<CloudUploadOutlinedIcon fontSize="small" />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 1.25,
                        }}
                      >
                        {currentLogo || logoFile ? "Replace" : "Upload"}
                        <input
                          hidden
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={selectLogo}
                        />
                      </Button>
                      {logoFile && (
                        <Button
                          color="error"
                          size="small"
                          variant="text"
                          startIcon={
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          }
                          onClick={removeLogo}
                          sx={{ textTransform: "none" }}
                        >
                          Clear
                        </Button>
                      )}
                    </Stack>

                    {/* ✅ mt auto only pushes the hint block down; it won't overlap siblings */}
                    <Box sx={{ mt: "auto", minWidth: 0 }}>
                      {logoFile && (
                        <Tooltip title={logoFile.name}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {logoFile.name}
                          </Typography>
                        </Tooltip>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        JPG, PNG, WEBP or GIF · max 5 MB
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Title + preview column */}
                <Grid size={{ xs: 12, sm: 8, md: 8 }} sx={{ minWidth: 0 }}>
                  <Stack spacing={2.5} sx={{ height: "100%" }}>
                    <Box>
                      <FieldLabel>Site title</FieldLabel>
                      <TextField
                        name="siteTitle"
                        value={form.siteTitle}
                        onChange={updateForm}
                        placeholder="e.g. Shivraj High School"
                        inputProps={{ maxLength: 150 }}
                        helperText={`${form.siteTitle.length}/150 characters`}
                        fullWidth
                        size="small"
                        sx={FIELD_SX}
                      />
                    </Box>

                    <Box>
                      <FieldLabel>Navbar preview</FieldLabel>
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 1.5,
                          borderColor: "divider",
                          bgcolor: "grey.50",
                          px: 2.5,
                          height: 64,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          overflow: "hidden",
                        }}
                      >
                        {currentLogo || logoFile ? (
                          <Avatar
                            variant="circular"
                            src={
                              logoFile
                                ? URL.createObjectURL(logoFile)
                                : currentLogo
                            }
                            alt="Site logo"
                            sx={{
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                              bgcolor: "background.paper",
                              border: "1px solid",
                              borderColor: "divider",
                              "& img": {
                                objectFit: "cover", 
                              },
                            }}
                          />
                        ) : (
                          <Avatar
                            variant="circular"
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "grey.300",
                              fontSize: 15,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {(form.siteTitle || "S").charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          noWrap
                          sx={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {form.siteTitle || "Your site title"}
                        </Typography>
                      </Paper>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.75 }}
                      >
                        This is how your brand appears in the navbar.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Footer card */}
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "divider", overflow: "hidden" }}
          >
            <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
              <CardHeader
                icon={<BusinessOutlinedIcon fontSize="small" />}
                title="Site Footer"
                description="Contact details and legal text shown at the bottom of your site."
              />
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2.5}>
                <Box>
                  <FieldLabel>About / footer text</FieldLabel>
                  <TextField
                    name="footerText"
                    value={form.footerText}
                    onChange={updateForm}
                    multiline
                    minRows={3}
                    maxRows={6}
                    fullWidth
                    size="small"
                    placeholder="A short description of your business…"
                    helperText="A short blurb shown in the footer."
                    sx={FIELD_SX}
                  />
                </Box>

                <Box>
                  <FieldLabel>Address</FieldLabel>
                  <TextField
                    name="footerAddress"
                    value={form.footerAddress}
                    onChange={updateForm}
                    inputProps={{ maxLength: 300 }}
                    fullWidth
                    size="small"
                    placeholder="123 Main St, City, Country"
                    sx={FIELD_SX}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel>Phone</FieldLabel>
                    <TextField
                      name="footerPhone"
                      value={form.footerPhone}
                      onChange={updateForm}
                      inputProps={{ maxLength: 30 }}
                      fullWidth
                      size="small"
                      placeholder="+1 (555) 000-0000"
                      sx={FIELD_SX}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FieldLabel>Email</FieldLabel>
                    <TextField
                      name="footerEmail"
                      type="email"
                      value={form.footerEmail}
                      onChange={updateForm}
                      inputProps={{ maxLength: 190 }}
                      fullWidth
                      size="small"
                      placeholder="hello@yourcompany.com"
                      sx={FIELD_SX}
                    />
                  </Grid>
                </Grid>

                <Box>
                  <FieldLabel>Copyright</FieldLabel>
                  <TextField
                    name="copyrightText"
                    value={form.copyrightText}
                    onChange={updateForm}
                    inputProps={{ maxLength: 255 }}
                    fullWidth
                    size="small"
                    placeholder="© 2025 Your Company. All rights reserved."
                    helperText="Shown in the footer bottom bar."
                    sx={FIELD_SX}
                  />
                </Box>
              </Stack>
            </Box>
          </Paper>

          {/* Social card */}
          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "divider", overflow: "hidden" }}
          >
            <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
              <CardHeader
                icon={<ShareOutlinedIcon fontSize="small" />}
                title="Social Links"
                description="Add links to your social profiles. Leave a field blank to hide that platform."
              />
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                {SOCIALS.map((platform) => (
                  <Grid key={platform} size={{ xs: 12, sm: 6 }}>
                    <FieldLabel>{LABELS[platform] || platform}</FieldLabel>
                    <TextField
                      name={platform}
                      type="url"
                      value={social[platform] || ""}
                      onChange={updateSocial}
                      placeholder={PLACEHOLDERS[platform]}
                      inputProps={{ maxLength: 500 }}
                      fullWidth
                      size="small"
                      sx={FIELD_SX}
                      InputProps={{
                        startAdornment: social[platform]?.trim() ? (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: "success.main",
                              }}
                            />
                          </InputAdornment>
                        ) : undefined,
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 2 }}
              >
                {activeSocialCount} of {SOCIALS.length} platforms configured
              </Typography>
            </Box>
          </Paper>
        </Stack>
      </Box>

      {/* Sticky save bar */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          left: { xs: 16, sm: "auto" },
          right: { xs: 16, sm: 32 },
          bottom: { xs: 16, sm: 24 },
          zIndex: 1100,
          borderRadius: 2,
          px: 2,
          py: 1.25,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary" noWrap>
          {saving
            ? "Saving changes…"
            : "Changes are saved when you click Save."}
        </Typography>
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
            borderRadius: 1.25,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Paper>
    </Box>
  );
}
