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

/* ------------------------------------------------------------------ */
/*  Resource metadata — mirrors RESOURCE_CONFIG in SiteAdminData       */
/* ------------------------------------------------------------------ */
const RESOURCE_META = {
  // Common tables (all sites)
  headers: { label: "Headers", color: "#607d8b" },
  pages: { label: "Pages", color: "#3f51b5" },
  news: { label: "News", color: "#ff9800" },
  galleries: { label: "Galleries", color: "#9c27b0" },
  slider: { label: "Slider", color: "#e91e63" },
  employees: { label: "Employees", color: "#009688" },

  // School pack
  teachers: { label: "Teachers", color: "#2e7d32" },
  classes: { label: "Classes", color: "#6a1b9a" },
  students: { label: "Students", color: "#1976d2" },

  // Medical pack
  departments: { label: "Departments", color: "#c62828" },
  doctors: { label: "Doctors", color: "#00695c" },

  // E-commerce pack
  productcategories: { label: "Product categories", color: "#ef6c00" },
  products: { label: "Products", color: "#4527a0" },

  // Restaurant pack
  menucategories: { label: "Menu categories", color: "#ad1457" },
  menuitems: { label: "Menu items", color: "#3e2723" },
  reservations: { label: "Reservations", color: "#5d4037" },

  // Hotel pack
  roomtypes: { label: "Room types", color: "#1565c0" },
  rooms: { label: "Rooms", color: "#0277bd" },
  bookings: { label: "Bookings", color: "#0288d1" },

  // Real Estate pack
  propertytypes: { label: "Property types", color: "#2e7d32" },
  properties: { label: "Properties", color: "#388e3c" },
  agents: { label: "Agents", color: "#43a047" },

  // Gym pack
  trainers: { label: "Trainers", color: "#f57f17" },
  membershipplans: { label: "Membership plans", color: "#ff8f00" },
  members: { label: "Members", color: "#ffa000" },

  // Blog pack
  blogcategories: { label: "Blog categories", color: "#6a1b9a" },
  blogposts: { label: "Blog posts", color: "#7b1fa2" },
  comments: { label: "Comments", color: "#8e24aa" },

  // Portfolio pack
  projectcategories: { label: "Project categories", color: "#c62828" },
  projects: { label: "Projects", color: "#d32f2f" },
  testimonials: { label: "Testimonials", color: "#e53935" },

  // Event Management pack
  eventtypes: { label: "Event types", color: "#00695c" },
  events: { label: "Events", color: "#00796b" },
  registrations: { label: "Registrations", color: "#00897b" },

  // NGO pack
  causes: { label: "Causes", color: "#4a148c" },
  donations: { label: "Donations", color: "#6a1b9a" },
  volunteers: { label: "Volunteers", color: "#7b1fa2" },

  // Spa pack
  servicecategories: { label: "Service categories", color: "#1a237e" },
  services: { label: "Services", color: "#283593" },
  appointments: { label: "Appointments", color: "#303f9f" },

  // Law Firm pack
  practiceareas: { label: "Practice areas", color: "#bf360c" },
  attorneys: { label: "Attorneys", color: "#d84315" },
  caseinquiries: { label: "Case inquiries", color: "#e64a19" },

  // Agriculture pack
  farmproducts: { label: "Farm products", color: "#1b5e20" },
  farminquiries: { label: "Farm inquiries", color: "#2e7d32" },
  farmorders: { label: "Farm orders", color: "#388e3c" },
  farmorderitems: { label: "Farm order items", color: "#43a047" },

  // Consulting pack
  consultingservices: { label: "Consulting services", color: "#0d47a1" },
  consultants: { label: "Consultants", color: "#1565c0" },
  consultationrequests: { label: "Consultation requests", color: "#1976d2" },
  proposals: { label: "Proposals", color: "#1e88e5" },
  engagements: { label: "Engagements", color: "#2196f3" },

  // Petcare pack
  petservices: { label: "Pet services", color: "#4a148c" },
  veterinarians: { label: "Veterinarians", color: "#6a1b9a" },
  petappointments: { label: "Pet appointments", color: "#7b1fa2" },
  petrecords: { label: "Pet records", color: "#8e24aa" },
  petpayments: { label: "Pet payments", color: "#9c27b0" },

  // Daycare pack
  daycareprograms: { label: "Daycare programs", color: "#e65100" },
  caregivers: { label: "Caregivers", color: "#ef6c00" },
  admissionenquiries: { label: "Admission enquiries", color: "#f57c00" },
  enrollments: { label: "Enrollments", color: "#fb8c00" },
  daycarepayments: { label: "Daycare payments", color: "#ff9800" },

  // Dental pack
  dentalservices: { label: "Dental services", color: "#004d40" },
  dentists: { label: "Dentists", color: "#00695c" },
  dentalappointments: { label: "Dental appointments", color: "#00796b" },
  dentalpatients: { label: "Dental patients", color: "#00897b" },
  treatmentplans: { label: "Treatment plans", color: "#009688" },
  dentalpayments: { label: "Dental payments", color: "#26a69a" },

  // Mobile Apps pack
  appcategories: { label: "App categories", color: "#311b92" },
  mobileapps: { label: "Mobile apps", color: "#4527a0" },
  appreviews: { label: "App reviews", color: "#5e35b1" },
  downloads: { label: "Downloads", color: "#673ab7" },
  apppurchases: { label: "App purchases", color: "#7e57c2" },

  // Interior Design pack
  designservices: { label: "Design services", color: "#880e4f" },
  designprojects: { label: "Design projects", color: "#ad1457" },
  designinquiries: { label: "Design inquiries", color: "#c2185b" },
  sitevisits: { label: "Site visits", color: "#d81b60" },
  moodboards: { label: "Mood boards", color: "#ec407a" },

  // Music pack
  artists: { label: "Artists", color: "#b71c1c" },
  albums: { label: "Albums", color: "#c62828" },
  tracks: { label: "Tracks", color: "#d32f2f" },
  eventshows: { label: "Event shows", color: "#e53935" },

  // Streaming pack
  genres: { label: "Genres", color: "#3e2723" },
  movies: { label: "Movies", color: "#4e342e" },
  subscriptionplans: { label: "Subscription plans", color: "#5d4037" },
  watchlist: { label: "Watchlist", color: "#6d4c41" },
  episodes: { label: "Episodes", color: "#795548" },
  subscriptions: { label: "Subscriptions", color: "#8d6e63" },
  watchhistory: { label: "Watch history", color: "#a1887f" },

  // Gaming pack
  gamecategories: { label: "Game categories", color: "#1a237e" },
  games: { label: "Games", color: "#283593" },
  teams: { label: "Teams", color: "#303f9f" },
  tournaments: { label: "Tournaments", color: "#3f51b5" },
  players: { label: "Players", color: "#5c6bc0" },
  teamrosters: { label: "Team rosters", color: "#7986cb" },
  matches: { label: "Matches", color: "#9fa8da" },
  matchresults: { label: "Match results", color: "#c5cae9" },

  // Jewelry pack
  jewelrycategories: { label: "Jewelry categories", color: "#ff6f00" },
  jewelryproducts: { label: "Jewelry products", color: "#ff8f00" },
  jewelryinquiries: { label: "Jewelry inquiries", color: "#ffa000" },
  goldrates: { label: "Gold rates", color: "#ffb300" },
  jewelryorders: { label: "Jewelry orders", color: "#ffc107" },
  jewelryorderitems: { label: "Jewelry order items", color: "#ffca28" },

  // Furniture pack
  furniturecategories: { label: "Furniture categories", color: "#263238" },
  furnitureproducts: { label: "Furniture products", color: "#37474f" },
  customorders: { label: "Custom orders", color: "#455a64" },
  furnitureorders: { label: "Furniture orders", color: "#546e7a" },
  furnitureorderitems: { label: "Furniture order items", color: "#607d8b" },
  deliveries: { label: "Deliveries", color: "#78909c" },

  // Grocery pack
  grocerycategories: { label: "Grocery categories", color: "#1b5e20" },
  groceryproducts: { label: "Grocery products", color: "#2e7d32" },
  deliveryslots: { label: "Delivery slots", color: "#388e3c" },
  groceryorders: { label: "Grocery orders", color: "#43a047" },
  groceryorderitems: { label: "Grocery order items", color: "#4caf50" },

  // Cafe pack
  cafecategories: { label: "Cafe categories", color: "#3e2723" },
  cafeitems: { label: "Cafe items", color: "#4e342e" },
  tablebookings: { label: "Table bookings", color: "#5d4037" },
  cafeorders: { label: "Cafe orders", color: "#6d4c41" },
  cafeorderitems: { label: "Cafe order items", color: "#795548" },
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
