import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import HailIcon from "@mui/icons-material/Hail";
import PersonIcon from "@mui/icons-material/Person";

function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    handleCloseUserMenu();
    navigate("/");
  };

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");

  const navItems = [
    { name: "Home", path: "/" },
    ...(isAuthenticated
      ? [
          { name: "Contact", path: "/contact" },
          { name: "Template", path: "/templates" },
          ...(role === "admin"
            ? [{ name: "Admin", path: "/admin/admindashboard" }]
            : []),
        ]
      : []),
  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: "#172033" }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          {/* Mobile: hamburger menu */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              edge="start"
            >
              <MenuIcon />
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              keepMounted
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.name}
                  component={Link}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                >
                  <Typography>{item.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Brand: one block for both mobile and desktop */}
          <Box
            component={Link}
            to="/home"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: { xs: 1, md: 0 }, // mobile: pushes the avatar to the right
              mr: { md: 3 },
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <HailIcon />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: { xs: ".15rem", md: ".3rem" },
                fontSize: { xs: "1.05rem", md: "1.25rem" },
              }}
            >
              Tenant Website
            </Typography>
          </Box>

          {/* Desktop: nav buttons */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.name}
                component={Link}
                to={item.path}
                sx={{ color: "white" }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* User area */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isAuthenticated ? (
              <>
                <Tooltip title="My Profile">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "white",
                        color: "#1976d2",
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {(username || email)?.charAt(0)?.toUpperCase() || <PersonIcon />}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  id="user-menu"
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  sx={{ mt: 1 }}
                  keepMounted
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem component={Link} to="/myaccount" onClick={handleCloseUserMenu}>
                    <Typography>My Account</Typography>
                  </MenuItem>
                  <MenuItem component={Link} to="/mysite" onClick={handleCloseUserMenu}>
                    <Typography>Purchased Templates</Typography>
                  </MenuItem>
                  <MenuItem component={Link} to="/review" onClick={handleCloseUserMenu}>
                    <Typography>Review</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Typography sx={{ color: "red" }}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={Link}
                to="/login"
                color="inherit"
                variant="outlined"
                sx={{ borderColor: "rgba(255,255,255,0.7)" }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;