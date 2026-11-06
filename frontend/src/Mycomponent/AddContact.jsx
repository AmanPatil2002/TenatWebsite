import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CONTACT_URL = `${API_URL}/contact/acontact`;

const MAX_EMAIL = 190;
const MAX_ADDRESS = 100;

const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const getInitialForm = () => ({ phone: "", email: "", address: "" });

/* ---------- Shared form ---------- */
const ContactForm = ({ initialValues, submitLabel, onSubmit, onCancel, submitting, isEdit }) => {
  const [formData, setFormData] = useState(initialValues || getInitialForm());
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    const address = formData.address.trim();

    if (!phone) errs.phone = "Phone is required";
    else if (!/^\d{10}$/.test(phone)) errs.phone = "Phone must be 10 digits";

    if (!email) errs.email = "Email is required";
    else if (email.length > MAX_EMAIL) errs.email = `Email must be ${MAX_EMAIL} characters or fewer`;
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";

    if (!address) errs.address = "Address is required";
    else if (address.length > MAX_ADDRESS) errs.address = `Address must be ${MAX_ADDRESS} characters or fewer`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === "phone" ? e.target.value.replace(/\D/g, "") : e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      contact: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    };

    const ok = await onSubmit(payload);
    if (ok && !isEdit) setFormData(getInitialForm());
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          size="small"
          name="phone"
          label="Phone"
          value={formData.phone}
          onChange={handleChange}
          error={!!errors.phone}
          helperText={errors.phone || "10 digits, numbers only"}
          placeholder="1234567890"
          slotProps={{ htmlInput: { maxLength: 10, inputMode: "numeric" } }}
        />

        <TextField
          fullWidth
          size="small"
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email || `Up to ${MAX_EMAIL} characters`}
          placeholder="admin@example.com"
          slotProps={{ htmlInput: { maxLength: MAX_EMAIL } }}
        />

        <TextField
          fullWidth
          size="small"
          name="address"
          label="Address"
          multiline
          minRows={3}
          maxRows={6}
          value={formData.address}
          onChange={handleChange}
          error={!!errors.address}
          helperText={errors.address || `${formData.address.length}/${MAX_ADDRESS}`}
          placeholder="Office address"
          slotProps={{ htmlInput: { maxLength: MAX_ADDRESS } }}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : isEdit ? (
                <SaveIcon fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )
            }
            sx={{
              py: 1.1,
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 1.5,
            }}
          >
            {submitting ? "Saving…" : submitLabel}
          </Button>
          {onCancel && (
            <Button
              variant="outlined"
              disabled={submitting}
              onClick={onCancel}
              sx={{
                py: 1.1,
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 1.5,
              }}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

/* ---------- Confirmation dialog ---------- */
const ConfirmDialog = ({ open, title, message, details, onConfirm, onCancel, confirming }) => (
  <Dialog open={open} onClose={confirming ? undefined : onCancel} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{title}</DialogTitle>
    <DialogContent>
      <Typography variant="body1">{message}</Typography>
      {details && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, wordBreak: "break-word" }}
        >
          {details}
        </Typography>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button
        onClick={onCancel}
        disabled={confirming}
        color="inherit"
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        disableElevation
        disabled={confirming}
        sx={{ minWidth: 110, textTransform: "none", fontWeight: 600 }}
      >
        {confirming ? "Deleting…" : "Delete"}
      </Button>
    </DialogActions>
  </Dialog>
);

/* ---------- Main page ---------- */
export default function AddContact() {
  const [contacts, setContacts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, contact: null });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const fetchContacts = useCallback(async (showSpinner = true) => {
    if (!getToken()) {
      showSnack("Please log in first.", "error");
      setLoadingList(false);
      return;
    }
    try {
      if (showSpinner) setLoadingList(true);
      const res = await axios.get(CONTACT_URL, authHeaders());
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      showSnack(error.response?.data?.message || "Could not load contacts.", "error");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleCreate = async (values) => {
    if (!getToken()) {
      showSnack("Please log in first.", "error");
      return false;
    }
    if (contacts.length >= 1) {
      showSnack("A contact already exists. Only one contact can be added.", "warning");
      return false;
    }
    try {
      setSubmitting(true);
      await axios.post(CONTACT_URL, values, authHeaders());
      showSnack("Contact added successfully!");
      fetchContacts(false);
      return true;
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to add contact.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    if (!getToken()) {
      showSnack("Please log in first.", "error");
      return false;
    }
    try {
      setSubmitting(true);
      await axios.put(`${CONTACT_URL}/${editingId}`, values, authHeaders());
      showSnack("Contact updated successfully!");
      setEditingId(null);
      fetchContacts(false);
      return true;
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to update contact.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contactId) => {
    setEditingId(contactId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (contact) => setDeleteDialog({ open: true, contact });

  const handleDeleteConfirm = async () => {
    const contact = deleteDialog.contact;
    if (!contact) return;
    if (!getToken()) {
      showSnack("Please log in first.", "error");
      setDeleteDialog({ open: false, contact: null });
      return;
    }
    try {
      setDeletingId(contact.contactId);
      await axios.delete(`${CONTACT_URL}/${contact.contactId}`, authHeaders());
      showSnack("Contact deleted successfully.");
      if (editingId === contact.contactId) setEditingId(null);
      fetchContacts(false);
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to delete contact.", "error");
    } finally {
      setDeletingId(null);
      setDeleteDialog({ open: false, contact: null });
    }
  };

  const handleDeleteCancel = () => setDeleteDialog({ open: false, contact: null });

  const handleSnackClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  const editingContact =
    editingId != null ? contacts.find((c) => c.contactId === editingId) : null;

  const hasContact = contacts.length >= 1;
  const showForm = !hasContact || !!editingContact;
  const deleteDetails = deleteDialog.contact
    ? `${deleteDialog.contact.contact} · ${deleteDialog.contact.email}`
    : "";

  const headCellSx = { fontWeight: 700, bgcolor: "grey.50", whiteSpace: "nowrap" };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      {/* Page header */}
      <Box sx={{ maxWidth: 1280, mx: "auto", mb: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <ContactPhoneOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Contact Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the single admin contact displayed on your website.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        alignItems="flex-start"
        sx={{ maxWidth: 1280, mx: "auto" }}
      >
        {/* Form card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {editingContact ? "Edit Contact" : "Add Contact"}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {editingContact
                  ? "Update the contact details and save your changes."
                  : "Only one admin contact can exist at a time."}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {showForm ? (
              <ContactForm
                key={editingContact ? editingContact.contactId : "new"}
                isEdit={!!editingContact}
                initialValues={
                  editingContact
                    ? {
                        phone: editingContact.contact || "",
                        email: editingContact.email || "",
                        address: editingContact.address || "",
                      }
                    : getInitialForm()
                }
                submitLabel={editingContact ? "Save Changes" : "Add Contact"}
                onSubmit={editingContact ? handleUpdate : handleCreate}
                onCancel={editingContact ? () => setEditingId(null) : undefined}
                submitting={submitting}
              />
            ) : (
              <Alert
                severity="info"
                icon={<InfoOutlinedIcon fontSize="small" />}
                sx={{ borderRadius: 1.5, alignItems: "flex-start" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Contact already added
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only one contact is allowed. Edit the existing contact in the table,
                  or delete it to add a new one.
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Table card */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Admin Contact
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : contacts.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: "center",
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  No contact added yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the form to add the admin contact.
                </Typography>
              </Box>
            ) : (
              <TableContainer
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Table size="small" sx={{ minWidth: 560 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>Phone</TableCell>
                      <TableCell sx={headCellSx}>Email</TableCell>
                      <TableCell sx={headCellSx}>Address</TableCell>
                      <TableCell align="right" sx={{ ...headCellSx, width: 110 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((c) => {
                      const isEditing = editingId === c.contactId;
                      const busy = submitting || deletingId === c.contactId;
                      return (
                        <TableRow
                          key={c.contactId}
                          hover
                          selected={isEditing}
                          sx={{ "& td": { verticalAlign: "top" } }}
                        >
                          <TableCell sx={{ fontWeight: isEditing ? 600 : 400 }}>
                            {c.contact}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220, wordBreak: "break-word" }}>
                            {c.email}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.6,
                              }}
                            >
                              {c.address}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label="Edit contact"
                                    onClick={() => handleEdit(c.contactId)}
                                    disabled={busy}
                                    sx={{ color: isEditing ? "primary.main" : "inherit" }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    aria-label="Delete contact"
                                    onClick={() => handleDeleteClick(c)}
                                    disabled={busy}
                                  >
                                    {deletingId === c.contactId ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <DeleteIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete contact?"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        details={deleteDetails}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirming={deletingId !== null}
      />
    </Box>
  );
}