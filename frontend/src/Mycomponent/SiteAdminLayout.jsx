import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
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
const SchoolIcon = (p) => (
  <SvgIcon {...p}>
    <path d="m12 3 9 4-9 4-9-4 9-4Z" />
    <path d="M6 9v6c0 1.5 2.7 3 6 3s6-1.5 6-3V9" />
  </SvgIcon>
);
const ProductsIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
    <path d="M3 7l3-4h12l3 4" />
    <path d="M9 11v5M15 11v5" />
  </SvgIcon>
);
const RestaurantIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M6 2v8a2 2 0 0 0 4 0V2" />
    <path d="M8 10v12" />
    <path d="M18 2v20" />
    <path d="M15 2v6a3 3 0 0 0 6 0V2" />
  </SvgIcon>
);
const MenuBookIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z" />
    <path d="M20 4h-6v14a2 2 0 0 1 2-2h4V4Z" />
  </SvgIcon>
);
const LogoutIcon = (p) => (
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
const PreviewIcon = (p) => (
  <SvgIcon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);
const GlobeIcon = (p) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18" />
    <path d="M12 3a14 14 0 0 0 0 18" />
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
  const [collapsedOverride, setCollapsedOverride] = useState(null);
  const collapsed = collapsedOverride ?? isSmallScreen;
  const drawerWidth = collapsed ? MINI_WIDTH : FULL_WIDTH;

  const token = localStorage.getItem("siteAdminToken");
  const siteBasePath = `/site-admin/${siteId}`;
  const baseUrl = `${API_URL}/sites/client-admin/${siteId}`;
  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const [site, setSite] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const signOut = useCallback(() => {
    localStorage.removeItem("siteAdminToken");
    localStorage.removeItem("siteAdminSiteId");
    localStorage.removeItem("siteAdminSiteName");
    navigate(`/mysite`, { replace: true });
  }, [navigate]);

  const reloadSite = useCallback(async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/pages`, authConfig);
      setSite(data);
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        signOut();
        return;
      }
      setError(
        requestError.response?.data?.message || "Could not load site details.",
      );
    } finally {
      setInitialLoading(false);
    }
  }, [authConfig, baseUrl, signOut]);

  useEffect(() => {
    if (!token) navigate(`${siteBasePath}/login`, { replace: true });
  }, [token, navigate, siteBasePath]);

  useEffect(() => {
    if (token) reloadSite();
  }, [token, reloadSite, location.pathname]);

  const pages = Array.isArray(site?.pages) ? site.pages : [];
  const siteName = site?.siteName || localStorage.getItem("siteAdminSiteName");
  const siteCategory = String(site?.categoryName || "").toLowerCase();
  

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon size={20} />, path: `${siteBasePath}/panel` },
    { text: "Manage pages", icon: <PagesIcon size={20} />, path: `${siteBasePath}/manage` },
    { text: "Employees", icon: <EmployeesIcon size={20} />, path: `${siteBasePath}/employees` },
    { text: "News", icon: <NewsIcon size={20} />, path: `${siteBasePath}/news` },
    { text: "Gallery", icon: <GalleryIcon size={20} />, path: `${siteBasePath}/gallery` },
    { text: "Slider", icon: <SliderIcon size={20} />, path: `${siteBasePath}/slider` },
    { text: "Header & footer", icon: <BrandingIcon size={20} />, path: `${siteBasePath}/header-footer` },
    // ...recordItems,
  ];

  const currentItem = menuItems.find((i) => i.path === location.pathname);

  const transition = theme.transitions.create(["width", "margin"], {
    duration: theme.transitions.duration.shorter,
  });

  /* Content group: first "content" block, then optional record-specific block */
  const contentItems = menuItems.slice(0, 7);
  const extraItems = menuItems.slice(7);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      {/* ---------------- AppBar ---------------- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
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
            onClick={() => setCollapsedOverride(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            sx={{
              mr: 1.5,
              color: "text.secondary",
              borderRadius: 2,
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            {collapsed ? <MenuIcon size={20} /> : <MenuOpenIcon size={20} />}
          </IconButton>

          <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
            
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {currentItem?.text || "Dashboard"}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<PreviewIcon size={16} />}
              onClick={() => navigate(`${siteBasePath}/preview`)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                display: { xs: "none", sm: "inline-flex" },
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              View site
            </Button>
            <Tooltip title="View site">
              <IconButton
                onClick={() => navigate(`${siteBasePath}/preview`)}
                sx={{
                  display: { sm: "none" },
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <PreviewIcon size={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ---------------- Drawer ---------------- */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition,
            bgcolor: "#ffffff",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Brand / site identity */}
          <Box
            sx={{
              minHeight: 68,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              px: collapsed ? 0 : 2.5,
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
                flexShrink: 0,
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <PagesIcon size={22} />
            </Box>
            {!collapsed && (
              <Box sx={{ ml: 1.5, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={800} noWrap letterSpacing="-0.01em">
                  {siteName || "My Site"}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Site workspace
                </Typography>
              </Box>
            )}
          </Box>

          {/* Nav */}
          <List sx={{ px: 1.5, py: 2, flexGrow: 1, overflowY: "auto" }}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  mb: 1,
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  fontSize: 10.5,
                }}
              >
                Content
              </Typography>
            )}
            {contentItems.map((item) => {
              const selected = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ display: "block", mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.text : ""} placement="right">
                    <ListItemButton
                      selected={selected}
                      onClick={() => navigate(item.path)}
                      sx={{
                        position: "relative",
                        borderRadius: 2,
                        minHeight: 44,
                        justifyContent: collapsed ? "center" : "flex-start",
                        px: collapsed ? 1 : 1.5,
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
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.14),
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: collapsed ? 0 : 1.5,
                          justifyContent: "center",
                          color: "inherit",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: selected ? 700 : 500,
                          }}
                        />
                      )}
                      {!collapsed && selected && (
                        <ChevronIcon size={14} color={theme.palette.primary.main} />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}

            {extraItems.length > 0 && (
              <>
                {!collapsed && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      mt: 2,
                      mb: 1,
                      display: "block",
                      color: "text.secondary",
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      fontSize: 10.5,
                    }}
                  >
                    Records
                  </Typography>
                )}
                {collapsed && <Divider sx={{ my: 1.5 }} />}
                {extraItems.map((item) => {
                  const selected = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding sx={{ display: "block", mb: 0.5 }}>
                      <Tooltip title={collapsed ? item.text : ""} placement="right">
                        <ListItemButton
                          selected={selected}
                          onClick={() => navigate(item.path)}
                          sx={{
                            position: "relative",
                            borderRadius: 2,
                            minHeight: 44,
                            justifyContent: collapsed ? "center" : "flex-start",
                            px: collapsed ? 1 : 1.5,
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
                              "&:hover": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.14),
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: collapsed ? 0 : 1.5,
                              justifyContent: "center",
                              color: "inherit",
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: 14,
                                fontWeight: selected ? 700 : 500,
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </>
            )}
          </List>

          {/* Bottom: plan chip + sign out */}
          {!collapsed && (
            <Box sx={{ px: 2, pb: 1.5 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                  <GlobeIcon size={14} color={theme.palette.primary.main} />
                  <Typography variant="caption" fontWeight={700} color="primary.main">
                    Your site is live
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Purchased template workspace
                </Typography>
              </Box>
            </Box>
          )}

          <Divider />

          <List sx={{ px: 1.5, py: 1.5 }}>
            <ListItem disablePadding>
              <Tooltip title={collapsed ? "Sign out" : ""} placement="right">
                <ListItemButton
                  onClick={signOut}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: collapsed ? "center" : "flex-start",
                    px: collapsed ? 1 : 1.5,
                    color: "text.secondary",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                      color: theme.palette.error.main,
                      "& .MuiListItemIcon-root": { color: theme.palette.error.main },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.5,
                      justifyContent: "center",
                      color: "inherit",
                    }}
                  >
                    <LogoutIcon size={20} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary="Sign out"
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* ---------------- Main ---------------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 },
          mt: "68px",
          transition,
        }}
      >
        {initialLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Outlet
            context={{
              site,
              pages,
              siteError: error,
              reloadSite,
              baseUrl,
              authConfig,
              siteBasePath,
              siteId,
            }}
          />
        )}
      </Box>
    </Box>
  );
}