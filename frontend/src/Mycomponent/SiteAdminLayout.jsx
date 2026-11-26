import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getTablePermission } from "../config/readOnlyTables";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
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

const DashboardIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </SvgIcon>
);
const PagesIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v6h6" />
    <path d="M8 13h8M8 17h5" />
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
const NewsIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 0 2-2V8" />
    <path d="M4 5v12a2 2 0 0 0 2 2h13" />
    <path d="M8 9h7M8 13h7M8 17h4" />
  </SvgIcon>
);
const GalleryIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 18 5-5 4 4 3-3 4 4" />
  </SvgIcon>
);
const SliderIcon = (p) => (
  <SvgIcon {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10v4M18 10v4M12 10v4" />
  </SvgIcon>
);
const BrandingIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 4h16v4H4z" />
    <path d="M4 12h16v8H4z" />
    <path d="M8 16h8" />
  </SvgIcon>
);
const ThemeIcon = (p) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 2a10 10 0 1 0 0 20" />
    <path d="M12 2v20" />
  </SvgIcon>
);
const DataIcon = (p) => (
  <SvgIcon {...p}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
  </SvgIcon>
);

// Map dynamic table names to appropriate icons
const getTableIcon = (tableName) => {
  const name = tableName.toLowerCase();
  switch (name) {
    case "employees":
    case "staff":
    case "users":
      return EmployeesIcon;
    case "news":
    case "posts":
    case "articles":
    case "blog":
      return NewsIcon;
    case "gallery":
    case "images":
    case "photos":
    case "media":
      return GalleryIcon;
    case "slider":
    case "slides":
    case "banners":
      return SliderIcon;
    case "branding":
    case "header":
    case "footer":
    case "headerfooter":
      return BrandingIcon;
    case "theme":
    case "themes":
      return ThemeIcon;
    case "pages":
      return PagesIcon;
    case "dashboard":
      return DashboardIcon;
    default:
      return DataIcon;
  }
};

const LayoutLogoutIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </SvgIcon>
);
const MenuIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </SvgIcon>
);
const MenuOpenIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 6h16M4 12h10M4 18h16" />
    <path d="m17 9 3 3-3 3" />
  </SvgIcon>
);
const ChevronIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m9 6 6 6-6 6" />
  </SvgIcon>
);

