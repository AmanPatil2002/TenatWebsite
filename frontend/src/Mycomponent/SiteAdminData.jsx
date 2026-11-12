import { useCallback, useEffect, useMemo, useState } from "react";
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
  Grid,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  alpha,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons for resource types                                 */
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

const ResourceIcons = {
  students: (p) => (
    <SvgIcon {...p}>
      <path d="M12 3l9 4-9 4-9-4 9-4Z" />
      <path d="M6 9v6c0 1.5 2.7 3 6 3s6-1.5 6-3V9" />
    </SvgIcon>
  ),
  teachers: (p) => (
    <SvgIcon {...p}>
      <path d="M12 3l9 4-9 4-9-4 9-4Z" />
      <path d="M6 9v6c0 1.5 2.7 3 6 3s6-1.5 6-3V9" />
      <circle cx="12" cy="12" r="2" />
    </SvgIcon>
  ),
  classes: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M9 5v14" />
    </SvgIcon>
  ),
  departments: (p) => (
    <SvgIcon {...p}>
      <path d="M12 3l9 4-9 4-9-4 9-4Z" />
      <path d="M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9" />
      <path d="M12 3v6" />
    </SvgIcon>
  ),
  doctors: (p) => (
    <SvgIcon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5M10 12h4" />
    </SvgIcon>
  ),
  productcategories: (p) => (
    <SvgIcon {...p}>
      <path d="M4 4h16v4H4Z" />
      <path d="M4 12h16v4H4Z" />
      <path d="M4 20h16" />
      <path d="M8 8v4M12 8v4M16 8v4" />
    </SvgIcon>
  ),
  products: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 12h6M9 15h4" />
    </SvgIcon>
  ),
  menucategories: (p) => (
    <SvgIcon {...p}>
      <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z" />
      <path d="M20 4h-6v14a2 2 0 0 1 2-2h4V4Z" />
    </SvgIcon>
  ),
  menuitems: (p) => (
    <SvgIcon {...p}>
      <path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
      <path d="M3 7l3-4h12l3 4" />
      <path d="M9 11v5M15 11v5" />
    </SvgIcon>
  ),
};

const FieldIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="16" width="7" height="5" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </SvgIcon>
);

const EntriesIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 18 9 5 9-5" />
  </SvgIcon>
);

/* ------------------------------------------------------------------ */
/*  Resource configuration                                              */
/* ------------------------------------------------------------------ */
const field = (label, type = "text", options = {}) => ({
  label,
  type,
  ...options,
});
const status = field("Status", "select", {
  options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  defaultValue: "active",
});
const text = (label, options = {}) => field(label, "text", options);
const number = (label, options = {}) => field(label, "number", options);
const longText = (label, options = {}) =>
  field(label, "textarea", { rows: 4, ...options });
const date = (label, options = {}) => field(label, "date", options);
const json = (label, options = {}) =>
  field(label, "json", { rows: 4, ...options });

