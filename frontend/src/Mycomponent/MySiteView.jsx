import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import LaptopIcon from "@mui/icons-material/Laptop";
import TvIcon from "@mui/icons-material/Tv";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// tv = full width, laptop = fixed laptop width, phone = phone width
const DEVICE_WIDTHS = {
  tv: "100%",
  laptop: 1280,
  phone: 390,
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const buildSrcDoc = (html, background, color) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        padding: 16px;
        background: ${background};
        color: ${color};
        font-family: Arial, Helvetica, sans-serif;
      }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }
    </style>
  </head>
  <body>${html || "<p>This page has no content yet.</p>"}</body>
</html>`;

export default function MySiteView() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [devices, setDevices] = useState("tv");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [pagesRes, sitesRes] = await Promise.all([
          axios.get(`${API_URL}/sites/${siteId}/pages`, { headers }),
          axios.get(`${API_URL}/sites/my`, { headers }).catch(() => null),
        ]);
        if (cancelled) return;

        const list = Array.isArray(pagesRes.data?.pages) ? pagesRes.data.pages : [];
        const meta = Array.isArray(sitesRes?.data)
          ? sitesRes.data.find((s) => String(s.id) === String(siteId))
          : null;

        setPages(list);
        setActiveId(list[0] ? String(list[0].pagesId) : "");
        setSite({
          color: meta?.color || list[0]?.color || "#222222",
          background: meta?.background || list[0]?.background || "#ffffff",
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : err.response?.data?.message || "Could not load this site."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [siteId, navigate]);

  const activePage = useMemo(
    () => pages.find((p) => String(p.pagesId) === String(activeId)),
    [pages, activeId]
  );

  const handleDevices = (_, value) => {
    if (value) setDevices(value); // ignore deselect so one is always active
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#fff" }}>
      {/* Top bar: device toggle on the left of the My sites button */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={devices}
          onChange={handleDevices}
          aria-label="device"
        >
          <ToggleButton value="laptop" aria-label="laptop">
            <LaptopIcon />
          </ToggleButton>
          <ToggleButton value="tv" aria-label="tv">
            <TvIcon />
          </ToggleButton>
          <ToggleButton value="phone" aria-label="phone">
            <PhoneAndroidIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <Button onClick={() => navigate("/mysite")}>← My sites</Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      ) : pages.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>This site has no pages yet.</Alert>
      ) : (
        <>
          <Tabs
            value={activeId}
            onChange={(_, value) => setActiveId(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            {pages.map((p) => (
              <Tab
                key={p.pagesId}
                value={String(p.pagesId)}
                label={p.title}
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
            ))}
          </Tabs>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              justifyContent: "center",
              bgcolor: devices === "tv" ? "transparent" : "#e5e7eb",
            }}
          >
            <Box
              component="iframe"
              key={`${activeId}-${devices}`}
              title={activePage?.title || "Page preview"}
              sandbox=""
              srcDoc={buildSrcDoc(activePage?.page, site?.background, site?.color)}
              sx={{
                width: DEVICE_WIDTHS[devices],
                maxWidth: "100%",
                height: "100%",
                border: 0,
                display: "block",
                bgcolor: site?.background || "#fff",
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
}