const FULL_WIDTH = 264;
const MINI_WIDTH = 80;

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function SiteAdminLayout() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    records: true,
    dataTables: true,
    customerActivity: true,
  });
  const [tableResources, setTableResources] = useState([]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!isSmallScreen) setMobileOpen(false);
  }, [isSmallScreen, location.pathname]);

  const drawerWidth = isSmallScreen
    ? FULL_WIDTH
    : collapsed
      ? MINI_WIDTH
      : FULL_WIDTH;
  // True only when the drawer is actually the narrow icon-only version
  const navCompact = !isSmallScreen && collapsed;

  const token = localStorage.getItem("siteAdminToken");
  const siteBasePath = `/site-admin/${siteId}`;
  const baseUrl = `${API_URL}/sites/client-admin/${siteId}`;

  const authConfig = useMemo(
    () =>
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { headers: {} },
    [token],
  );

  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const requestRef = useRef(null);

  const signOut = useCallback(() => {
    localStorage.removeItem("siteAdminToken");
    localStorage.removeItem("siteAdminSiteId");
    localStorage.removeItem("siteAdminSiteName");
    navigate(`/mysite`, { replace: true });
  }, [navigate]);

  const reloadSite = useCallback(async () => {
    if (requestRef.current) requestRef.current.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const [pagesRes, schemaRes] = await Promise.all([
        axios.get(`${baseUrl}/pages`, {
          ...authConfig,
          signal: controller.signal,
        }),
        axios.get(`${baseUrl}/data/schema`, {
          ...authConfig,
          signal: controller.signal,
        }),
      ]);

      const raw = pagesRes.data;
      const isArray = Array.isArray(raw);
      const siteMeta = isArray ? {} : raw || {};
      const pageList = isArray
        ? raw
        : Array.isArray(raw?.pages)
          ? raw.pages
          : [];

      // Fetch dynamic tables - schemaRes.data may contain site info including packKey/vertical
      const schemaData = schemaRes.data || {};
      const schemas = schemaData.resources || {};
      // Extract packKey/vertical from schema response (backend returns site metadata here)
      const sitePackKey =
        schemaData.packKey ||
        schemaData.vertical ||
        schemaData.pack ||
        schemaData.type ||
        "";
      // Extract assetOrigin from schema response for image uploads
      const assetOrigin = schemaData.assetOrigin || "";

      const knownResources = Object.entries(schemas)
        .filter(([name, schema]) => {
          if (getTablePermission(sitePackKey, name) === "hidden") return false;
          return (
            !schema.isCommon &&
            Array.isArray(schema.columns) &&
            schema.columns.some((c) => c.editable)
          );
        })
        .map(([name]) => name);

      setTableResources(knownResources);

      let themeData = {};
      try {
        const themeRes = await axios.get(`${baseUrl}/theme`, {
          ...authConfig,
          signal: controller.signal,
        });
        themeData = themeRes.data || {};
      } catch (e) {
        console.warn("Theme fetch failed:", e?.message);
      }

      if (controller.signal.aborted) return;

      // Include packKey/vertical in site object for permission checks
      setSite({
        ...siteMeta,
        ...themeData,
        pages: pageList,
        packKey: sitePackKey,
        vertical: sitePackKey,
        assetOrigin,
      });
      setPages(pageList);
      setError("");
    } catch (requestError) {
      if (axios.isCancel(requestError)) return;
      if (requestError.response?.status === 401) {
        signOut();
        return;
      }
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not load site details.",
      );
    } finally {
      if (!controller.signal.aborted) setInitialLoading(false);
    }
  }, [authConfig, baseUrl, signOut]);

  useEffect(() => {
    if (!token) {
      navigate(`${siteBasePath}/login`, { replace: true });
      return;
    }
    setInitialLoading(true);
    reloadSite();
    return () => {
      if (requestRef.current) requestRef.current.abort();
    };
  }, [token, baseUrl, navigate, siteBasePath, reloadSite]);

  const siteName = site?.siteName || localStorage.getItem("siteAdminSiteName");

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon size={20} />,
      path: `${siteBasePath}/panel`,
    },
    {
      text: "Manage pages",
      icon: <PagesIcon size={20} />,
      path: `${siteBasePath}/manage`,
    },
    {
      text: "Theme",
      icon: <ThemeIcon size={20} />,
      path: `${siteBasePath}/theme`,
    },
    {
      text: "Employees",
      icon: <EmployeesIcon size={20} />,
      path: `${siteBasePath}/employees`,
    },
    {
      text: "News",
      icon: <NewsIcon size={20} />,
      path: `${siteBasePath}/news`,
    },
    {
      text: "Gallery",
      icon: <GalleryIcon size={20} />,
      path: `${siteBasePath}/gallery`,
    },
    {
      text: "Slider",
      icon: <SliderIcon size={20} />,
      path: `${siteBasePath}/slider`,
    },
    {
      text: "Header & footer",
      icon: <BrandingIcon size={20} />,
      path: `${siteBasePath}/header-footer`,
    },
  ];

  const contentItems = menuItems.slice(0, 3);
  const recordItems = menuItems.slice(3);

  const transition = theme.transitions.create(["width", "margin"], {
    duration: theme.transitions.duration.shorter,
  });

  const NavItem = ({ item }) => {
    const selected = location.pathname === item.path;
    return (
      <Tooltip title={navCompact ? item.text : ""} placement="right">
        <ListItemButton
          selected={selected}
          onClick={() => navigate(item.path)}
          sx={{
            position: "relative",
            borderRadius: 2,
            minHeight: 44,
            px: navCompact ? 1 : 1.5,
            justifyContent: navCompact ? "center" : "flex-start",
            color: "text.secondary",
            "&::before": selected
              ? {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  borderRadius: "0 3px 3px 0",
                  bgcolor: "primary.main",
                }
              : {},
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
              color: "text.primary",
              "& .MuiListItemIcon-root": { color: "primary.main" },
            },
            "&.Mui-selected": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              "& .MuiListItemIcon-root": { color: "primary.main" },
            },
          }}
        >
          <ListItemIcon
            sx={{ minWidth: 0, mr: navCompact ? 0 : 1.5, color: "inherit" }}
          >
            {item.icon}
          </ListItemIcon>
          {!navCompact && (
            <ListItemText
              primary={item.text}
              slotProps={{
                primary: {
                  sx: { fontSize: 14, fontWeight: selected ? 700 : 500 },
                },
              }}
            />
          )}
          {!navCompact && selected && (
            <ChevronIcon size={14} color={theme.palette.primary.main} />
          )}
        </ListItemButton>
      </Tooltip>
    );
  };

  // Section header: full label + arrow normally, a thin divider in mini mode
  const renderSectionHeader = (key, label) => {
    if (navCompact) return <Divider sx={{ my: 1 }} />;

    return (
      <ListItemButton
        onClick={() => toggleSection(key)}
        sx={{ borderRadius: 2, mb: 0.5 }}
      >
        <ListItemText
          primary={label}
          slotProps={{
            primary: {
              variant: "caption",
              sx: { fontWeight: 700, textTransform: "uppercase" },
            },
          }}
        />
        {expandedSections[key] ? (
          <ExpandLess fontSize="small" />
        ) : (
          <ExpandMore fontSize="small" />
        )}
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, md: `${drawerWidth}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition,
          zIndex: theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ minHeight: 68, px: { xs: 1.5, sm: 2.5 } }}>
          <IconButton
            edge="start"
            onClick={() =>
              isSmallScreen ? setMobileOpen((p) => !p) : setCollapsed((p) => !p)
            }
            sx={{
              mr: 1.5,
              color: "text.secondary",
              borderRadius: 2,
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            {isSmallScreen ? (
              <MenuIcon size={20} />
            ) : collapsed ? (
              <MenuIcon size={20} />
            ) : (
              <MenuOpenIcon size={20} />
            )}
          </IconButton>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
            sx={{ flexGrow: 1 }}
          >
            {siteName || "Admin"}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`${siteBasePath}/preview`)}
            sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
          >
            View Preview
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isSmallScreen ? "temporary" : "permanent"}
        open={isSmallScreen ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: { xs: 0, md: drawerWidth },
          flexShrink: 0,
          transition,
          "& .MuiDrawer-paper": {
            width: isSmallScreen ? FULL_WIDTH : drawerWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition,
            bgcolor: "#ffffff",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            paddingTop: 1,
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: navCompact ? "center" : "flex-start",
              minHeight: 68,
              px: navCompact ? 0 : 2.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: "#fff",
              }}
            >
              <PagesIcon size={22} />
            </Box>
            {!navCompact && (
              <Typography
                variant="subtitle2"
                fontWeight={800}
                noWrap
                sx={{ ml: 1.5 }}
              >
                {siteName || "My Site"}
              </Typography>
            )}
          </Stack>

          <List sx={{ px: 1.5, py: 2, flexGrow: 1, overflowY: "auto" }}>
            {/* Content */}
            {renderSectionHeader("content", "Content")}
            <Collapse in={navCompact || expandedSections.content}>
              {contentItems.map((i) => (
                <NavItem key={i.text} item={i} />
              ))}
            </Collapse>

            {/* Records */}
            {renderSectionHeader("records", "Records")}
            <Collapse in={navCompact || expandedSections.records}>
              {recordItems.map((i) => (
                <NavItem key={i.text} item={i} />
              ))}
            </Collapse>

            {/* Data Tables */}
            {renderSectionHeader("dataTables", "Content Management")}
            <Collapse in={navCompact || expandedSections.dataTables}>
              {tableResources.filter((res) =>
                getTablePermission(site?.packKey || site?.vertical, res) === "full"
              ).map((res) => {
                const IconComponent = getTableIcon(res);
                return (
                  <NavItem
                    key={res}
                    item={{
                      text: res.charAt(0).toUpperCase() + res.slice(1),
                      icon: <IconComponent size={20} />,
                      path: `${siteBasePath}/data/${res}`,
                    }}
                  />
                );
              })}
            </Collapse>

            {renderSectionHeader("customerActivity", "Customer Activity")}
            <Collapse in={navCompact || expandedSections.customerActivity}>
              {tableResources.filter((res) => {
                const mode = getTablePermission(site?.packKey || site?.vertical, res);
                return mode === "status" || mode === "view";
              }).map((res) => {
                const IconComponent = getTableIcon(res);
                return (
                  <NavItem
                    key={res}
                    item={{
                      text: res.charAt(0).toUpperCase() + res.slice(1),
                      icon: <IconComponent size={20} />,
                      path: `${siteBasePath}/data/${res}`,
                    }}
                  />
                );
              })}
            </Collapse>
          </List>

          <Divider />
          <List sx={{ px: 1.5, py: 1.5 }}>
            <Tooltip title={navCompact ? "Sign out" : ""} placement="right">
              <ListItemButton
                onClick={signOut}
                sx={{
                  borderRadius: 2,
                  justifyContent: navCompact ? "center" : "flex-start",
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: navCompact ? 0 : 1.5 }}>
                  <LayoutLogoutIcon size={20} />
                </ListItemIcon>
                {!navCompact && <ListItemText primary="Sign out" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: "68px",
          bgcolor: "#f9fafb",
          minHeight: "calc(100vh - 68px)",
        }}
      >
        {initialLoading ? (
          <CircularProgress />
        ) : (
          <Outlet
            context={{
              site,
              pages,
              setPages,
              setSite,
              siteError: error,
              reloadSite,
              baseUrl,
              authConfig,
              siteBasePath,
              siteId,
              API_URL,
            }}
          />
        )}
      </Box>
    </Box>
  );
}