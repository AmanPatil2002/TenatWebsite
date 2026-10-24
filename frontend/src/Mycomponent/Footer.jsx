import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Stack,
} from "@mui/material";

import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";

export default function Footer() {
  const role = localStorage.getItem("role");
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#172033",
        color: "white",
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
          sx={{
            py: 6,
          }}
        >
          <Grid item xs={12} sm={6} md={4}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 2,
                color: "#ffffff",
              }}
            >
              Tenant Website
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#b8c0cc",
                lineHeight: 1.8,
                maxWidth: 350,
              }}
            >
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Possimus nulla fugiat et veniam dicta? Reiciendis magnam dolores maiores repellendus molestiae!
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <IconButton
                component="a"
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": {
                    color: "#0A66C2",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <LinkedInIcon />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": {
                    color: "#FF0000",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <YouTubeIcon />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": {
                    color: "#E4405F",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <InstagramIcon />
              </IconButton>

              <IconButton
                component="a"
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": {
                    color: "#1877F2",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <FacebookIcon />
              </IconButton>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 2,
              }}
            >
              Quick Links
            </Typography>

            <Stack spacing={1.5}>
              <Link
                href="/home"
                underline="none"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": { color: "#ffffff" },
                }}
              >
                Home
              </Link>

              <Link
                href="/contact"
                underline="none"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": { color: "#ffffff" },
                }}
              >
                Contact
              </Link>
              <Link
                href="/viewtemp"
                underline="none"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": { color: "#ffffff" },
                }}
              >
                Template
              </Link>
              <Link
                href="/myaccount"
                underline="none"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": { color: "#ffffff" },
                }}
              >
                Contact
              </Link>
              {role === "admin" || role === "superadmin" &&
              <Link
                href="/admin"
                underline="none"
                sx={{
                  color: "#b8c0cc",
                  "&:hover": { color: "#ffffff" },
                }}
              >
                Admin
              </Link>
}
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            py: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#9ca6b5",
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} Tenant Website. All Rights Reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
