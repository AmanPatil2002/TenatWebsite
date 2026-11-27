import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { useTablePermissions } from "../hooks/useTablePermissions";
import { getTablePermission } from "../config/readOnlyTables";
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
  FormHelperText,
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
  TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import ImageIcon from "@mui/icons-material/Image";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

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
  agriculture: (p) => (
    <SvgIcon {...p}>
      <path d="M3 11h18M3 15h18M12 3v18" />
      <path d="M12 3l9 9-9 9-9-9 9-9Z" />
    </SvgIcon>
  ),
  blogcategories: (p) => (
    <SvgIcon {...p}>
      <path d="M4 4h16v16H4Z" />
      <path d="M4 8h16M4 12h16M4 16h16" />
    </SvgIcon>
  ),
  blogposts: (p) => (
    <SvgIcon {...p}>
      <path d="M4 2h16v20H4Z" />
      <path d="M8 6h8M8 10h8M8 14h6" />
    </SvgIcon>
  ),
  causes: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </SvgIcon>
  ),
  donations: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </SvgIcon>
  ),
  volunteers: (p) => (
    <SvgIcon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
    </SvgIcon>
  ),
  branches: (p) => (
    <SvgIcon {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M9 22V12h6v10" />
    </SvgIcon>
  ),
  financeproducts: (p) => (
    <SvgIcon {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M7 15h0M12 15h0M17 15h0" />
    </SvgIcon>
  ),
  financeapplications: (p) => (
    <SvgIcon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </SvgIcon>
  ),
  gymclasses: (p) => (
    <SvgIcon {...p}>
      <path d="M6 18h12M6 14h12M6 10h12" />
      <circle cx="9" cy="5" r="2" />
      <circle cx="15" cy="5" r="2" />
    </SvgIcon>
  ),
  members: (p) => (
    <SvgIcon {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgIcon>
  ),
  membershipplans: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </SvgIcon>
  ),
  trainers: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </SvgIcon>
  ),
  salonservices: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2v20M2 12h20" />
    </SvgIcon>
  ),
  stylists: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </SvgIcon>
  ),
  salonbookings: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </SvgIcon>
  ),
  salonpackages: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </SvgIcon>
  ),
  marketingservices: (p) => (
    <SvgIcon {...p}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </SvgIcon>
  ),
  casestudies: (p) => (
    <SvgIcon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </SvgIcon>
  ),
  leads: (p) => (
    <SvgIcon {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgIcon>
  ),
  practiceareas: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2v20M2 12h20" />
    </SvgIcon>
  ),
  attorneys: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </SvgIcon>
  ),
  caseinquiries: (p) => (
    <SvgIcon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
    </SvgIcon>
  ),
  consultations: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </SvgIcon>
  ),
  casedocuments: (p) => (
    <SvgIcon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
    </SvgIcon>
  ),
  propertytypes: (p) => (
    <SvgIcon {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M9 22V12h6v10" />
    </SvgIcon>
  ),
  properties: (p) => (
    <SvgIcon {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M9 22V12h6v10" />
    </SvgIcon>
  ),
  agents: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </SvgIcon>
  ),
  roomtypes: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </SvgIcon>
  ),
  rooms: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </SvgIcon>
  ),
  bookings: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </SvgIcon>
  ),
  amenities: (p) => (
    <SvgIcon {...p}>
      <path d="M12 2v20M2 12h20" />
    </SvgIcon>
  ),
  registrations: (p) => (
    <SvgIcon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
    </SvgIcon>
  ),
  venues: (p) => (
    <SvgIcon {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M9 22V12h6v10" />
    </SvgIcon>
  ),
  events: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </SvgIcon>
  ),
  eventtypes: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </SvgIcon>
  ),
  tickettypes: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </SvgIcon>
  ),
  tickets: (p) => (
    <SvgIcon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
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
const text = (label, options = {}) =>
  field(label, "text", { maxLength: 255, ...options });
const number = (label, options = {}) =>
  field(label, "number", { min: 0, ...options });
const idNumber = (label, options = {}) =>
  number(label, { integer: true, min: 1, ...options });
const longText = (label, options = {}) =>
  field(label, "textarea", { rows: 4, maxLength: 2000, ...options });
const date = (label, options = {}) => field(label, "date", options);
const json = (label, options = {}) =>
  field(label, "json", { rows: 4, ...options });
const email = (label, options = {}) =>
  field(label, "email", { maxLength: 255, ...options });
const phone = (label, options = {}) =>
  field(label, "tel", { maxLength: 20, ...options });
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
      classId: idNumber("Class ID", { references: { table: "classes" } }),
      subjectId: idNumber("Subject ID", {
        references: { table: "subjects" },
        dependsOn: "classId",
      }),
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
      experienceYears: number("Experience in years", {
        integer: true,
        max: 60,
      }),
      consultationFee: number("Consultation fee", {
        step: "0.01",
        max: 1000000,
      }),
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
      sortOrder: number("Sort order", {
        integer: true,
        max: 9999,
        defaultValue: 0,
      }),
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

const humanize = (value) =>
  String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/* MySQL integer ranges: [signedMin, signedMax, unsignedMax] */
const INT_RANGES = {
  tinyint: [-128, 127, 255],
  smallint: [-32768, 32767, 65535],
  mediumint: [-8388608, 8388607, 16777215],
  int: [-2147483648, 2147483647, 4294967295],
  integer: [-2147483648, 2147483647, 4294967295],
};

/* Numeric columns that should never be negative (extend as needed) */
const NON_NEGATIVE_NAME =
  /(price|amount|fee|cost|total|stock|quantity|qty|capacity|duration|discount|salary|seats)/i;

const fieldFromSchema = (column) => {
  const { dataType, columnType, name } = column;
  const lowerType = String(dataType).toLowerCase();
  const typeDefinition = String(columnType).toLowerCase();
  const varcharLength = typeDefinition.match(/^(?:var)?char\((\d+)\)/);
  const integer = [
    "tinyint",
    "smallint",
    "mediumint",
    "int",
    "integer",
    "bigint",
    "year",
  ].includes(lowerType);
  const decimalScale = typeDefinition.match(
    /^(?:decimal|numeric)\(\d+,(\d+)\)/,
  );
  const base = {
    label: humanize(name),
    required: Boolean(column.required),
    nullable: Boolean(column.nullable),
    defaultValue: column.defaultValue,
    references: column.references,
  };

  if (lowerType === "enum") {
    return {
      ...base,
      type: "select",
      options: (column.enumValues || []).map((value) => ({
        value,
        label: humanize(value),
      })),
    };
  }
  if (lowerType === "json") return { ...base, type: "json", rows: 4 };
  if (lowerType === "date") return { ...base, type: "date" };
  if (lowerType === "datetime" || lowerType === "timestamp") {
    return { ...base, type: "datetime-local" };
  }
  if (lowerType === "time") return { ...base, type: "time" };
  if (lowerType === "tinyint" && /^tinyint\(1\)/.test(typeDefinition)) {
    return { ...base, type: "boolean" };
  }
  if (/email$/i.test(name)) {
    return {
      ...base,
      type: "email",
      maxLength: varcharLength ? Number(varcharLength[1]) : undefined,
    };
  }
  if (/(phone|mobile|telephone)$/i.test(name)) {
    return {
      ...base,
      type: "tel",
      maxLength: varcharLength ? Number(varcharLength[1]) : undefined,
    };
  }
  if (
    integer ||
    ["decimal", "numeric", "float", "double", "real"].includes(lowerType)
  ) {
    const unsigned = typeDefinition.includes("unsigned");
    const decimal = typeDefinition.match(
      /^(?:decimal|numeric)\((\d+)(?:,(\d+))?\)/,
    );
    const scale = decimal ? Number(decimal[2] ?? 0) : undefined;
    const whole = integer || scale === 0;

    let min = unsigned ? 0 : undefined;
    let max;

    if (INT_RANGES[lowerType]) {
      const [signedMin, signedMax, unsignedMax] = INT_RANGES[lowerType];
      min = unsigned ? 0 : signedMin;
      max = unsigned ? unsignedMax : signedMax;
    } else if (lowerType === "year") {
      min = 1901;
      max = 2155;
    } else if (decimal) {
      const wholeDigits = Number(decimal[1]) - scale;
      max = Number(
        `${"9".repeat(wholeDigits) || "0"}${scale ? `.${"9".repeat(scale)}` : ""}`,
      );
      min = unsigned ? 0 : -max;
    }

    if (
      (min === undefined || min < 0) &&
      !/id$/i.test(name) &&
      NON_NEGATIVE_NAME.test(name)
    ) {
      min = 0;
    }

    return {
      ...base,
      type: "number",
      integer: whole,
      bigint: lowerType === "bigint",
      scale,
      min,
      max,
      step: whole ? "1" : scale > 0 ? `0.${"0".repeat(scale - 1)}1` : "any",
    };
  }
  if (/(image|photo|thumbnail|poster|banner|cover|logo|icon)url$/i.test(name)) {
    return {
      ...base,
      type: "image",
      maxLength: varcharLength ? Number(varcharLength[300]) : undefined,
    };
  }
  return {
    ...base,
    type: ["text", "mediumtext", "longtext", "tinytext"].includes(lowerType)
      ? "textarea"
      : "text",
    rows: ["text", "mediumtext", "longtext", "tinytext"].includes(lowerType)
      ? 4
      : undefined,
    maxLength: varcharLength ? Number(varcharLength[1]) : undefined,
  };
};
const OPTIONAL_FIELDS = new Set([]);
const buildResourceConfig = (resource, schema, primaryColor) => {
  if (!schema) return null;
  const existing = RESOURCE_CONFIG[resource];
  const fields = Object.fromEntries(
    schema.columns
      .filter((column) => column.editable)
      .map((column) => {
        const configuredField = existing?.fields[column.name];
        const inferredField = fieldFromSchema(column);
        const spec = {
          ...inferredField,
          ...(configuredField || {}),
          label: configuredField?.label || inferredField.label,
          type:
            inferredField.type === "text" &&
            configuredField?.type === "select" &&
            configuredField.options
              ? "select"
              : inferredField.type,
          required: !OPTIONAL_FIELDS.has(column.name),
          nullable: column.nullable,
          defaultValue:
            column.defaultValue ?? configuredField?.defaultValue ?? null,
          references: column.references,
        };
        const noPast = NO_PAST_FIELDS[resource]?.includes(column.name);
        if (inferredField.integer !== undefined) {
          spec.integer = inferredField.integer;
          spec.bigint = inferredField.bigint;
          spec.step = inferredField.step;
        }
        if (inferredField.maxLength !== undefined) {
          spec.maxLength = inferredField.maxLength;
        }
        if (column.dataType === "enum") {
          spec.type = "select";
          spec.options = inferredField.options;
        }
        if (
          noPast &&
          (spec.type === "date" || spec.type === "datetime-local")
        ) {
          spec.min = spec.type === "date" ? "today" : "now";
        }
        return [column.name, spec];
      }),
  );
  const label = existing?.label || humanize(resource);

  return {
    label,
    singular: existing?.singular || label.replace(/s$/, ""),
    icon: existing?.icon || ResourceIcons[resource] || FieldIcon,
    color: existing?.color || primaryColor,
    fields,
  };
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
/* Scheduling columns that must not be set to a past date.
   Keyed by table base name. Tables not listed here (attendance, payments,
   dob, joinedOn, ...) keep accepting past dates. */
const NO_PAST_FIELDS = {
  exams: ["examDate"],
  appointments: ["appointmentDate"],
  petappointments: ["appointmentDate"],
  dentalappointments: ["appointmentDate"],
  reservations: ["reservationDate"],
  tablebookings: ["bookingDate"],
  salonbookings: ["bookingDate"],
  classbookings: ["bookingDate"],
  bookings: ["checkInDate", "checkOutDate"],
  propertyviewings: ["viewingDate"],
  consultations: ["consultationDate"],
  consultationrequests: ["preferredDate"],
  sitevisits: ["visitDate"],
  deliveries: ["scheduledDate"],
  tournaments: ["startDate"],
  proposals: ["validUntil"],
  events: ["startDateTime", "endDateTime"],
  eventshows: ["showDateTime"],
  matches: ["matchDate"],
  coupons: ["expiresAt"],
};

/* [dateColumn, timeColumn]: if the date is today, the time can't be over already */
const DATE_TIME_PAIRS = [
  ["examDate", "startTime"],
  ["appointmentDate", "appointmentTime"],
  ["reservationDate", "reservationTime"],
  ["bookingDate", "bookingTime"],
  ["consultationDate", "consultationTime"],
  ["viewingDate", "viewingTime"],
  ["visitDate", "visitTime"],
];
/* Start/end pairs: end must come AFTER start (or on/after when allowEqual).
   Applied automatically to any table that has both fields. */
const RANGE_RULES = [
  { start: "startTime", end: "endTime" }, // exams, availability, gymclasses, deliveryslots
  { start: "startDateTime", end: "endDateTime" }, // events
  { start: "startDate", end: "endDate", allowEqual: true }, // causes, tournaments, engagements, enrollments
  { start: "checkInDate", end: "checkOutDate" }, // hotel bookings (checkout must be after check-in)
  { start: "checkIn", end: "checkOut" }, // gym attendance
  { start: "joinDate", end: "expiryDate" }, // members
  { start: "periodStart", end: "periodEnd", allowEqual: true }, // member payments
  { start: "saleStartsAt", end: "saleEndsAt" }, // ticket types
  { start: "startsAt", end: "expiresAt" }, // coupons
  { start: "shippedAt", end: "deliveredAt" }, // shipments
];

/* start/end partner lookup, used to clear stale errors and set input min */
const RANGE_PARTNER = {};
RANGE_RULES.forEach(({ start, end }) => {
  RANGE_PARTNER[start] = end;
  RANGE_PARTNER[end] = start;
});
/* ------------------------------------------------------------------ */
/*  Image upload constants                                              */
/* ------------------------------------------------------------------ */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_FIELD_NAME = "image";

/* Resolve an image URL relative to the asset origin (backend upload prefix) */
const resolveImage = (url, assetOrigin) => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const origin = String(assetOrigin || "").replace(/\/+$/, "");
  const path = url.replace(/\\/g, "/");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
};

/* ------------------------------------------------------------------ */
/*  Date / time helpers                                                 */
/* ------------------------------------------------------------------ */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (part) => String(part).padStart(2, "0");

const toDateInput = (dt) =>
  `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const toDateTimeInput = (dt) =>
  `${toDateInput(dt)}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

const todayStr = () => toDateInput(new Date());
const resolveBound = (bound) => (bound === "today" ? todayStr() : bound);

const isRealDate = (str) => {
  if (!DATE_RE.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
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
  if (type === "time") return String(value).slice(0, 5);
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
const validateField = (spec, raw, original) => {
  const value = raw === undefined || raw === null ? "" : String(raw).trim();
  const unchanged =
    original !== undefined &&
    original !== null &&
    String(original).trim() === value;
  if (!value) return spec.required ? `${spec.label} is required.` : "";

  if (spec.minLength && value.length < spec.minLength) {
    return `${spec.label} must be at least ${spec.minLength} characters.`;
  }
  if (spec.maxLength && value.length > spec.maxLength) {
    return `${spec.label} must be at most ${spec.maxLength} characters.`;
  }

  switch (spec.type) {
    case "number": {
      if (!/^-?\d+(\.\d+)?$/.test(value))
        return `${spec.label} must be a number.`;
      if (spec.integer && !/^-?\d+$/.test(value)) {
        return `${spec.label} must be a whole number.`;
      }
      const num = Number(value);
      if (!Number.isFinite(num)) return `${spec.label} must be a number.`;

      const scale = spec.scale ?? (spec.step === "0.01" ? 2 : undefined);
      if (scale !== undefined && (value.split(".")[1] || "").length > scale) {
        return `${spec.label} can have at most ${scale} decimal place${scale === 1 ? "" : "s"}.`;
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
      if (!/^\+?[\d\s\-()]+$/.test(value))
        return `${spec.label} can only contain digits, spaces, +, - and brackets.`;
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15
        ? ""
        : `${spec.label} must be a valid phone number (7–15 digits).`;
    }
    case "date": {
      if (!isRealDate(value)) return `${spec.label} must be a valid date.`;
      const min = resolveBound(spec.min);
      const max = resolveBound(spec.max);
      if (min && value < min) {
        if (spec.min === "today") {
          if (!unchanged) return `${spec.label} cannot be in the past.`;
        } else {
          return `${spec.label} cannot be before ${formatDate(min)}.`;
        }
      }
      if (max && value > max)
        return `${spec.label} cannot be after ${formatDate(max)}.`;
      return "";
    }
    case "datetime-local": {
      if (Number.isNaN(new Date(value).getTime()))
        return `${spec.label} must be a valid date and time.`;
      if (
        spec.min === "now" &&
        !unchanged &&
        value < toDateTimeInput(new Date())
      ) {
        return `${spec.label} cannot be in the past.`;
      }
      return "";
    }
    case "time":
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
        ? ""
        : `${spec.label} must be a valid time.`;
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
      return value === "0" || value === "1"
        ? ""
        : `${spec.label} must be Yes or No.`;
    default:
      return "";
  }
};

/* Field rules + cross-field rules */
const validateForm = (form, config, original) => {
  const errors = {};
  for (const [name, spec] of Object.entries(config.fields)) {
    const message = validateField(spec, form[name], original?.[name]);
    if (message) errors[name] = message;
  }
  for (const { start, end, allowEqual } of RANGE_RULES) {
    const startSpec = config.fields[start];
    const endSpec = config.fields[end];
    if (!startSpec || !endSpec) continue;
    if (errors[start] || errors[end]) continue;
    const s = form[start];
    const e = form[end];
    if (!s || !e) continue;

    const bad = allowEqual ? e < s : e <= s;
    if (bad) {
      errors[end] = allowEqual
        ? `${endSpec.label} cannot be before ${startSpec.label.toLowerCase()}.`
        : `${endSpec.label} must be after ${startSpec.label.toLowerCase()}.`;
    }
  }
  const now = new Date();
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  for (const [dateKey, timeKey] of DATE_TIME_PAIRS) {
    if (config.fields[dateKey]?.min !== "today" || !config.fields[timeKey])
      continue;
    if (errors[dateKey] || errors[timeKey]) continue;
    if (form[dateKey] !== todayStr() || !form[timeKey]) continue;
    const untouched =
      original &&
      form[dateKey] === original[dateKey] &&
      form[timeKey] === original[timeKey];
    if (!untouched && form[timeKey] < nowTime) {
      errors[timeKey] =
        `${config.fields[timeKey].label} has already passed for today.`;
    }
  }
  return errors;
};

const makePayload = (form, config, original) => {
  const payload = {};
  for (const [name, spec] of Object.entries(config.fields)) {
    const raw = form[name];
    const message = validateField(spec, raw, original?.[name]);
    if (message) throw new Error(message);

    if (raw === "" || raw === undefined || raw === null) {
      if (spec.nullable !== false) payload[name] = null;
      continue;
    }
    if (spec.type === "number") {
      payload[name] =
        spec.bigint && spec.integer ? String(raw).trim() : Number(raw);
    } else if (spec.type === "boolean") payload[name] = Number(raw);
    else if (spec.type === "json")
      payload[name] = JSON.stringify(JSON.parse(raw));
    else if (spec.type === "datetime-local")
      payload[name] = `${raw.replace("T", " ")}:00`;
    else payload[name] = String(raw).trim();
  }
  return payload;
};

const formatCell = (value, spec) => {
  if (value === null || value === undefined || value === "") return "—";
  if (spec?.type === "date") return formatDate(value);
  if (spec?.type === "datetime-local") return formatDateTime(value);
  if (
    spec?.type === "number" &&
    spec.step === "0.01" &&
    Number.isFinite(Number(value))
  ) {
    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/* ------------------------------------------------------------------ */
/*  Image upload field (file upload with preview + replace)             */
/* ------------------------------------------------------------------ */
function ImageUploadField({
  spec,
  value,
  onChange,
  error,
  uploadUrl,
  authConfig,
  assetOrigin,
  onUploadingChange,
}) {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const notifyRef = useRef(onUploadingChange);
  notifyRef.current = onUploadingChange;

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      notifyRef.current?.(false); // never leave the form stuck in "uploading"
    };
  }, []);

  useEffect(() => {
    setBroken(false);
  }, [value]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPG, PNG, WEBP or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image must be 5 MB or smaller.");
      return;
    }

    setUploadError("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const body = new FormData();
      body.append(IMAGE_FIELD_NAME, file);
      const { data } = await axios.post(uploadUrl, body, {
        ...authConfig,
        headers: {
          ...authConfig?.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      const url = data?.url || data?.imageUrl || data?.path;
      if (!url)
        throw new Error("Upload succeeded but no image URL was returned.");
      if (mountedRef.current) onChange(url);
    } catch (err) {
      if (mountedRef.current) {
        setUploadError(
          err.response?.data?.message ||
            err.message ||
            "Could not upload the image.",
        );
      }
    } finally {
      if (mountedRef.current) setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const message =
    uploadError ||
    error ||
    (value && broken ? "This image could not be loaded." : "");

  return (
    <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
        {spec.label}
        {spec.required ? " *" : ""}
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={handleFileChange}
      />

      {value ? (
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${message ? theme.palette.error.main : theme.palette.divider}`,
            bgcolor: "action.hover",
            height: 200,
            display: "grid",
            placeItems: "center",
          }}
        >
          {broken ? (
            <ImageIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          ) : (
            <Box
              component="img"
              src={resolveImage(value, assetOrigin)}
              alt={`${spec.label} preview`}
              onError={() => setBroken(true)}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={{ position: "absolute", bottom: 8, right: 8 }}
          >
            <Button
              size="small"
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              startIcon={
                uploading ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <CloudUploadIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
            >
              {uploading ? "Uploading…" : "Replace"}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => {
                setUploadError("");
                onChange("");
              }}
              disabled={uploading}
              startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
            >
              Remove
            </Button>
          </Stack>
        </Box>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          color={message ? "error" : "primary"}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          sx={{
            py: 4,
            borderRadius: 2,
            borderStyle: "dashed",
            flexDirection: "column",
            gap: 0.75,
            textTransform: "none",
            fontWeight: 600,
            color: "text.secondary",
            "&:hover": {
              borderStyle: "dashed",
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            {uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          </Box>
          <span>
            {uploading ? "Uploading…" : `Upload ${spec.label.toLowerCase()}`}
          </span>
          <Typography variant="caption" color="text.secondary" fontWeight={400}>
            JPG, PNG, WEBP or GIF · max 5 MB
          </Typography>
        </Button>
      )}

      {message && (
        <FormHelperText error sx={{ mx: 1.75, mt: 0.5 }}>
          {message}
        </FormHelperText>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SiteAdminData() {
  const theme = useTheme();
  const { baseUrl, authConfig, site } = useOutletContext();
  const { tableName } = useParams();

  // Support multiple possible property names for vertical/packKey
  const vertical =
    site?.packKey || site?.vertical || site?.pack || site?.type || "";

  const [resources, setResources] = useState([]);
  const [resourceSchemas, setResourceSchemas] = useState({});
  const [selectedResource, setSelectedResource] = useState(tableName || "");
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

  // New state for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (tableName) {
      setSelectedResource(tableName);
    }
  }, [tableName]);

  // Reset pagination when resource changes
  useEffect(() => {
    setPage(0);
  }, [selectedResource]);

  const resourceConfigs = useMemo(
    () =>
      Object.fromEntries(
        resources.map((resource) => [
          resource,
          buildResourceConfig(
            resource,
            resourceSchemas[resource],
            theme.palette.primary.main,
          ),
        ]),
      ),
    [resources, resourceSchemas, theme.palette.primary.main],
  );
  const config = resourceConfigs[selectedResource];
  const resourceColor = config?.color || theme.palette.primary.main;
  const resourceUrl = `${baseUrl}/data/${selectedResource}`;
  const assetOrigin = useMemo(() => {
    if (site?.assetOrigin) return site.assetOrigin;
    try {
      return new URL(baseUrl, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }, [site?.assetOrigin, baseUrl]);
  // Table permissions hook
  const tablePermissions = useTablePermissions(vertical, selectedResource);
  const originalForm = useMemo(
    () =>
      editingRecord && config
        ? formFromRecord(editingRecord, config)
        : undefined,
    [editingRecord, config],
  );
  /* ---------------- FK options ---------------- */
  const fetchFkOptions = useCallback(
    async (parentValues = {}) => {
      if (!config) return;
      const newOptions = {};
      for (const [name, spec] of Object.entries(config.fields)) {
        const fk = spec.references?.table;
        if (fk) {
          const dependsOn = spec.dependsOn;
          const url =
            dependsOn && parentValues[dependsOn] !== undefined
              ? `${baseUrl}/data/${fk}?dependsOn=${dependsOn}&dependsOnValue=${encodeURIComponent(
                  parentValues[dependsOn],
                )}`
              : `${baseUrl}/data/${fk}`;
          try {
            const { data } = await axios.get(url, authConfig);
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
    },
    [config, baseUrl, authConfig],
  );

  useEffect(() => {
    fetchFkOptions();
  }, [fetchFkOptions]);

  /* Re-fetch FK options whose parent field changed.
     Example: subjectId options depend on the selected classId. */
  useEffect(() => {
    if (!config) return;
    const parentValues = {};
    for (const [name, spec] of Object.entries(config.fields)) {
      if (spec.dependsOn) {
        parentValues[name] = form[spec.dependsOn] ?? '';
      }
    }
    fetchFkOptions(parentValues);
  }, [config, fetchFkOptions, form]);

  /* Clear a dependent field when its parent value changes. */
  useEffect(() => {
    if (!config || !editingRecord) return;
    for (const [name, spec] of Object.entries(config.fields)) {
      if (
        spec.dependsOn &&
        form[name] &&
        form[spec.dependsOn] !== editingRecord[spec.dependsOn]
      ) {
        setForm((current) => ({ ...current, [name]: '' }));
      }
    }
  }, [form, config, editingRecord]);

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
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        formatCell(value).toLowerCase().includes(query),
      ),
    );
  }, [rows, search]);

  // Paginated rows
  const visibleRows = useMemo(() => {
    return filteredRows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredRows, page, rowsPerPage]);

  const selectedColumns = useMemo(() => {
    if (!config) return [];
    return Object.keys(config.fields).filter(
      (name) => !hiddenColumns.includes(name),
    );
  }, [config, hiddenColumns]);

  const toggleColumn = (name) => {
    setHiddenColumns((current) =>
      current.includes(name)
        ? current.filter((c) => c !== name)
        : [...current, name],
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
      setError(
        requestError.response?.data?.message ||
          "Could not load this site's data.",
      );
    } finally {
      setLoading(false);
    }
  }, [authConfig, resourceUrl, selectedResource, config]);

  /* ---------------- Load resource list on mount ---------------- */
  useEffect(() => {
    let cancelled = false;
    const loadResources = async () => {
      try {
        const { data } = await axios.get(`${baseUrl}/data/schema`, authConfig);
        if (cancelled) return;
        const schemas =
          data?.resources && typeof data.resources === "object"
            ? data.resources
            : {};
        const knownResources = Object.entries(schemas)
          .filter(([name, schema]) => {
            if (getTablePermission(vertical, name) === "hidden") return false;
            return (
              !schema.isCommon &&
              Array.isArray(schema.columns) &&
              schema.columns.some((column) => column.editable)
            );
          })
          .map(([name]) => name);
        setResourceSchemas(schemas);
        setResources(knownResources);
        // Only auto-select if no tableName from route params
        if (!tableName && knownResources.length) {
          setSelectedResource(
            knownResources.find((name) => RESOURCE_ORDER.includes(name)) ||
              knownResources[0],
          );
        } else if (!tableName) {
          setSelectedResource("");
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
  }, [authConfig, baseUrl, tableName]);

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
    if (tablePermissions.isStatusOnly) {
      const statusField = tablePermissions.allowedStatusField;
      if (!statusField) return;
      setEditingRecord(record);
      setForm({
        [statusField]: formatInputValue(record[statusField], "select"),
      });
      setFieldErrors({});
      setError("");
      setNotice("");
      setDialogOpen(true);
      return;
    }
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

    const errors = tablePermissions.isStatusOnly
      ? (() => {
          const statusField = tablePermissions.allowedStatusField;
          const message = statusField
            ? validateField(config.fields[statusField], form[statusField])
            : "This table has no permitted status field.";
          return message ? { [statusField || "status"]: message } : {};
        })()
      : validateForm(form, config, originalForm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const count = Object.keys(errors).length;
      setError(
        `Please complete ${count} highlighted field${count === 1 ? "" : "s"} before saving.`,
      );
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});
    setNotice("");
    try {
      const payload = tablePermissions.isStatusOnly
        ? {
            [tablePermissions.allowedStatusField]:
              form[tablePermissions.allowedStatusField],
          }
        : makePayload(form, config, originalForm);

      if (editingRecord) {
        await axios.put(
          `${resourceUrl}/${editingRecord.id}`,
          payload,
          authConfig,
        );
      } else {
        await axios.post(resourceUrl, payload, authConfig);
      }
      await fetchRows();
      setDialogOpen(false);
      setNotice(
        editingRecord
          ? `${config.label} record updated.`
          : `${config.label} record created.`,
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
      record.name ||
      record.title ||
      `${config?.label || "record"} #${record.id}`;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeletingId(record.id);
    setError("");
    setNotice("");
    try {
      await axios.delete(`${resourceUrl}/${record.id}`, authConfig);
      setRows((current) => current.filter((row) => row.id !== record.id));
      setNotice("Record deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not delete this record.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    const partner = RANGE_PARTNER[name];
    if (fieldErrors[name] || (partner && fieldErrors[partner])) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        if (partner) delete next[partner];
        return next;
      });
    }
    // Clear dependent fields when their parent value changes.
    if (config) {
      const dependents = Object.entries(config.fields).filter(
        ([, spec]) => spec.dependsOn === name,
      );
      if (dependents.length) {
        setForm((current) => {
          let next = { ...current };
          for (const [depName] of dependents) {
            next = { ...next, [depName]: '' };
          }
          return next;
        });
      }
    }
  };

  const validateOnBlur = (name, spec) => {
    let message = validateField(spec, form[name], originalForm?.[name]);

    if (!message) {
      const rule = RANGE_RULES.find((r) => r.end === name);
      const startSpec = rule && config.fields[rule.start];
      const s = rule && form[rule.start];
      const e = form[name];
      if (startSpec && s && e && (rule.allowEqual ? e < s : e <= s)) {
        message = rule.allowEqual
          ? `${spec.label} cannot be before ${startSpec.label.toLowerCase()}.`
          : `${spec.label} must be after ${startSpec.label.toLowerCase()}.`;
      }
    }

    setFieldErrors((current) => {
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  /* ---------------- Form field renderer ---------------- */
  const renderFormField = ([name, spec]) => {
    const isFk = Boolean(spec.references);
    const isSelect = spec.type === "select" || spec.type === "boolean" || isFk;
    const multiline = spec.type === "textarea" || spec.type === "json";
    const errorText = fieldErrors[name];

    if (spec.type === "image") {
      return (
        <ImageUploadField
          key={name}
          spec={spec}
          value={form[name] ?? ""}
          onChange={(value) => updateForm(name, value)}
          error={errorText}
          uploadUrl={`${baseUrl}/data/${selectedResource}/upload`}
          authConfig={authConfig}
          assetOrigin={assetOrigin}
        />
      );
    }

    const inputType = isSelect
      ? undefined
      : ["date", "email", "tel", "number", "datetime-local", "time"].includes(
            spec.type,
          )
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
    if (spec.type === "datetime-local" && spec.min === "now") {
      htmlInput.min = toDateTimeInput(new Date());
    }
    const rangeRule = RANGE_RULES.find((r) => r.end === name);
    if (rangeRule && form[rangeRule.start]) {
      if (spec.type === "date" || spec.type === "datetime-local") {
        htmlInput.min = form[rangeRule.start];
      }
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
          ? spec.min === "today"
            ? "Past dates are not allowed."
            : "Pick a date from the calendar."
          : spec.type === "datetime-local" && spec.min === "now"
            ? "Past dates are not allowed."
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
        sx={
          multiline ? { gridColumn: { xs: "auto", sm: "1 / -1" } } : undefined
        }
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
        {isFk && spec.nullable && (
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
  const displayColumns = useMemo(() => {
    return selectedColumns;
  }, [selectedColumns]);

  /* ---------------- Loading/Unavailable states ---------------- */
  if (!site || !vertical) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loading && !config) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && !config) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
        <Alert severity="warning">
          This resource is unavailable, hidden, or not part of this site.
        </Alert>
      </Box>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Page header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mb: 0.5, alignItems: "center" }}
          >
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
                {config.label}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Manage the {config.label.toLowerCase()} stored for this site.
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {config && tablePermissions.canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNewRecord}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Add {config.singular}
            </Button>
          )}
          {config && tablePermissions.isReadOnly && (
            <Chip
              label="Read-only table"
              variant="outlined"
              size="small"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
          {config && tablePermissions.isStatusOnly && (
            <Chip
              label="Status-only table"
              variant="outlined"
              size="small"
              color="info"
              sx={{ fontWeight: 600 }}
            />
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

      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}
      >
        {config && (
          <Box sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                mb: 2,
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700} color={resourceColor}>
                  {config.label}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {filteredRows.length} total record
                  {filteredRows.length === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <TextField
                  size="small"
                  placeholder="Search records"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <SearchIcon color="action" sx={{ mr: 1 }} />
                      ),
                    },
                  }}
                  sx={{ minWidth: 240 }}
                />
                <Tooltip title="Toggle view">
                  <IconButton
                    onClick={() =>
                      setViewMode((prev) =>
                        prev === "table" ? "cards" : "table",
                      )
                    }
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
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
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
              <Box
                sx={{ display: "grid", placeItems: "center", minHeight: 240 }}
              >
                <CircularProgress />
              </Box>
            ) : !filteredRows.length ? (
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
                  {search
                    ? "No matching records"
                    : `No ${config.label.toLowerCase()} yet`}
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
                {!search && tablePermissions.canCreate && (
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
              <Box>
                <TableContainer
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    width: "100%",
                    mb: 1,
                  }}
                >
                  <Table size="small" sx={{ minWidth: "100%" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: resourceColor }}>
                        {displayColumns.map((column) => {
                          return (
                            <TableCell
                              key={column}
                              sx={{
                                fontWeight: 700,
                                color: "#000000",
                                whiteSpace: "nowrap",
                                px: 2,
                              }}
                            >
                              {config?.fields[column]?.label || column}
                            </TableCell>
                          );
                        })}
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            px: 2,
                            width: 100,
                            position: "sticky",
                            right: 0,
                            bgcolor: resourceColor,
                            zIndex: 1,
                          }}
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
                          {displayColumns.map((column) => {
                            const spec = config.fields[column];
                            const value = row[column];

                            // Image thumbnails in table
                            if (spec?.type === "image" && value) {
                              return (
                                <TableCell key={column} sx={{ px: 2 }}>
                                  <Avatar
                                    src={resolveImage(value, assetOrigin)}
                                    variant="rounded"
                                    sx={{ width: 40, height: 40 }}
                                  >
                                    <ImageIcon fontSize="small" />
                                  </Avatar>
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell key={column} sx={{ px: 2 }}>
                                {column === "status" ? (
                                  <Chip
                                    size="small"
                                    label={formatCell(value, spec)}
                                    color={
                                      value === "active" ? "success" : "default"
                                    }
                                    variant="outlined"
                                  />
                                ) : column === "isVeg" ||
                                  column === "isSpecial" ? (
                                  <Chip
                                    size="small"
                                    label={value ? "Yes" : "No"}
                                    color={value ? "success" : "default"}
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography
                                    variant="body2"
                                    noWrap={spec?.type !== "longText"}
                                    title={formatCell(value, spec)}
                                    sx={{ maxWidth: 200 }}
                                  >
                                    {formatCell(value, spec)}
                                  </Typography>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell
                            align="right"
                            sx={{
                              px: 2,
                              whiteSpace: "nowrap",
                              position: "sticky",
                              right: 0,
                              bgcolor: "background.paper",
                              zIndex: 1,
                            }}
                          >
                            {config && tablePermissions.canUpdate && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  aria-label={`Edit record ${row.id}`}
                                  onClick={() => openEditRecord(row)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {config && tablePermissions.canDelete && (
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
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(event, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                />
              </Box>
            ) : (
              /* Card view */
              <Grid container spacing={2}>
                {visibleRows.map((row) => (
                  <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{ height: "100%", borderRadius: 2 }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          sx={{
                            mb: 1.5,
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center" }}
                          >
                            {config.fields.photoUrl && row.photoUrl && (
                              <Avatar
                                src={resolveImage(row.photoUrl, assetOrigin)}
                                sx={{ width: 40, height: 40 }}
                              />
                            )}
                            {config.fields.thumbnailUrl && row.thumbnailUrl && (
                              <Avatar
                                src={resolveImage(row.thumbnailUrl, assetOrigin)}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                              />
                            )}
                            {config.fields.imageUrl && row.imageUrl && (
                              <Avatar
                                src={resolveImage(row.imageUrl, assetOrigin)}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                              />
                            )}
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              noWrap
                            >
                              {row.name ||
                                row.title ||
                                row.admissionNo ||
                                `#${row.id}`}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5}>
                            {config && tablePermissions.canUpdate && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  aria-label={`Edit record ${row.id}`}
                                  onClick={() => openEditRecord(row)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {config && tablePermissions.canDelete && (
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
                            )}
                          </Stack>
                        </Stack>
                        {selectedColumns.map((column) => {
                          const spec = config.fields[column];
                          // Image fields are already shown as avatars
                          if (spec?.type === "image" && row[column])
                            return null;
                          return (
                            <Box component="div" key={column} sx={{ mb: 0.75 }}>
                              <Typography
                                color="text.secondary"
                                variant="caption"
                                component="div"
                              >
                                {spec.label}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                component="div"
                              >
                                {column === "status" ? (
                                  <Chip
                                    size="small"
                                    label={formatCell(row[column], spec)}
                                    color={
                                      row[column] === "active"
                                        ? "success"
                                        : "default"
                                    }
                                    variant="outlined"
                                  />
                                ) : column === "isVeg" ||
                                  column === "isSpecial" ? (
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
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
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
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
                p: 3,
              }}
            >
              {config &&
                Object.entries(config.fields)
                  .filter(
                    ([name]) =>
                      !tablePermissions.isStatusOnly ||
                      name === tablePermissions.allowedStatusField,
                  )
                  .map(renderFormField)}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}
          >
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
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
