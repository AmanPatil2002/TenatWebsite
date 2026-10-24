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

const formatPrice = (price, currency = "INR") => {
  if (price == null || price === "") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(price));
};

function filterTemplate(templates, query) {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((t) =>
    [
      t.name,
      t.categoryName,
      t.language,
      t.shortDescription,
      t.description,
      t.demoUrl,
      t.demoDomain,
      t.price,
      t.validityDays,
      t.status,
      t.createdBy,
    ].some((field) =>
      String(field ?? "")
        .toLowerCase()
        .includes(q),
    ),
  );
}

export default function ViewProject() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("You are not logged in");

        // Admin endpoint: returns every status (draft, published, archived)
        const res = await fetch(`${API_URL}/templates/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 401)
            throw new Error("Your session has expired. Please log in again.");
          if (res.status === 403)
            throw new Error("You don't have permission to view templates.");
          throw new Error(data?.message || "Failed to load projects");
        }
        if (!Array.isArray(data))
          throw new Error("Invalid templates response");

        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const searching = Boolean(query.trim());
  const filteredTemplates = filterTemplate(templates, query);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 && rowsPerPage > 0
      ? Math.max(0, (1 + page) * rowsPerPage - filteredTemplates.length)
      : 0;

  const visibleRows =
    rowsPerPage > 0
      ? filteredTemplates.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage,
        )
      : filteredTemplates;

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ textAlign: "center", mb: 2 }}
      >
        View Project
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
          label="Search by name, language, status or price"
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
            {filteredTemplates.length}{" "}
            {filteredTemplates.length === 1 ? "Project" : "Projects"}
            {searching ? " match your search" : ""}
          </Typography>
        </Stack>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 500 }} aria-label="project table">
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              {["No.", "Name", "Details", "Url", "Status", "Created At"].map(
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
                    ? "No projects match your search"
                    : "No projects found"}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((t, index) => (
                <TableRow key={t.templateId} hover>
                  <TableCell>
                    {rowsPerPage > 0
                      ? page * rowsPerPage + index + 1
                      : index + 1}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {t.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.language}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created by user #{t.createdBy}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {t.shortDescription} · {formatPrice(t.price, t.currency)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {t.description}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ wordBreak: "break-all" }}>
                    <Typography variant="body1" fontWeight="medium">
                      {t.demoUrl}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.demoDomain}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {t.status}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(t.createdAt)}
                    </Typography>
                  </TableCell>
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
                count={filteredTemplates.length}
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