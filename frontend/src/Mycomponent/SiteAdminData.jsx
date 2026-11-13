import { useCallback, useEffect, useMemo, useState } from "react";
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
  alpha,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import ImageIcon from "@mui/icons-material/Image";

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
const text = (label, options = {}) => field(label, "text", { maxLength: 255, ...options });
const number = (label, options = {}) => field(label, "number", { min: 0, ...options });
const idNumber = (label, options = {}) =>
  number(label, { integer: true, min: 1, ...options });
const longText = (label, options = {}) =>
  field(label, "textarea", { rows: 4, maxLength: 2000, ...options });
const date = (label, options = {}) => field(label, "date", options);
const json = (label, options = {}) =>
  field(label, "json", { rows: 4, ...options });
const email = (label, options = {}) => field(label, "email", { maxLength: 255, ...options });
const phone = (label, options = {}) => field(label, "tel", { maxLength: 20, ...options });
const image = (label, options = {}) => field(label, "image", options);

const RESOURCE_CONFIG = {
  students: {
    label: "Students",
    singular: "Student",
    icon: ResourceIcons.students,
    color: "#1976d2",
    fields: {
      admissionNo: text("Admission number", { maxLength: 50 }),
      name: text("Student name", { required: true, minLength: 2 }),
      classId: idNumber("Class ID"),
      rollNo: text("Roll number", { maxLength: 50 }),
      gender: field("Gender", "select", {
        options: [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
        ],
      }),
      dob: date("Date of birth", { min: "1900-01-01", max: "today" }),
      guardianName: text("Guardian name", { minLength: 2 }),
      guardianPhone: phone("Guardian phone"),
      address: longText("Address"),
      photoUrl: image("Photo"),
      status,
    },
  },
  teachers: {
    label: "Teachers",
    singular: "Teacher",
    icon: ResourceIcons.teachers,
    color: "#2e7d32",
    fields: {
      name: text("Name", { required: true, minLength: 2 }),
      email: email("Email"),
      phone: phone("Phone"),
      qualification: text("Qualification"),
      subjectSpecialty: text("Subject specialty"),
      photoUrl: image("Photo"),
      joinedOn: date("Joined on", { min: "1950-01-01" }),
      status,
    },
  },
  classes: {
    label: "Classes",
    singular: "Class",
    icon: ResourceIcons.classes,
    color: "#6a1b9a",
    fields: {
      name: text("Class name", { required: true, minLength: 1 }),
      section: text("Section", { maxLength: 50 }),
      academicYear: text("Academic year", { maxLength: 50 }),
      classTeacherId: idNumber("Class teacher ID"),
      status,
    },
  },
  departments: {
    label: "Departments",
    singular: "Department",
    icon: ResourceIcons.departments,
    color: "#c62828",
    fields: {
      name: text("Department name", { required: true, minLength: 2 }),
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
      departmentId: idNumber("Department ID"),
      name: text("Name", { required: true, minLength: 2 }),
      qualification: text("Qualification"),
      specialization: text("Specialization"),
      experienceYears: number("Experience in years", { integer: true, max: 60 }),
      consultationFee: number("Consultation fee", { step: "0.01", max: 1000000 }),
      bio: longText("Biography"),
      photoUrl: image("Photo"),
      status,
    },
  },
  productcategories: {
    label: "Product categories",
    singular: "Product category",
    icon: ResourceIcons.productcategories,
    color: "#ef6c00",
    fields: {
      name: text("Category name", { required: true, minLength: 2 }),
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
      categoryId: idNumber("Category ID"),
      name: text("Product name", { required: true, minLength: 2 }),
      sku: text("SKU", { maxLength: 100 }),
      description: longText("Description"),
      price: number("Price", {
        required: true,
        step: "0.01",
        max: 99999999.99,
        defaultValue: 0,
      }),
      salePrice: number("Sale price", { step: "0.01", max: 99999999.99 }),
      stock: number("Stock", { integer: true, max: 1000000, defaultValue: 0 }),
      thumbnailUrl: image("Thumbnail"),
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
      name: text("Category name", { required: true, minLength: 2 }),
      description: longText("Description"),
      sortOrder: number("Sort order", { integer: true, max: 9999, defaultValue: 0 }),
      status,
    },
  },
  menuitems: {
    label: "Menu items",
    singular: "Menu item",
    icon: ResourceIcons.menuitems,
    color: "#3e2723",
    fields: {
      categoryId: idNumber("Category ID"),
      name: text("Item name", { required: true, minLength: 2 }),
      description: longText("Description"),
      price: number("Price", {
        required: true,
        step: "0.01",
        max: 99999999.99,
        defaultValue: 0,
      }),
      imageUrl: image("Image"),
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

const FK_MAP = {
  classes: { classTeacherId: "teachers" },
  students: { classId: "classes" },
  doctors: { departmentId: "departments" },
  products: { categoryId: "productcategories" },
  menuitems: { categoryId: "menucategories" },
  rooms: { roomTypeId: "roomtypes" },
  bookings: { roomId: "rooms" },
  properties: { propertyTypeId: "propertytypes" },
  members: { planId: "membershipplans" },
  blogposts: { categoryId: "blogcategories", authorId: "employees" },
  comments: { postId: "blogposts" },
  projects: { categoryId: "projectcategories" },
  events: { eventTypeId: "eventtypes" },
  registrations: { eventId: "events" },
  donations: { causeId: "causes" },
  appointments: { serviceId: "services", therapistId: "employees" },
  attorneys: { practiceAreaId: "practiceareas" },
  caseinquiries: { practiceAreaId: "practiceareas" },
};

/* ------------------------------------------------------------------ */
/*  Date / time helpers                                                 */
/* ------------------------------------------------------------------ */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (part) => String(part).padStart(2, "0");

const toDateInput = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const toDateTimeInput = (dt) =>
  `${toDateInput(dt)}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

const todayStr = () => toDateInput(new Date());
const resolveBound = (bound) => (bound === "today" ? todayStr() : bound);

const isRealDate = (str) => {
  if (!DATE_RE.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

/* 2026-11-13 -> 13 Nov 2026 (string based, so there is no timezone shift) */
const formatDate = (value) => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const [, y, m, d] = match;
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

/* 2026-11-13 14:30:00 -> 13 Nov 2026, 02:30 PM */
const formatDateTime = (value) => {
  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return String(value);
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${pad(parsed.getDate())} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}, ${time}`;
};

/* ------------------------------------------------------------------ */
/*  Form helpers                                                        */
/* ------------------------------------------------------------------ */
const formatInputValue = (value, type) => {
  if (value === null || value === undefined) return "";
  if (type === "json") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
  if (type === "date") {
    if (value instanceof Date) return toDateInput(value);
    const str = String(value).trim();
    if (DATE_RE.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}[T ]/.test(str)) return str.slice(0, 10);
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? "" : toDateInput(parsed);
  }
  if (type === "datetime-local") {
    if (value instanceof Date) return toDateTimeInput(value);
    return String(value).replace(" ", "T").slice(0, 16);
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

const isValidImageUrl = (value) => {
  if (value.startsWith("/")) return true;
  // Existing records saved earlier may still hold an embedded image
  if (value.startsWith("data:image/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/* Single source of truth: returns an error message, or "" when valid */
const validateField = (spec, raw) => {
  const value = raw === undefined || raw === null ? "" : String(raw).trim();
  if (!value) return spec.required ? `${spec.label} is required.` : "";

  if (spec.minLength && value.length < spec.minLength) {
    return `${spec.label} must be at least ${spec.minLength} characters.`;
  }
  if (spec.maxLength && value.length > spec.maxLength) {
    return `${spec.label} must be at most ${spec.maxLength} characters.`;
  }

  switch (spec.type) {
    case "number": {
      const num = Number(value);
      if (!Number.isFinite(num)) return `${spec.label} must be a number.`;
      if (spec.integer && !Number.isInteger(num)) {
        return `${spec.label} must be a whole number.`;
      }
      if (spec.step === "0.01" && !/^-?\d+(\.\d{1,2})?$/.test(value)) {
        return `${spec.label} can have at most 2 decimal places.`;
      }
      if (spec.min !== undefined && num < spec.min) {
        return `${spec.label} must be at least ${spec.min}.`;
      }
      if (spec.max !== undefined && num > spec.max) {
        return `${spec.label} must be at most ${spec.max}.`;
      }
      return "";
    }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
        ? ""
        : `${spec.label} must be a valid email address.`;
    case "tel": {
      const digits = value.replace(/\D/g, "");
      return /^\+?[0-9\s\-().]+$/.test(value) && digits.length >= 7 && digits.length <= 15
        ? ""
        : `${spec.label} must be a valid phone number (7–15 digits).`;
    }
    case "date": {
      if (!isRealDate(value)) return `${spec.label} must be a valid date.`;
      const min = resolveBound(spec.min);
      const max = resolveBound(spec.max);
      if (min && value < min) return `${spec.label} cannot be before ${formatDate(min)}.`;
      if (max && value > max) return `${spec.label} cannot be after ${formatDate(max)}.`;
      return "";
    }
    case "datetime-local":
      return Number.isNaN(new Date(value).getTime())
        ? `${spec.label} must be a valid date and time.`
        : "";
    case "image":
      return isValidImageUrl(value)
        ? ""
        : `${spec.label} must be a valid http(s) URL or a path starting with "/".`;
    case "json":
      try {
        JSON.parse(value);
        return "";
      } catch {
        return `${spec.label} must be valid JSON.`;
      }
    case "select":
      return spec.options.some((o) => String(o.value) === value)
        ? ""
        : `Please choose a valid ${spec.label.toLowerCase()}.`;
    case "boolean":
      return value === "0" || value === "1" ? "" : `${spec.label} must be Yes or No.`;
    default:
      return "";
  }
};

/* Field rules + cross-field rules */
const validateForm = (form, config) => {
  const errors = {};
  for (const [name, spec] of Object.entries(config.fields)) {
    const message = validateField(spec, form[name]);
    if (message) errors[name] = message;
  }
  if (
    config.fields.salePrice &&
    !errors.salePrice &&
    !errors.price &&
    form.salePrice !== "" &&
    form.salePrice !== undefined &&
    Number(form.salePrice) > Number(form.price)
  ) {
    errors.salePrice = "Sale price cannot be higher than the price.";
  }
  return errors;
};

const makePayload = (form, config) => {
  const payload = {};
  for (const [name, spec] of Object.entries(config.fields)) {
    const raw = form[name];
    const message = validateField(spec, raw);
    if (message) throw new Error(message);

    if (raw === "" || raw === undefined || raw === null) {
      if (spec.nullable !== false) payload[name] = null;
      continue;
    }
    if (spec.type === "number") payload[name] = Number(raw);
    else if (spec.type === "boolean") payload[name] = Number(raw);
    else if (spec.type === "json") payload[name] = JSON.stringify(JSON.parse(raw));
    else if (spec.type === "datetime-local") payload[name] = `${raw.replace("T", " ")}:00`;
    else payload[name] = String(raw).trim();
  }
  return payload;
};

const formatCell = (value, spec) => {
  if (value === null || value === undefined || value === "") return "—";
  if (spec?.type === "date") return formatDate(value);
  if (spec?.type === "datetime-local") return formatDateTime(value);
  if (spec?.type === "number" && spec.step === "0.01" && Number.isFinite(Number(value))) {
    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/* ------------------------------------------------------------------ */
/*  Image URL field (no upload, URL only with live preview)             */
/* ------------------------------------------------------------------ */
function ImageUrlField({ spec, value, onChange, onBlur, error }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [value]);

  return (
    <Box
      sx={{
        gridColumn: { xs: "auto", sm: "1 / -1" },
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          bgcolor: "action.hover",
          flexShrink: 0,
        }}
      >
        {value && !broken && !error ? (
          <Box
            component="img"
            src={value}
            alt={spec.label}
            onError={() => setBroken(true)}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ImageIcon sx={{ fontSize: 32, color: "text.disabled" }} />
        )}
      </Box>
      <TextField
        label={`${spec.label} URL`}
        value={value.startsWith("data:") ? "(embedded image)" : value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        fullWidth
        placeholder="https://example.com/image.jpg"
        error={Boolean(error) || (Boolean(value) && broken)}
        helperText={
          error || (value && broken ? "This image could not be loaded." : undefined)
        }
        slotProps={{
          htmlInput: { readOnly: value.startsWith("data:") },
          input: {
            endAdornment: value ? (
              <Button size="small" onClick={() => onChange("")} sx={{ textTransform: "none" }}>
                Clear
              </Button>
            ) : null,
          },
        }}
      />
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SiteAdminData() {
  const theme = useTheme();
  const { baseUrl, authConfig } = useOutletContext();

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [fkOptions, setFkOptions] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const config = RESOURCE_CONFIG[selectedResource];
  const resourceColor = config?.color || theme.palette.primary.main;
  const resourceUrl = `${baseUrl}/data/${selectedResource}`;
  const fkMap = FK_MAP[selectedResource] || {};

  /* ---------------- FK options ---------------- */
  const fetchFkOptions = useCallback(async () => {
    if (!config) return;
    const newOptions = {};
    for (const name of Object.keys(config.fields)) {
      const fk = FK_MAP[selectedResource]?.[name];
      if (fk) {
        try {
          const { data } = await axios.get(`${baseUrl}/data/${fk}`, authConfig);
          newOptions[name] = Array.isArray(data) ? data : [];
        } catch (e) {
          if (e.response?.status !== 404) {
            console.error(`Failed to load FK options for ${name}`, e);
          }
          newOptions[name] = [];
        }
      }
    }
    setFkOptions(newOptions);
  }, [config, selectedResource, baseUrl, authConfig]);

  useEffect(() => {
    fetchFkOptions();
  }, [fetchFkOptions]);

  /* ---------------- Resources list ---------------- */
  const availableResources = useMemo(
    () =>
      [...resources].sort((a, b) => {
        const aIndex = RESOURCE_ORDER.indexOf(a);
        const bIndex = RESOURCE_ORDER.indexOf(b);
        return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
      }),
    [resources],
  );

  /* ---------------- Visible rows ---------------- */
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => formatCell(value).toLowerCase().includes(query)),
    );
  }, [rows, search]);

  /* ---------------- Columns ---------------- */
  const selectedColumns = useMemo(() => {
    if (!config) return [];
    return Object.keys(config.fields).filter((name) => !hiddenColumns.includes(name));
  }, [config, hiddenColumns]);

  const toggleColumn = (name) => {
    setHiddenColumns((current) =>
      current.includes(name) ? current.filter((c) => c !== name) : [...current, name],
    );
  };

  /* ---------------- Fetch rows ---------------- */
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

  /* ---------------- Load resource list on mount ---------------- */
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
          setError(
            requestError.response?.data?.message ||
              "Could not load this site's data resources.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadResources();
    return () => {
      cancelled = true;
    };
  }, [authConfig, baseUrl]);

  /* ---------------- Fetch rows when resource changes ---------------- */
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  /* ---------------- Dialog actions ---------------- */
  const openNewRecord = () => {
    if (!config) return;
    setEditingRecord(null);
    setForm(createEmptyForm(config));
    setFieldErrors({});
    setError("");
    setNotice("");
    setDialogOpen(true);
  };

  const openEditRecord = (record) => {
    setEditingRecord(record);
    setForm(formFromRecord(record, config));
    setFieldErrors({});
    setError("");
    setNotice("");
    setDialogOpen(true);
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    if (!config) return;

    const errors = validateForm(form, config);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});
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
      setNotice(
        editingRecord ? `${config.label} record updated.` : `${config.label} record created.`,
      );
    } catch (requestError) {
      const serverErrors = requestError.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        const mapped = {};
        for (const [key, value] of Object.entries(serverErrors)) {
          mapped[key] = Array.isArray(value) ? value.join(", ") : String(value);
        }
        setFieldErrors(mapped);
      }
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not save this record.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    const label =
      record.name || record.title || `${config?.label || "record"} #${record.id}`;
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

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const validateOnBlur = (name, spec) => {
    const message = validateField(spec, form[name]);
    setFieldErrors((current) => {
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  /* ---------------- Form field renderer ---------------- */
  const renderFormField = ([name, spec]) => {
    const isFk = Boolean(fkMap[name]);
    const isSelect = spec.type === "select" || spec.type === "boolean" || isFk;
    const multiline = spec.type === "textarea" || spec.type === "json";
    const errorText = fieldErrors[name];

    if (spec.type === "image") {
      return (
        <ImageUrlField
          key={name}
          spec={spec}
          value={form[name] ?? ""}
          onChange={(value) => updateForm(name, value)}
          onBlur={() => validateOnBlur(name, spec)}
          error={errorText}
        />
      );
    }

    const inputType = isSelect
      ? undefined
      : ["date", "email", "tel", "number", "datetime-local"].includes(spec.type)
        ? spec.type
        : "text";

    const htmlInput = {};
    if (spec.maxLength) htmlInput.maxLength = spec.maxLength;
    if (spec.type === "number") {
      htmlInput.step = spec.step || (spec.integer ? "1" : "any");
      if (spec.min !== undefined) htmlInput.min = spec.min;
      if (spec.max !== undefined) htmlInput.max = spec.max;
    }
    if (spec.type === "date") {
      if (spec.min) htmlInput.min = resolveBound(spec.min);
      if (spec.max) htmlInput.max = resolveBound(spec.max);
    }

    const placeholder =
      spec.type === "email"
        ? "name@example.com"
        : spec.type === "tel"
          ? "+91 98765 43210"
          : undefined;

    const hint =
      errorText ||
      (spec.type === "json"
        ? "Enter a valid JSON value."
        : spec.type === "date"
          ? "Pick a date from the calendar."
          : isFk
            ? "Select a related record"
            : undefined);

    return (
      <TextField
        key={name}
        label={spec.label}
        value={form[name] ?? ""}
        onChange={(e) => updateForm(name, e.target.value)}
        onBlur={() => validateOnBlur(name, spec)}
        type={inputType}
        required={Boolean(spec.required)}
        select={isSelect}
        multiline={multiline}
        minRows={multiline ? spec.rows : undefined}
        fullWidth
        placeholder={placeholder}
        error={Boolean(errorText)}
        helperText={hint}
        slotProps={{
          inputLabel: ["date", "datetime-local"].includes(spec.type)
            ? { shrink: true }
            : undefined,
          htmlInput,
        }}
        sx={multiline ? { gridColumn: { xs: "auto", sm: "1 / -1" } } : undefined}
      >
        {spec.type === "boolean" && [
          <MenuItem key="0" value="0">
            No
          </MenuItem>,
          <MenuItem key="1" value="1">
            Yes
          </MenuItem>,
        ]}
        {spec.type === "select" &&
          spec.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        {isFk && (
          <MenuItem key="clear" value="">
            None
          </MenuItem>
        )}
        {isFk &&
          (fkOptions[name] || []).map((option) => (
            <MenuItem key={option.id} value={String(option.id)}>
              {option.name || option.title || option.id}
            </MenuItem>
          ))}
      </TextField>
    );
  };

  /* ---------------- Loading state ---------------- */
  if (loading && !config) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Page header */}
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

      {/* Resource selector */}
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
                setHiddenColumns([]);
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
                  {visibleRows.length} of {rows.length} record
                  {rows.length === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
                    color="primary"
                    aria-label="Toggle view mode"
                  >
                    {viewMode === "table" ? <GridViewIcon /> : <ViewListIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Column visibility">
                  <IconButton
                    onClick={() => {
                      setHiddenColumns((current) =>
                        current.length ? [] : Object.keys(config.fields),
                      );
                    }}
                    color={hiddenColumns.length ? "default" : "primary"}
                    aria-label="Column visibility"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Column visibility chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {Object.entries(config.fields).map(([name, spec]) => {
                const hidden = hiddenColumns.includes(name);
                return (
                  <Chip
                    key={name}
                    label={spec.label}
                    size="small"
                    variant={hidden ? "outlined" : "filled"}
                    color={hidden ? "default" : "primary"}
                    onClick={() => toggleColumn(name)}
                    sx={{ mb: 1 }}
                  />
                );
              })}
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
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ maxWidth: 360, mx: "auto" }}
                >
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
              <TableContainer
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
              >
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(resourceColor, 0.04) }}>
                      {selectedColumns.map((column) => (
                        <TableCell
                          key={column}
                          sx={{ fontWeight: 700, whiteSpace: "nowrap", maxWidth: 280 }}
                        >
                          {config?.fields[column]?.label || column}
                        </TableCell>
                      ))}
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 100 }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.map((row) => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 } }}
                      >
                        {selectedColumns.map((column) => {
                          const spec = config.fields[column];
                          const value = row[column];

                          // Image thumbnails in table
                          if (spec?.type === "image" && value) {
                            return (
                              <TableCell key={column} sx={{ maxWidth: 280 }}>
                                <Avatar
                                  src={value}
                                  variant="rounded"
                                  sx={{ width: 40, height: 40 }}
                                >
                                  <ImageIcon fontSize="small" />
                                </Avatar>
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={column} sx={{ maxWidth: 280 }}>
                              {column === "status" ? (
                                <Chip
                                  size="small"
                                  label={formatCell(value, spec)}
                                  color={value === "active" ? "success" : "default"}
                                  variant="outlined"
                                />
                              ) : column === "isVeg" || column === "isSpecial" ? (
                                <Chip
                                  size="small"
                                  label={value ? "Yes" : "No"}
                                  color={value ? "success" : "default"}
                                  variant="outlined"
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  noWrap
                                  title={formatCell(value, spec)}
                                >
                                  {formatCell(value, spec)}
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
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
              /* Card view */
              <Grid container spacing={2}>
                {visibleRows.map((row) => (
                  <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          sx={{ mb: 1.5 }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {config.fields.photoUrl && row.photoUrl && (
                              <Avatar src={row.photoUrl} sx={{ width: 40, height: 40 }} />
                            )}
                            {config.fields.thumbnailUrl && row.thumbnailUrl && (
                              <Avatar
                                src={row.thumbnailUrl}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                              />
                            )}
                            {config.fields.imageUrl && row.imageUrl && (
                              <Avatar
                                src={row.imageUrl}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                              />
                            )}
                            <Typography variant="subtitle1" fontWeight={700} noWrap>
                              {row.name || row.title || row.admissionNo || `#${row.id}`}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5}>
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
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        {selectedColumns.map((column) => {
                          const spec = config.fields[column];
                          // Image fields are already shown as avatars
                          if (spec?.type === "image" && row[column]) return null;
                          return (
                            <Box component="div" key={column} sx={{ mb: 0.75 }}>
                              <Typography
                                color="text.secondary"
                                variant="caption"
                                component="div"
                              >
                                {spec.label}
                              </Typography>
                              <Typography variant="body2" fontWeight={500} component="div">
                                {column === "status" ? (
                                  <Chip
                                    size="small"
                                    label={formatCell(row[column], spec)}
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
                                  formatCell(row[column], spec)
                                )}
                              </Typography>
                            </Box>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* Add/Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={saveRecord} noValidate>
          <DialogTitle fontWeight={800} sx={{ px: 3, py: 2 }}>
            {editingRecord ? "Edit" : "Add"} {config?.singular}
          </DialogTitle>
          <DialogContent dividers sx={{ maxHeight: "70vh" }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, mx: 3, mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                p: 3,
              }}
            >
              {config && Object.entries(config.fields).map(renderFormField)}
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