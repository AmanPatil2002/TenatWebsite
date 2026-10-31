import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import PagesOutlinedIcon from "@mui/icons-material/PagesOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";

const FULL_WIDTH = 250;
const MINI_WIDTH = 72;

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
    navigate(`${siteBasePath}/login`, { replace: true });
  }, [navigate, siteBasePath]);

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

  // Redirect if not signed in
  useEffect(() => {
    if (!token) navigate(`${siteBasePath}/login`, { replace: true });
  }, [token, navigate, siteBasePath]);

  // Reload site info on every section change so counts/page lists stay fresh
  // (e.g. after adding a page in "Manage pages")
  useEffect(() => {
    if (token) reloadSite();
  }, [token, reloadSite, location.pathname]);

  const pages = Array.isArray(site?.pages) ? site.pages : [];
  const siteName = site?.siteName || localStorage.getItem("siteAdminSiteName");

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: `${siteBasePath}/panel` },
    { text: "Manage pages", icon: <PagesOutlinedIcon />, path: `${siteBasePath}/manage` },
    { text: "Employees", icon: <GroupsOutlinedIcon />, path: `${siteBasePath}/employees` },
    { text: "Page data", icon: <Inventory2OutlinedIcon />, path: `${siteBasePath}/page-data` },
  ];
  const current = menuItems.find((item) => item.path === location.pathname);

  const transition = theme.transitions.create(["width", "margin"], {
    duration: theme.transitions.duration.shorter,
  });

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          boxShadow: 1,
          transition,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setCollapsedOverride(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            sx={{ mr: 2 }}
          >
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
          <Typography variant="h6" fontWeight="bold" noWrap sx={{ flexGrow: 1 }}>
            {current?.text || "Site Admin Panel"}
          </Typography>
          <Button
            color="inherit"
            startIcon={<PreviewOutlinedIcon />}
            onClick={() => navigate(`${siteBasePath}/preview`)}
          >
            Preview
          </Button>
          <Typography
            variant="body2"
            noWrap
            sx={{ display: { xs: "none", sm: "block" }, maxWidth: "40%", ml: 1 }}
          >
            {siteName}
          </Typography>
        </Toolbar>
      </AppBar>

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
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: collapsed ? 2 : 3, textAlign: collapsed ? "center" : "left" }}>
            <Typography
              variant={collapsed ? "h6" : "h5"}
              fontWeight="bold"
              color="primary"
              noWrap
            >
              {collapsed ? <PagesOutlinedIcon /> : "Site Admin"}
            </Typography>
            {!collapsed && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {siteName}
              </Typography>
            )}
          </Box>
          <Divider />
          <List sx={{ px: 1, py: 1, flexGrow: 1, overflowY: "auto" }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ display: "block", mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ""} placement="right">
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1 : 2,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                      "&.Mui-selected:hover": { backgroundColor: "primary.dark" },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: "center" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List sx={{ px: 1, py: 1 }}>
            <ListItem disablePadding>
              <Tooltip title={collapsed ? "Sign out" : ""} placement="right">
                <ListItemButton
                  onClick={signOut}
                  sx={{
                    borderRadius: 2,
                    color: "error.main",
                    justifyContent: collapsed ? "center" : "flex-start",
                    px: collapsed ? 1 : 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: "center",
                      color: "error.main",
                    }}
                  >
                    <LogoutIcon />
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary="Sign out" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, mt: 8 }}>
        {initialLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
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