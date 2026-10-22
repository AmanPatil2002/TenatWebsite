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
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

function filterReviews(reviews, query) {
  const q = query.trim().toLowerCase();
  return reviews.filter((review) => {
    if (!q) return true;
    return [
      review.reviewId,
      review.reviewBy,
      review.name,
      review.email,
      review.templateId,
      review.siteId,
      review.description,
      review.rating,
      review.createdAt,
    ].some((field) =>
      String(field ?? "")
        .toLowerCase()
        .includes(q),
    );
  });
}

export default function ViewReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/review/getreview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load reviews");
        if (!Array.isArray(data)) throw new Error("Invalid reviews response");
        setReviews(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
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

  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - filteredReviews.length)
      : 0;
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows =
    rowsPerPage > 0
      ? filteredReviews.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage,
        )
      : filteredReviews;

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ textAlign: "center", mb: 2 }}
      >
        View Reviews
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          label="Search by user, target, rating or review text"
          value={query}
          onChange={handleSearch}
          sx={{ bgcolor: "background.paper" }}
        />
        {searching && (
          <Button
            onClick={() => {
              setQuery("");
              setPage(0);
            }}
            sx={{ flexShrink: 0 }}
          >
            Clear
          </Button>
        )}
      </Stack>

      {!loading && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            {filteredReviews.length}{"     "}
            {filteredReviews.length === 1 ? "review" : "reviews"}
            {searching ? " match your search" : ""}
          </Typography>
          {averageRating && (
            <Typography variant="body2" color="text.secondary">
              ||  Average rating: {averageRating} / 5
            </Typography>
          )}
        </Stack>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 500 }} aria-label="reviews table">
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              {["No.", "Reviewed By", "Target", "Rating", "Review", "Created At"].map(
                (h) => (
                  <TableCell
                    key={h}
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {h}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {searching
                    ? "No reviews match your search"
                    : "No reviews found"}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((review, index) => (
                <TableRow key={review.reviewId} hover>
                  <TableCell>
                    {rowsPerPage > 0 ? page * rowsPerPage + index + 1 : index + 1}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {review.name || `User #${review.reviewBy}`}
                    </Typography>
                    {review.email && (
                      <Typography variant="caption" color="text.secondary">
                        {review.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {review.templateId
                      ? `Template #${review.templateId}`
                      : review.siteId
                        ? `Site #${review.siteId}`
                        : "-"}
                  </TableCell>
                  <TableCell>
                    <Rating value={Number(review.rating)} readOnly size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>
                    {review.description}
                  </TableCell>
                  <TableCell>{formatDate(review.createdAt)}</TableCell>
                </TableRow>
              ))
            )}

            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={6}
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
    </Box>
  );
}