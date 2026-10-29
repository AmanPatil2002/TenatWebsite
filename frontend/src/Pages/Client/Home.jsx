import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Accordion, AccordionSummary, AccordionDetails,
  Box, CircularProgress, Alert, Button, Stack, Grid, Card, CardContent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ViewQuiltOutlinedIcon from '@mui/icons-material/ViewQuiltOutlined';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Shared palette
const c = {
  ink: '#1a1a2e',
  indigo: '#4361ee',
  violet: '#7b2ff7',
  coral: '#ff6b6b',
  sun: '#ffc233',
  mint: '#2ec4b6',
};

const starters = [
  { title: 'Ecommerce', desc: 'Ecommerce functionality built in.', color: c.coral, tint: '#fff0f0', Icon: ShoppingCartOutlinedIcon },
  { title: 'CMS', desc: 'CMS functionality built in.', color: c.mint, tint: '#e9faf8', Icon: ArticleOutlinedIcon },
  { title: 'Multi Layout', desc: 'Multiple layout variations built in.', color: c.violet, tint: '#f3ebff', Icon: ViewQuiltOutlinedIcon },
];

const faqColors = [c.indigo, c.coral, c.mint, c.sun, c.violet];

/* A small "browser window" made of CSS shapes, used in the hero collage */
function MockWindow({ color, accent, sx }) {
  return (
    <Box
      sx={{
        bgcolor: '#fff', borderRadius: 3, overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(26,26,46,0.18)', position: 'absolute', ...sx,
      }}
    >
      <Box sx={{ display: 'flex', gap: 0.6, px: 1.5, py: 1, bgcolor: '#f4f5fb' }}>
        {[c.coral, c.sun, c.mint].map((d) => (
          <Box key={d} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d }} />
        ))}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ height: 54, borderRadius: 2, bgcolor: color, mb: 1.2 }} />
        <Box sx={{ height: 8, width: '70%', borderRadius: 1, bgcolor: '#e3e6f3', mb: 0.8 }} />
        <Box sx={{ height: 8, width: '45%', borderRadius: 1, bgcolor: '#e3e6f3', mb: 1.2 }} />
        <Box sx={{ height: 14, width: 48, borderRadius: 1, bgcolor: accent }} />
      </Box>
    </Box>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative', overflow: 'hidden', py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #f1f3ff 0%, #fff4f0 55%, #eafaf7 100%)',
      }}
    >
      {/* soft colour blobs */}
      <Box sx={{ position: 'absolute', top: -120, left: -100, width: 340, height: 340, borderRadius: '50%', bgcolor: c.indigo, opacity: 0.14, filter: 'blur(60px)' }} />
      <Box sx={{ position: 'absolute', bottom: -140, right: -80, width: 380, height: 380, borderRadius: '50%', bgcolor: c.coral, opacity: 0.16, filter: 'blur(70px)' }} />
      <Box sx={{ position: 'absolute', top: '30%', right: '35%', width: 220, height: 220, borderRadius: '50%', bgcolor: c.sun, opacity: 0.16, filter: 'blur(60px)' }} />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h1" gutterBottom sx={{ color: c.ink }}>
              Launch a high-performing site without starting from scratch
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 5, maxWidth: 560 }}>
              Professionally designed HTML templates, ready to customize, and built to grow with you.
              Browse templates made by Webflow's community of creators.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/viewtemp')}
                sx={{
                  background: `linear-gradient(135deg, ${c.indigo}, ${c.violet})`,
                  boxShadow: '0 10px 24px rgba(67,97,238,0.35)',
                  '&:hover': { boxShadow: '0 14px 28px rgba(67,97,238,0.45)' },
                }}
              >
                Browse Templates
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  borderColor: c.coral, color: c.coral, borderWidth: 2,
                  '&:hover': { borderWidth: 2, borderColor: c.coral, bgcolor: 'rgba(255,107,107,0.08)' },
                }}
              >
                Become a Creator
              </Button>
            </Stack>
          </Grid>

          {/* Collage of template previews */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'relative', height: 360 }}>
              <MockWindow color={`linear-gradient(135deg, ${c.indigo}, ${c.violet})`} accent={c.sun} sx={{ top: 0, left: 10, width: 190, transform: 'rotate(-6deg)' }} />
              <MockWindow color={`linear-gradient(135deg, ${c.coral}, ${c.sun})`} accent={c.indigo} sx={{ top: 70, right: 0, width: 200, transform: 'rotate(5deg)' }} />
              <MockWindow color={`linear-gradient(135deg, ${c.mint}, ${c.indigo})`} accent={c.coral} sx={{ bottom: 0, left: 50, width: 210, transform: 'rotate(-2deg)' }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function StarterFeatures() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
      <Typography variant="h2" sx={{ textAlign: 'center', color: c.ink }} gutterBottom>
        Starter templates
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
        Jumpstart your build with a template that already has the essentials.
      </Typography>
      <Grid container spacing={3}>
        {starters.map(({ title, desc, color, tint, Icon }) => (
          <Grid size={{ xs: 12, md: 4 }} key={title}>
            <Card
              onClick={() => navigate('/viewtemp')}
              sx={{
                height: '100%', bgcolor: tint, boxShadow: 'none', borderRadius: 4,
                border: `2px solid ${color}22`, borderTop: `6px solid ${color}`,
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 16px 32px ${color}33` },
              }}
            >
              <CardContent sx={{ py: 5 }}>
                <Box
                  sx={{
                    width: 56, height: 56, borderRadius: 3, bgcolor: color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ color: c.ink }}>{title}</Typography>
                <Typography color="text.secondary">{desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

function CTASection() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative', overflow: 'hidden', color: '#fff', borderRadius: 5,
            p: { xs: 5, md: 8 }, textAlign: 'center',
            backgroundImage: `linear-gradient(120deg, ${c.violet} 0%, ${c.indigo} 45%, ${c.mint} 100%)`,
          }}
        >
          {/* decorative shapes */}
          <Box sx={{ position: 'absolute', top: -50, left: -50, width: 180, height: 180, borderRadius: '50%', bgcolor: c.coral, opacity: 0.55 }} />
          <Box sx={{ position: 'absolute', bottom: -60, right: -30, width: 200, height: 200, borderRadius: '50%', bgcolor: c.sun, opacity: 0.5 }} />
          <Box sx={{ position: 'absolute', top: 30, right: '12%', width: 40, height: 40, borderRadius: 2, bgcolor: '#fff', opacity: 0.2, transform: 'rotate(20deg)' }} />

          <Box sx={{ position: 'relative' }}>
            <Typography variant="h2" gutterBottom>
              Create and sell custom website templates with Webflow
            </Typography>
            <Typography sx={{ mb: 4, opacity: 0.92, maxWidth: 640, mx: 'auto' }}>
              Discover how to submit your own website templates and meet Webflow's quality guidelines,
              or explore our collection of stunning templates created by talented designers.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: '#fff', color: c.violet, fontWeight: 700,
                '&:hover': { bgcolor: c.sun, color: c.ink },
              }}
            >
              Get started
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_URL}/faq/faq`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load FAQs');
        setFaqs(await res.json());
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 } }}>
      <Typography variant="h2" sx={{ textAlign: 'center', color: c.ink }} gutterBottom>
        Frequently asked questions
      </Typography>

      {loading && <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress sx={{ color: c.indigo }} /></Box>}
      {error && <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>}

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {faqs.map((f, i) => {
          const color = faqColors[i % faqColors.length];
          return (
            <Accordion
              key={f.faqId}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: '#fff', borderRadius: '16px !important', overflow: 'hidden',
                border: '1px solid #eceef5', borderLeft: `6px solid ${color}`,
                transition: 'box-shadow 0.2s',
                '&:before': { display: 'none' },
                '&.Mui-expanded': { boxShadow: `0 10px 24px ${color}26`, bgcolor: `${color}0d` },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color }} />}>
                <Typography variant="h6">{f.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{f.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Container>
  );
}

export default function Home() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="main" sx={{ flex: 1 }}>
        <Hero />
        <StarterFeatures />
        <CTASection />
        <FAQ />
      </Box>
    </Box>
  );
}