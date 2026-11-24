import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const STATUSES = ["open", "in_progress", "resolved", "closed", "rejected"];
const SEVERITIES = ["low", "medium", "high", "critical"];

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const statusLabel = (status = "") => {
  const normalized = String(status).trim().replaceAll("_", " ");
  return normalized
    ? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Unknown";
};

const statusColor = (status) => {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "rejected") return "default";
  if (status === "in_progress") return "info";
  return "warning";
};

const severityColor = (severity) => {
  if (severity === "critical") return "error";
  if (severity === "high") return "warning";
  if (severity === "low") return "default";
  return "info";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const screenshotHref = (value) => {
  try {
    const url = new URL(value, API_URL);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export default function BugReports() {
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [edit, setEdit] = useState({
    status: "open",
    severity: "medium",
    adminNote: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const loadReports = async () => {
      try {
        const token = getToken();
        if (!token) {
          setReports([]);
          setTotal(0);
          setError("Your session has expired. Please log in again.");
          return;
        }

        const { data } = await axios.get(`${API_URL}/bugreports`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: page + 1,
            limit: rowsPerPage,
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(severityFilter ? { severity: severityFilter } : {}),
          },
          signal: controller.signal,
        });
        const responseTotal = Number(data.total);
        if (
          !Array.isArray(data.data) ||
          !Number.isSafeInteger(responseTotal) ||
          responseTotal < 0
        ) {
          throw new Error("The bug-report API returned an invalid response.");
        }
        setReports(data.data);
        setTotal(responseTotal);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Could not load bug reports.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadReports();
    return () => controller.abort();
  }, [page, reloadKey, rowsPerPage, severityFilter, statusFilter]);

  const openReport = (report) => {
    setSelectedReport(report);
    setEdit({
      status: report.status,
      severity: report.severity,
      adminNote: report.adminNote || "",
    });
    setDialogError("");
    setConfirmClose(false);
  };

  const hasUnsavedChanges =
    Boolean(selectedReport) &&
    (edit.status !== selectedReport.status ||
      edit.severity !== selectedReport.severity ||
      edit.adminNote !== (selectedReport.adminNote || ""));

  const closeReport = () => {
    if (saving) return;
    if (hasUnsavedChanges) {
      setConfirmClose(true);
      return;
    }
    setSelectedReport(null);
    setDialogError("");
  };

  const discardChanges = () => {
    setConfirmClose(false);
    setSelectedReport(null);
    setDialogError("");
  };

  const saveReport = async () => {
    if (!selectedReport) return;
    setSaving(true);
    setDialogError("");
    setNotice("");
    try {
      const token = getToken();
      if (!token) {
        setDialogError("Your session has expired. Please log in again.");
        return;
      }
      await axios.put(`${API_URL}/bugreports/${selectedReport.id}`, edit, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedReport(null);
      setConfirmClose(false);
      setNotice(`Report #${selectedReport.id} was updated successfully.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setDialogError(
        requestError.response?.data?.message ||
          "Could not update this report. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedScreenshotHref = selectedReport?.screenshotUrl
    ? screenshotHref(selectedReport.screenshotUrl)
    : null;

  const renderReportCard = (report) => (
    <Card
      key={report.id}
      variant="outlined"
      sx={{
        borderRadius: 2,
        transition: "box-shadow 150ms ease, border-color 150ms ease",
        "@media (hover: hover)": {
          "&:hover": {
            boxShadow: 2,
            borderColor: "primary.main",
          },
        },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.25 }}
              >
                Report #{report.id}
              </Typography>
              <Typography
                fontWeight={600}
                sx={{ overflowWrap: "anywhere", lineHeight: 1.35 }}
              >
                {report.title || "Untitled report"}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={severityColor(report.severity)}
              label={statusLabel(report.severity)}
              sx={{ flexShrink: 0 }}
            />
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: "anywhere" }}
          >
            {report.reporterName || "Unknown reporter"} ·{" "}
            {report.siteName || "Platform"} · {formatDate(report.createdAt)}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={statusLabel(report.status)}
              color={statusColor(report.status)}
            />
            <Chip
              size="small"
              variant="outlined"
              label={statusLabel(report.type)}
            />
          </Stack>
          <Button
            variant="outlined"
            size="small"
            onClick={() => openReport(report)}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              minHeight: 44,
              textTransform: "none",
            }}
          >
            Review Report
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box
      component="main"
      id="bug-reports-main"
      aria-busy={loading || saving}
      sx={{ maxWidth: 1400, mx: "auto", minWidth: 0, pb: 2 }}
    >
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          component="h1"
          variant="h4"
          fontWeight={700}
          sx={{ mb: 0.5, overflowWrap: "anywhere", textWrap: "balance" }}
        >
          Bug Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and manage issues submitted for purchased sites and the
          platform.
        </Typography>
      </Box>

      <Box aria-live="polite" aria-atomic="true">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error} Refresh the list to try again.
          </Alert>
        )}
        {notice && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setNotice("")}
          >
            {notice}
          </Alert>
        )}
      </Box>

      {/* Filters + refresh bar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ flex: 1 }}
          >
            <Grid container spacing={2} sx={{ flex: 1 }}>
              {/* Status Filter */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bug-status-filter">Status</InputLabel>
                  <Select
                    labelId="bug-status-filter"
                    id="bug-status-filter-select"
                    name="statusFilter"
                    value={statusFilter}
                    label="Status"
                    onChange={(event) => {
                      setLoading(true);
                      setStatusFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All statuses</MenuItem>
                    {STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {statusLabel(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Severity Filter */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bug-severity-filter">Severity</InputLabel>
                  <Select
                    labelId="bug-severity-filter"
                    id="bug-severity-filter-select"
                    name="severityFilter"
                    value={severityFilter}
                    label="Severity"
                    onChange={(event) => {
                      setLoading(true);
                      setSeverityFilter(event.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All severities</MenuItem>
                    {SEVERITIES.map((severity) => (
                      <MenuItem key={severity} value={severity}>
                        {statusLabel(severity)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
          <Button
            variant="outlined"
            onClick={() => {
              setLoading(true);
              setReloadKey((key) => key + 1);
            }}
            disabled={loading}
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              minHeight: 44,
              textTransform: "none",
            }}
          >
            {loading ? "Refreshing…" : "Refresh Reports"}
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack
          role="status"
          aria-live="polite"
          direction="column"
          spacing={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            minHeight: 260,
          }}
        >
          <CircularProgress aria-hidden="true" />
          <Typography color="text.secondary">Loading bug reports…</Typography>
        </Stack>
      ) : reports.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 6 },
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
            No Bug Reports
          </Typography>
          <Typography color="text.secondary">
            {statusFilter || severityFilter
              ? "No reports match the selected filters. Try changing or clearing a filter."
              : "No bug reports have been submitted yet."}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Mobile card layout */}
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {reports.map(renderReportCard)}
          </Stack>

          {/* Desktop table layout */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              display: { xs: "none", md: "block" },
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            <Table aria-label="Bug reports" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  {[
                    "Report",
                    "Reporter / Site",
                    "Severity",
                    "Status",
                    "Created",
                    "Actions",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        fontSize: "0.8125rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "text.secondary",
                        py: 1.5,
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    sx={{
                      "& td": { verticalAlign: "middle" },
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ maxWidth: 320, py: 1.75 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ overflowWrap: "anywhere", lineHeight: 1.35 }}
                      >
                        {report.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {statusLabel(report.type)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Typography
                        variant="body2"
                        sx={{ maxWidth: 240, overflowWrap: "anywhere" }}
                      >
                        {report.reporterName || "Unknown reporter"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                        display: "block",
                        maxWidth: 240,
                        overflowWrap: "anywhere",
                      }}
                      >
                        {report.siteName || "Platform"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Chip
                        size="small"
                        color={severityColor(report.severity)}
                        label={statusLabel(report.severity)}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Chip
                        size="small"
                        color={statusColor(report.status)}
                        label={statusLabel(report.status)}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        py: 1.75,
                        color: "text.secondary",
                      }}
                    >
                      {formatDate(report.createdAt)}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openReport(report)}
                        sx={{ minHeight: 44, textTransform: "none" }}
                      >
                        Review Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => {
              setLoading(true);
              setPage(nextPage);
            }}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setLoading(true);
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            sx={{
              mt: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              ".MuiTablePagination-toolbar": {
                px: { xs: 0, sm: 2 },
                minHeight: 52,
                flexWrap: { xs: "wrap", sm: "nowrap" },
              },
              ".MuiIconButton-root": { minWidth: 44, minHeight: 44 },
            }}
          />
        </>
      )}

      {/* Review dialog */}
      <Dialog
        open={Boolean(selectedReport)}
        onClose={closeReport}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreenDialog}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { sm: "calc(100% - 32px)" },
            overscrollBehavior: "contain",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
          <Stack spacing={1.5}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                overflowWrap: "anywhere",
                lineHeight: 1.35,
                textAlign: "center",
              }}
            >
              Review Report #{selectedReport?.id}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={1.5}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ overflowWrap: "anywhere", lineHeight: 1.35 }}
                  >
                    {selectedReport.title || "Untitled report"}
                  </Typography>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Description
                    </Typography>
                    <Typography
                      sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                    >
                      {selectedReport.description || "No description provided."}
                    </Typography>
                  </Box>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    <strong>From:</strong>{" "}
                    {selectedReport.reporterName || "Unknown reporter"}
                    {selectedReport.reporterEmail
                      ? ` (${selectedReport.reporterEmail})`
                      : ""}
                  </Typography>
                  <Stack direction="row" spacing={5} flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Site:</strong>{" "}
                      {selectedReport.siteName || "Platform"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Submitted:</strong>{" "}
                      {formatDate(selectedReport.createdAt)}
                    </Typography>
                  </Stack>
                  {selectedReport.screenshotUrl && selectedScreenshotHref && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        Attached screenshot
                      </Typography>

                      <Box
                        component="img"
                        src={selectedScreenshotHref}
                        alt="Report screenshot"
                        loading="lazy"
                        width="1200"
                        height="800"
                        sx={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                          maxHeight: 400,
                          objectFit: "contain",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                        }}
                      />

                      <Button
                        component="a"
                        href={selectedScreenshotHref}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        sx={{ mt: 1, minHeight: 44, textTransform: "none" }}
                      >
                        Open Full-Size Image
                      </Button>
                    </Box>
                  )}

                  {selectedReport.screenshotUrl && !selectedScreenshotHref && (
                    <Alert severity="warning">
                      This screenshot link is invalid.
                    </Alert>
                  )}
                  {selectedReport.adminNote && (
                    <Alert severity="info">
                      Previous note: {selectedReport.adminNote}
                    </Alert>
                  )}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 2, bgcolor: "grey.50" }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      mb: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "text.secondary",
                    }}
                  >
                    Update Report
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-report-status">Status</InputLabel>
                      <Select
                        labelId="edit-report-status"
                        id="edit-report-status-select"
                        name="status"
                        label="Status"
                        value={edit.status}
                        onChange={(event) =>
                          setEdit({ ...edit, status: event.target.value })
                        }
                      >
                        {STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {statusLabel(status)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-report-severity">
                        Severity
                      </InputLabel>
                      <Select
                        labelId="edit-report-severity"
                        id="edit-report-severity-select"
                        name="severity"
                        label="Severity"
                        value={edit.severity}
                        onChange={(event) =>
                          setEdit({ ...edit, severity: event.target.value })
                        }
                      >
                        {SEVERITIES.map((severity) => (
                          <MenuItem key={severity} value={severity}>
                            {statusLabel(severity)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      id="bug-report-admin-note"
                      name="adminNote"
                      label="Admin Note"
                      value={edit.adminNote}
                      onChange={(event) =>
                        setEdit({ ...edit, adminNote: event.target.value })
                      }
                      multiline
                      minRows={7}
                      maxRows={12}
                      inputProps={{ maxLength: 65535 }}
                      autoComplete="off"
                      helperText={`${new Intl.NumberFormat().format(edit.adminNote.length)} characters`}
                      fullWidth
                      size="medium"
                    />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
          <Box aria-live="polite" aria-atomic="true">
            {dialogError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {dialogError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > :not(style)": { m: 0, minHeight: 44 },
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <Button
            onClick={closeReport}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            {hasUnsavedChanges ? "Discard Changes" : "Cancel"}
          </Button>
          <Button
            variant="contained"
            onClick={saveReport}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        aria-labelledby="discard-report-changes-title"
        PaperProps={{ sx: { m: 2, overscrollBehavior: "contain" } }}
      >
        <DialogTitle id="discard-report-changes-title">
          Discard Unsaved Changes?
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Your updates to this report have not been saved.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > :not(style)": { m: 0, minHeight: 44 },
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <Button onClick={() => setConfirmClose(false)}>Keep Editing</Button>
          <Button color="error" variant="contained" onClick={discardChanges}>
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
