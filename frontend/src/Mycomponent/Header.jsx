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
import PersonIcon from '@mui/icons-material/Person';

function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    handleCloseUserMenu();
    navigate("/login");
  };

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const role = localStorage.getItem("role");
  const navItems = [
    { name: "Home", path: "/" },
    ...(isAuthenticated
      ? [
          { name: "Contact", path: "/contact" },
          { name: "Template", path: "/viewtemp" },
          { name: "My Account", path: "/myaccount" },
          ...(role === "admin" || role === "superadmin"
            ? [{ name: "Admin", path: "/admin/admindashboard" }]
            : []),
        ]
      : []),
  ];
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");

  return (
    <AppBar position="static">
      <Container maxWidth="xl" sx={{ backgroundColor: "#172033" }}>
        <Toolbar disableGutters>
          <HailIcon
            sx={{
              display: { xs: "none", md: "flex" },
              mr: 1,
            }}
          />

          <Typography
            variant="h6"
            component={Link}
            to="/home"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Tenant Website
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "flex", md: "none" },
            }}
          >
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.name}
                  component={Link}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                >
                  <Typography sx={{ textAlign: "center" }}>
                    {item.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <HailIcon
            sx={{
              display: { xs: "flex", md: "none" },
              mr: 1,
            }}
          />

          <Typography
            variant="h5"
            component={Link}
            to="/home"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".2rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Tenant Website
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.name}
                component={Link}
                to={item.path}
                onClick={handleCloseNavMenu}
                sx={{
                  my: 2,
                  color: "white",
                  display: "block",
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            {isAuthenticated ? (
              <>
                <Tooltip title="My Profile">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        margin: "0 auto 15px",
                        bgcolor: "white",
                        color: "#1976d2",
                        fontSize: 15,
                      }}
                    >
                      {(username || email)?.charAt(0)?.toUpperCase() || (
                        <PersonIcon />
                      )}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  sx={{ mt: "45px" }}
                  id="user-menu"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    component={Link}
                    to="/myaccount"
                    onClick={handleCloseUserMenu}
                  >
                    <Typography sx={{ textAlign: "center" }}>My Account</Typography>
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/mysite"
                    onClick={handleCloseUserMenu}
                  >
                    <Typography sx={{ textAlign: "center" }}>Purchased Templates</Typography>
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/review"
                    onClick={handleCloseUserMenu}
                  >
                    <Typography sx={{ textAlign: "center" }}>Review</Typography>
                  </MenuItem>

                  <MenuItem onClick={handleLogout}>
                    <Typography sx={{ textAlign: "center", color: "red" }}>
                      Logout
                    </Typography>
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
