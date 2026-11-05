import { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Stack,
  Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AdminProfileDialog from "./AdminProfileDialog";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import PeopleIcon from "@mui/icons-material/People";
import RateReviewIcon from "@mui/icons-material/RateReview";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ReorderIcon from "@mui/icons-material/Reorder";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import EditIcon from "@mui/icons-material/Edit";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import AdminDashboard from "../../Mycomponent/AdminDashboard";

const FULL_WIDTH = 260;
const MINI_WIDTH = 76;

const BRAND = {
  indigo: "#4f46e5",
  indigoDeep: "#3730a3",
  ink: "#0f172a",
  muted: "#64748b",
  sidebar: "#0f172a",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "rgba(99,102,241,0.18)",
};

const menuGroups = [
  {
    label: "Overview",
    items: [
      {
        text: "Dashboard",
        icon: <DashboardIcon />,
        path: "/admin/admindashboard",
      },
    ],
  },
  {
    label: "Content",
    items: [
      { text: "Add Category", icon: <CategoryIcon />, path: "/admin/category" },
      { text: "Add Theme", icon: <ViewQuiltIcon />, path: "/admin/theme" },
      { text: "Add Pages", icon: <NoteAddIcon />, path: "/admin/page" },
      {
        text: "Arrange Pages",
        icon: <ReorderIcon />,
        path: "/admin/template-pages",
      },
      {
        text: "Add Templates",
        icon: <DevicesOtherIcon />,
        path: "/admin/templates",
      },
      {
        text: "View Templates",
        icon: <FolderOpenIcon />,
        path: "/admin/viewtemplates",
      },
    ],
  },
  {
    label: "Engagement",
    items: [
      { text: "FAQ", icon: <HelpOutlineIcon />, path: "/admin/faq" },
      { text: "Contact", icon: <ContactMailIcon />, path: "/admin/contact" },
      { text: "View Users", icon: <PeopleIcon />, path: "/admin/users" },
      {
        text: "View Review",
        icon: <RateReviewIcon />,
        path: "/admin/usereview",
      },
      {
        text: "View Payment",
        icon: <RateReviewIcon />,
        path: "/admin/invoice",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        text: "Site Admin Access",
        icon: <ManageAccountsIcon />,
        path: "/admin/site-admins",
      },
      {
        text: "Bug Reports",
        icon: <BugReportOutlinedIcon />,
        path: "/admin/bug-reports",
      },
    ],
  },
];

const allMenuItems = menuGroups.flatMap((g) => g.items);

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const theme = useTheme();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [collapsed, setCollapsed] = useState(isSmallScreen);

  useEffect(() => {
    setCollapsed(isSmallScreen);
  }, [isSmallScreen]);

  const drawerWidth = collapsed ? MINI_WIDTH : FULL_WIDTH;
  const [email, setEmail] = useState(localStorage.getItem("email"));
  const [profileOpen, setProfileOpen] = useState(false);

  const handleProfileSaved = (profile) => {
    localStorage.setItem("email", profile.email.trim());
    localStorage.setItem("username", profile.name.trim());
    setEmail(profile.email.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("Id");
    navigate("/");
  };

  const avatarLetter = (email || "A").charAt(0).toUpperCase();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* ----------------------------- APP BAR ----------------------------- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: "background.paper",
          color: BRAND.ink,
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
          transition: theme.transitions.create(["width", "margin"], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            sx={{
              borderRadius: 2,
              "&:hover": { bgcolor: alpha(BRAND.indigo, 0.08) },
            }}
          >
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: BRAND.ink,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              noWrap
            >
              Admin Dashboard
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: BRAND.muted, display: { xs: "none", sm: "block" } }}
            >
              Manage your platform content and users
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Desktop profile chip */}
            <Box
              onClick={() => setProfileOpen(true)}
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                cursor: "pointer",
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: alpha(BRAND.indigo, 0.35),
                  bgcolor: alpha(BRAND.indigo, 0.04),
                },
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: alpha(BRAND.indigo, 0.12),
                  color: BRAND.indigo,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {avatarLetter}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: BRAND.ink,
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email || "Admin"}
              </Typography>
              <EditIcon sx={{ fontSize: 15, color: BRAND.muted }} />
            </Box>

            {/* Mobile profile icon */}
            <IconButton
              onClick={() => setProfileOpen(true)}
              aria-label="Edit my profile"
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                borderRadius: 2,
                "&:hover": { bgcolor: alpha(BRAND.indigo, 0.08) },
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: alpha(BRAND.indigo, 0.12),
                  color: BRAND.indigo,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {avatarLetter}
              </Avatar>
            </IconButton>

            <AdminProfileDialog
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              onSaved={handleProfileSaved}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ----------------------------- DRAWER ----------------------------- */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            duration: theme.transitions.duration.shorter,
          }),
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            bgcolor: BRAND.sidebar,
            color: "#cbd5e1",
            borderRight: "none",
            transition: theme.transitions.create("width", {
              duration: theme.transitions.duration.shorter,
            }),
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Brand */}
          <Box
            sx={{
              height: 72,
              px: collapsed ? 0 : 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 1.25,
              borderBottom: `1px solid ${alpha("#fff", 0.08)}`,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                bgcolor: alpha("#fff", 0.08),
                color: "#fff",
              }}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: 22 }} />
            </Box>
            {!collapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: "0.95rem",
                    lineHeight: 1.2,
                  }}
                  noWrap
                >
                  Admin Panel
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: alpha("#fff", 0.5),
                    letterSpacing: "0.06em",
                  }}
                  noWrap
                >
                  CONTROL CENTER
                </Typography>
              </Box>
            )}
          </Box>

          {/* Menu groups */}
          <List
            sx={{
              px: 1,
              py: 1.5,
              flexGrow: 1,
              overflowY: "auto",
              overflowX: "hidden",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: alpha("#fff", 0.12),
                borderRadius: 3,
              },
            }}
          >
            {menuGroups.map((group, gi) => (
              <Box key={group.label} sx={{ mb: 1 }}>
                {!collapsed && (
                  <Typography
                    sx={{
                      px: 2,
                      py: 0.75,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: alpha("#fff", 0.4),
                      textTransform: "uppercase",
                    }}
                  >
                    {group.label}
                  </Typography>
                )}
                {collapsed && gi > 0 && (
                  <Divider
                    sx={{ my: 1, mx: 1.5, borderColor: alpha("#fff", 0.08) }}
                  />
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <ListItem
                      key={item.text}
                      disablePadding
                      sx={{ display: "block", mb: 0.25 }}
                    >
                      <Tooltip
                        title={collapsed ? item.text : ""}
                        placement="right"
                        arrow
                      >
                        <ListItemButton
                          selected={isActive}
                          onClick={() => navigate(item.path)}
                          sx={{
                            borderRadius: 2,
                            minHeight: 42,
                            justifyContent: collapsed ? "center" : "flex-start",
                            px: collapsed ? 1 : 1.75,
                            mx: 0.5,
                            color: alpha("#fff", 0.72),
                            transition: "all 0.15s ease",
                            "& .MuiListItemIcon-root": {
                              color: alpha("#fff", 0.55),
                              minWidth: 0,
                              mr: collapsed ? 0 : 1.5,
                              justifyContent: "center",
                              transition: "color 0.15s ease",
                            },
                            "&:hover": {
                              bgcolor: BRAND.sidebarHover,
                              color: "#fff",
                              "& .MuiListItemIcon-root": { color: "#fff" },
                            },
                            "&.Mui-selected": {
                              bgcolor: BRAND.sidebarActive,
                              color: "#fff",
                              boxShadow: `inset 3px 0 0 ${BRAND.indigo}`,
                              "& .MuiListItemIcon-root": {
                                color: "#a5b4fc",
                              },
                              "&:hover": {
                                bgcolor: alpha(BRAND.indigo, 0.25),
                              },
                            },
                          }}
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: "0.875rem",
                                fontWeight: isActive ? 600 : 500,
                                noWrap: true,
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </Box>
            ))}
          </List>

          {/* Logout */}
          <Box
            sx={{
              p: 1,
              borderTop: `1px solid ${alpha("#fff", 0.08)}`,
              flexShrink: 0,
            }}
          >
            <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  minHeight: 42,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1 : 1.75,
                  color: "#f87171",
                  "& .MuiListItemIcon-root": {
                    color: "#f87171",
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.5,
                    justifyContent: "center",
                  },
                  "&:hover": {
                    bgcolor: alpha("#ef4444", 0.12),
                    color: "#fca5a5",
                    "& .MuiListItemIcon-root": { color: "#fca5a5" },
                  },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      {/* ----------------------------- MAIN ----------------------------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 },
          mt: 8,
          bgcolor: "#f8fafc",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {outlet ?? (
          <Box>
            {location.pathname === "/admin" ? (
              <AdminDashboard />
            ) : (
              <Typography variant="h5" component="h1" fontWeight="bold">
                {allMenuItems.find((item) => item.path === location.pathname)
                  ?.text ?? "Admin Dashboard"}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}