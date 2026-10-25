import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  Stack,
  Divider,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PLACEHOLDER_IMG = "https://placehold.co/600x340?text=No+Preview";

const PREVIEW_WIDTHS = ["100%", 768, 390];

export default function Template() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("You are not logged in");

        const res = await fetch(`${API_URL}/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 401)
            throw new Error("Your session has expired. Please log in again.");
          if (res.status === 403)
            throw new Error("You don't have permission to view templates.");
          throw new Error(data?.message || "Failed to load projects");
        }
        if (!Array.isArray(data)) throw new Error("Invalid templates response");

        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box sx={{ bgcolor: "#f7f7f8", minHeight: "100vh", pb: 8 }}>
      {templates.map((selected) => (
        <>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Button onClick={() => navigate("/")}>Back</Button>
            <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
              {selected.name}
            </Typography>

            <Box sx={{ backgroundColor: "lightgrey" }}>
              <Tabs onChange={handleTabChange} value={tabIndex}>
                <Tab label="Desktop" />
                <Tab label="Tablet" />
                <Tab label="Mobile" />
              </Tabs>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              bgcolor: "#eee",
              borderRadius: 1,
              p: 1,
            }}
          >
            {selected.demoUrl ? (
              <Box
                component="iframe"
                src={selected.demoUrl}
                title={`${selected.name} preview`}
                sx={{
                  width: PREVIEW_WIDTHS[tabIndex],
                  maxWidth: "100%",
                  height: "60vh",
                  border: 0,
                  bgcolor: "#fff",
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                component="img"
                src={selected.thumbnailUrl || PLACEHOLDER_IMG}
                alt={selected.name}
                sx={{
                  width: PREVIEW_WIDTHS[tabIndex],
                  maxWidth: "100%",
                  maxHeight: "30%",
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
        </>
      ))}
    </Box>
  );
}
