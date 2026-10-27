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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


const MIN_QUESTION = 10;
const MIN_ANSWER = 20;

const getInitialForm = () => ({ question: "", answer: "" });

// ---- Shared form (add + edit) -------------------------------------------
function FaqForm({ initialValues, submitLabel, onSubmit, onCancel, submitting }) {
  const [formData, setFormData] = useState(initialValues || getInitialForm());
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const question = formData.question.trim();
    const answer = formData.answer.trim();

    if (!question) errs.question = "Question is required";
    else if (question.length < MIN_QUESTION)
      errs.question = `Question must be at least ${MIN_QUESTION} characters`;

    if (!answer) errs.answer = "Answer is required";
    else if (answer.length < MIN_ANSWER)
      errs.answer = `Answer must be at least ${MIN_ANSWER} characters`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
    };

    // Clear the form after a successful create (edit form is remounted via key)
    Promise.resolve(onSubmit(payload)).then((ok) => {
      if (ok && !initialValues?.question) setFormData(getInitialForm());
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            name="question"
            label="Question"
            value={formData.question}
            onChange={handleChange}
            error={!!errors.question}
            helperText={errors.question || "e.g. How do I change my domain?"}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            minRows={5}
            maxRows={14}
            size="small"
            name="answer"
            label="Answer"
            value={formData.answer}
            onChange={handleChange}
            error={!!errors.answer}
            helperText={errors.answer}
          />
        </Grid>

        <Grid size={12}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
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
}

// ---- Main page ----------------------------------------------------------

export default function AddFaq() {
  const [faqs, setFaqs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
  const faqUrl = `${API_URL}/faq/faq`;

  const fetchFaqs = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(faqUrl);
      setFaqs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setSnack({
        open: true,
        message: error.response?.data?.message || "Could not load FAQs.",
        severity: "error",
      });
    } finally {
      setLoadingList(false);
    }
  }, [faqUrl]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Each handler returns true on success so the form can reset itself
  const handleCreate = async (values) => {
    if (!getToken()) {
      showSnack("Please log in first.", "error");
      return false;
    }
    try {
      setSubmitting(true);
      await axios.post(faqUrl, values, authHeaders());
      showSnack("FAQ added successfully!");
      fetchFaqs();
      return true;
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to add FAQ.", "error");
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
      await axios.put(`${faqUrl}/faq/${editingId}`, values, authHeaders());
      showSnack("FAQ updated successfully!");
      setEditingId(null);
      fetchFaqs();
      return true;
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to update FAQ.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faq) => {
    if (!window.confirm("Delete this FAQ?")) return;
    if (!getToken()) return showSnack("Please log in first.", "error");

    try {
      setDeletingId(faq.faqId);
      await axios.delete(`${faqUrl}/faq/${faq.faqId}`, authHeaders());
      showSnack("FAQ deleted.");
      if (editingId === faq.faqId) setEditingId(null);
      fetchFaqs();
    } catch (error) {
      showSnack(error.response?.data?.message || "Failed to delete FAQ.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const editingFaq = editingId != null ? faqs.find((f) => f.faqId === editingId) : null;

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
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              FAQs appear in the questions section of your website.
            </Typography>

            <FaqForm
              key={editingFaq ? editingFaq.faqId : "new"}
              initialValues={
                editingFaq
                  ? { question: editingFaq.question || "", answer: editingFaq.answer || "" }
                  : getInitialForm()
              }
              submitLabel={editingFaq ? "Save changes" : "Add FAQ"}
              onSubmit={editingFaq ? handleUpdate : handleCreate}
              onCancel={editingFaq ? () => setEditingId(null) : undefined}
              submitting={submitting}
            />
          </Paper>
        </Grid>

        {/* -------- Table card -------- */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Existing FAQs
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : faqs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No FAQs yet. Add your first one using the form.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell >Question & Answer</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {faqs.map((f) => (
                      <TableRow key={f.faqId} hover selected={editingId === f.faqId}>
                        <TableCell sx={{ maxWidth: 220, verticalAlign: "top" }}>
                          <Stack>
                            <Typography variant="body1"><b>Question :</b> {f.question}</Typography>
                            <Typography variant="body1"><b>Answer : </b> {f.answer}</Typography>
                          </Stack>
                          
                        </TableCell>
                        
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => setEditingId(f.faqId)}
                                disabled={submitting || deletingId === f.faqId}
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
                                onClick={() => handleDelete(f)}
                                disabled={submitting || deletingId === f.faqId}
                              >
                                {deletingId === f.faqId ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </Box>
  );
}