import { useState, useEffect } from "react";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const reviewerLabel = (review) =>
  review.reviewerName || `User #${review.reviewBy}`;

// First letter for the avatar
const initialOf = (review) =>
  (reviewerLabel(review) || "?").trim().charAt(0).toUpperCase();

function filterReviews(reviews, query) {
  const q = query.trim().toLowerCase();
  if (!q) return reviews;
  return reviews.filter((review) =>
    [
      review.reviewId,
      reviewerLabel(review),
      review.description,
      review.rating,
      formatDate(review.createdAt),
    ].some((field) =>
      String(field ?? "")
        .toLowerCase()
        .includes(q),
    ),
  );
}

const headCellSx = {
  fontWeight: 700,
  bgcolor: "grey.50",
  whiteSpace: "nowrap",
  color: "text.primary",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid",
  borderColor: "divider",
};

export default function ViewReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/review`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load reviews");
        }
        if (!Array.isArray(data)) throw new Error("Invalid reviews response");
        setReviews(data);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load reviews");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchReviews();
    return () => controller.abort();
  }, []);

  const searching = Boolean(query.trim());
  const filteredReviews = filterReviews(reviews, query);

  const averageRating =
    filteredReviews.length > 0
      ? (
          filteredReviews.reduce((sum, r) => sum + Number(r.rating), 0) /
          filteredReviews.length
        ).toFixed(1)
      : null;

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showAll = rowsPerPage < 1;

  const emptyRows =
    page > 0 && !showAll
      ? Math.max(0, (1 + page) * rowsPerPage - filteredReviews.length)
      : 0;

  const visibleRows = showAll
    ? filteredReviews
    : filteredReviews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Page header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: { xs: 2, md: 3 } }}>
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
            <RateReviewOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              View Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse customer feedback and monitor overall satisfaction.
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 1.5 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                size="small"
                fullWidth
                label="Search reviews"
                placeholder="Reviewer, rating, date or review text"
                value={query}
                onChange={handleSearch}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searching ? (
                      <InputAdornment position="end">
                        <CloseIcon
                          fontSize="small"
                          sx={{ cursor: "pointer", color: "text.secondary" }}
                          onClick={() => {
                            setQuery("");
                            setPage(0);
                          }}
                        />
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Chip
                  size="small"
                  label={`${filteredReviews.length} ${
                    filteredReviews.length === 1 ? "review" : "reviews"
                  }`}
                  variant="outlined"
                />
                {averageRating && (
                  <Chip
                    size="small"
                    icon={<StarIcon fontSize="small" />}
                    label={`Avg ${averageRating} / 5`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Stack>
          </Box>

          <Divider />

          <TableContainer>
            <Table sx={{ minWidth: 640 }} aria-label="reviews table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headCellSx, width: 60 }}>No.</TableCell>
                  <TableCell sx={{ ...headCellSx, width: 220 }}>Reviewed By</TableCell>
                  <TableCell sx={headCellSx}>Review</TableCell>
                  <TableCell align="right" sx={{ ...headCellSx, width: 130 }}>
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {searching ? "No matching reviews" : "No reviews found"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searching
                          ? "Try a different search term."
                          : "Customer reviews will appear here."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((review, index) => {
                    const ratingValue = Number(review.rating);
                    return (
                      <TableRow
                        key={review.reviewId}
                        hover
                        sx={{
                          "& td": {
                            verticalAlign: "top",
                            py: 2,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                          },
                          "&:last-child td": { borderBottom: "none" },
                        }}
                      >
                        {/* No. */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {showAll ? index + 1 : page * rowsPerPage + index + 1}
                          </Typography>
                        </TableCell>

                        {/* Reviewed By */}
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: "0.9rem",
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                              }}
                            >
                              {initialOf(review)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, wordBreak: "break-word" }}
                              >
                                {reviewerLabel(review)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Review #{review.reviewId}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Review (rating + text) */}
                        <TableCell>
                          <Stack spacing={0.75}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Rating
                                value={ratingValue}
                                readOnly
                                size="small"
                                precision={0.5}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {ratingValue.toFixed(1)} / 5
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                lineHeight: 1.65,
                                whiteSpace: "pre-line",
                                wordBreak: "break-word",
                                display: "-webkit-box",
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {review.description || "—"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Date */}
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            justifyContent="flex-end"
                          >
                            <CalendarTodayOutlinedIcon
                              sx={{ fontSize: 14, color: "text.disabled" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(review.createdAt)}
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={4} />
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                    colSpan={4}
                    count={filteredReviews.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    slotProps={{
                      select: {
                        inputProps: { "aria-label": "rows per page" },
                        native: true,
                      },
                    }}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}