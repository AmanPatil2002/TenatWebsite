import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  GlobalStyles,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchIcon from "@mui/icons-material/Search";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// Edit these to show your business details on the invoice.
const COMPANY = {
  name: "Your Company Name",
  line1: "Street address, City, State",
  line2: "support@yourcompany.com",
};

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

const formatShortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
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

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const statusMeta = (status) => {
  const value = String(status || "").toLowerCase();
  if (["captured", "paid", "success", "completed"].includes(value)) {
    return { label: "Paid", color: "success" };
  }
  if (["pending", "created", "authorized"].includes(value)) {
    return { label: "Pending", color: "warning" };
  }
  if (["failed", "cancelled", "canceled"].includes(value)) {
    return { label: value, color: "error" };
  }
  if (value === "refunded") return { label: "Refunded", color: "default" };
  return { label: value || "Paid", color: value ? "default" : "success" };
};

const headCellSx = {
  fontWeight: 700,
  whiteSpace: "nowrap",
  color: "text.secondary",
  textTransform: "uppercase",
  fontSize: 12,
  letterSpacing: 0.5,
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
};

/* ---------------- Invoice dialog ---------------- */

function MetaItem({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>{children}</Box>
    </Box>
  );
}

function InvoiceDialog({ payment, admin, onClose }) {
  if (!payment) return null;

  const pages = [...getPages(payment.pages)].sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
  );
  const status = statusMeta(payment.status);
  const hasPagePrices = pages.some(
    (page) => page.price != null && page.price !== "",
  );
  const baseAmount =
    payment.baseAmount ?? payment.templatePriceSnapshot ?? null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      {/* Print only the invoice, not the page behind it */}
      <GlobalStyles
        styles={{
          "@media print": {
            "body *": { visibility: "hidden" },
            ".invoice-print, .invoice-print *": { visibility: "visible" },
            ".invoice-print": {
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
            },
            ".no-print": { display: "none !important" },
          },
        }}
      />

      <Box className="invoice-print">
        {/* Header band */}
        <Box
          sx={(theme) => ({
            px: 3,
            py: 2.5,
            color: "common.white",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            position: "relative",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          })}
        >
          <IconButton
            className="no-print"
            aria-label="Close invoice"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8, color: "inherit" }}
          >
            <CloseIcon />
          </IconButton>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,.2)", color: "inherit" }}>
              <ReceiptLongOutlinedIcon />
            </Avatar>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.2 }}>
                Invoice
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {payment.invoiceNumber || "Invoice unavailable"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={3}>
            {/* From / Billed to */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <MetaItem label="From">
                <Typography variant="body2" fontWeight={700}>
                  {COMPANY.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {COMPANY.line1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {COMPANY.line2}
                </Typography>
              </MetaItem>
              <MetaItem label="Billed to">
                <Typography variant="body2" fontWeight={700}>
                  {payment.userName || "—"}
                </Typography>
                {payment.email && (
                  <Typography variant="body2" color="text.secondary">
                    {payment.email}
                  </Typography>
                )}
              </MetaItem>
            </Stack>

            {/* Invoice details */}
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                <MetaItem label="Date">
                  <Typography variant="body2" fontWeight={600}>
                    {formatShortDate(payment.paidAt || payment.createdAt)}
                  </Typography>
                </MetaItem>
                <MetaItem label="Status">
                  <Chip
                    size="small"
                    label={status.label}
                    color={status.color}
                    sx={{ textTransform: "capitalize", fontWeight: 600 }}
                  />
                </MetaItem>
                <MetaItem label="Method">
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>
                    {payment.method || "—"}
                  </Typography>
                </MetaItem>
                <MetaItem label="Transaction ID">
                  <Typography variant="body2" fontWeight={600} noWrap title={payment.transactionId}>
                    {payment.transactionId || "—"}
                  </Typography>
                </MetaItem>
              </Box>
            </Paper>

            {/* Line items */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellSx, bgcolor: "transparent", pl: 0 }}>
                      Description
                    </TableCell>
                    <TableCell
                      sx={{ ...headCellSx, bgcolor: "transparent", pr: 0 }}
                      align="right"
                    >
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ pl: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {payment.templateName || `Template #${payment.templateId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Website template
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0, whiteSpace: "nowrap" }}>
                      {baseAmount != null
                        ? formatMoney(baseAmount, payment.currency)
                        : "—"}
                    </TableCell>
                  </TableRow>

                  {hasPagePrices ? (
                    pages.map((page, index) => (
                      <TableRow key={page.pagesId || index}>
                        <TableCell sx={{ pl: 0 }}>
                          <Typography variant="body2">
                            {page.title || `Page #${page.pagesId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Page
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 0, whiteSpace: "nowrap" }}>
                          {formatMoney(page.price, payment.currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell sx={{ pl: 0 }}>
                        <Typography variant="body2">
                          Selected pages ({pages.length})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pages.length
                            ? pages
                                .map((page) => page.title || `Page #${page.pagesId}`)
                                .join(", ")
                            : "No pages recorded"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 0, whiteSpace: "nowrap" }}>
                        {payment.pagesAmount != null
                          ? formatMoney(payment.pagesAmount, payment.currency)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total */}
            <Box
              sx={(theme) => ({
                p: 2,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              })}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Total paid
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {formatMoney(payment.amount, payment.currency)}
                </Typography>
              </Stack>
            </Box>

            <Divider />
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Thank you for your purchase. This is a computer-generated invoice
              and does not require a signature.
            </Typography>
          </Stack>
        </DialogContent>
      </Box>

      <DialogActions className="no-print" sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          onClick={() => window.print()}
        >
          Print / Save PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---------------- Page ---------------- */

// The admin invoice page shows all purchases; pass admin={false} for a client's own payments.
export default function ViewPayment({ admin = true }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  const loadError = error || (!token ? "Please log in first." : "");
  const columnCount = admin ? 7 : 6;

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

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter((payment) => {
      const pageTitles = getPages(payment.pages).map((p) => p.title);
      return [
        payment.invoiceNumber,
        payment.userName,
        payment.email,
        payment.templateName,
        ...pageTitles,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [payments, search]);

  const visiblePayments = filteredPayments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Purchased templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {admin
                ? "All template purchases and their invoices."
                : "Your template purchases and invoices."}
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search invoice, user, template..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 300 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        {loading && token ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !loadError ? (
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table stickyHeader size="medium" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Invoice</TableCell>
                    {admin && <TableCell sx={headCellSx}>Purchased by</TableCell>}
                    <TableCell sx={headCellSx}>Template &amp; pages</TableCell>
                    <TableCell sx={headCellSx} align="right">
                      Amount
                    </TableCell>
                    <TableCell sx={headCellSx}>Date</TableCell>
                    <TableCell sx={headCellSx}>Status</TableCell>
                    <TableCell sx={headCellSx} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visiblePayments.map((payment) => {
                    const pages = getPages(payment.pages);
                    const status = statusMeta(payment.status);
                    return (
                      <TableRow hover key={payment.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="body2" fontWeight={600}>
                            {payment.invoiceNumber || "—"}
                          </Typography>
                        </TableCell>

                        {admin && (
                          <TableCell sx={{ minWidth: 220 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  fontSize: 13,
                                  bgcolor: "primary.main",
                                }}
                              >
                                {getInitials(payment.userName)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {payment.userName || "—"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  display="block"
                                >
                                  {payment.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                        )}

                        <TableCell sx={{ minWidth: 220, maxWidth: 320 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {payment.templateName || `#${payment.templateId}`}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {pages.length
                              ? pages
                                  .map((p) => p.title || `Page #${p.pagesId}`)
                                  .join(", ")
                              : "No pages recorded"}
                          </Typography>
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{ whiteSpace: "nowrap", fontWeight: 600 }}
                        >
                          {formatMoney(payment.amount, payment.currency)}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatShortDate(payment.paidAt || payment.createdAt)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={status.label}
                            color={status.color}
                            variant="outlined"
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReceiptLongOutlinedIcon />}
                            onClick={() => setSelectedPayment(payment)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!visiblePayments.length && (
                    <TableRow>
                      <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {payments.length
                            ? "No purchases match your search."
                            : "No purchases yet."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredPayments.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: 1, borderColor: "divider" }}
            />
          </Paper>
        ) : null}
      </Box>

      <InvoiceDialog
        payment={selectedPayment}
        admin={admin}
        onClose={() => setSelectedPayment(null)}
      />
    </Box>
  );
}