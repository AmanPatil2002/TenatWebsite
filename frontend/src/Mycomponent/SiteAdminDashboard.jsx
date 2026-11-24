import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  PieChart,
  BarChart,
} from "@mui/x-charts";

/* ------------------------------------------------------------------ */
/*  Resource metadata — mirrors RESOURCE_CONFIG in SiteAdminData       */
/*  Uses a structured categorical palette (validated for CVD safety)  */
/* ------------------------------------------------------------------ */

// Categorical palette - 8 validated hues for light & dark modes
// Slot order: blue, orange, aqua, yellow, magenta, green, violet, red
const CATEGORICAL_PALETTE = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

// Pack-color mapping: each pack gets a consistent hue from the categorical palette
const PACK_COLOR_MAP = {
  common: 0,      // blue
  ecommerce: 1,   // orange
  restaurant: 2,  // aqua
  hotel: 3,       // yellow
  realestate: 4,  // magenta
  gym: 5,         // green
  medical: 6,     // violet
  school: 7,      // red
  blog: 0,
  portfolio: 1,
  eventmanagement: 2,
  ngo: 3,
  spa: 4,
  lawfirm: 5,
  agriculture: 6,
  consulting: 7,
  petcare: 0,
  daycare: 1,
  dental: 2,
  mobileapps: 3,
  interiordesign: 4,
  music: 5,
  streaming: 6,
  gaming: 7,
  jewelry: 0,
  furniture: 1,
  grocery: 2,
  cafe: 3,
};

// Get color for a pack (light mode default, dark handled by MUI theme)
const getPackColor = (packKey) => {
  const slot = PACK_COLOR_MAP[packKey] ?? 0;
  return CATEGORICAL_PALETTE.light[slot];
};

// Generate resource colors consistently: each resource gets a shade from its pack's hue
const generateResourceColors = () => {
  const colors = {};
  const packTables = {
    common: ["headers", "pages", "news", "galleries", "slider", "employees"],
    ecommerce: ["productcategories", "products", "orders", "orderitems", "payments", "customers", "shipments", "productreviews", "wishlists"],
    restaurant: ["menucategories", "menuitems", "reservations", "orders", "orderitems", "reviews"],
    hotel: ["roomtypes", "rooms", "bookings", "invoices", "roominventory", "hotelreviews"],
    realestate: ["propertytypes", "properties", "agents", "propertyinquiries", "propertyviewings", "propertyfavorites"],
    gym: ["trainers", "membershipplans", "members", "classbookings", "memberpayments", "attendance"],
    medical: ["departments", "doctors", "appointments", "patients", "prescriptions", "doctoravailability"],
    school: ["teachers", "classes", "students", "attendance", "examresults", "feepayments"],
    blog: ["blogcategories", "blogposts", "comments"],
    portfolio: ["projectcategories", "projects", "testimonials"],
    eventmanagement: ["eventtypes", "events", "registrations", "tickets"],
    ngo: ["causes", "donations", "volunteers", "donationreceipts"],
    spa: ["servicecategories", "services", "appointments"],
    lawfirm: ["practiceareas", "attorneys", "caseinquiries", "consultations", "casedocuments"],
    agriculture: ["farmproducts", "farminquiries", "farmorders", "farmorderitems"],
    consulting: ["consultingservices", "consultants", "consultationrequests", "proposals", "engagements"],
    petcare: ["petservices", "veterinarians", "petappointments", "petrecords", "petpayments"],
    daycare: ["daycareprograms", "caregivers", "admissionenquiries", "enrollments", "daycarepayments"],
    dental: ["dentalservices", "dentists", "dentalappointments", "dentalpatients", "treatmentplans", "dentalpayments"],
    mobileapps: ["appcategories", "mobileapps", "appreviews", "downloads", "apppurchases"],
    interiordesign: ["designservices", "designprojects", "designinquiries", "sitevisits", "moodboards"],
    music: ["artists", "albums", "tracks", "eventshows"],
    streaming: ["genres", "movies", "subscriptionplans", "watchlist", "episodes", "subscriptions", "watchhistory"],
    gaming: ["gamecategories", "games", "teams", "tournaments", "players", "teamrosters", "matches", "matchresults"],
    jewelry: ["jewelrycategories", "jewelryproducts", "jewelryinquiries", "goldrates", "jewelryorders", "jewelryorderitems"],
    furniture: ["furniturecategories", "furnitureproducts", "customorders", "furnitureorders", "furnitureorderitems", "deliveries"],
    grocery: ["grocerycategories", "groceryproducts", "deliveryslots", "groceryorders", "groceryorderitems"],
    cafe: ["cafecategories", "cafeitems", "tablebookings", "cafeorders", "cafeorderitems"],
  };

  Object.entries(packTables).forEach(([pack, tables]) => {
    const baseColor = getPackColor(pack);
    // Generate lighter/darker variants for each table in the pack
    tables.forEach((table, index) => {
      // Use the base color with slight variations for distinction
      colors[table] = baseColor;
    });
  });

  return colors;
};

