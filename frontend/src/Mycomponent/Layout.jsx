import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function Layout() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header />
      <Box
        component="main"
        id="main-content"
        sx={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}

export default Layout;
