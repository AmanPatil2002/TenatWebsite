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
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MIN_QUESTION = 10;
const MIN_ANSWER = 20;

const getInitialForm = () => ({ question: "", answer: "" });

/* ---------- Shared form (add + edit) ---------- */
function FaqForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
}) {
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

    Promise.resolve(onSubmit(payload)).then((ok) => {
      if (ok && !initialValues?.question) setFormData(getInitialForm());
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          size="small"
          name="question"
          label="Question"
          placeholder="e.g. How do I change my domain?"
          value={formData.question}
          onChange={handleChange}
          error={!!errors.question}
          helperText={errors.question || `Minimum ${MIN_QUESTION} characters`}
        />

        <TextField
          fullWidth
          multiline
          minRows={5}
          maxRows={14}
          size="small"
          name="answer"
          label="Answer"
          placeholder="Write a clear, helpful answer…"
          value={formData.answer}
          onChange={handleChange}
          error={!!errors.answer}
          helperText={errors.answer || `Minimum ${MIN_ANSWER} characters`}
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
              ) : (
                <AddCommentOutlinedIcon fontSize="small" />
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
}

/* ---------- Main page ---------- */
export default function AddFaq() {
  const [faqs, setFaqs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const getToken = () => localStorage.getItem("token");
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });
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
      showSnack(
        error.response?.data?.message || "Failed to update FAQ.",
        "error",
      );
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
      showSnack(
        error.response?.data?.message || "Failed to delete FAQ.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const editingFaq =
    editingId != null ? faqs.find((f) => f.faqId === editingId) : null;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
      }}
    >
      {/* -------- Page header -------- */}
      <Box sx={{ maxWidth: 1280, mx: "auto", mb: { xs: 2, md: 3 } }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
        >
          FAQ Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Create, edit, and manage the frequently asked questions shown on your
          website.
        </Typography>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        alignItems="flex-start"
        sx={{ maxWidth: 1280, mx: "auto" }}
      >
        {/* -------- Form card -------- */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editingFaq
                  ? "Update the question and answer, then save your changes."
                  : "Fill in the question and answer below to publish a new FAQ."}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <FaqForm
              key={editingFaq ? editingFaq.faqId : "new"}
              initialValues={
                editingFaq
                  ? {
                      question: editingFaq.question || "",
                      answer: editingFaq.answer || "",
                    }
                  : getInitialForm()
              }
              submitLabel={editingFaq ? "Save Changes" : "Add FAQ"}
              onSubmit={editingFaq ? handleUpdate : handleCreate}
              onCancel={editingFaq ? () => setEditingId(null) : undefined}
              submitting={submitting}
            />
          </Paper>
        </Grid>

        {/* -------- Table card -------- */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Existing FAQs
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : faqs.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: "center",
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  No FAQs yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add your first FAQ using the form.
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
                    <TableRow sx={{ backgroundColor: "#fafafa" }}>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        Question &amp; Answer
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          width: 120,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {faqs.map((f) => (
                      <TableRow
                        key={f.faqId}
                        hover
                        selected={editingId === f.faqId}
                        sx={{
                          verticalAlign: "top",
                          "& td": { verticalAlign: "top" },
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Stack spacing={1}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "text.primary" }}
                            >
                              {f.question}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}
                            >
                              {f.answer}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 2 }}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                            alignItems="center"
                          >
                            <Tooltip title="Edit">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingId(f.faqId)}
                                  disabled={
                                    submitting || deletingId === f.faqId
                                  }
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
                                  disabled={
                                    submitting || deletingId === f.faqId
                                  }
                                >
                                  {deletingId === f.faqId ? (
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
