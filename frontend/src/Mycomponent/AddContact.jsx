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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Keep these in sync with backend validation
const MAX_EMAIL = 190;
const MAX_ADDRESS = 100;

const getInitialForm = () => ({ phone: "", email: "", address: "" });

// ---- Shared form component -------------------------------------------
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
    const { name, value } = e.target;
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
    // Clear the form only after a successful "create"
    if (ok && !isEdit) setFormData(getInitialForm());
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone || "e.g. 1234567890"}
            placeholder="10 digits only"
            inputProps={{ maxLength: 10, inputMode: "numeric" }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            inputProps={{ maxLength: MAX_EMAIL }}
          />
        </Grid>

        <Grid size={12}>
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
            helperText={errors.address}
            inputProps={{ maxLength: MAX_ADDRESS }}
          />
        </Grid>

        <Grid size={12}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              startIcon={submitting ? null : isEdit ? <SaveIcon /> : <AddIcon />}
              sx={{ py: 1.25, fontSize: "0.95rem", fontWeight: "bold" }}
            >
              {submitting ? "Saving…" : submitLabel}
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                fullWidth
                disabled={submitting}
                onClick={onCancel}
                sx={{ py: 1.25, fontSize: "0.95rem" }}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

// ---- Confirmation dialog ---------------------------------------------
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirming }) => {
  return (
    <Dialog open={open} onClose={confirming ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={confirming} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={confirming}
          sx={{ minWidth: 100 }}
        >
          {confirming ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---- Main page ----------------------------------------------------------

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

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  // Base endpoint. Item routes are `${contactUrl}/:id`
  const contactUrl = `${API_URL}/contact/acontact`;

  const fetchContacts = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setSnack({ open: true, message: "Please log in first.", severity: "error" });
      setLoadingList(false);
      return;
    }
    try {
      setLoadingList(true);
      const res = await axios.get(contactUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setSnack({
        open: true,
        message: error.response?.data?.message || "Could not load contacts.",
        severity: "error",
      });
    } finally {
      setLoadingList(false);
    }
  }, [contactUrl]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Each handler returns true on success so the form can reset itself
  const handleCreate = async (values) => {
    if (!getToken()) {
      showSnack("Please log in first.", "error");
      return false;
    }
    try {
      setSubmitting(true);
      await axios.post(contactUrl, values, authHeaders());
      showSnack("Contact added successfully!");
      fetchContacts();
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
      // FIX: was `${contactUrl}/acontact/${id}` which doubled "acontact" in the path
      await axios.put(`${contactUrl}/${editingId}`, values, authHeaders());
      showSnack("Contact updated successfully!");
      setEditingId(null);
      fetchContacts();
      return true;
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to update contact.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (contact) => {
    setDeleteDialog({ open: true, contact });
  };

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
      // FIX: same doubled path as update
      await axios.delete(`${contactUrl}/${contact.contactId}`, authHeaders());
      showSnack("Contact deleted successfully.");
      if (editingId === contact.contactId) setEditingId(null);
      fetchContacts();
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to delete contact.", "error");
    } finally {
      setDeletingId(null);
      setDeleteDialog({ open: false, contact: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, contact: null });
  };

  const editingContact =
    editingId != null ? contacts.find((c) => c.contactId === editingId) : null;

  const headCellSx = { fontWeight: "bold", bgcolor: "#f5f5f5" };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* -------- Form card -------- */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", mb: 0.5, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
            >
              {editingContact ? "Edit Contact" : "Add Contact"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Admin contact information appears on the Contact page.
            </Typography>

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
              submitLabel={editingContact ? "Save changes" : "Add Contact"}
              onSubmit={editingContact ? handleUpdate : handleCreate}
              onCancel={editingContact ? () => setEditingId(null) : undefined}
              submitting={submitting}
            />
          </Paper>
        </Grid>

        {/* -------- Table card -------- */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold", mb: 1, display: "flex", alignItems: "center", gap: 1 }}
            >
              Admin Contacts
              <Box
                component="span"
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {contacts.length}
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : contacts.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No contacts yet. Add your first contact using the form.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All admin contacts will appear here for management.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 400, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>Phone</TableCell>
                      <TableCell sx={headCellSx}>Email</TableCell>
                      <TableCell sx={headCellSx}>Address</TableCell>
                      <TableCell align="right" sx={headCellSx}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((c) => {
                      const isEditing = editingId === c.contactId;
                      // Editing happens in the form on the left; the row is only highlighted.
                      const cellSx = {
                        verticalAlign: "top",
                        fontWeight: isEditing ? "bold" : "normal",
                        color: isEditing ? "primary.main" : "inherit",
                      };

                      return (
                        <TableRow
                          key={c.contactId}
                          hover
                          selected={isEditing}
                          sx={{ "&.Mui-selected": { bgcolor: "action.selected" } }}
                        >
                          <TableCell sx={{ ...cellSx, maxWidth: 140 }}>{c.contact}</TableCell>
                          <TableCell sx={{ ...cellSx, maxWidth: 200, wordBreak: "break-word" }}>
                            {c.email}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, maxWidth: 250 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                fontWeight: "inherit",
                                color: "inherit",
                              }}
                            >
                              {c.address}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                            <Tooltip title="Edit">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingId(c.contactId)}
                                  disabled={submitting || deletingId === c.contactId}
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
                                  onClick={() => handleDeleteClick(c)}
                                  disabled={submitting || deletingId === c.contactId}
                                >
                                  {deletingId === c.contactId ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
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
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Confirm Delete"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirming={deletingId !== null}
      />
    </Box>
  );
}