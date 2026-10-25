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
        // Show clients only
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
    <Box>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ textAlign: "center", mb: 2 }}
      >
        View Users
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
          label="Search by ID, name, email or phone"
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
          {searching ? " match your search" : ""}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 500 }} aria-label="users table">
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              {[
                "No.",
                "User",
                "Status",
                "Contact & Address",
                "Action",
                "Created At",
              ].map((h) => (
                <TableCell key={h} sx={{ color: "white", fontWeight: "bold" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 4 }}>
                  {searching ? "No users match your search" : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((user, index) => (
                <TableRow key={user.userId} hover>
                  <TableCell>
                    {rowsPerPage > 0 ? page * rowsPerPage + index + 1 : index + 1}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      variant="outlined"
                      color={user.status === "active" ? "success" : "error"}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{user.phone || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.address || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => toggleUserStatus(user.userId, user.status)}
                      color={user.status === "active" ? "error" : "success"}
                      sx={{ textTransform: "none" }}
                    >
                      {user.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>

                  <TableCell>{formatDate(user.createdAt)}</TableCell>
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
    </Box>
  );
}