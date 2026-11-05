import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
  DialogTitle,
  Divider,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no MUI icon imports, no tree-shaking issues     */
/* ------------------------------------------------------------------ */
const SvgIcon = ({ children, size = 20, color = "currentColor" }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    sx={{ width: size, height: size, display: "block", color, flexShrink: 0 }}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Box>
);

const AddIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);
const DeleteIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </SvgIcon>
);
const EditIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </SvgIcon>
);
const EmployeesIcon = (p) => (
  <SvgIcon {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 14.2a6 6 0 0 1 4 5.8" />
  </SvgIcon>
);
const MailIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </SvgIcon>
);
const PhoneIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
  </SvgIcon>
);
const BriefcaseIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M2 13h20" />
  </SvgIcon>
);

const AVATAR_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c",
  "#059669", "#0891b2", "#4f46e5", "#be123c",
];

const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const emptyEmployee = {
  name: "",
  jobTitle: "",
  email: "",
  phone: "",
  status: "active",
};

export default function SiteAdminEmployees() {
  const theme = useTheme();
  const { baseUrl, authConfig } = useOutletContext();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [form, setForm] = useState(emptyEmployee);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadEmployees = useCallback(async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/employees`, authConfig);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not load employees.",
      );
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authConfig]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const updateForm = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openDialog = (employee) => {
    setEmployeeId(employee?.id ?? null);
    setForm(employee ? { ...employee } : { ...emptyEmployee });
    setDialogOpen(true);
    setError("");
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (employeeId) {
        await axios.put(`${baseUrl}/employees/${employeeId}`, form, authConfig);
      } else {
        await axios.post(`${baseUrl}/employees`, form, authConfig);
      }
      await loadEmployees();
      setDialogOpen(false);
      setNotice(employeeId ? "Employee updated." : "Employee added.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not save employee.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (employee) => {
    if (!window.confirm(`Remove ${employee.name} from this site?`)) return;
    setDeletingId(employee.id);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${baseUrl}/employees/${employee.id}`, authConfig);
      setEmployees((current) =>
        current.filter((row) => row.id !== employee.id),
      );
      setNotice("Employee removed.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not remove employee.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = employees.filter((e) => e.status === "active").length;

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      {/* ---------------- Page header ---------------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Employees
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage the team associated with your purchased site.
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          <Chip
            icon={<EmployeesIcon size={14} />}
            label={`${employees.length} total`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              "& .MuiChip-icon": { color: "primary.main", ml: 0.5 },
            }}
          />
          <Chip
            icon={<BriefcaseIcon size={14} />}
            label={`${activeCount} active`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              "& .MuiChip-icon": { color: "success.main", ml: 0.5 },
            }}
          />
        </Stack>
      </Stack>

      {error && !dialogOpen && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {notice && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      )}

      {/* ---------------- Table card ---------------- */}
      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: "hidden" }}
      >
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Team directory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click a row's edit button to update details.
              </Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddIcon size={16} />}
              onClick={() => openDialog(null)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                alignSelf: { xs: "flex-start", sm: "center" },
                boxShadow: `0 4px 12px ${alpha(
                  theme.palette.primary.main,
                  0.25,
                )}`,
              }}
            >
              Add employee
            </Button>
          </Stack>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : employees.length === 0 ? (
          <Box
            sx={{
              py: 8,
              px: 2,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
              }}
            >
              <EmployeesIcon size={28} />
            </Box>
            <Typography fontWeight={700} variant="h6">
              No employees yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, mb: 2 }}
            >
              Add your first team member to get started.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon size={16} />}
              onClick={() => openDialog(null)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Add employee
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    hover
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      "& td": { py: 1.75 },
                    }}
                  >
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{ minWidth: 0 }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: avatarColor(employee.name),
                            fontWeight: 700,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {initialsOf(employee.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                          >
                            {employee.name || "Unnamed"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ display: "block" }}
                          >
                            ID: {employee.id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        sx={{ color: "text.secondary", minWidth: 0 }}
                      >
                        <BriefcaseIcon
                          size={15}
                          color={theme.palette.text.secondary}
                        />
                        <Typography variant="body2" noWrap>
                          {employee.jobTitle || "—"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {employee.email || employee.phone ? (
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          {employee.email && (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                              sx={{ minWidth: 0 }}
                            >
                              <MailIcon
                                size={14}
                                color={theme.palette.text.secondary}
                              />
                              <Typography
                                variant="body2"
                                component="a"
                                href={`mailto:${employee.email}`}
                                noWrap
                                sx={{
                                  color: "text.primary",
                                  textDecoration: "none",
                                  "&:hover": {
                                    color: "primary.main",
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {employee.email}
                              </Typography>
                            </Stack>
                          )}
                          {employee.phone && (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.75}
                              sx={{ minWidth: 0 }}
                            >
                              <PhoneIcon
                                size={14}
                                color={theme.palette.text.secondary}
                              />
                              <Typography
                                variant="caption"
                                component="a"
                                href={`tel:${employee.phone.replace(
                                  /[^\d+]/g,
                                  "",
                                )}`}
                                noWrap
                                sx={{
                                  color: "text.secondary",
                                  textDecoration: "none",
                                  "&:hover": {
                                    color: "primary.main",
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {employee.phone}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={employee.status}
                        sx={{
                          textTransform: "capitalize",
                          fontWeight: 700,
                          fontSize: 11,
                          height: 22,
                          bgcolor:
                            employee.status === "active"
                              ? alpha(theme.palette.success.main, 0.12)
                              : alpha(theme.palette.grey[500], 0.12),
                          color:
                            employee.status === "active"
                              ? theme.palette.success.dark
                              : theme.palette.text.secondary,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            aria-label={`Edit ${employee.name}`}
                            onClick={() => openDialog(employee)}
                            size="small"
                            disabled={deletingId === employee.id}
                            sx={{
                              borderRadius: 1.5,
                              color: "text.secondary",
                              "&:hover": {
                                color: "primary.main",
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.08,
                                ),
                              },
                            }}
                          >
                            <EditIcon size={17} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            aria-label={`Delete ${employee.name}`}
                            onClick={() => deleteEmployee(employee)}
                            size="small"
                            disabled={deletingId === employee.id}
                            sx={{
                              borderRadius: 1.5,
                              color: "text.secondary",
                              "&:hover": {
                                color: "error.main",
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                              },
                            }}
                          >
                            {deletingId === employee.id ? (
                              <CircularProgress size={16} color="error" />
                            ) : (
                              <DeleteIcon size={17} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ---------------- Dialog ---------------- */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={saveEmployee}>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                }}
              >
                {employeeId ? <EditIcon size={18} /> : <AddIcon size={18} />}
              </Box>
              <Box>
                <Typography fontWeight={700} lineHeight={1.2}>
                  {employeeId ? "Edit employee" : "Add employee"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {employeeId
                    ? "Update the details and save."
                    : "Enter the new team member's details."}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2.5 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  inputProps={{ maxLength: 150 }}
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Job title"
                  value={form.jobTitle}
                  onChange={(e) => updateForm("jobTitle", e.target.value)}
                  inputProps={{ maxLength: 120 }}
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => updateForm("email", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone"
                  value={form.phone || ""}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  inputProps={{ maxLength: 30 }}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={16} color="inherit" /> : null
              }
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                boxShadow: `0 4px 12px ${alpha(
                  theme.palette.primary.main,
                  0.25,
                )}`,
              }}
            >
              {saving
                ? "Saving…"
                : employeeId
                  ? "Save employee"
                  : "Add employee"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}