const RESOURCE_COLORS = generateResourceColors();

const RESOURCE_META = {
  // Common tables (all sites)
  headers: { label: "Headers", color: RESOURCE_COLORS.headers },
  pages: { label: "Pages", color: RESOURCE_COLORS.pages },
  news: { label: "News", color: RESOURCE_COLORS.news },
  galleries: { label: "Galleries", color: RESOURCE_COLORS.galleries },
  slider: { label: "Slider", color: RESOURCE_COLORS.slider },
  employees: { label: "Employees", color: RESOURCE_COLORS.employees },

  // School pack
  teachers: { label: "Teachers", color: RESOURCE_COLORS.teachers },
  classes: { label: "Classes", color: RESOURCE_COLORS.classes },
  students: { label: "Students", color: RESOURCE_COLORS.students },
  attendance: { label: "Attendance", color: RESOURCE_COLORS.attendance },
  examresults: { label: "Exam results", color: RESOURCE_COLORS.examresults },
  feepayments: { label: "Fee payments", color: RESOURCE_COLORS.feepayments },

  // Medical pack
  departments: { label: "Departments", color: RESOURCE_COLORS.departments },
  doctors: { label: "Doctors", color: RESOURCE_COLORS.doctors },
  appointments: { label: "Appointments", color: RESOURCE_COLORS.appointments },
  patients: { label: "Patients", color: RESOURCE_COLORS.patients },
  prescriptions: { label: "Prescriptions", color: RESOURCE_COLORS.prescriptions },
  doctoravailability: { label: "Doctor availability", color: RESOURCE_COLORS.doctoravailability },

  // E-commerce pack
  productcategories: { label: "Product categories", color: RESOURCE_COLORS.productcategories },
  products: { label: "Products", color: RESOURCE_COLORS.products },
  orders: { label: "Orders", color: RESOURCE_COLORS.orders },
  orderitems: { label: "Order items", color: RESOURCE_COLORS.orderitems },
  payments: { label: "Payments", color: RESOURCE_COLORS.payments },
  customers: { label: "Customers", color: RESOURCE_COLORS.customers },
  shipments: { label: "Shipments", color: RESOURCE_COLORS.shipments },
  productreviews: { label: "Product reviews", color: RESOURCE_COLORS.productreviews },
  wishlists: { label: "Wishlists", color: RESOURCE_COLORS.wishlists },

  // Restaurant pack
  menucategories: { label: "Menu categories", color: RESOURCE_COLORS.menucategories },
  menuitems: { label: "Menu items", color: RESOURCE_COLORS.menuitems },
  reservations: { label: "Reservations", color: RESOURCE_COLORS.reservations },
  reviews: { label: "Reviews", color: RESOURCE_COLORS.reviews },

  // Hotel pack
  roomtypes: { label: "Room types", color: RESOURCE_COLORS.roomtypes },
  rooms: { label: "Rooms", color: RESOURCE_COLORS.rooms },
  bookings: { label: "Bookings", color: RESOURCE_COLORS.bookings },
  invoices: { label: "Invoices", color: RESOURCE_COLORS.invoices },
  roominventory: { label: "Room inventory", color: RESOURCE_COLORS.roominventory },
  hotelreviews: { label: "Hotel reviews", color: RESOURCE_COLORS.hotelreviews },

  // Real Estate pack
  propertytypes: { label: "Property types", color: RESOURCE_COLORS.propertytypes },
  properties: { label: "Properties", color: RESOURCE_COLORS.properties },
  agents: { label: "Agents", color: RESOURCE_COLORS.agents },
  propertyinquiries: { label: "Property inquiries", color: RESOURCE_COLORS.propertyinquiries },
  propertyviewings: { label: "Property viewings", color: RESOURCE_COLORS.propertyviewings },
  propertyfavorites: { label: "Property favorites", color: RESOURCE_COLORS.propertyfavorites },

  // Gym pack
  trainers: { label: "Trainers", color: RESOURCE_COLORS.trainers },
  membershipplans: { label: "Membership plans", color: RESOURCE_COLORS.membershipplans },
  members: { label: "Members", color: RESOURCE_COLORS.members },
  classbookings: { label: "Class bookings", color: RESOURCE_COLORS.classbookings },
  memberpayments: { label: "Member payments", color: RESOURCE_COLORS.memberpayments },

  // Blog pack
  blogcategories: { label: "Blog categories", color: RESOURCE_COLORS.blogcategories },
  blogposts: { label: "Blog posts", color: RESOURCE_COLORS.blogposts },
  comments: { label: "Comments", color: RESOURCE_COLORS.comments },

  // Portfolio pack
  projectcategories: { label: "Project categories", color: RESOURCE_COLORS.projectcategories },
  projects: { label: "Projects", color: RESOURCE_COLORS.projects },
  testimonials: { label: "Testimonials", color: RESOURCE_COLORS.testimonials },

  // Event Management pack
  eventtypes: { label: "Event types", color: RESOURCE_COLORS.eventtypes },
  events: { label: "Events", color: RESOURCE_COLORS.events },
  registrations: { label: "Registrations", color: RESOURCE_COLORS.registrations },
  tickets: { label: "Tickets", color: RESOURCE_COLORS.tickets },

  // NGO pack
  causes: { label: "Causes", color: RESOURCE_COLORS.causes },
  donations: { label: "Donations", color: RESOURCE_COLORS.donations },
  volunteers: { label: "Volunteers", color: RESOURCE_COLORS.volunteers },
  donationreceipts: { label: "Donation receipts", color: RESOURCE_COLORS.donationreceipts },

  // Spa pack
  servicecategories: { label: "Service categories", color: RESOURCE_COLORS.servicecategories },
  services: { label: "Services", color: RESOURCE_COLORS.services },
  appointments: { label: "Appointments", color: RESOURCE_COLORS.appointments },

  // Law Firm pack
  practiceareas: { label: "Practice areas", color: RESOURCE_COLORS.practiceareas },
  attorneys: { label: "Attorneys", color: RESOURCE_COLORS.attorneys },
  caseinquiries: { label: "Case inquiries", color: RESOURCE_COLORS.caseinquiries },
  consultations: { label: "Consultations", color: RESOURCE_COLORS.consultations },
  casedocuments: { label: "Case documents", color: RESOURCE_COLORS.casedocuments },

  // Agriculture pack
  farmproducts: { label: "Farm products", color: RESOURCE_COLORS.farmproducts },
  farminquiries: { label: "Farm inquiries", color: RESOURCE_COLORS.farminquiries },
  farmorders: { label: "Farm orders", color: RESOURCE_COLORS.farmorders },
  farmorderitems: { label: "Farm order items", color: RESOURCE_COLORS.farmorderitems },

  // Consulting pack
  consultingservices: { label: "Consulting services", color: RESOURCE_COLORS.consultingservices },
  consultants: { label: "Consultants", color: RESOURCE_COLORS.consultants },
  consultationrequests: { label: "Consultation requests", color: RESOURCE_COLORS.consultationrequests },
  proposals: { label: "Proposals", color: RESOURCE_COLORS.proposals },
  engagements: { label: "Engagements", color: RESOURCE_COLORS.engagements },

  // Petcare pack
  petservices: { label: "Pet services", color: RESOURCE_COLORS.petservices },
  veterinarians: { label: "Veterinarians", color: RESOURCE_COLORS.veterinarians },
  petappointments: { label: "Pet appointments", color: RESOURCE_COLORS.petappointments },
  petrecords: { label: "Pet records", color: RESOURCE_COLORS.petrecords },
  petpayments: { label: "Pet payments", color: RESOURCE_COLORS.petpayments },

  // Daycare pack
  daycareprograms: { label: "Daycare programs", color: RESOURCE_COLORS.daycareprograms },
  caregivers: { label: "Caregivers", color: RESOURCE_COLORS.caregivers },
  admissionenquiries: { label: "Admission enquiries", color: RESOURCE_COLORS.admissionenquiries },
  enrollments: { label: "Enrollments", color: RESOURCE_COLORS.enrollments },
  daycarepayments: { label: "Daycare payments", color: RESOURCE_COLORS.daycarepayments },

  // Dental pack
  dentalservices: { label: "Dental services", color: RESOURCE_COLORS.dentalservices },
  dentists: { label: "Dentists", color: RESOURCE_COLORS.dentists },
  dentalappointments: { label: "Dental appointments", color: RESOURCE_COLORS.dentalappointments },
  dentalpatients: { label: "Dental patients", color: RESOURCE_COLORS.dentalpatients },
  treatmentplans: { label: "Treatment plans", color: RESOURCE_COLORS.treatmentplans },
  dentalpayments: { label: "Dental payments", color: RESOURCE_COLORS.dentalpayments },

  // Mobile Apps pack
  appcategories: { label: "App categories", color: RESOURCE_COLORS.appcategories },
  mobileapps: { label: "Mobile apps", color: RESOURCE_COLORS.mobileapps },
  appreviews: { label: "App reviews", color: RESOURCE_COLORS.appreviews },
  downloads: { label: "Downloads", color: RESOURCE_COLORS.downloads },
  apppurchases: { label: "App purchases", color: RESOURCE_COLORS.apppurchases },

  // Interior Design pack
  designservices: { label: "Design services", color: RESOURCE_COLORS.designservices },
  designprojects: { label: "Design projects", color: RESOURCE_COLORS.designprojects },
  designinquiries: { label: "Design inquiries", color: RESOURCE_COLORS.designinquiries },
  sitevisits: { label: "Site visits", color: RESOURCE_COLORS.sitevisits },
  moodboards: { label: "Mood boards", color: RESOURCE_COLORS.moodboards },

  // Music pack
  artists: { label: "Artists", color: RESOURCE_COLORS.artists },
  albums: { label: "Albums", color: RESOURCE_COLORS.albums },
  tracks: { label: "Tracks", color: RESOURCE_COLORS.tracks },
  eventshows: { label: "Event shows", color: RESOURCE_COLORS.eventshows },

  // Streaming pack
  genres: { label: "Genres", color: RESOURCE_COLORS.genres },
  movies: { label: "Movies", color: RESOURCE_COLORS.movies },
  subscriptionplans: { label: "Subscription plans", color: RESOURCE_COLORS.subscriptionplans },
  watchlist: { label: "Watchlist", color: RESOURCE_COLORS.watchlist },
  episodes: { label: "Episodes", color: RESOURCE_COLORS.episodes },
  subscriptions: { label: "Subscriptions", color: RESOURCE_COLORS.subscriptions },
  watchhistory: { label: "Watch history", color: RESOURCE_COLORS.watchhistory },

  // Gaming pack
  gamecategories: { label: "Game categories", color: RESOURCE_COLORS.gamecategories },
  games: { label: "Games", color: RESOURCE_COLORS.games },
  teams: { label: "Teams", color: RESOURCE_COLORS.teams },
  tournaments: { label: "Tournaments", color: RESOURCE_COLORS.tournaments },
  players: { label: "Players", color: RESOURCE_COLORS.players },
  teamrosters: { label: "Team rosters", color: RESOURCE_COLORS.teamrosters },
  matches: { label: "Matches", color: RESOURCE_COLORS.matches },
  matchresults: { label: "Match results", color: RESOURCE_COLORS.matchresults },

  // Jewelry pack
  jewelrycategories: { label: "Jewelry categories", color: RESOURCE_COLORS.jewelrycategories },
  jewelryproducts: { label: "Jewelry products", color: RESOURCE_COLORS.jewelryproducts },
  jewelryinquiries: { label: "Jewelry inquiries", color: RESOURCE_COLORS.jewelryinquiries },
  goldrates: { label: "Gold rates", color: RESOURCE_COLORS.goldrates },
  jewelryorders: { label: "Jewelry orders", color: RESOURCE_COLORS.jewelryorders },
  jewelryorderitems: { label: "Jewelry order items", color: RESOURCE_COLORS.jewelryorderitems },

  // Furniture pack
  furniturecategories: { label: "Furniture categories", color: RESOURCE_COLORS.furniturecategories },
  furnitureproducts: { label: "Furniture products", color: RESOURCE_COLORS.furnitureproducts },
  customorders: { label: "Custom orders", color: RESOURCE_COLORS.customorders },
  furnitureorders: { label: "Furniture orders", color: RESOURCE_COLORS.furnitureorders },
  furnitureorderitems: { label: "Furniture order items", color: RESOURCE_COLORS.furnitureorderitems },
  deliveries: { label: "Deliveries", color: RESOURCE_COLORS.deliveries },

  // Grocery pack
  grocerycategories: { label: "Grocery categories", color: RESOURCE_COLORS.grocerycategories },
  groceryproducts: { label: "Grocery products", color: RESOURCE_COLORS.groceryproducts },
  deliveryslots: { label: "Delivery slots", color: RESOURCE_COLORS.deliveryslots },
  groceryorders: { label: "Grocery orders", color: RESOURCE_COLORS.groceryorders },
  groceryorderitems: { label: "Grocery order items", color: RESOURCE_COLORS.groceryorderitems },

  // Cafe pack
  cafecategories: { label: "Cafe categories", color: RESOURCE_COLORS.cafecategories },
  cafeitems: { label: "Cafe items", color: RESOURCE_COLORS.cafeitems },
  tablebookings: { label: "Table bookings", color: RESOURCE_COLORS.tablebookings },
  cafeorders: { label: "Cafe orders", color: RESOURCE_COLORS.cafeorders },
  cafeorderitems: { label: "Cafe order items", color: RESOURCE_COLORS.cafeorderitems },
};

