import { useEffect, useState, useCallback } from "react";
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
import { alpha } from "@mui/material/styles";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReviewsOutlinedIcon from "@mui/icons-material/ReviewsOutlined";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
      if (!res.ok)
        throw new Error(data.message || "Could not load your reviews");
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
      if (!res.ok)
        throw new Error(data.message || "Could not submit your review");

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
    <Box
      sx={{
        minHeight: "80vh",
        py: { xs: 4, md: 7 },
        background:
          "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <Container maxWidth="lg">
        {/* Page header */}
        <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: "center" }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: BRAND.indigo,
            }}
          >
            Feedback
          </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: BRAND.ink,
              mt: 0.5,
            }}
          >
            Reviews
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 560, mx: "auto" }}
          >
            Share your experience and keep track of the reviews you have posted.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 2.5, md: 3 },
            alignItems: "stretch",
          }}
        >
          {/* LEFT: write a review */}
          <Paper
            component="form"
            variant="outlined"
            onSubmit={submitReview}
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  color: BRAND.indigo,
                  bgcolor: alpha(BRAND.indigo, 0.08),
                  "& .MuiSvgIcon-root": { fontSize: "1.25rem" },
                }}
              >
                <RateReviewOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} color={BRAND.ink}>
                  Write a review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tell others about your experience.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2.25} sx={{ flex: 1 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.75, fontWeight: 600 }}
                >
                  Your rating
                </Typography>
                <Rating
                  name="review-rating"
                  value={rating}
                  onChange={(_, value) => setRating(value || 0)}
                  precision={1}
                  size="large"
                  sx={{ color: BRAND.indigo }}
                />
              </Box>

              <TextField
                label="Your review"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={5}
                required
                fullWidth
                inputProps={{ maxLength: 2000 }}
                helperText={`${description.length}/2000 characters`}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />

              <Box sx={{ mt: "auto" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  size="large"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.15,
                    bgcolor: BRAND.indigo,
                    boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.25)}`,
                    "&:hover": {
                      bgcolor: BRAND.indigoDeep,
                      boxShadow: `0 10px 24px ${alpha(BRAND.indigo, 0.32)}`,
                    },
                  }}
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* RIGHT: my reviews */}
          <Paper
            variant="outlined"
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  color: BRAND.indigo,
                  bgcolor: alpha(BRAND.indigo, 0.08),
                  "& .MuiSvgIcon-root": { fontSize: "1.25rem" },
                }}
              >
                <ReviewsOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  fontWeight={700}
                  color={BRAND.ink}
                >
                  My reviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reviews.length > 0
                    ? `${reviews.length} review${
                        reviews.length === 1 ? "" : "s"
                      } posted`
                    : "Your submitted reviews will appear here."}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 6,
                  flex: 1,
                }}
              >
                <CircularProgress
                  size={32}
                  sx={{ color: BRAND.indigo }}
                  aria-label="Loading reviews"
                />
              </Box>
            ) : reviews.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  py: 6,
                  px: 2,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: alpha(BRAND.indigo, 0.08),
                    display: "grid",
                    placeItems: "center",
                    mb: 2,
                  }}
                >
                  <ReviewsOutlinedIcon
                    sx={{ fontSize: 28, color: BRAND.indigo }}
                  />
                </Box>
                <Typography fontWeight={600} color={BRAND.ink} gutterBottom>
                  No reviews yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven&apos;t posted any reviews yet. Use the form on the
                  left to share your first experience.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: { xs: 420, md: 520 },
                  overflowY: "auto",
                  pr: 1,
                  "&::-webkit-scrollbar": { width: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: alpha(BRAND.indigo, 0.25),
                    borderRadius: 3,
                  },
                }}
              >
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {reviews.map((review) => (
                    <Box
                      key={review.reviewId}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(BRAND.indigo, 0.02),
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        flexWrap="wrap"
                      >
                        <Rating
                          value={review.rating}
                          readOnly
                          size="small"
                          sx={{ color: BRAND.indigo }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography
                        sx={{
                          mt: 1,
                          whiteSpace: "pre-wrap",
                          color: BRAND.ink,
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {review.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}