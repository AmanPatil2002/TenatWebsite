
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TEMPLATES_URL = `${API_URL}/templates`;

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  fallback;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export default function ViewProject() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message, severity = "success") => {
    setSnack({ open: true, message, severity });
  };

  const fetchTemplates = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${TEMPLATES_URL}/admin/all?limit=100`,
        authConfig()
      );

      const data = response.data;
      setTemplates(
        Array.isArray(data)
          ? data
          : data?.templates || data?.data || []
      );
    } catch (error) {
      showSnack(getErrorMessage(error, "Could not load templates."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return templates;

    return templates.filter((template) =>
      [
        template.name,
        template.categoryName,
        template.shortDescription,
        template.status,
        template.language,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [templates, search]);

  const visibleTemplates = filteredTemplates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete "${template.name}"?`)) return;

    setDeletingId(template.templateId);

    try {
      await axios.delete(
        `${TEMPLATES_URL}/${template.templateId}`,
        authConfig()
      );

      setTemplates((previous) =>
        previous.filter((item) => item.templateId !== template.templateId)
      );

      showSnack("Template deleted.");
    } catch (error) {
      showSnack(getErrorMessage(error, "Could not delete template."), "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 4 }, maxWidth: 1600, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            View Projects
          </Typography>
          <Typography color="text.secondary">
            Manage templates, pages and themes.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTemplates}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/admin/templates/add")}
          >
            Add Template
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by template, category, language or status..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : visibleTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              visibleTemplates.map((template, index) => (
                <TableRow key={template.templateId} hover>
                  <TableCell>
                    {page * rowsPerPage + index + 1}
                  </TableCell>

                  <TableCell sx={{ minWidth: 160 }}>
                    <Typography fontWeight={600}>
                      {template.name || "Untitled"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.categoryName || "Uncategorized"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ minWidth: 220 }}>
                    {template.shortDescription ||
                      template.description ||
                      "—"}
                  </TableCell>

                  <TableCell sx={{ minWidth: 140 }}>
                    {template.domainLink ? (
                      <a
                        href={template.domainLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open URL
                      </a>
                    ) : template.demoUrl ? (
                      <a
                        href={template.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={template.status || "draft"}
                      color={
                        template.status === "published"
                          ? "success"
                          : template.status === "inactive"
                            ? "default"
                            : "warning"
                      }
                    />
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(template.createdAt)}
                  </TableCell>

                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                      flexWrap="wrap"
                    >
                      <Tooltip title="Edit template">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(
                              `/admin/templates/${template.templateId}/edit`
                            )
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Manage pages and themes">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(
                              `/admin/templates/${template.templateId}/content`
                            )
                          }
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Manage pages">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(
                              `/admin/templates/${template.templateId}/pages`
                            )
                          }
                        >
                          <ArticleOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Manage themes">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(
                              `/admin/templates/${template.templateId}/themes`
                            )
                          }
                        >
                          <PaletteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete template">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deletingId === template.templateId}
                            onClick={() => handleDelete(template)}
                          >
                            {deletingId === template.templateId ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filteredTemplates.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
