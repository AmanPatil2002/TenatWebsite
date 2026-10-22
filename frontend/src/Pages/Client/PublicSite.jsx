import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  CircularProgress,
  CssBaseline,
  IconButton,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ---- helpers ------------------------------------------------------------

// MySQL JSON columns may arrive parsed or as strings
const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Subdomain comes from the route (/s/:subdomain) or, failing that,
// from the first label of the host (school.yourapp.com -> "school")
const resolveSubdomain = (fromRoute) => {
  if (fromRoute) return fromRoute;
  const parts = window.location.hostname.split(".");
  return parts.length > 2 ? parts[0] : null;
};

const buildMuiTheme = (themeRow) => {
  const s = parseJson(themeRow?.settings, {}) || {};
  return createTheme({
    palette: {
      primary: { main: s.primaryColor || "#1565c0" },
      secondary: { main: s.secondaryColor || "#455a64" },
      background: { default: s.backgroundColor || "#ffffff" },
      text: { primary: s.textColor || "#1a1a1a" },
    },
    typography: {
      fontFamily: s.fontFamily || '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: { borderRadius: Number(s.borderRadius ?? 8) },
  });
};

// Build { topLevel: [...], childrenOf: { [parentId]: [...] } } from menu pages
const buildMenu = (pages) => {
  const menuPages = pages.filter((p) => p.showInMenu);
  const childrenOf = {};
  menuPages.forEach((p) => {
    if (p.parentId) (childrenOf[p.parentId] ||= []).push(p);
  });
  const ids = new Set(menuPages.map((p) => p.id));
  // a child whose parent isn't in the menu is promoted to top level
  const topLevel = menuPages.filter((p) => !p.parentId || !ids.has(p.parentId));
  return { topLevel, childrenOf };
};

// ---- content blocks -----------------------------------------------------
// Page `content` is a JSON array of blocks. Supported shapes:
//   { type: "hero",    title, subtitle, image, buttonText, buttonLink }
//   { type: "heading", text, level }
//   { type: "text",    text }
//   { type: "image",   src, alt }
//   { type: "gallery", images: [{ src, alt }] }
//   { type: "list",    items: ["...", "..."] }
//   { type: "button",  text, link }
// Unknown block types fall back to showing title/text if present.
function Block({ block }) {
  if (!block || typeof block !== "object") return null;
  const type = block.type;

  switch (type) {
    case "hero":
      return (
        <Box
          sx={{
            py: { xs: 8, md: 14 },
            px: 2,
            textAlign: "center",
            color: block.image ? "#fff" : "text.primary",
            backgroundColor: block.image ? "grey.900" : "action.hover",
            backgroundImage: block.image
              ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5)), url(${block.image})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h2" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "3.25rem" } }}>
              {block.title}
            </Typography>
            {block.subtitle && (
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 400, opacity: 0.9 }}>
                {block.subtitle}
              </Typography>
            )}
            {block.buttonText && (
              <Button
                variant="contained"
                size="large"
                href={block.buttonLink || "#"}
                sx={{ mt: 4 }}
              >
                {block.buttonText}
              </Button>
            )}
          </Container>
        </Box>
      );

    case "heading":
      return (
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Typography
            variant={`h${Math.min(Math.max(Number(block.level) || 2, 1), 6)}`}
            sx={{ fontWeight: 700 }}
          >
            {block.text}
          </Typography>
        </Container>
      );

    case "text":
    case "paragraph":
      return (
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
            {block.text}
          </Typography>
        </Container>
      );

    case "image":
      return (
        <Container maxWidth="md" sx={{ py: 2 }}>
          <Box
            component="img"
            src={block.src}
            alt={block.alt || ""}
            sx={{ width: "100%", height: "auto", borderRadius: 1, display: "block" }}
          />
        </Container>
      );

    case "gallery":
      return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <ImageList cols={3} gap={12} sx={{ "@media (max-width:600px)": { gridTemplateColumns: "repeat(1, 1fr) !important" } }}>
            {(block.images || []).map((img, i) => (
              <ImageListItem key={i}>
                <img src={img.src} alt={img.alt || ""} loading="lazy" style={{ borderRadius: 8 }} />
              </ImageListItem>
            ))}
          </ImageList>
        </Container>
      );

    case "list":
      return (
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <List dense sx={{ listStyleType: "disc", pl: 3 }}>
            {(block.items || []).map((item, i) => (
              <ListItem key={i} sx={{ display: "list-item", px: 0 }}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Container>
      );

    case "button":
      return (
        <Container maxWidth="md" sx={{ py: 2 }}>
          <Button variant="contained" href={block.link || "#"}>
            {block.text}
          </Button>
        </Container>
      );

    default:
      if (block.title || block.text) {
        return (
          <Container maxWidth="md" sx={{ py: 2 }}>
            {block.title && (
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {block.title}
              </Typography>
            )}
            {block.text && <Typography sx={{ mt: 1 }}>{block.text}</Typography>}
          </Container>
        );
      }
      return null;
  }
}

function PageContent({ page }) {
  const blocks = parseJson(page.content, []);
  const list = Array.isArray(blocks) ? blocks : [];

  // No hero block? still give the page a visible title
  const hasHero = list.some((b) => b?.type === "hero");

  return (
    <Box component="main" sx={{ flex: 1, pb: 6 }}>
      {!hasHero && (
        <Container maxWidth="md" sx={{ pt: 5, pb: 1 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "1.9rem", md: "2.5rem" } }}>
            {page.title}
          </Typography>
        </Container>
      )}
      {list.length === 0 ? (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Typography color="text.secondary">This page has no content yet.</Typography>
        </Container>
      ) : (
        list.map((block, i) => <Block key={i} block={block} />)
      )}
    </Box>
  );
}

