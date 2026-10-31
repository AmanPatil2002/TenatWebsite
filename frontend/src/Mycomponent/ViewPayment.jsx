import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const formatMoney = (amount, currency) => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const getPages = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function TablePaginationActions({ count, page, rowsPerPage, onPageChange }) {
  const theme = useTheme();
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={(event) => onPageChange(event, 0)}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={(event) => onPageChange(event, page - 1)}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={(event) => onPageChange(event, page + 1)}
        disabled={page >= lastPage}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={(event) => onPageChange(event, lastPage)}
        disabled={page >= lastPage}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

function InvoiceDialog({ payment, admin, onClose }) {
  if (!payment) return null;

  const pages = getPages(payment.pages).sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 7 }}>
        Invoice
        <IconButton
          aria-label="Close invoice"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Invoice number
            </Typography>
            <Typography fontWeight={600}>
              {payment.invoiceNumber || "Invoice unavailable"}
            </Typography>
          </Box>
          {admin && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Purchased user
              </Typography>
              <Typography>{payment.userName || "—"}</Typography>
              {payment.email && (
                <Typography variant="body2" color="text.secondary">
                  {payment.email}
                </Typography>
              )}
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Purchased template
            </Typography>
            <Typography>{payment.templateName || `#${payment.templateId}`}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pages
            </Typography>
            {pages.length ? (
              <Stack component="ul" spacing={0.5} sx={{ my: 0, pl: 2.5 }}>
                {pages.map((page, index) => (
                  <Typography component="li" variant="body2" key={page.pagesId || index}>
                    {page.title || `Page #${page.pagesId}`}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2">No pages recorded</Typography>
            )}
          </Box>
          <Divider />
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Date of purchase
            </Typography>
            <Typography variant="body2" textAlign="right">
              {formatDate(payment.paidAt || payment.createdAt)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700}>
              {formatMoney(payment.amount, payment.currency)}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// The admin invoice page shows all purchases; pass admin={false} for a client's own payments.
export default function ViewPayment({ admin = true }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  const loadError = error || (!token ? "Please log in first." : "");
  const visiblePayments =
    rowsPerPage > 0
      ? payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : payments;
  const emptyRows =
    rowsPerPage > 0
      ? Math.max(0, (page + 1) * rowsPerPage - payments.length)
      : 0;

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    axios
      .get(`${API_URL}/payments/${admin ? "admin/all" : "my"}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (!cancelled) {
          setPayments(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message || "Could not load purchases.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [admin, token]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Paper
        elevation={1}
        sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Purchased templates
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        {loading && token ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : !loadError && payments.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No purchases yet.
          </Typography>
        ) : !loadError ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {admin && <TableCell>Purchased user</TableCell>}
                  <TableCell>Purchased templates with pages</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Date of purchase</TableCell>
                  <TableCell align="center">Invoice</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visiblePayments.map((payment) => {
                  const pages = getPages(payment.pages);
                  return (
                    <TableRow hover key={payment.id}>
                      {admin && (
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {payment.userName || "—"}
                          </Typography>
                          {payment.email && (
                            <Typography variant="caption" color="text.secondary">
                              {payment.email}
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {payment.templateName || `#${payment.templateId}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pages.length
                            ? pages.map((page) => page.title || `Page #${page.pagesId}`).join(", ")
                            : "No pages recorded"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {formatMoney(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow sx={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={admin ? 5 : 4} />
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    colSpan={admin ? 5 : 4}
                    count={payments.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[
                      5,
                      10,
                      25,
                      { label: "All", value: -1 },
                    ]}
                    slotProps={{
                      select: {
                        inputProps: { "aria-label": "rows per page" },
                        native: true,
                      },
                    }}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setRowsPerPage(Number.parseInt(event.target.value, 10));
                      setPage(0);
                    }}
                    ActionsComponent={TablePaginationActions}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        ) : null}
      </Paper>
      <InvoiceDialog
        payment={selectedPayment}
        admin={admin}
        onClose={() => setSelectedPayment(null)}
      />
    </Box>
  );
}
