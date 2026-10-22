import React from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  Avatar,
} from "@mui/material";

import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const contactDetails = [
  {
    title: "Phone Number",
    value: "+19 (XXXXXXXXXX)",
    icon: <PhoneIcon />,
  },
  {
    title: "Email Address",
    value: "info@tenant.com",
    icon: <EmailIcon />,
  },
  {
    title: "Address",
    value:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eaque, dolor.",
    icon: <LocationOnIcon />,
  },
];

export default function Contact() {
  return (
    <Box
      component="section"
      sx={{
        backgroundColor: "#f5f5f5",
        py: { xs: 5, sm: 7, md: 8 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Heading */}
        <Stack spacing={1} alignItems="center" sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            color="text.primary"
            textAlign="center"
            sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}
          >
            Contact Us
          </Typography>
          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 480 }}
          >
            Reach out using any of the details below.
          </Typography>
        </Stack>

        {/* Cards: stacked on mobile, 3 across on desktop */}
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="stretch">
          {contactDetails.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.title} sx={{ display: "flex" }}>
              <Paper
                elevation={2}
                sx={{
                  width: "100%",
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: { xs: "flex-start", md: "center" },
                  textAlign: { xs: "left", md: "center" },
                  transition: "box-shadow 0.3s ease, transform 0.3s ease",
                  "&:hover": {
                    boxShadow: 8,
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: "primary.main",
                    color: "common.white",
                    mb: 2,
                  }}
                >
                  {contact.icon}
                </Avatar>

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {contact.title}
                </Typography>

                <Typography color="text.secondary" sx={{ wordBreak: "break-word" }}>
                  {contact.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}