// ---- navigation ---------------------------------------------------------
function NavItem({ page, children, onNavigate }) {
  const [anchor, setAnchor] = useState(null);

  if (!children?.length) {
    return (
      <Button color="inherit" onClick={() => onNavigate(page.slug)}>
        {page.title}
      </Button>
    );
  }

  return (
    <>
      <Button
        color="inherit"
        endIcon={<ArrowDropDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {page.title}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onNavigate(page.slug);
          }}
        >
          {page.title}
        </MenuItem>
        {children.map((c) => (
          <MenuItem
            key={c.id}
            onClick={() => {
              setAnchor(null);
              onNavigate(c.slug);
            }}
          >
            {c.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function SiteHeader({ site, menu, onNavigate }) {
  const [mobileAnchor, setMobileAnchor] = useState(null);

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, flexGrow: 1, cursor: "pointer" }}
          onClick={() => onNavigate(null)}
        >
          {site.siteName}
        </Typography>

        {/* desktop */}
        <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" } }}>
          {menu.topLevel.map((p) => (
            <NavItem key={p.id} page={p} children={menu.childrenOf[p.id]} onNavigate={onNavigate} />
          ))}
        </Stack>

        {/* mobile */}
        <IconButton
          color="inherit"
          aria-label="Open menu"
          sx={{ display: { xs: "inline-flex", md: "none" } }}
          onClick={(e) => setMobileAnchor(e.currentTarget)}
        >
          <MenuIcon />
        </IconButton>
        <Menu anchorEl={mobileAnchor} open={!!mobileAnchor} onClose={() => setMobileAnchor(null)}>
          {menu.topLevel.flatMap((p) => [
            <MenuItem
              key={p.id}
              onClick={() => {
                setMobileAnchor(null);
                onNavigate(p.slug);
              }}
            >
              {p.title}
            </MenuItem>,
            ...(menu.childrenOf[p.id] || []).map((c) => (
              <MenuItem
                key={c.id}
                sx={{ pl: 4 }}
                onClick={() => {
                  setMobileAnchor(null);
                  onNavigate(c.slug);
                }}
              >
                {c.title}
              </MenuItem>
            )),
          ])}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

function SiteFooter({ site, contact }) {
  return (
    <Box component="footer" sx={{ bgcolor: "grey.900", color: "grey.100", py: 4, mt: "auto" }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 6 }} sx={{ justifyContent: "space-between" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {site.siteName}
          </Typography>
          {contact && (
            <Stack spacing={0.5}>
              {contact.address && <Typography variant="body2">{contact.address}</Typography>}
              {contact.phone && (
                <Typography variant="body2">
                  <a href={`tel:${contact.phone}`} style={{ color: "inherit" }}>
                    {contact.phone}
                  </a>
                </Typography>
              )}
              {contact.email && (
                <Typography variant="body2">
                  <a href={`mailto:${contact.email}`} style={{ color: "inherit" }}>
                    {contact.email}
                  </a>
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
        <Typography variant="caption" sx={{ display: "block", mt: 3, opacity: 0.6 }}>
          © {new Date().getFullYear()} {site.siteName}
        </Typography>
      </Container>
    </Box>
  );
}

// ---- main ---------------------------------------------------------------
// Routes:
//   <Route path="/s/:subdomain" element={<PublicSite />} />
//   <Route path="/s/:subdomain/:slug" element={<PublicSite />} />
// On a real subdomain (school.yourapp.com) use "/" and "/:slug" instead —
// the subdomain is then read from the hostname.
export default function PublicSite() {
  const { subdomain: subdomainParam, slug } = useParams();
  const navigate = useNavigate();
  const subdomain = resolveSubdomain(subdomainParam);

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error

  useEffect(() => {
    if (!subdomain) {
      setStatus("notfound");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    axios
      .get(`${API_URL}/public/sites/${subdomain}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? "notfound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  const muiTheme = useMemo(() => buildMuiTheme(data?.theme), [data]);
  const menu = useMemo(() => buildMenu(data?.pages || []), [data]);

  // Which page to show: the slug in the URL, else the home page, else the first one
  const currentPage = useMemo(() => {
    const pages = data?.pages || [];
    if (slug) return pages.find((p) => p.slug === slug) || null;
    return (
      pages.find((p) => p.pageType === "home") ||
      pages.find((p) => p.slug === "home") ||
      pages.find((p) => !p.parentId) ||
      pages[0] ||
      null
    );
  }, [data, slug]);

  // Keep the browser tab title in sync
  useEffect(() => {
    if (data?.site) {
      document.title = currentPage
        ? `${currentPage.title} | ${data.site.siteName}`
        : data.site.siteName;
    }
  }, [data, currentPage]);

  const handleNavigate = (targetSlug) => {
    const base = subdomainParam ? `/s/${subdomainParam}` : "";
    navigate(targetSlug ? `${base}/${targetSlug}` : base || "/");
    window.scrollTo({ top: 0 });
  };

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === "notfound" || status === "error") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", p: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {status === "notfound" ? "Site not found" : "Something went wrong"}
          </Typography>
          <Typography color="text.secondary">
            {status === "notfound"
              ? "This site doesn't exist or isn't published yet."
              : "We couldn't load this site. Please try again in a moment."}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <SiteHeader site={data.site} menu={menu} onNavigate={handleNavigate} />

        {currentPage ? (
          <PageContent page={currentPage} />
        ) : (
          <Container maxWidth="md" sx={{ flex: 1, py: 8, textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Page not found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {slug ? "This page doesn't exist or isn't published." : "This site has no published pages yet."}
            </Typography>
            {slug && (
              <Button variant="contained" onClick={() => handleNavigate(null)}>
                Go to home page
              </Button>
            )}
          </Container>
        )}

        <SiteFooter site={data.site} contact={data.contact} />
      </Box>
    </ThemeProvider>
  );
}