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
  ButtonBase,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import PaymentIcon from "@mui/icons-material/Payment";
import ReorderIcon from "@mui/icons-material/Reorder";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import EditIcon from "@mui/icons-material/Edit";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import AdminDashboard from "../../Mycomponent/AdminDashboard";

const FULL_WIDTH = 260;
const MINI_WIDTH = 76;

const BRAND = {
  indigo: "#0284c7",
  indigoDeep: "#0369a1",
  ink: "#0f172a",
  muted: "#64748b",
  sidebar: "#0f172a",
  sidebarHover: "rgba(238, 223, 223, 0.06)",
  sidebarActive: "rgba(2,132,199,0.18)",
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
        text: "Add Templates",
        icon: <DevicesOtherIcon />,
        path: "/admin/templates",
      },
      {
        text: "Arrange Pages",
        icon: <ReorderIcon />,
        path: "/admin/template-pages",
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
        icon: <PaymentIcon />,
        path: "/admin/invoice",
      },
    ],
  },
  {
    label: "Administration",
    items: [
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

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isSmallScreen) {
      setMobileOpen(false);
    }
  }, [isSmallScreen, location.pathname]);

  const drawerWidth = isSmallScreen
    ? FULL_WIDTH
    : collapsed
      ? MINI_WIDTH
      : FULL_WIDTH;
  const [email, setEmail] = useState(localStorage.getItem("email"));
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

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
      <Box
        component="a"
        href="#admin-main-content"
        sx={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: (muiTheme) => muiTheme.zIndex.modal + 1,
          px: 2,
          py: 1,
          borderRadius: 1.5,
          bgcolor: BRAND.ink,
          color: "common.white",
          fontWeight: 700,
          textDecoration: "none",
          transform: "translateY(-160%)",
          transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shortest,
          }),
          "&:focus-visible": { transform: "translateY(0)" },
        }}
      >
        Skip to Main Content
      </Box>

      {/* ----------------------------- APP BAR ----------------------------- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, md: `${drawerWidth}px` },
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
            onClick={() =>
              isSmallScreen ? setMobileOpen((p) => !p) : setCollapsed((p) => !p)
            }
            aria-label={
              isSmallScreen
                ? "Open sidebar"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
            sx={{
              borderRadius: 2,
              "&:hover": { bgcolor: alpha(BRAND.indigo, 0.08) },
            }}
          >
            {isSmallScreen ? (
              <MenuIcon />
            ) : collapsed ? (
              <MenuIcon />
            ) : (
              <MenuOpenIcon />
            )}
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
            <ButtonBase
              onClick={() => setProfileOpen(true)}
              aria-label={`Edit profile for ${email || "Admin"}`}
              sx={{
                display: { xs: "none", sm: "flex" },
                minHeight: 44,
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                transition: theme.transitions.create(
                  ["background-color", "border-color"],
                  { duration: theme.transitions.duration.shortest },
                ),
                "&:hover": {
                  borderColor: alpha(BRAND.indigo, 0.35),
                  bgcolor: alpha(BRAND.indigo, 0.04),
                },
                "&:focus-visible": {
                  outline: `3px solid ${alpha(BRAND.indigo, 0.35)}`,
                  outlineOffset: 2,
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
              <EditIcon
                aria-hidden="true"
                sx={{ fontSize: 15, color: BRAND.muted }}
              />
            </ButtonBase>

            {/* Mobile profile icon */}
            <IconButton
              onClick={() => setProfileOpen(true)}
              aria-label="Edit my profile"
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                width: 44,
                height: 44,
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
        variant={isSmallScreen ? "temporary" : "permanent"}
        open={isSmallScreen ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          component: "nav",
          "aria-label": "Platform administration",
        }}
        sx={{
          width: { xs: 0, md: drawerWidth },
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            duration: theme.transitions.duration.shorter,
          }),
          "& .MuiDrawer-paper": {
            width: isSmallScreen ? FULL_WIDTH : drawerWidth,
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
            overscrollBehavior: "contain",
          }}
        >
          {/* Brand */}
          <Box
            sx={{
              height: 72,
              px: !isSmallScreen && collapsed ? 0 : 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent:
                !isSmallScreen && collapsed ? "center" : "flex-start",
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
            {(isSmallScreen || !collapsed) && (
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
                bgcolor: alpha("#fff", 0.2), // was 0.12 — more visible
                borderRadius: 3,
              },
            }}
          >
            {menuGroups.map((group, gi) => (
              <Box key={group.label} sx={{ mb: 1 }}>
                {(isSmallScreen || !collapsed) && (
                  <Typography
                    sx={{
                      px: 2,
                      py: 0.75,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: alpha("#fff", 0.6), // was 0.4 — better contrast
                      textTransform: "uppercase",
                    }}
                  >
                    {group.label}
                  </Typography>
                )}
                {!isSmallScreen && collapsed && gi > 0 && (
                  <Divider
                    sx={{ my: 1, mx: 1.5, borderColor: alpha("#fff", 0.1) }}
                  />
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const showLabel = isSmallScreen || !collapsed;

                  return (
                    <ListItem
                      key={item.text}
                      disablePadding
                      sx={{ display: "block", mb: 0.25 }}
                    >
                      <Tooltip
                        title={!showLabel ? item.text : ""}
                        placement="right"
                        arrow
                      >
                        <ListItemButton
                          component={Link}
                          to={item.path}
                          selected={isActive}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => {
                            if (isSmallScreen) setMobileOpen(false);
                          }}
                          sx={{
                            borderRadius: 2,
                            minHeight: 44,
                            justifyContent: showLabel ? "flex-start" : "center",
                            touchAction: "manipulation",
                            px: showLabel ? 1.75 : 1,
                            mx: 0.5,
                            color: alpha("#fff", 0.85), // was 0.72 — clearer text
                            transition: theme.transitions.create(
                              ["background-color", "color", "box-shadow"],
                              { duration: theme.transitions.duration.shortest },
                            ),
                            "&:focus-visible": {
                              outline: `3px solid ${alpha("#fff", 0.45)}`,
                              outlineOffset: -2,
                            },
                            "& .MuiListItemIcon-root": {
                              color: alpha("#fff", 0.7), // was 0.55
                              minWidth: 0,
                              mr: showLabel ? 1.5 : 0,
                              justifyContent: "center",
                              transition: "color 0.15s ease",
                            },
                            "& .MuiListItemText-primary": {
                              color: "inherit", // keep text tied to button color
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
                              "& .MuiListItemIcon-root": { color: "#a5b4fc" },
                              "&:hover": { bgcolor: alpha(BRAND.indigo, 0.25) },
                            },
                          }}
                        >
                          <ListItemIcon aria-hidden="true">
                            {item.icon}
                          </ListItemIcon>
                          {showLabel && (
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: "0.875rem",
                                fontWeight: isActive ? 600 : 500,
                                noWrap: true,
                                color: "inherit", // <-- was missing; ensures correct font color
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
            <Tooltip
              title={!isSmallScreen && collapsed ? "Logout" : ""}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => {
                  setLogoutOpen(true);
                  if (isSmallScreen) setMobileOpen(false);
                }}
                aria-label="Log out of the admin account"
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  touchAction: "manipulation",
                  justifyContent:
                    isSmallScreen || !collapsed ? "flex-start" : "center",
                  px: isSmallScreen || !collapsed ? 1.75 : 1,
                  color: "#f87171", // base red (text + icon)
                  "&:focus-visible": {
                    outline: `3px solid ${alpha("#fff", 0.45)}`,
                    outlineOffset: -2,
                  },
                  "& .MuiListItemIcon-root": {
                    color: "inherit", // follows button color
                    minWidth: 0,
                    mr: isSmallScreen || !collapsed ? 1.5 : 0,
                    justifyContent: "center",
                    transition: "color 0.15s ease",
                  },
                  "&:hover": {
                    bgcolor: alpha("#ef4444", 0.12),
                    color: "#fca5a5", // lighter red on hover
                  },
                }}
              >
                <ListItemIcon aria-hidden="true">
                  <LogoutIcon />
                </ListItemIcon>
                {(isSmallScreen || !collapsed) && (
                  <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "inherit", 
                      noWrap: true,
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
        id="admin-main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflowX: "hidden",
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2.5, sm: 3, md: 4 },
          mt: 8,
          scrollMarginTop: 80,
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: "auto", width: "100%" }}>
          {outlet ?? (
            <Box>
              {location.pathname === "/admin" ? (
                <AdminDashboard />
              ) : (
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: BRAND.ink,
                    letterSpacing: "-0.02em",
                    mb: 3,
                  }}
                >
                  {allMenuItems.find((item) => item.path === location.pathname)
                    ?.text ?? "Admin Dashboard"}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{ sx: { borderRadius: 3, m: 2, width: "100%", maxWidth: 420 } }}
      >
        <DialogTitle id="logout-dialog-title" sx={{ fontWeight: 700 }}>
          Log Out?
        </DialogTitle>
        <DialogContent>
          <Typography id="logout-dialog-description" color="text.secondary">
            You’ll need to sign in again to manage the platform.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 600 }}
          >
            Stay Signed In
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}
          >
            Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
