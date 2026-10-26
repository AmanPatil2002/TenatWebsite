import { useEffect, useState,useCallback} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
      : "General feedback";

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load your reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const submitReview = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!rating) {
      setError("Please choose a rating from 1 to 5 stars.");
      return;
    }
    if (!description.trim()) {
      setError("Please write a review before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/review`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ rating, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not submit your review");

      setDescription("");
      setRating(0);
      setSuccess("Your review was added.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Could not submit your review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 1 }}>
        Reviews
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Share your experience and keep track of the reviews you have posted.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Paper component="form" variant="outlined" onSubmit={submitReview} sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Write a review
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Your rating
            </Typography>
            <Rating
              name="review-rating"
              value={rating}
              onChange={(_, value) => setRating(value || 0)}
              precision={1}
            />
          </Box>
          <TextField
            label="Your review"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={4}
            required
            inputProps={{ maxLength: 2000 }}
            helperText={`${description.length}/2000 characters`}
          />
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit review"}
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 2 }}>
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