const RESOURCE_ORDER = [
  // Common
  "headers",
  "pages",
  "news",
  "galleries",
  "slider",
  "employees",
  // School
  "teachers",
  "classes",
  "students",
  // Medical
  "departments",
  "doctors",
  // E-commerce
  "productcategories",
  "products",
  // Restaurant
  "menucategories",
  "menuitems",
  "reservations",
  // Hotel
  "roomtypes",
  "rooms",
  "bookings",
  // Real Estate
  "propertytypes",
  "properties",
  "agents",
  // Gym
  "trainers",
  "membershipplans",
  "members",
  // Blog
  "blogcategories",
  "blogposts",
  "comments",
  // Portfolio
  "projectcategories",
  "projects",
  "testimonials",
  // Event Management
  "eventtypes",
  "events",
  "registrations",
  // NGO
  "causes",
  "donations",
  "volunteers",
  // Spa
  "servicecategories",
  "services",
  "appointments",
  // Law Firm
  "practiceareas",
  "attorneys",
  "caseinquiries",
  // Agriculture
  "farmproducts",
  "farminquiries",
  "farmorders",
  "farmorderitems",
  // Consulting
  "consultingservices",
  "consultants",
  "consultationrequests",
  "proposals",
  "engagements",
  // Petcare
  "petservices",
  "veterinarians",
  "petappointments",
  "petrecords",
  "petpayments",
  // Daycare
  "daycareprograms",
  "caregivers",
  "admissionenquiries",
  "enrollments",
  "daycarepayments",
  // Dental
  "dentalservices",
  "dentists",
  "dentalappointments",
  "dentalpatients",
  "treatmentplans",
  "dentalpayments",
  // Mobile Apps
  "appcategories",
  "mobileapps",
  "appreviews",
  "downloads",
  "apppurchases",
  // Interior Design
  "designservices",
  "designprojects",
  "designinquiries",
  "sitevisits",
  "moodboards",
  // Music
  "artists",
  "albums",
  "tracks",
  "eventshows",
  // Streaming
  "genres",
  "movies",
  "subscriptionplans",
  "watchlist",
  "episodes",
  "subscriptions",
  "watchhistory",
  // Gaming
  "gamecategories",
  "games",
  "teams",
  "tournaments",
  "players",
  "teamrosters",
  "matches",
  "matchresults",
  // Jewelry
  "jewelrycategories",
  "jewelryproducts",
  "jewelryinquiries",
  "goldrates",
  "jewelryorders",
  "jewelryorderitems",
  // Furniture
  "furniturecategories",
  "furnitureproducts",
  "customorders",
  "furnitureorders",
  "furnitureorderitems",
  "deliveries",
  // Grocery
  "grocerycategories",
  "groceryproducts",
  "deliveryslots",
  "groceryorders",
  "groceryorderitems",
  // Cafe
  "cafecategories",
  "cafeitems",
  "tablebookings",
  "cafeorders",
  "cafeorderitems",
];

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */
const SvgIcon = ({ children, size = 22, color = "currentColor" }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    sx={{
      width: size,
      height: size,
      display: "block",
      color,
      flexShrink: 0,
    }}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Box>
);

const PagesIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v6h6" />
    <path d="M8 13h8M8 17h5" />
  </SvgIcon>
);

const RefreshIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 4v5h-5" />
  </SvgIcon>
);

const CalendarIcon = (props) => (
  <SvgIcon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </SvgIcon>
);

const LayersIcon = (props) => (
  <SvgIcon {...props}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 18 9 5 9-5" />
  </SvgIcon>
);

const PaletteIcon = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);

const IdIcon = (props) => (
  <SvgIcon {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M14 10h5M14 14h5" />
  </SvgIcon>
);

const DatabaseIcon = (props) => (
  <SvgIcon {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </SvgIcon>
);

const ChartIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3-2-2-3 3" />
  </SvgIcon>
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
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

function SummaryCard({ title, value, caption, icon, accent }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        borderColor: alpha(accent, 0.25),
        background: `linear-gradient(180deg, ${alpha(accent, 0.06)} 0%, ${
          theme.palette.background.paper
        } 70%)`,
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(accent, 0.18)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              color="text.secondary"
              variant="body2"
              fontWeight={600}
              sx={{
                textTransform: "uppercase",
                letterSpacing: ".06em",
                fontSize: 11,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ mt: 1, lineHeight: 1.1 }}
            >
              {value}
            </Typography>
            <Typography
              color="text.secondary"
              variant="caption"
              component="div"
              sx={{ mt: 0.5 }}
            >
              {caption}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(accent, 0.12),
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailItem({ icon, label, value }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", minWidth: 0 }}
    >
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
/*  Chart Components                                                   */
/* ------------------------------------------------------------------ */

function DataDistributionDonut({ resources }) {
  const theme = useTheme();

  if (!resources.length) return null;

  // Prepare data for donut chart - use top 8 resources + "Other"
  const sorted = [...resources].sort((a, b) => b[1] - a[1]);
  const topResources = sorted.slice(0, 7);
  const otherCount = sorted.slice(7).reduce((sum, [, count]) => sum + count, 0);

  const chartData = topResources.map(([name, count]) => ({
    name: RESOURCE_META[name]?.label || name,
    value: count,
    color: RESOURCE_META[name]?.color || theme.palette.primary.main,
  }));

  if (otherCount > 0) {
    chartData.push({
      name: "Other",
      value: otherCount,
      color: theme.palette.grey[500],
    });
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mb: 2 }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
            }}
          >
            <ChartIcon size={18} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Data Distribution
          </Typography>
        </Stack>
        <PieChart
          height={320}
          series={[
            {
              data: chartData.map((item, index) => ({
                id: index,
                label: item.name,
                value: item.value,
                color: item.color,
              })),
              innerRadius: 70,
              cornerRadius: 4,
              paddingAngle: 2,
              arcLabel: ({ label, value }) => `${label}: ${value}`,
              arcLabelRadius: 90,
              arcLabelMinAngle: 36,
            },
          ]}
          margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
          slotProps={{
            legend: {
              direction: "horizontal",
              position: { vertical: "bottom", horizontal: "center" },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

function TopResourcesBarChart({ resources }) {
  const theme = useTheme();

  if (!resources.length) return null;

  // Top 10 resources by count
  const topResources = [...resources]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name: RESOURCE_META[name]?.label || name,
      value: count,
      color: RESOURCE_META[name]?.color || theme.palette.primary.main,
    }));

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mb: 2 }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
            }}
          >
            <ChartIcon size={18} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Top Resources
          </Typography>
        </Stack>
        <BarChart
          height={320}
          series={[
            {
              data: topResources.map((item) => item.value),
              label: "Records",
              color: theme.palette.success.main,
            },
          ]}
          xAxis={[
            {
              scaleType: "band",
              data: topResources.map((item) => item.name),
              tickLabelStyle: { fontSize: 11 },
            },
          ]}
          yAxis={[{ tickLabelStyle: { fontSize: 11 } }]}
          grid={{ horizontal: true }}
          hideLegend
          margin={{ top: 20, bottom: 60, left: 10, right: 20 }}
        />
      </CardContent>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SiteAdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    site,
    pages = [],
    siteError,
    reloadSite,
    baseUrl,
    authConfig,
    siteBasePath,
  } = useOutletContext();

  const [resourceCounts, setResourceCounts] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countsError, setCountsError] = useState("");

  /* -------------------- data fetchers -------------------- */

  const fetchResourceCounts = useCallback(
    async (signal) => {
      // 1. Discover which data tables exist for this site
      const { data } = await axios.get(`${baseUrl}/data`, {
        ...authConfig,
        signal,
      });
      const available = Array.isArray(data)
        ? data.filter((name) => RESOURCE_META[name])
        : [];

      // 2. Fetch each list in parallel (tolerate individual failures)
      const results = await Promise.allSettled(
        available.map((name) =>
          axios.get(`${baseUrl}/data/${name}`, {
            ...authConfig,
            signal,
          }),
        ),
      );

      if (signal?.aborted) return {};

      const counts = {};
      results.forEach((result, i) => {
        const name = available[i];
        if (result.status === "fulfilled") {
          const rows = result.value.data;
          counts[name] = Array.isArray(rows) ? rows.length : 0;
        } else {
          counts[name] = 0;
        }
      });
      return counts;
    },
    [authConfig, baseUrl],
  );

  /* -------------------- initial load -------------------- */
  useEffect(() => {
    const controller = new AbortController();

    fetchResourceCounts(controller.signal)
      .then((counts) => {
        if (!controller.signal.aborted) setResourceCounts(counts);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResourceCounts({});
          setCountsError(
            error.response?.data?.message || "Could not load site data counts.",
          );
        }
      });

    return () => controller.abort();
  }, [fetchResourceCounts]);

  // Only resources the admin has actually populated (count > 0),
  // sorted by RESOURCE_ORDER for a stable layout.
  const populatedResources = useMemo(() => {
    if (!resourceCounts) return [];
    return Object.entries(resourceCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => {
        const ai = RESOURCE_ORDER.indexOf(a[0]);
        const bi = RESOURCE_ORDER.indexOf(b[0]);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
  }, [resourceCounts]);

  const countsLoading = resourceCounts === null;
  const totalRecords = populatedResources.reduce(
    (sum, [, count]) => sum + count,
    0,
  );

  /* -------------------- refresh handler -------------------- */
  const refresh = async () => {
    setRefreshing(true);
    setCountsError("");
    try {
      const [, countsData] = await Promise.all([
        reloadSite(),
        fetchResourceCounts(),
      ]);
      setResourceCounts(countsData ?? {});
    } catch (error) {
      const msg =
        error.response?.data?.message || "Could not refresh dashboard.";
      setCountsError(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const goToData = () => navigate(`${siteBasePath}/data`);

  /* -------------------- render -------------------- */
  return (
    <Stack spacing={3}>
      {/* ---------- Page header ---------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Site dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Overview of{" "}
            <Box component="span" fontWeight={600} color="text.primary">
              {site?.siteName || "your site"}
            </Box>
            .
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={refresh}
          disabled={refreshing}
          startIcon={
            refreshing ? (
              <CircularProgress size={16} thickness={5} />
            ) : (
              <RefreshIcon size={18} />
            )
          }
          sx={{
            borderRadius: 2,
            alignSelf: { xs: "stretch", sm: "auto" },
            whiteSpace: "nowrap",
            minWidth: "fit-content",
          }}
        >
          Refresh
        </Button>
      </Stack>

      {siteError && <Alert severity="error">{siteError}</Alert>}
      {countsError && <Alert severity="error">{countsError}</Alert>}

      {/* ---------- KPI cards ---------- */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <SummaryCard
            title="Pages"
            value={pages.length}
            caption="Pages on this site"
            accent={theme.palette.primary.main}
            icon={<PagesIcon size={22} />}
          />
        </Grid>

        {/* Only show a Data KPI when the admin has actually added records */}
        {!countsLoading && populatedResources.length > 0 && (
          <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
            <SummaryCard
              title="Data records"
              value={totalRecords}
              caption={`Across ${populatedResources.length} table${
                populatedResources.length === 1 ? "" : "s"
              }`}
              accent={theme.palette.info.main}
              icon={<DatabaseIcon size={22} />}
            />
          </Grid>
        )}

        {/* Placeholder while counts are still loading */}
        {countsLoading && (
          <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                minHeight: 120,
              }}
            >
              <CircularProgress size={28} />
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ---------- Charts Section ---------- */}
      {!countsLoading && populatedResources.length > 0 && (
        <Grid container spacing={2}>
          {/* Donut Chart - Data Distribution */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <DataDistributionDonut resources={populatedResources} />
          </Grid>
          {/* Bar Chart - Top Resources */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <TopResourcesBarChart resources={populatedResources} />
          </Grid>
        </Grid>
      )}

      {/* ---------- Site details ---------- */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mb: 2 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <IdIcon size={18} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Site details
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<LayersIcon size={18} />}
                label="Template category"
                value={site?.categoryName || "—"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<PaletteIcon size={18} />}
                label="Theme"
                value={site?.themeName || "—"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<IdIcon size={18} />}
                label="Site ID"
                value={site?.siteId || "—"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailItem
                icon={<CalendarIcon size={18} />}
                label="Expires"
                value={formatDate(site?.expiresAt)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ---------- Your data (only populated resources) ---------- */}
      {!countsLoading && populatedResources.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                mb: 2,
              }}
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                    }}
                  >
                    <DatabaseIcon size={18} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    Your data
                  </Typography>
                </Stack>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 0.5 }}
                >
                  {totalRecords} record{totalRecords === 1 ? "" : "s"} across{" "}
                  {populatedResources.length} table
                  {populatedResources.length === 1 ? "" : "s"}.
                </Typography>
              </Box>
              <Button
                variant="contained"
                disableElevation
                onClick={goToData}
                sx={{ borderRadius: 2 }}
              >
                Manage data
              </Button>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={1}>
              {populatedResources.map(([name, count]) => {
                const meta = RESOURCE_META[name];
                return (
                  <Grid key={name} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Card
                      variant="outlined"
                      onClick={goToData}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        borderColor: alpha(meta.color, 0.25),
                        transition:
                          "transform .18s ease, box-shadow .18s ease, background-color .18s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          bgcolor: alpha(meta.color, 0.04),
                          boxShadow: `0 8px 20px ${alpha(meta.color, 0.15)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight={600}
                              noWrap
                            >
                              {meta.label}
                            </Typography>
                            <Typography
                              variant="h5"
                              fontWeight={800}
                              sx={{ color: meta.color, mt: 0.25 }}
                            >
                              {count}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ---------- Empty-state hint ---------- */}
      {!countsLoading && populatedResources.length === 0 && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderStyle: "dashed",
            bgcolor: alpha(theme.palette.info.main, 0.02),
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 1.5,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
              }}
            >
              <DatabaseIcon size={26} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              No data yet
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ maxWidth: 420, mx: "auto", mb: 2 }}
            >
              Once you add records in <strong>Site data</strong>, a summary of
              each populated table will appear here.
            </Typography>
            <Button
              variant="contained"
              disableElevation
              onClick={goToData}
              sx={{ borderRadius: 2 }}
            >
              Go to Site data
            </Button>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}