const RESOURCE_CONFIG = {
  students: {
    label: "Students",
    singular: "Student",
    icon: ResourceIcons.students,
    color: "#1976d2",
    fields: {
      admissionNo: text("Admission number"),
      name: text("Student name", { required: true }),
      classId: number("Class ID"),
      rollNo: text("Roll number"),
      gender: field("Gender", "select", {
        options: [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
        ],
      }),
      dob: date("Date of birth"),
      guardianName: text("Guardian name"),
      guardianPhone: text("Guardian phone"),
      address: longText("Address"),
      photoUrl: text("Photo URL"),
      status,
    },
  },
  teachers: {
    label: "Teachers",
    singular: "Teacher",
    icon: ResourceIcons.teachers,
    color: "#2e7d32",
    fields: {
      name: text("Name", { required: true }),
      email: text("Email", { type: "email" }),
      phone: text("Phone"),
      qualification: text("Qualification"),
      subjectSpecialty: text("Subject specialty"),
      photoUrl: text("Photo URL"),
      joinedOn: date("Joined on"),
      status,
    },
  },
  classes: {
    label: "Classes",
    singular: "Class",
    icon: ResourceIcons.classes,
    color: "#6a1b9a",
    fields: {
      name: text("Class name", { required: true }),
      section: text("Section"),
      academicYear: text("Academic year"),
      classTeacherId: number("Class teacher ID"),
      status,
    },
  },
  departments: {
    label: "Departments",
    singular: "Department",
    icon: ResourceIcons.departments,
    color: "#c62828",
    fields: {
      name: text("Department name", { required: true }),
      description: longText("Description"),
      status,
    },
  },
  doctors: {
    label: "Doctors",
    singular: "Doctor",
    icon: ResourceIcons.doctors,
    color: "#00695c",
    fields: {
      departmentId: number("Department ID"),
      name: text("Name", { required: true }),
      qualification: text("Qualification"),
      specialization: text("Specialization"),
      experienceYears: number("Experience in years"),
      consultationFee: number("Consultation fee", { step: "0.01" }),
      bio: longText("Biography"),
      photoUrl: text("Photo URL"),
      status,
    },
  },
  productcategories: {
    label: "Product categories",
    singular: "Product category",
    icon: ResourceIcons.productcategories,
    color: "#ef6c00",
    fields: {
      name: text("Category name", { required: true }),
      description: longText("Description"),
      status,
    },
  },
  products: {
    label: "Products",
    singular: "Product",
    icon: ResourceIcons.products,
    color: "#4527a0",
    fields: {
      categoryId: number("Category ID"),
      name: text("Product name", { required: true }),
      sku: text("SKU"),
      description: longText("Description"),
      price: number("Price", { required: true, step: "0.01", defaultValue: 0 }),
      salePrice: number("Sale price", { step: "0.01" }),
      stock: number("Stock", { defaultValue: 0 }),
      thumbnailUrl: text("Thumbnail URL"),
      attributes: json("Attributes"),
      status,
    },
  },
  menucategories: {
    label: "Menu categories",
    singular: "Menu category",
    icon: ResourceIcons.menucategories,
    color: "#ad1457",
    fields: {
      name: text("Category name", { required: true }),
      description: longText("Description"),
      sortOrder: number("Sort order", { defaultValue: 0 }),
      status,
    },
  },
  menuitems: {
    label: "Menu items",
    singular: "Menu item",
    icon: ResourceIcons.menuitems,
    color: "#3e2723",
    fields: {
      categoryId: number("Category ID"),
      name: text("Item name", { required: true }),
      description: longText("Description"),
      price: number("Price", { required: true, step: "0.01", defaultValue: 0 }),
      imageUrl: text("Image URL"),
      isVeg: field("Vegetarian", "boolean", { defaultValue: 0 }),
      isSpecial: field("Special item", "boolean", { defaultValue: 0 }),
      status,
    },
  },
};

const RESOURCE_ORDER = [
  "students",
  "teachers",
  "classes",
  "departments",
  "doctors",
  "productcategories",
  "products",
  "menucategories",
  "menuitems",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatInputValue = (value, type) => {
  if (value === null || value === undefined) return "";
  if (type === "json") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  if (type === "date") {
    if (value instanceof Date) {
      const pad = (part) => String(part).padStart(2, "0");
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }
    return String(value).replace(" ", "T").slice(0, 10);
  }
  if (type === "datetime-local") {
    let raw = String(value);
    if (value instanceof Date) {
      const pad = (part) => String(part).padStart(2, "0");
      raw = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
    }
    return raw.replace(" ", "T").slice(0, 16);
  }
  if (type === "boolean") return String(Number(value));
  return String(value);
};

const createEmptyForm = (config) =>
  Object.fromEntries(
    Object.entries(config.fields).map(([name, spec]) => [
      name,
      formatInputValue(spec.defaultValue, spec.type),
    ]),
  );

const formFromRecord = (record, config) =>
  Object.fromEntries(
    Object.entries(config.fields).map(([name, spec]) => [
      name,
      formatInputValue(record[name], spec.type),
    ]),
  );

const makePayload = (form, config) => {
  const payload = {};
  for (const [name, spec] of Object.entries(config.fields)) {
    const raw = form[name];
    if (spec.required && (raw === "" || raw === undefined || !String(raw).trim())) {
      throw new Error(`${spec.label} is required.`);
    }
    if (raw === "" || raw === undefined) {
      if (spec.nullable !== false) payload[name] = null;
      continue;
    }
    if (spec.type === "number") {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`${spec.label} must be a number.`);
      payload[name] = value;
    } else if (spec.type === "boolean") {
      payload[name] = Number(raw);
    } else if (spec.type === "json") {
      try {
        payload[name] = JSON.stringify(JSON.parse(raw));
      } catch {
        throw new Error(`${spec.label} must be valid JSON.`);
      }
    } else if (spec.type === "datetime-local") {
      payload[name] = raw.replace("T", " ") + ":00";
    } else {
      payload[name] = raw.trim();
    }
  }
  return payload;
};

