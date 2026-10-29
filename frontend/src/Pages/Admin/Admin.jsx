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
} from "@mui/material";

import { useLocation, useNavigate, useOutlet } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import ContactMailIcon from "@mui/icons-material/ContactMail";
import PeopleIcon from "@mui/icons-material/People";
import RateReviewIcon from "@mui/icons-material/RateReview";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AdminDashboard from "../../Mycomponent/AdminDashboard";

const FULL_WIDTH = 250;
const MINI_WIDTH = 72;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/admindashboard" },
  { text: "Add Category", icon: <CategoryIcon />, path: "/admin/category" },
  { text: "Add Theme", icon: <ViewQuiltIcon />, path: "/admin/theme" },
  { text: "Add Pages", icon: <NoteAddIcon />, path: "/admin/page" },
  { text: "Add Templates", icon: <DevicesOtherIcon />, path: "/admin/templates" },
  { text: "View Templates", icon: <FolderOpenIcon />, path: "/admin/viewtemplates" },
  { text: "FAQ", icon: <HelpOutlineIcon />, path: "/admin/faq" },
  { text: "Contact", icon: <ContactMailIcon />, path: "/admin/contact" },
  { text: "View Users", icon: <PeopleIcon />, path: "/admin/users" },
  { text: "View Review", icon: <RateReviewIcon />, path: "/admin/usereview" },
  { text: "View Payment", icon: <RateReviewIcon />, path: "/admin/invoice" },
];

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const theme = useTheme();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // true = collapsed (icons only). Starts collapsed on small screens.
  const [collapsed, setCollapsed] = useState(isSmallScreen);

  // Auto-collapse when the screen shrinks, auto-expand when it grows
  useEffect(() => {
    setCollapsed(isSmallScreen);
  }, [isSmallScreen]);

  const drawerWidth = collapsed ? MINI_WIDTH : FULL_WIDTH;
  const email = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("Id");
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          boxShadow: 1,
          transition: theme.transitions.create(["width", "margin"], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            sx={{ mr: 2 }}
          >
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>

          <Typography variant="h6" fontWeight="bold" noWrap sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="h6"
              fontWeight="bold"
              noWrap
              sx={{
                border: "1px solid white",
                padding: "4px 8px",
                borderRadius: "4px",
                display: { xs: "none", sm: "block" },
              }}
            >
              {email}
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>

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
            transition: theme.transitions.create("width", {
              duration: theme.transitions.duration.shorter,
            }),
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              p: collapsed ? 2 : 3,
              textAlign: collapsed ? "center" : "left",
            }}
          >
            <Typography
              variant={collapsed ? "h6" : "h5"}
              fontWeight="bold"
              color="primary"
              noWrap
            >
              {collapsed ? <AdminPanelSettingsIcon /> : "Admin Panel"}
            </Typography>
          </Box>

          <Divider />

          <List sx={{ px: 1, flexGrow: 1, overflowY: "auto" }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <ListItem
                  key={item.text}
                  disablePadding
                  sx={{ display: "block", mb: 0.5 }}
                >
                  <Tooltip title={collapsed ? item.text : ""} placement="right">
                    <ListItemButton
                      selected={isActive}
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
                        "&.Mui-selected:hover": {
                          backgroundColor: "primary.dark",
                        },
                        "&:hover": {
                          backgroundColor: "primary.light",
                          color: "white",
                          "& .MuiListItemIcon-root": { color: "white" },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: collapsed ? 0 : 2,
                          justifyContent: "center",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      {!collapsed && <ListItemText primary={item.text} />}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>

          <Divider />

          <List sx={{ px: 1, py: 1 }}>
            <ListItem disablePadding>
              <Tooltip title={collapsed ? "Logout" : ""} placement="right">
                <ListItemButton
                  onClick={handleLogout}
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

                  {!collapsed && <ListItemText primary="Logout" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 },
          mt: 8,
        }}
      >
        {outlet ?? (
          <Box>
            {location.pathname === "/admin" ? (
              <AdminDashboard />
            ) : (
              <Typography variant="h5" component="h1" fontWeight="bold">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.text ?? "Admin Dashboard"}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}