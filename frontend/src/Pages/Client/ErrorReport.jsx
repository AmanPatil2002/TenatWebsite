import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const MAX_DESCRIPTION_BYTES = 65535;
const PAGE_SIZE = 10;
const SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EMPTY_REPORT = {
  title: "",
  description: "",
  type: "error",
  severity: "medium",
  siteId: "",
};

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const utf8ByteLength = (value) => new TextEncoder().encode(value).length;

const statusLabel = (value) =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const statusColor = (status) => {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "rejected") return "default";
  if (status === "in_progress") return "info";
  return "warning";
};

const severityColor = {
  low: "success.main",
  medium: "info.main",
  high: "warning.main",
  critical: "error.main",
};

const severityTint = {
  low: "rgba(22,163,74,0.04)",
  medium: "rgba(2,132,199,0.04)",
  high: "rgba(245,158,11,0.05)",
  critical: "rgba(220,38,38,0.05)",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const resolveImageUrl = (url) =>
  url && url.startsWith("/") ? `${API_URL}${url}` : url;

/* ------------------------------ Report card ------------------------------ */
function ReportCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const isLong =
    item.description.length > 220 || item.description.split("\n").length > 4;
  const imageUrl = resolveImageUrl(item.screenshotUrl);

  return (
    <Card
      variant="outlined"
      elevation={0}
      sx={{
        borderRadius: 2.5,
        borderColor: "divider",
        borderLeft: "4px solid",
        borderLeftColor: severityColor[item.severity] || "divider",
        bgcolor: severityTint[item.severity] || "background.paper",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: 2.5 } }}>
        <Stack spacing={1.5}>
          {/* Header: title block + status chip */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: BRAND.muted,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                #{item.id} · {formatDate(item.createdAt)}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: BRAND.ink,
                  overflowWrap: "anywhere",
                  lineHeight: 1.35,
                }}
              >
                {item.title}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={statusLabel(item.status)}
              color={statusColor(item.status)}
              sx={{ fontWeight: 600, flexShrink: 0 }}
            />
          </Stack>

          {/* Meta chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {item.siteId && (
              <Chip
                size="small"
                variant="outlined"
                label={`Site #${item.siteId}`}
              />
            )}
          </Stack>

          {/* Description */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                color: BRAND.ink,
                lineHeight: 1.6,
                ...(!expanded && {
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }),
              }}
            >
              {item.description}
            </Typography>
            {isLong && (
              <Button
                size="small"
                onClick={() => setExpanded((v) => !v)}
                sx={{
                  px: 0,
                  minWidth: 0,
                  mt: 0.5,
                  textTransform: "none",
                  fontWeight: 600,
                  color: BRAND.indigo,
                }}
              >
                {expanded ? "Show less" : "Show more"}
              </Button>
            )}
          </Box>

          {/* Screenshot */}
          {imageUrl && (
            <Link
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "inline-block", lineHeight: 0 }}
            >
              <Box
                component="img"
                src={imageUrl}
                alt="Report screenshot"
                sx={{
                  maxWidth: 220,
                  maxHeight: 140,
                  objectFit: "cover",
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  display: "block",
                }}
              />
            </Link>
          )}

          {/* Admin response */}
          {item.adminNote ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha("#0284c7", 0.06),
                borderLeft: "3px solid",
                borderLeftColor: "info.main",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "info.main",
                }}
              >
                ADMIN RESPONSE
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  mt: 0.5,
                  color: BRAND.ink,
                }}
              >
                {item.adminNote}
              </Typography>
              {item.resolvedAt && (
                <Typography
                  variant="caption"
                  sx={{ color: BRAND.muted, display: "block", mt: 0.5 }}
                >
                  Resolved {formatDate(item.resolvedAt)}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: BRAND.muted }}>
              No admin response yet.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* Section label helper */
