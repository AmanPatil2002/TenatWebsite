import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const emptyEmployee = {
  name: "",
  jobTitle: "",
  email: "",
  phone: "",
  status: "active",
};

export default function SiteAdminEmployees() {
  const { baseUrl, authConfig } = useOutletContext();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [form, setForm] = useState(emptyEmployee);
  const [saving, setSaving] = useState(false);

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
    setForm(employee ? { ...employee } : emptyEmployee);
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
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {error && !dialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700}>
              Employees
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the team associated with this purchased site.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog(null)}
            sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
          >
            Add employee
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Job title</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.jobTitle}</TableCell>
                    <TableCell>
                      {employee.email || employee.phone || "—"}
                      {employee.email && employee.phone && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {employee.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={employee.status}
                        color={
                          employee.status === "active" ? "success" : "default"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Edit ${employee.name}`}
                        onClick={() => openDialog(employee)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${employee.name}`}
                        color="error"
                        onClick={() => deleteEmployee(employee)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!employees.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No employees yet. Add your first employee.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={saveEmployee}>
          <DialogTitle>
            {employeeId ? "Edit employee" : "Add employee"}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  inputProps={{ maxLength: 150 }}
                  required
                  fullWidth
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
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => updateForm("email", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone"
                  value={form.phone || ""}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  inputProps={{ maxLength: 30 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving
                ? "Saving..."
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
