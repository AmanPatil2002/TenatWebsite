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
} from "@mui/material";

// TODO: set this to your real auth route prefix (where /me is mounted)
const API_URL = "http://localhost:5000/auth";

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
      if (!NAME_RE.test(value)) return "Name can only contain letters, spaces, . ' -";
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
  if (!wantsChange) return {}; // password section is optional as a whole
  const errors = {};
  Object.keys(emptyPasswords).forEach((k) => {
    const msg = validatePasswordField(k, passwords[k], passwords);
    if (msg) errors[k] = msg;
  });
  return errors;
};

export default function AdminProfileDialog({ open, onClose, onSaved }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [passwords, setPasswords] = useState(emptyPasswords);
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
        })
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
      setProfileErrors((er) => ({ ...er, [name]: validateProfileField(name, value) }));
    }
  };

  const handleProfileBlur = (e) => {
    const { name, value } = e.target;
    setProfileErrors((er) => ({ ...er, [name]: validateProfileField(name, value) }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const next = { ...passwords, [name]: value };
    setPasswords(next);
    setSuccess("");
    // Re-validate fields that already show an error (confirm depends on newPassword)
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
    // Only validate on blur once the user has started the password section
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

    // Send trimmed values
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
      {...extra}
    />
  );

  const passwordField = (name, label, autoComplete) => (
    <TextField
      label={label}
      name={name}
      type="password"
      value={passwords[name]}
      onChange={handlePasswordChange}
      onBlur={handlePasswordBlur}
      error={!!passwordErrors[name]}
      helperText={passwordErrors[name] || " "}
      autoComplete={autoComplete}
      fullWidth
    />
  );

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit My Profile</DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={1} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            {profileField("name", "Name", { inputProps: { maxLength: 120 } })}
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

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Change password (leave blank to keep current)
            </Typography>

            {passwordField("currentPassword", "Current password", "current-password")}
            {passwordField("newPassword", "New password", "new-password")}
            {passwordField("confirm", "Confirm new password", "new-password")}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Close</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}