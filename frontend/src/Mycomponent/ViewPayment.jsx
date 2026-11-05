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

const CONTACT_URL = `${API_URL}/contact/acontact`;

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

function InvoiceDialog({ payment, admin, adminContact, onClose }) {
  const adminemail = localStorage.getItem("email");
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

  // ---- FROM = admin contact (fallback to COMPANY) ----
  const fromName = adminemail || "";
  const fromEmail = adminContact?.email || "";
  const fromAddress = adminContact?.address || "";
  const fromPhone = adminContact?.contact || "";

  // ---- BILLED TO = buyer info from payment ----
  const billedName = payment.userName || payment.email || "—";
  const billedEmail = payment.email || "";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
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
        {/* Invoice header */}
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
            size="small"
            sx={{ position: "absolute", right: 8, top: 8, color: "inherit" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ opacity: 0.85, letterSpacing: 1.2 }}
              >
                Invoice
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ lineHeight: 1.2 }}
              >
                {payment.invoiceNumber || "—"}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  label={status.label}
                  color={status.color}
                  sx={{
                    textTransform: "capitalize",
                    fontWeight: 600,
                    color: "common.white",
                    borderColor: "rgba(255,255,255,.5)",
                  }}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={3}>
            {/* From / Billed to */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 3, sm: 4 }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              sx={{ width: "100%" }}
            >
              {/* From: Business / Admin details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1, fontWeight: 700 }}
                >
                  From
                </Typography>

                <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                  {fromName}
                </Typography>

                {fromAddress && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                    }}
                  >
                    {fromAddress}
                  </Typography>
                )}

                {fromEmail && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, wordBreak: "break-word" }}
                  >
                    {fromEmail}
                  </Typography>
                )}

                {fromPhone && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {fromPhone}
                  </Typography>
                )}
              </Box>

              {/* Billed to: Customer details */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: { xs: "left", sm: "right" },
                }}
              >
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1, fontWeight: 700 }}
                >
                  Billed to
                </Typography>

                <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                  {billedName}
                </Typography>

                {billedEmail && billedEmail !== billedName && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, wordBreak: "break-word" }}
                  >
                    {billedEmail}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Divider />

            {/* Line items */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ ...headCellSx, bgcolor: "transparent", pl: 0 }}
                    >
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
                        {payment.templateName ||
                          `Template #${payment.templateId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Website template
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ pr: 0, whiteSpace: "nowrap" }}
                    >
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
                        <TableCell
                          align="right"
                          sx={{ pr: 0, whiteSpace: "nowrap" }}
                        >
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
                                .map(
                                  (page) =>
                                    page.title || `Page #${page.pagesId}`,
                                )
                                .join(", ")
                            : "No pages recorded"}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ pr: 0, whiteSpace: "nowrap" }}
                      >
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
              <Stack direction="row" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Total paid
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="primary"
                  sx={{ ml: "auto", textAlign: "right" }}
                >
                  {formatMoney(payment.amount, payment.currency)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Box>

      <DialogActions className="no-print" sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        <Button
          variant="contained"
          disableElevation
          startIcon={<PrintOutlinedIcon fontSize="small" />}
          onClick={() => window.print()}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Print / Save PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---------------- Page ---------------- */

export default function ViewPayment({ admin = true }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Admin contact (email + address + phone) used on the invoice "From" block
  const [adminContact, setAdminContact] = useState(null);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  const loadError = error || (!token ? "Please log in first." : "");
  const columnCount = admin ? 7 : 6;

  // Load payments
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

  // Load admin contact for the invoice "From" block
  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    axios
      .get(CONTACT_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (cancelled) return;
        const data = response.data;
        const first = Array.isArray(data) ? data[0] : data;
        setAdminContact(first || null);
      })
      .catch(() => {
        // Non-fatal: invoice falls back to COMPANY details
        if (!cancelled) setAdminContact(null);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

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
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
      }}
    >
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        {/* Page header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
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
              <ReceiptLongOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ lineHeight: 1.2 }}
              >
                Purchased Templates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {admin
                  ? "All template purchases and their invoices."
                  : "Your template purchases and invoices."}
              </Typography>
            </Box>
          </Stack>

          <TextField
            size="small"
            placeholder="Search invoice, user, template..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 320 }, bgcolor: "background.paper" }}
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
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
            {loadError}
          </Alert>
        )}

        {loading && token ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !loadError ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {admin && (
                      <TableCell sx={headCellSx}>Purchased by</TableCell>
                    )}
                    <TableCell sx={headCellSx}>Template &amp; pages</TableCell>
                    <TableCell sx={headCellSx} align="right">
                      Amount
                    </TableCell>
                    <TableCell sx={headCellSx}>Date</TableCell>
                    <TableCell sx={headCellSx}>Status</TableCell>
                    <TableCell sx={headCellSx} align="center" width={110}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visiblePayments.map((payment) => {
                    const pages = getPages(payment.pages);
                    const status = statusMeta(payment.status);
                    return (
                      <TableRow
                        hover
                        key={payment.id}
                        sx={{ "& td": { verticalAlign: "middle" } }}
                      >
                        {admin && (
                          <TableCell sx={{ minWidth: 220 }}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
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
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                >
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
                            sx={{
                              textTransform: "capitalize",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <ReceiptLongOutlinedIcon fontSize="small" />
                            }
                            onClick={() => setSelectedPayment(payment)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!visiblePayments.length && (
                    <TableRow>
                      <TableCell
                        colSpan={columnCount}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {payments.length
                            ? "No matching purchases"
                            : "No purchases yet"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {payments.length
                            ? "Try a different search term."
                            : "Purchases will appear here."}
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
        adminContact={adminContact}
        onClose={() => setSelectedPayment(null)}
      />
    </Box>
  );
}
