import { useEffect, useState,useCallback} from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Divider,
  Rating,
  Stack,
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
      : "Unknown target";

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError(err.message || "Could not load your reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>

      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        My reviews
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