const formatCell = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/* ------------------------------------------------------------------ */
/*  Reusable UI components                                             */
/* ------------------------------------------------------------------ */
function ResourceSummaryCard({ config, count, color }) {
  const theme = useTheme();
  const Icon = config.icon;
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        borderColor: alpha(color, 0.25),
        background: `linear-gradient(180deg, ${alpha(color, 0.06)} 0%, ${theme.palette.background.paper} 70%)`,
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(color, 0.18)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              color="text.secondary"
              variant="body2"
              fontWeight={600}
              sx={{ textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11 }}
            >
              {config.label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 1, lineHeight: 1.1, color }}>
              {count}
            </Typography>
            <Typography color="text.secondary" variant="caption" component="div" sx={{ mt: 0.5 }}>
              {count === 1 ? "record" : "records"}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(color, 0.12),
              color: color,
              flexShrink: 0,
            }}
          >
            <Icon size={24} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailItem({ icon, label, value }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography color="text.secondary" variant="caption" component="div">
          {label}
        </Typography>
        <Typography fontWeight={600} variant="body2" noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SiteAdminData() {
  const theme = useTheme();
  const { baseUrl, authConfig, site } = useOutletContext();

  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [selectedColumns, setSelectedColumns] = useState([]);

  const availableResources = useMemo(
    () =>
      [...resources].sort((a, b) => {
        const aIndex = RESOURCE_ORDER.indexOf(a);
        const bIndex = RESOURCE_ORDER.indexOf(b);
        return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
      }),
    [resources],
  );

  const config = RESOURCE_CONFIG[selectedResource];
  const resourceColor = config?.color || theme.palette.primary.main;
  const resourceUrl = `${baseUrl}/data/${selectedResource}`;

  // Initialize selected columns when resource changes
  useEffect(() => {
    if (config) {
      setSelectedColumns(Object.keys(config.fields).slice(0, 6));
    }
  }, [config]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => formatCell(value).toLowerCase().includes(query)),
    );
  }, [rows, search]);

  // Single data fetching effect
  const fetchRows = useCallback(async () => {
    if (!selectedResource || !config) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(resourceUrl, authConfig);
      setRows(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load this site's data.");
    } finally {
      setLoading(false);
    }
  }, [authConfig, resourceUrl, selectedResource, config]);

  // Load resources on mount
  useEffect(() => {
    let cancelled = false;
    const loadResources = async () => {
      try {
        const { data } = await axios.get(`${baseUrl}/data`, authConfig);
        if (cancelled) return;
        const knownResources = Array.isArray(data)
          ? data.filter((name) => RESOURCE_CONFIG[name])
          : [];
        setResources(knownResources);
        if (knownResources.length) {
          setSelectedResource(knownResources[0]);
        }
        setError("");
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Could not load this site's data resources.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadResources();
    return () => { cancelled = true; };
  }, [authConfig, baseUrl]);

  // Fetch rows when resource changes
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openNewRecord = () => {
    if (!config) return;
    setEditingRecord(null);
    setForm(createEmptyForm(config));
    setError("");
    setNotice("");
    setDialogOpen(true);
  };

  const openEditRecord = (record) => {
    setEditingRecord(record);
    setForm(formFromRecord(record, config));
    setError("");
    setNotice("");
    setDialogOpen(true);
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = makePayload(form, config);
      if (editingRecord) {
        await axios.put(`${resourceUrl}/${editingRecord.id}`, payload, authConfig);
      } else {
        await axios.post(resourceUrl, payload, authConfig);
      }
      await fetchRows();
      setDialogOpen(false);
      setNotice(editingRecord ? `${config.label} record updated.` : `${config.label} record created.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not save this record.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    const label = record.name || record.title || `${config?.label || "record"} #${record.id}`;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeletingId(record.id);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${resourceUrl}/${record.id}`, authConfig);
      setRows((current) => current.filter((row) => row.id !== record.id));
      setNotice("Record deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not delete this record.");
    } finally {
      setDeletingId(null);
    }
  };

  const updateForm = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  const handleColumnToggle = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  const renderFormField = ([name, spec]) => {
    const multiline = spec.type === "textarea" || spec.type === "json";
    const isSelect = spec.type === "select" || spec.type === "boolean";

    return (
      <TextField
        key={name}
        label={spec.label}
        value={form[name] ?? ""}
        onChange={(event) => updateForm(name, event.target.value)}
        type={isSelect ? undefined : spec.type === "number" ? "number" : "text"}
        required={Boolean(spec.required)}
        select={isSelect}
        multiline={multiline}
        minRows={multiline ? spec.rows : undefined}
        fullWidth
        helperText={
          spec.type === "json" ? "Enter a valid JSON value." :
          spec.type === "number" && spec.step ? `Step: ${spec.step}` :
          undefined
        }
        slotProps={
          spec.type === "number"
            ? { htmlInput: { step: spec.step || "1", min: spec.min } }
            : undefined
        }
        sx={
          multiline
            ? { gridColumn: { xs: "auto", sm: "1 / -1" } }
            : undefined
        }
      >
        {spec.type === "boolean" && [
          <MenuItem key="0" value="0">No</MenuItem>,
          <MenuItem key="1" value="1">Yes</MenuItem>,
        ]}
        {spec.type === "select" &&
          spec.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
      </TextField>
    );
  };

  // If no resources loaded yet, show loading
  if (loading && !config) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* ---------- Page Header ---------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            {config && (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(resourceColor, 0.12),
                  color: resourceColor,
                }}
              >
                <config.icon size={24} />
              </Box>
            )}
            <Box>
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                Site data
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Manage the records stored for this site.
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {site?.categoryName && (
            <Chip
              label={site.categoryName}
              variant="outlined"
              icon={<EntriesIcon size={16} />}
              sx={{ textTransform: "capitalize", fontWeight: 600 }}
            />
          )}
          {config && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNewRecord}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Add {config.singular}
            </Button>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      {/* ---------- Resource Selector & Summary Cards ---------- */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              select
              size="small"
              label="Data table"
              value={selectedResource}
              onChange={(event) => {
                setSelectedResource(event.target.value);
                setSearch("");
                setNotice("");
                setError("");
              }}
              disabled={loading || availableResources.length === 0}
              sx={{ minWidth: { sm: 280 }, flex: { sm: 1 } }}
            >
              {availableResources.map((resource) => {
                const resConfig = RESOURCE_CONFIG[resource];
                return (
                  <MenuItem key={resource} value={resource}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: alpha(resConfig.color, 0.15),
                          color: resConfig.color,
                        }}
                      >
                        <resConfig.icon size={14} />
                      </Box>
                      {resConfig.label}
                    </Stack>
                  </MenuItem>
                );
              })}
            </TextField>
            {config && (
              <Chip
                label={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
                variant="outlined"
                icon={<FieldIcon size={16} />}
              />
            )}
          </Stack>
        </Box>

        {/* Summary cards for all resources */}
        {availableResources.length > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              All data tables
            </Typography>
            <Grid container spacing={2}>
              {availableResources.map((resource) => {
                const resConfig = RESOURCE_CONFIG[resource];
                const resourceRows = resource === selectedResource ? rows : [];
                // We'd need to fetch counts for other resources, for now show current
                return (
                  <Grid key={resource} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <ResourceSummaryCard
                      config={resConfig}
                      count={resource === selectedResource ? rows.length : 0}
                      color={resConfig.color}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Current resource table */}
        {config && (
          <Box sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700} color={resourceColor}>
                  {config.label}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {visibleRows.length} of {rows.length} record{rows.length === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search records"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                  sx={{ minWidth: 240 }}
                />
                <Tooltip title="Toggle view">
                  <IconButton
                    onClick={() => setViewMode((prev) => (prev === "table" ? "cards" : "table"))}
                    color={viewMode === "table" ? "primary" : "default"}
                    aria-label="Toggle view mode"
                  >
                    {viewMode === "table" ? (
                      <FilterListIcon />
                    ) : (
                      <TableCell />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Column visibility">
                  <IconButton
                    onClick={() => {}}
                    color="default"
                    aria-label="Column visibility"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
                <CircularProgress />
              </Box>
            ) : !visibleRows.length ? (
              <Box sx={{ p: 5, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(resourceColor, 0.08),
                    color: resourceColor,
                  }}
                >
                  <config.icon size={32} />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  {search ? "No matching records" : `No ${config.label.toLowerCase()} yet`}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 360, mx: "auto" }}>
                  {search
                    ? "Try adjusting your search terms."
                    : "Add your first record to get started."}
                </Typography>
                {!search && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openNewRecord}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    Add {config.singular}
                  </Button>
                )}
              </Box>
            ) : viewMode === "table" ? (
              <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(resourceColor, 0.04) }}>
                      {selectedColumns.map((column) => (
                        <TableCell
                          key={column}
                          sx={{ fontWeight: 700, whiteSpace: "nowrap", maxWidth: 280 }}
                        >
                          {config.fields[column].label}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 100 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.map((row) => (
                      <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        {selectedColumns.map((column) => (
                          <TableCell key={column} sx={{ maxWidth: 280 }}>
                            {column === "status" ? (
                              <Chip
                                size="small"
                                label={formatCell(row[column])}
                                color={row[column] === "active" ? "success" : "default"}
                                variant="outlined"
                              />
                            ) : column === "isVeg" || column === "isSpecial" ? (
                              <Chip
                                size="small"
                                label={row[column] ? "Yes" : "No"}
                                color={row[column] ? "success" : "default"}
                                variant="outlined"
                                icon={row[column] ? <VisibilityIcon fontSize="small" /> : undefined}
                              />
                            ) : (
                              <Typography variant="body2" noWrap title={formatCell(row[column])}>
                                {formatCell(row[column])}
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              aria-label={`Edit record ${row.id}`}
                              onClick={() => openEditRecord(row)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Delete record ${row.id}`}
                              disabled={deletingId === row.id}
                              onClick={() => deleteRecord(row)}
                            >
                              {deletingId === row.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              /* Card view for mobile */
              <Grid container spacing={2}>
                {visibleRows.map((row) => (
                  <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {row.name || row.title || row.admissionNo || `#${row.id}`}
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditRecord(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                disabled={deletingId === row.id}
                                onClick={() => deleteRecord(row)}
                              >
                                {deletingId === row.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        {selectedColumns.map((column) => (
                          <Box key={column} sx={{ mb: 0.75 }}>
                            <Typography color="text.secondary" variant="caption" component="div">
                              {config.fields[column].label}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {column === "status" ? (
                                <Chip
                                  size="small"
                                  label={formatCell(row[column])}
                                  color={row[column] === "active" ? "success" : "default"}
                                  variant="outlined"
                                />
                              ) : column === "isVeg" || column === "isSpecial" ? (
                                <Chip
                                  size="small"
                                  label={row[column] ? "Yes" : "No"}
                                  color={row[column] ? "success" : "default"}
                                  variant="outlined"
                                />
                              ) : (
                                formatCell(row[column])
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* ---------- Add/Edit Dialog ---------- */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={saveRecord}>
          <DialogTitle fontWeight={800} sx={{ px: 3, py: 2 }}>
            {editingRecord ? "Edit" : "Add"} {config?.singular}
          </DialogTitle>
          <DialogContent dividers sx={{ maxHeight: "70vh" }}>
            {error && <Alert severity="error" sx={{ mb: 2, mx: 3 }}>{error}</Alert>}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                p: 3,
              }}
            >
              {config &&
                Object.entries(config.fields).map(renderFormField)}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} />
                  Saving...
                </Stack>
              ) : editingRecord ? (
                "Save changes"
              ) : (
                "Create record"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}