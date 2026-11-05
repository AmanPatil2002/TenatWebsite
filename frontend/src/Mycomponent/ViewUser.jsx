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
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const COLUMN_COUNT = 6;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

function filterUsers(users, query) {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((user) =>
    [
      user.userId,
      user.name,
      user.email,
      user.phone,
      user.address,
      user.status,
      user.createdAt,
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
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: "1px solid",
  borderColor: "divider",
};

export default function ViewUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/auth/register`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load users");
        if (!Array.isArray(data)) throw new Error("Invalid users response");
        setUsers(data.filter((user) => user.role === "client"));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const res = await fetch(`${API_URL}/auth/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to update user status");

      setError("");
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, status: newStatus } : user,
        ),
      );
    } catch (err) {
      setError(err.message);
      console.error("Error toggling user status:", err);
    }
  };

  const searching = Boolean(query.trim());
  const filteredUsers = filterUsers(users, query);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 && rowsPerPage > 0
      ? Math.max(0, (1 + page) * rowsPerPage - filteredUsers.length)
      : 0;

  const visibleRows =
    rowsPerPage > 0
      ? filteredUsers.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage,
        )
      : filteredUsers;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Box sx={{ maxWidth: 1280, mx: "auto" }}>
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
            <PeopleAltOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              View Users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review registered clients and manage their account status.
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
                label="Search users"
                placeholder="Search by ID, name, email or phone"
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {loading
                  ? "Loading…"
                  : `${filteredUsers.length} ${
                      filteredUsers.length === 1 ? "user" : "users"
                    }${searching ? " matched" : ""}`}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          <TableContainer sx={{ maxWidth: "100%" }}>
            <Table sx={{ minWidth: 720 }} aria-label="users table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headCellSx, width: 64 }}>No.</TableCell>
                  <TableCell sx={headCellSx}>User</TableCell>
                  <TableCell sx={headCellSx}>Status</TableCell>
                  <TableCell sx={headCellSx}>Contact &amp; Address</TableCell>
                  <TableCell sx={{ ...headCellSx, width: 130 }}>Action</TableCell>
                  <TableCell sx={{ ...headCellSx, width: 130 }}>Created At</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {searching ? "No matching users" : "No users found"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searching
                          ? "Try a different search term."
                          : "Registered clients will appear here."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((user, index) => (
                    <TableRow
                      key={user.userId}
                      hover
                      sx={{ "& td": { verticalAlign: "top", py: 1.75 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {rowsPerPage > 0 ? page * rowsPerPage + index + 1 : index + 1}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user.name || "-"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {user.email || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          variant="outlined"
                          color={user.status === "active" ? "success" : "error"}
                          sx={{ textTransform: "capitalize", fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2">{user.phone || "-"}</Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {user.address || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Button
                          size="small"
                          variant={user.status === "active" ? "outlined" : "contained"}
                          disableElevation
                          onClick={() => toggleUserStatus(user.userId, user.status)}
                          color={user.status === "active" ? "error" : "success"}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 1.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={COLUMN_COUNT} />
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                    colSpan={COLUMN_COUNT}
                    count={filteredUsers.length}
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