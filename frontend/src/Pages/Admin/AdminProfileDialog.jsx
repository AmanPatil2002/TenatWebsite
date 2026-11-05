import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Divider,
  Typography,
  Stack,
  CircularProgress,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// TODO: set this to your real auth route prefix (where /me is mounted)
const API_URL = "http://localhost:5000/auth";

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

const authFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const emptyProfile = { name: "", email: "", phone: "", address: "" };
const emptyPasswords = { currentPassword: "", newPassword: "", confirm: "" };
const emptyVisibility = {
  currentPassword: false,
  newPassword: false,
  confirm: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s-]{7,20}$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;

// ---- Validators: return an error string, or "" when valid ----
const validateProfileField = (name, rawValue) => {
  const value = (rawValue || "").trim();
  switch (name) {
    case "name":
      if (!value) return "Name is required";
      if (value.length < 2) return "Name must be at least 2 characters";
      if (!NAME_RE.test(value))
        return "Name can only contain letters, spaces, . ' -";
      return "";
    case "email":
      if (!value) return "Email is required";
      if (!EMAIL_RE.test(value)) return "Enter a valid email address";
      return "";
    case "phone": {
      if (!value) return "Phone is required";
      if (!PHONE_RE.test(value)) return "Enter a valid phone number";
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15)
        return "Phone must have 10 to 15 digits";
      return "";
    }
    case "address":
      if (!value) return "Address is required";
      if (value.length < 5) return "Address must be at least 5 characters";
      if (value.length > 255) return "Address must be under 255 characters";
      return "";
    default:
      return "";
  }
};

const validatePasswordField = (name, value, passwords) => {
  switch (name) {
    case "currentPassword":
      return value ? "" : "Current password is required";
    case "newPassword":
      if (!value) return "New password is required";
      if (value.length < 6) return "Must be at least 6 characters";
      if (value === passwords.currentPassword)
        return "New password must be different from current password";
      return "";
    case "confirm":
      if (!value) return "Please confirm the new password";
      if (value !== passwords.newPassword) return "Passwords do not match";
      return "";
    default:
      return "";
  }
};

const validateProfile = (profile) => {
  const errors = {};
  Object.keys(emptyProfile).forEach((k) => {
    const msg = validateProfileField(k, profile[k]);
    if (msg) errors[k] = msg;
  });
  return errors;
};

const validatePasswords = (passwords) => {
  const wantsChange =
    passwords.currentPassword || passwords.newPassword || passwords.confirm;
  if (!wantsChange) return {};
  const errors = {};
  Object.keys(emptyPasswords).forEach((k) => {
    const msg = validatePasswordField(k, passwords[k], passwords);
    if (msg) errors[k] = msg;
  });
  return errors;
};

