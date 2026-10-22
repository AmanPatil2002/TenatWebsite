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
  useMediaQuery,
  useTheme,
  Stack,
  Button,
} from "@mui/material";

import { Outlet, useLocation, useNavigate, useOutlet } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AdminDashboard from "../../Mycomponent/AdminDashboard";

const FULL_WIDTH = 250;
const MINI_WIDTH = 72;
const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/admin/admindashboard",
  },
  {
    text: "Add Category",
    icon: <WorkIcon />,
    path: "/admin/category",
  },
  {
    text: "Add Templates",
    icon: <WorkIcon />,
    path: "/admin/templates",
  },
  {
    text: "Add Theme",
    icon: <WorkIcon />,
    path: "/admin/theme",
  },
  {
    text: "Add Pages",
    icon: <WorkIcon />,
    path: "/admin/pages",
  },
  {
    text: "View Project",
    icon: <WorkIcon />,
    path: "/admin/projects",
  },
  {
    text: "View Users",
    icon: <PersonIcon />,
    path: "/admin/users",
  },
  {
    text: "View Review",
    icon: <AssignmentIcon />,
    path: "/admin/usereview",
  },
];

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const theme = useTheme();

  const role = localStorage.getItem("role");

  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const drawerWidth = compact ? MINI_WIDTH : FULL_WIDTH;
  const email = localStorage.getItem("email");
  const Id = localStorage.getItem("Id");
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f5f7fb",
      }}
    >
      
        <>
          <AppBar
            position="fixed"
            sx={{
              width: `calc(100% - ${drawerWidth}px)`,
              ml: `${drawerWidth}px`,
              boxShadow: 1,
            }}
          >
            <Toolbar>
              <Typography
                variant="h6"
                fontWeight="bold"
                noWrap
                sx={{ flexGrow: 1 }}
              >
                Admin Dashboard
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  noWrap
                  sx={{
                    flexGrow: 1,
                    border: "1px solid white",
                    padding: "4px 8px",
                    borderRadius: "4px",
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
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  p: compact ? 2 : 3,
                  textAlign: compact ? "center" : "left",
                }}
              >
                <Typography
                  variant={compact ? "h6" : "h5"}
                  fontWeight="bold"
                  color="primary"
                >
                  {compact ? <AdminPanelSettingsIcon/> : "Admin Panel"}
                </Typography>
              </Box>

              <Divider />

              <List sx={{ px: 1, flexGrow: 1 }}>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <ListItem
                      key={item.text}
                      disablePadding
                      sx={{
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      <Tooltip
                        title={compact ? item.text : ""}
                        placement="right"
                      >
                        <ListItemButton
                          selected={isActive}
                          onClick={() => navigate(item.path)}
                          sx={{
                            borderRadius: 2,

                            justifyContent: compact ? "center" : "flex-start",

                            px: compact ? 1 : 2,

                            "&.Mui-selected": {
                              backgroundColor: "primary.main",
                              color: "white",

                              "& .MuiListItemIcon-root": {
                                color: "white",
                              },
                            },

                            "&.Mui-selected:hover": {
                              backgroundColor: "primary.dark",
                            },

                            "&:hover": {
                              backgroundColor: "primary.light",
                              color: "white",

                              "& .MuiListItemIcon-root": {
                                color: "white",
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: compact ? 0 : 2,
                              justifyContent: "center",
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>

                          {!compact && <ListItemText primary={item.text} />}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
              <Divider />

              <List sx={{ px: 1, py: 1 }}>
                <ListItem disablePadding>
                  <Tooltip title={compact ? "Logout" : ""} placement="right">
                    <ListItemButton
                      onClick={handleLogout}
                      sx={{
                        borderRadius: 2,
                        color: "error.main",

                        justifyContent: compact ? "center" : "flex-start",

                        px: compact ? 1 : 2,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: compact ? 0 : 2,
                          justifyContent: "center",
                          color: "error.main",
                        }}
                      >
                        <LogoutIcon />
                      </ListItemIcon>

                      {!compact && <ListItemText primary="Logout" />}
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
                <Typography variant="h5" component="h1" fontWeight="bold">
                  {location.pathname === "/admin"
                    ? <AdminDashboard/>
                    : menuItems.find((item) => item.path === location.pathname)
                        ?.text ?? "Admin Dashboard"}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      
    </Box>
  );
}
