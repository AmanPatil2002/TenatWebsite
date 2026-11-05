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
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";

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
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#0f172a",
        backgroundImage: "linear-gradient(180deg, #111c31 0%, #0f172a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        color: "#e2e8f0",
        backdropFilter: "blur(8px)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 60, md: 68 }, gap: { xs: 0.5, md: 1 } }}>
          {/* Mobile: hamburger menu */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <IconButton
              size="medium"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              edge="start"
              sx={{
                borderRadius: 2,
                "&:hover": { backgroundColor: alpha("#ffffff", 0.08) },
              }}
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
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
                  },
                },
              }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.name}
                  component={Link}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                  sx={{
                    py: 1.25,
                    px: 2.25,
                    fontWeight: 500,
                    "&:hover": { backgroundColor: "#f1f5f9" },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.name}
                  </Typography>
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
              gap: 1.25,
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 4 },
              color: "inherit",
              textDecoration: "none",
              transition: "opacity 0.2s ease",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: { xs: 32, md: 36 },
                height: { xs: 32, md: 36 },
                borderRadius: 2,
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
              }}
            >
              <HailIcon sx={{ color: "#ffffff", fontSize: { xs: 18, md: 20 } }} />
            </Box>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontWeight: 700,
                letterSpacing: { xs: "0.02em", md: "0.04em" },
                fontSize: { xs: "1rem", md: "1.15rem" },
                color: "#f8fafc",
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
                disableRipple
                sx={{
                  color: "#cbd5e1",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 2,
                  position: "relative",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: alpha("#3b82f6", 0.15),
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* User area */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isAuthenticated ? (
              <>
                <Tooltip title="My Profile" arrow>
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{
                      p: 0.5,
                      border: "1px solid rgba(255,255,255,0.12)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "rgba(59,130,246,0.6)",
                        boxShadow: "0 0 0 4px rgba(59,130,246,0.12)",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: "#2563eb",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: '"Inter", "Segoe UI", sans-serif',
                      }}
                    >
                      {(username || email)?.charAt(0)?.toUpperCase() || <PersonIcon sx={{ fontSize: 18 }} />}
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
                  slotProps={{
                    paper: {
                      sx: {
                        minWidth: 210,
                        borderRadius: 2.5,
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 16px 40px rgba(15,23,42,0.16)",
                        p: 0.75,
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.25, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }} noWrap>
                      {username || "User"}
                    </Typography>
                    {email && (
                      <Typography variant="caption" sx={{ color: "#64748b" }} noWrap display="block">
                        {email}
                      </Typography>
                    )}
                  </Box>
                  <Divider sx={{ mb: 0.5 }} />
                  <MenuItem
                    component={Link}
                    to="/myaccount"
                    onClick={handleCloseUserMenu}
                    sx={{ borderRadius: 1.5, py: 1, px: 2, mb: 0.25 }}
                  >
                    <Typography variant="body2">My Account</Typography>
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/mysite"
                    onClick={handleCloseUserMenu}
                    sx={{ borderRadius: 1.5, py: 1, px: 2, mb: 0.25 }}
                  >
                    <Typography variant="body2">Purchased</Typography>
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/review"
                    onClick={handleCloseUserMenu}
                    sx={{ borderRadius: 1.5, py: 1, px: 2, mb: 0.25 }}
                  >
                    <Typography variant="body2">Review</Typography>
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/error-report"
                    onClick={handleCloseUserMenu}
                    sx={{ borderRadius: 1.5, py: 1, px: 2, mb: 0.25 }}
                  >
                    <Typography variant="body2">Error Report</Typography>
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      borderRadius: 1.5,
                      py: 1,
                      px: 2,
                      "&:hover": { backgroundColor: alpha("#ef4444", 0.08) },
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#dc2626", fontWeight: 600 }}>
                      Logout
                    </Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={Link}
                to="/login"
                variant="contained"
                disableElevation
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  px: { xs: 2, md: 2.5 },
                  py: 0.85,
                  borderRadius: 2,
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    boxShadow: "0 6px 20px rgba(37,99,235,0.45)",
                    transform: "translateY(-1px)",
                  },
                }}
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