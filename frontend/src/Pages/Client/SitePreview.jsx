import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FALLBACK_IMAGE = "https://placehold.co/1200x700?text=Site+Preview";

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return typeof value === "object" ? value : fallback;
};

const isVisibleMenuItem = (item) => item && Number(item.isVisible) !== 0;

const getThemeSettings = (theme) => {
  const parsed = parseJson(theme?.settings, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const renderPageContent = (content) => {
  const blocks = Array.isArray(content) ? content : typeof content === "string" ? [content] : [];

  if (!blocks.length) {
    return (
      <Typography variant="body1" color="text.secondary">
        This page has no content yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {blocks.map((block, index) => {
        if (typeof block === "string") {
          return (
            <Typography key={index} variant="body1" sx={{ lineHeight: 1.8 }}>
              {block}
            </Typography>
          );
        }

        if (!block || typeof block !== "object") {
          return null;
        }

        if (block.type === "heading" || block.type === "title") {
          return (
            <Typography key={index} variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {block.text || block.content || "Heading"}
            </Typography>
          );
        }

        if (block.type === "subheading" || block.type === "subtitle") {
          return (
            <Typography key={index} variant="h6" fontWeight={600} sx={{ lineHeight: 1.5 }}>
              {block.text || block.content || "Subheading"}
            </Typography>
          );
        }

        if (block.type === "paragraph" || block.type === "text") {
          return (
            <Typography key={index} variant="body1" sx={{ lineHeight: 1.8 }}>
              {block.text || block.content || ""}
            </Typography>
          );
        }

        if (block.type === "image" || block.type === "img") {
          const image = block.src || block.url || block.imageUrl || FALLBACK_IMAGE;
          return (
            <Box
              key={index}
              component="img"
              src={image}
              alt={block.alt || "Site content"}
              sx={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 2 }}
            />
          );
        }

        if (block.type === "list") {
          const items = Array.isArray(block.items) ? block.items : [];
          return (
            <List key={index} sx={{ listStyleType: "disc", pl: 3 }}>
              {items.map((item, itemIndex) => (
                <ListItem key={itemIndex} disablePadding sx={{ display: "list-item" }}>
                  <Typography variant="body1">{item.text || item}</Typography>
                </ListItem>
              ))}
            </List>
          );
        }

        if (block.type === "button") {
          return (
            <Button key={index} variant="contained" href={block.link || "#"}>
              {block.label || "Learn more"}
            </Button>
          );
        }

        if (block.type === "html") {
          return (
            <Box
              key={index}
              dangerouslySetInnerHTML={{ __html: block.html || block.content || "" }}
            />
          );
        }

        return (
          <Typography key={index} variant="body1" sx={{ lineHeight: 1.8 }}>
            {block.text || block.content || "Content"}
          </Typography>
        );
      })}
    </Stack>
  );
};

export default function SitePreview() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [themes, setThemes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePageSlug, setActivePageSlug] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchSiteData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view this site.");
        setLoading(false);
        return;
      }

      try {
        const [siteResponse, pagesResponse, themesResponse, menuResponse] = await Promise.all([
          axios.get(`${API}/site/${siteId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/site/${siteId}/pages`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/site/${siteId}/themes`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/site/${siteId}/menu`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (cancelled) return;

        const siteData = siteResponse.data || null;
        const pageData = Array.isArray(pagesResponse.data) ? pagesResponse.data : [];
        const themeData = Array.isArray(themesResponse.data) ? themesResponse.data : [];
        const menuData = Array.isArray(menuResponse.data) ? menuResponse.data : [];

        setSite(siteData);
        setPages(pageData.filter((page) => page.isPublished !== false));
        setThemes(themeData);
        setMenuItems(menuData.filter(isVisibleMenuItem));

        const defaultPage = pageData.find((page) => page.isPublished !== false) || pageData[0] || null;
        if (defaultPage) {
          setActivePageSlug(defaultPage.slug || "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.message || "Could not load site preview.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSiteData();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const activeTheme = useMemo(
    () => themes.find((theme) => Number(theme.isActive) === 1) || themes[0] || null,
    [themes],
  );

  const themeSettings = useMemo(() => getThemeSettings(activeTheme), [activeTheme]);

  const currentPage = useMemo(
    () => pages.find((page) => page.slug === activePageSlug) || pages[0] || null,
    [pages, activePageSlug],
  );

  const headerMenu = useMemo(
    () =>
      menuItems
        .filter((item) => item.menuLocation === "header")
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [menuItems],
  );

  const pageLinks = useMemo(
    () =>
      pages
        .slice()
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        .map((page) => ({
          label: page.title,
          slug: page.slug,
        })),
    [pages],
  );

  const previewStyles = {
    background: themeSettings.background || "#f8fafc",
    color: themeSettings.text || "#0f172a",
    borderColor: themeSettings.primary || "#dbeafe",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", background: previewStyles.background, color: previewStyles.color }}>
      <Box
        sx={{
          borderBottom: `1px solid ${previewStyles.borderColor}`,
          background: themeSettings.headerBackground || "rgba(255,255,255,0.94)",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2} sx={{ py: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" fontWeight={700}>{site.name}</Typography>
              {activeTheme && <Typography variant="caption" sx={{ opacity: 0.75 }}>{activeTheme.name}</Typography>}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {headerMenu.length ? (
                headerMenu.map((item) => (
                  <Button
                    key={item.id}
                    variant="text"
                    size="small"
                    onClick={() => {
                      if (item.pageId) {
                        const page = pages.find((entry) => Number(entry.id) === Number(item.pageId));
                        if (page) setActivePageSlug(page.slug);
                      } else if (item.subPageId) {
                        const page = pages.find((entry) => Number(entry.id) === Number(item.subPageId));
                        if (page) setActivePageSlug(page.slug);
                      } else if (item.externalUrl) {
                        window.open(item.externalUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    sx={{ color: themeSettings.primary || "#0f172a", textTransform: "none" }}
                  >
                    {item.label || item.displayLabel || "Link"}
                  </Button>
                ))
              ) : (
                pageLinks.map((page) => (
                  <Button key={page.slug} variant="text" size="small" onClick={() => setActivePageSlug(page.slug)} sx={{ color: themeSettings.primary || "#0f172a", textTransform: "none" }}>
                    {page.label}
                  </Button>
                ))
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${previewStyles.borderColor}`, background: themeSettings.cardBackground || "rgba(255,255,255,0.8)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Pages</Typography>
                <List disablePadding>
                  {pages.map((page) => (
                    <ListItem key={page.id} disablePadding>
                      <ListItemButton
                        selected={Boolean(currentPage && Number(currentPage.id) === Number(page.id))}
                        onClick={() => setActivePageSlug(page.slug)}
                        sx={{ borderRadius: 2, px: 1.5, py: 1 }}
                      >
                        <ListItemText primary={page.title} secondary={page.pageType} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            <Box
              sx={{
                background: themeSettings.cardBackground || "rgba(255,255,255,0.9)",
                borderRadius: 4,
                border: `1px solid ${previewStyles.borderColor}`,
                p: { xs: 2, md: 4 },
                minHeight: 520,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h3" fontWeight={800}>{currentPage?.title || site.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{site.subdomain || site.customDomain || "Custom site"}</Typography>
                </Box>
                <Button variant="outlined" onClick={() => navigate(`/mysite/${siteId}`)}>Edit this site</Button>
              </Stack>

              <Divider sx={{ mb: 3 }} />
              {currentPage ? renderPageContent(parseJson(currentPage.content, [])) : <Typography>No page selected.</Typography>}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