function SectionLabel({ children }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: BRAND.indigo,
        lineHeight: 1.6,
      }}
    >
      {children}
    </Typography>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function ErrorReport() {
  const [tab, setTab] = useState(0);

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [siteError, setSiteError] = useState("");

  const [myReports, setMyReports] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [reportsPage, setReportsPage] = useState(0);
  const [reportsReload, setReportsReload] = useState(0);

  const [report, setReport] = useState(EMPTY_REPORT);
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  /* Load sites */
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          setSiteError("Please sign in again to load your sites.");
          return;
        }
        const { data } = await axios.get(`${API_URL}/sites/my`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!Array.isArray(data)) throw new Error("Invalid sites response.");
        setSites(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        setSiteError(
          e.response?.data?.message ||
            e.message ||
            "Could not load your sites.",
        );
      } finally {
        if (!controller.signal.aborted) setSitesLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  /* Load my reports */
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          setReportsError("Your session has expired. Please log in again.");
          return;
        }
        const { data } = await axios.get(`${API_URL}/bugreports/my`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: reportsPage + 1, limit: PAGE_SIZE },
          signal: controller.signal,
        });
        if (
          !Array.isArray(data.data) ||
          !Number.isSafeInteger(Number(data.total))
        ) {
          throw new Error("Invalid reports response.");
        }
        setMyReports(data.data);
        setReportsTotal(Number(data.total));
        setReportsError("");
      } catch (e) {
        if (controller.signal.aborted) return;
        setReportsError(
          e.response?.data?.message ||
            e.message ||
            "Could not load your reports.",
        );
      } finally {
        if (!controller.signal.aborted) setReportsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [reportsPage, reportsReload]);

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    if (!SCREENSHOT_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, WEBP or GIF image.");
      event.target.value = "";
      return;
    }
    setError("");
    setScreenshot(file);
  };

  const clearForm = () => {
    setReport(EMPTY_REPORT);
    setScreenshot(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const title = report.title.trim();
    const description = report.description.trim();
    if (!title || !description)
      return setError("Title and description are required.");
    if (title.length > 190)
      return setError("Title must be 190 characters or fewer.");
    if (utf8ByteLength(description) > MAX_DESCRIPTION_BYTES) {
      return setError("Description must be 65535 bytes or fewer.");
    }

    const token = getToken();
    if (!token)
      return setError("Your session has expired. Please log in again.");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", report.type);
      formData.append("severity", report.severity);
      if (report.siteId) formData.append("siteId", report.siteId);
      if (screenshot) formData.append("screenshot", screenshot);

      await axios.post(`${API_URL}/bugreports`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      clearForm();
      setSuccess("Your report was submitted. Thank you for letting us know.");
      setReportsPage(0);
      setReportsLoading(true);
      setReportsReload((k) => k + 1);
      setTab(1);
    } catch (e) {
      setError(e.response?.data?.message || "Could not submit your report.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(reportsTotal / PAGE_SIZE));

  return (
    <Box
      sx={{
        minHeight: "80vh",
        py: { xs: 4, md: 7 },
        background:
          "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: "center" }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: BRAND.indigo,
            }}
          >
            Support
          </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: BRAND.ink,
              mt: 0.5,
            }}
          >
            Error reports
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 520, mx: "auto" }}
          >
            Report a problem to our team and track the progress of your earlier
            reports.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            borderRadius: 3.5,
            overflow: "hidden",
            borderColor: "divider",
            boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
            bgcolor: "background.paper",
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setError("");
            }}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: alpha(BRAND.indigo, 0.02),
              "& .MuiTab-root": {
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
                py: 1.75,
              },
              "& .Mui-selected": { color: BRAND.indigo },
              "& .MuiTabs-indicator": { bgcolor: BRAND.indigo, height: 3 },
            }}
          >
            <Tab label="New report" />
            <Tab
              label={`My reports${reportsTotal ? ` (${reportsTotal})` : ""}`}
            />
          </Tabs>

          {/* ----------------------------- NEW REPORT ----------------------------- */}
          {tab === 0 && (
            <Box
              component="form"
              onSubmit={submitReport}
              sx={{ p: { xs: 2.5, sm: 4 } }}
            >
              <Stack spacing={3.5}>
                {error && (
                  <Alert
                    severity="error"
                    onClose={() => setError("")}
                    sx={{ borderRadius: 2 }}
                  >
                    {error}
                  </Alert>
                )}
                {siteError && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {siteError} You can still submit a platform-level report.
                  </Alert>
                )}

                {/* Section: what happened */}
                <Box>
                  <SectionLabel>What happened</SectionLabel>
                  <Divider sx={{ mb: 2, mt: 0.5 }} />
                  <Stack spacing={2}>
                    <TextField
                      label="Title"
                      value={report.title}
                      onChange={(e) =>
                        setReport({ ...report, title: e.target.value })
                      }
                      inputProps={{ maxLength: 190 }}
                      helperText={`${report.title.length}/190`}
                      required
                      fullWidth
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <TextField
                      label="Describe the error"
                      value={report.description}
                      onChange={(e) =>
                        setReport({ ...report, description: e.target.value })
                      }
                      multiline
                      minRows={5}
                      helperText={`${utf8ByteLength(report.description)}/${MAX_DESCRIPTION_BYTES} bytes`}
                      required
                      fullWidth
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Stack>
                </Box>

                {/* Section: details */}
                <Box>
                  <SectionLabel>Details</SectionLabel>
                  <Divider sx={{ mb: 2, mt: 0.5 }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel id="er-type">Type</InputLabel>
                        <Select
                          labelId="er-type"
                          label="Type"
                          value={report.type}
                          onChange={(e) =>
                            setReport({ ...report, type: e.target.value })
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="bug">Bug</MenuItem>
                          <MenuItem value="error">Error</MenuItem>
                          <MenuItem value="suggestion">Suggestion</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel id="er-severity">Severity</InputLabel>
                        <Select
                          labelId="er-severity"
                          label="Severity"
                          value={report.severity}
                          onChange={(e) =>
                            setReport({ ...report, severity: e.target.value })
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth disabled={sitesLoading}>
                        <InputLabel id="er-site">Related site</InputLabel>
                        <Select
                          labelId="er-site"
                          label="Related site"
                          value={report.siteId}
                          onChange={(e) =>
                            setReport({ ...report, siteId: e.target.value })
                          }
                          sx={{ borderRadius: 2 }}
                          endAdornment={
                            sitesLoading ? (
                              <CircularProgress size={16} sx={{ mr: 3 }} />
                            ) : null
                          }
                        >
                          {sites.map((site) => (
                            <MenuItem
                              key={String(site.id)}
                              value={String(site.id)}
                            >
                              {site.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                {/* Section: screenshot */}
                <Box>
                  <SectionLabel>Screenshot (optional)</SectionLabel>
                  <Divider sx={{ mb: 2, mt: 0.5 }} />
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      {screenshot ? "Change screenshot" : "Attach screenshot"}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        hidden
                        onChange={handleScreenshotChange}
                      />
                    </Button>
                    {screenshot && (
                      <>
                        <Box
                          component="img"
                          src={URL.createObjectURL(screenshot)}
                          alt={screenshot.name}
                          sx={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ overflowWrap: "anywhere", minWidth: 0 }}
                        >
                          {screenshot.name}
                        </Typography>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => {
                            setScreenshot(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: BRAND.muted, display: "block", mt: 1 }}
                  >
                    JPG, PNG, WEBP or GIF, up to 5 MB.
                  </Typography>
                </Box>

                {/* Actions */}
                <Stack
                  direction="row"
                  spacing={1.5}
                  justifyContent="flex-end"
                  sx={{ pt: 1 }}
                >
                  <Button
                    color="inherit"
                    onClick={clearForm}
                    disabled={submitting}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      px: 3,
                      bgcolor: BRAND.indigo,
                      boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.25)}`,
                      "&:hover": {
                        bgcolor: BRAND.indigoDeep,
                        boxShadow: `0 10px 24px ${alpha(BRAND.indigo, 0.32)}`,
                      },
                    }}
                  >
                    {submitting ? "Submitting…" : "Submit report"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* ----------------------------- MY REPORTS ----------------------------- */}
          {tab === 1 && (
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Stack spacing={2.5}>
                {success && (
                  <Alert
                    severity="success"
                    onClose={() => setSuccess("")}
                    sx={{ borderRadius: 2 }}
                  >
                    {success}
                  </Alert>
                )}

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={reportsLoading}
                    onClick={() => {
                      setReportsLoading(true);
                      setReportsReload((k) => k + 1);
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Refresh
                  </Button>
                </Stack>

                <Divider />

                {reportsError && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {reportsError}
                  </Alert>
                )}

                {reportsLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                    }}
                  >
                    <CircularProgress
                      sx={{ color: BRAND.indigo }}
                      aria-label="Loading reports"
                    />
                  </Box>
                ) : reportsError ? null : myReports.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                      px: 2,
                      borderRadius: 3,
                      bgcolor: alpha(BRAND.indigo, 0.03),
                      border: "1px dashed",
                      borderColor: alpha(BRAND.indigo, 0.2),
                    }}
                  >
                    <Typography
                      fontWeight={700}
                      color={BRAND.ink}
                      gutterBottom
                    >
                      No reports yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                      Reports you submit will appear here with their status.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setTab(0)}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: BRAND.indigo,
                        boxShadow: `0 8px 20px ${alpha(BRAND.indigo, 0.25)}`,
                        "&:hover": { bgcolor: BRAND.indigoDeep },
                      }}
                    >
                      Create a report
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      maxHeight: { xs: "60vh", sm: 520 },
                      overflowY: "auto",
                      pr: 1,
                      "&::-webkit-scrollbar": { width: 6 },
                      "&::-webkit-scrollbar-thumb": {
                        bgcolor: alpha(BRAND.indigo, 0.25),
                        borderRadius: 3,
                      },
                    }}
                  >
                    <Stack spacing={2}>
                      {myReports.map((item) => (
                        <ReportCard key={item.id} item={item} />
                      ))}
                    </Stack>
                  </Box>
                )}

                {!reportsLoading && !reportsError && totalPages > 1 && (
                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ pt: 1 }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={reportsPage === 0}
                      onClick={() => setReportsPage((p) => Math.max(0, p - 1))}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Previous
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Page {reportsPage + 1} of {totalPages}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={reportsPage + 1 >= totalPages}
                      onClick={() => setReportsPage((p) => p + 1)}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Next
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}