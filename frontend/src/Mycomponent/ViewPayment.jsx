import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_COLOR = {
  captured: "success",
  pending: "warning",
  failed: "error",
  refunded: "default",
};

const formatMoney = (amount, currency) => {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency || ""}`.trim();
  }
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";

// JSON_ARRAYAGG returns NULL when there are no rows, and some drivers return a string
const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

function PaymentRow({ p, admin, open, onToggle }) {
  const pages = asArray(p.pages);
  const colSpan = admin ? 9 : 8;

  return (
    <Fragment>
      <TableRow hover>
        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(p.paidAt)}</TableCell>
        {admin && (
          <TableCell>
            {p.userName || "—"}
            {p.userEmail && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {p.userEmail}
              </Typography>
            )}
          </TableCell>
        )}
        <TableCell>
          {p.templateName || `#${p.templateId}`}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {p.themeName ? `Theme: ${p.themeName}` : "No theme"} · {pages.length} page
            {pages.length === 1 ? "" : "s"}
          </Typography>
        </TableCell>
        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.transactionId}</TableCell>
        <TableCell>{p.invoiceNumber || "—"}</TableCell>
        <TableCell>{p.method || "—"}</TableCell>
        <TableCell>
          <Chip size="small" label={p.status} color={STATUS_COLOR[p.status] || "default"} />
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
          {formatMoney(p.amount, p.currency)}
        </TableCell>
        <TableCell align="right">
          <Button size="small" onClick={onToggle}>
            {open ? "Hide" : "Details"}
          </Button>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={colSpan} sx={{ py: 0, borderBottom: open ? undefined : "none" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: { xs: 0, sm: 2 } }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Purchase
                  </Typography>
                  <Typography variant="body2">
                    Theme: <strong>{p.themeName || "—"}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Template price: {formatMoney(p.baseAmount, p.currency)}
                  </Typography>
                  <Typography variant="body2">
                    Pages subtotal: {formatMoney(p.pagesAmount, p.currency)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                    Total: {formatMoney(p.amount, p.currency)}
                  </Typography>
                </Box>

                <Box sx={{ flex: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pages purchased
                  </Typography>
                  {pages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No pages recorded for this payment.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableBody>
                        {pages.map((pg) => (
                          <TableRow key={pg.pagesId}>
                            <TableCell sx={{ pl: 0 }}>{pg.title || `Page #${pg.pagesId}`}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                              {formatMoney(pg.price, p.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

// Client:  <PaymentsView />            -> GET /payments/my
// Admin:   <PaymentsView admin />      -> GET /payments
export default function PaymentsView({ admin = false }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    axios
      .get(`${API_URL}/payments${admin ? "" : "/my"}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) setPayments(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Could not load payments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [admin]);

  const statuses = useMemo(
    () => [...new Set(payments.map((p) => p.status).filter(Boolean))],
    [payments]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      const pageTitles = asArray(p.pages).map((pg) => pg.title);
      return [
        p.transactionId,
        p.invoiceNumber,
        p.templateName,
        p.themeName,
        p.userName,
        p.userEmail,
        ...pageTitles,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [payments, statusFilter, search]);

  // Revenue of captured payments, grouped by currency
  const totals = useMemo(() => {
    const map = {};
    filtered
      .filter((p) => p.status === "captured")
      .forEach((p) => {
        map[p.currency] = (map[p.currency] || 0) + Number(p.amount || 0);
      });
    return Object.entries(map);
  }, [filtered]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 0.5, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
        >
          {admin ? "All payments" : "My payments"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {admin
            ? "Every purchase made on the platform."
            : "Your template purchases, with the theme and pages you chose."}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="Search"
            placeholder={
              admin
                ? "Transaction, invoice, template, theme, page, user"
                : "Transaction, invoice, template, theme, page"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {totals.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
            {totals.map(([currency, sum]) => (
              <Chip
                key={currency}
                color="primary"
                variant="outlined"
                label={`Captured: ${formatMoney(sum, currency)}`}
              />
            ))}
            <Chip
              variant="outlined"
              label={`${filtered.length} payment${filtered.length === 1 ? "" : "s"}`}
            />
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {payments.length === 0
              ? admin
                ? "No payments yet."
                : "You haven't bought a template yet."
              : "No payments match your filters."}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  {admin && <TableCell>User</TableCell>}
                  <TableCell>Template</TableCell>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p) => {
                  const key = p.paymentId ?? p.transactionId;
                  return (
                    <PaymentRow
                      key={key}
                      p={p}
                      admin={admin}
                      open={openId === key}
                      onToggle={() => setOpenId(openId === key ? null : key)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}