/* Section header helper */
function SectionHeader({ title, description }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="overline"
        sx={{
          display: "block",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: BRAND.indigo,
          lineHeight: 1.6,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: BRAND.muted, mt: 0.25 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

export default function AdminProfileDialog({ open, onClose, onSaved }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [showPassword, setShowPassword] = useState(emptyVisibility);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the current admin's data every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess("");
    setPasswords(emptyPasswords);
    setShowPassword(emptyVisibility);
    setProfileErrors({});
    setPasswordErrors({});
    setLoading(true);
    authFetch("/me")
      .then((u) =>
        setProfile({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
        }),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  // Clear a field's error as soon as the user edits it
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    setSuccess("");
    if (profileErrors[name]) {
      setProfileErrors((er) => ({
        ...er,
        [name]: validateProfileField(name, value),
      }));
    }
  };

  const handleProfileBlur = (e) => {
    const { name, value } = e.target;
    setProfileErrors((er) => ({
      ...er,
      [name]: validateProfileField(name, value),
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const next = { ...passwords, [name]: value };
    setPasswords(next);
    setSuccess("");
    setPasswordErrors((er) => {
      const updated = { ...er };
      Object.keys(er).forEach((k) => {
        if (er[k] || k === name) {
          updated[k] = validatePasswordField(k, next[k], next);
        }
      });
      return updated;
    });
  };

  const handlePasswordBlur = (e) => {
    const { name } = e.target;
    const started =
      passwords.currentPassword || passwords.newPassword || passwords.confirm;
    if (!started) {
      setPasswordErrors({});
      return;
    }
    setPasswordErrors((er) => ({
      ...er,
      [name]: validatePasswordField(name, passwords[name], passwords),
    }));
  };

  const toggleShowPassword = (name) =>
    setShowPassword((s) => ({ ...s, [name]: !s[name] }));

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const pErrors = validateProfile(profile);
    const pwErrors = validatePasswords(passwords);
    setProfileErrors(pErrors);
    setPasswordErrors(pwErrors);

    if (Object.keys(pErrors).length || Object.keys(pwErrors).length) {
      return setError("Please fix the highlighted fields");
    }

    const wantsPasswordChange =
      passwords.currentPassword || passwords.newPassword || passwords.confirm;

    const cleanProfile = {
      name: profile.name.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
    };

    setSaving(true);
    try {
      await authFetch("/me", {
        method: "PUT",
        body: JSON.stringify(cleanProfile),
      });
      setProfile(cleanProfile);

      if (wantsPasswordChange) {
        await authFetch("/me/password", {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        });
        setPasswords(emptyPasswords);
        setPasswordErrors({});
        setShowPassword(emptyVisibility);
      }

      setSuccess("Saved successfully");
      onSaved?.(cleanProfile);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const profileField = (name, label, extra = {}) => (
    <TextField
      label={label}
      name={name}
      value={profile[name]}
      onChange={handleProfileChange}
      onBlur={handleProfileBlur}
      error={!!profileErrors[name]}
      helperText={profileErrors[name] || " "}
      required
      fullWidth
      size="small"
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      {...extra}
    />
  );

  const passwordField = (name, label, autoComplete) => (
    <TextField
      label={label}
      name={name}
      type={showPassword[name] ? "text" : "password"}
      value={passwords[name]}
      onChange={handlePasswordChange}
      onBlur={handlePasswordBlur}
      error={!!passwordErrors[name]}
      helperText={passwordErrors[name] || " "}
      autoComplete={autoComplete}
      fullWidth
      size="small"
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={
                showPassword[name] ? `Hide ${label}` : `Show ${label}`
              }
              onClick={() => toggleShowPassword(name)}
              onMouseDown={(e) => e.preventDefault()}
              edge="end"
              size="small"
              sx={{
                color: BRAND.muted,
                "&:hover": { color: BRAND.indigo },
              }}
            >
              {showPassword[name] ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ fontWeight: 700, color: BRAND.ink, lineHeight: 1.25 }}
          >
            Edit My Profile
          </Typography>
          <Typography variant="body2" sx={{ color: BRAND.muted, mt: 0.25 }}>
            Update your personal information and password.
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          size="small"
          sx={{
            flexShrink: 0,
            color: BRAND.muted,
            "&:hover": { bgcolor: alpha(BRAND.indigo, 0.08) },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          borderColor: "divider",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress
              size={32}
              sx={{ color: BRAND.indigo }}
              aria-label="Loading profile"
            />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {error && (
              <Alert
                severity="error"
                sx={{ borderRadius: 2 }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{ borderRadius: 2 }}
                onClose={() => setSuccess("")}
              >
                {success}
              </Alert>
            )}

            {/* Personal information */}
            <Box>
              <SectionHeader
                title="Personal information"
                description="These details are shown on your account."
              />
              <Stack spacing={1.5}>
                {profileField("name", "Name", {
                  inputProps: { maxLength: 120 },
                })}
                {profileField("email", "Email", {
                  type: "email",
                  inputProps: { maxLength: 190 },
                })}
                {profileField("phone", "Phone", {
                  type: "tel",
                  inputProps: { maxLength: 20 },
                })}
                {profileField("address", "Address", {
                  multiline: true,
                  minRows: 2,
                  inputProps: { maxLength: 255 },
                })}
              </Stack>
            </Box>

            <Divider />

            {/* Password */}
            <Box>
              <SectionHeader
                title="Change password"
                description="Leave these fields blank to keep your current password."
              />
              <Stack spacing={1.5}>
                {passwordField(
                  "currentPassword",
                  "Current password",
                  "current-password",
                )}
                {passwordField("newPassword", "New password", "new-password")}
                {passwordField("confirm", "Confirm new password", "new-password")}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: BRAND.muted,
            borderRadius: 2,
            px: 2.5,
            "&:hover": { bgcolor: alpha(BRAND.indigo, 0.06) },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            bgcolor: BRAND.indigo,
            boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.25)}`,
            "&:hover": {
              bgcolor: BRAND.indigoDeep,
              boxShadow: `0 10px 24px ${alpha(BRAND.indigo, 0.32)}`,
            },
            "&.Mui-disabled": {
              bgcolor: alpha(BRAND.indigo, 0.35),
              color: "#fff",
            },
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}