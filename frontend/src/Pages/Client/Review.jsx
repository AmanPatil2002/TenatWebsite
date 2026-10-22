import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Rating,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MIN_DESCRIPTION = 20;

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const describeTarget = (review) =>
  review.templateId
    ? `Template #${review.templateId}`
    : review.siteId
      ? `Site #${review.siteId}`
      : "Unknown target";

export default function Review() {
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [targetType, setTargetType] = useState("template");
  const [targetId, setTargetId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/review/myreview`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not load your reviews");
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (rating < 1) return setError("Choose a rating from 1 to 5.");
    if (description.trim().length < MIN_DESCRIPTION)
      return setError(`Write at least ${MIN_DESCRIPTION} characters.`);
    if (!/^[1-9]\d*$/.test(targetId.trim()))
      return setError("Enter a valid positive target ID.");

    setSubmitting(true);
    try {
      const target = targetType === "template"
        ? { templateId: targetId.trim() }
        : { siteId: targetId.trim() };
      const res = await fetch(`${API_URL}/review/postreview`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...target,
          description: description.trim(),
          rating,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not submit your review");

      setSuccess("Review submitted.");
      setDescription("");
      setRating(0);
      setTargetId("");
      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }} elevation={2}>
        <Typography variant="h5" gutterBottom>
          Write a review
        </Typography>

        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="review-target-type-label">Review target</InputLabel>
            <Select
              labelId="review-target-type-label"
              label="Review target"
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value);
                setTargetId("");
              }}
            >
              <MenuItem value="template">Template</MenuItem>
              <MenuItem value="site">Site</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={`${targetType === "template" ? "Template" : "Site"} ID`}
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            required
            fullWidth
          />

          <Box>
            <Typography component="legend" variant="body2" color="text.secondary">
              Your rating
            </Typography>
            <Rating
              name="rating"
              value={rating}
              onChange={(_, value) => setRating(value || 0)}
              size="large"
            />
          </Box>

          <TextField
            label="Your review"
            multiline
            minRows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText={`${description.trim().length}/${MIN_DESCRIPTION} characters minimum`}
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit review"}
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        My reviews
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Typography color="text.secondary">
          You haven&apos;t posted any reviews yet. Your reviews will appear here.
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider flexItem />}>
          {reviews.map((review) => (
            <Box key={review.reviewId}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(review.createdAt)}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {describeTarget(review)}
              </Typography>
              <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                {review.description}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
}
