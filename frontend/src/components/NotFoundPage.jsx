import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1}
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 6,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
          <Typography variant="overline" color="primary.main">
            Error 404
          </Typography>
          <Typography variant="h3" sx={{ mt: 1 }}>
            This page could not be found
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 480, mx: "auto" }}>
            Check the address, return to the previous page, or go back to the home page.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 4, justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              component={Link}
              to="/"
              variant="contained"
              startIcon={<HomeRoundedIcon />}
            >
              Go to Home
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
