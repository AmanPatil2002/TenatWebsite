import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Accordion, AccordionSummary, AccordionDetails,
  Box, CircularProgress, Alert, Button, Stack, Grid, Card, CardContent,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ViewQuiltOutlinedIcon from '@mui/icons-material/ViewQuiltOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Shared palette – refined, professional tones
const c = {
  ink: '#0f172a',
  slate: '#334155',
  muted: '#64748b',
  indigo: '#4f46e5',
  indigoDeep: '#3730a3',
  blue: '#3b82f6',
  teal: '#0d9488',
  amber: '#d97706',
  rose: '#e11d48',
};

const starters = [
  {
    title: 'Ecommerce',
    desc: 'Ecommerce functionality built in, ready to sell from day one.',
    color: c.rose,
    tint: '#fff1f2',
    Icon: ShoppingCartOutlinedIcon,
  },
  {
    title: 'CMS',
    desc: 'CMS functionality built in for effortless content management.',
    color: c.teal,
    tint: '#f0fdfa',
    Icon: ArticleOutlinedIcon,
  },
  {
    title: 'Multi Layout',
    desc: 'Multiple layout variations built in to fit any brand.',
    color: c.indigo,
    tint: '#eef2ff',
    Icon: ViewQuiltOutlinedIcon,
  },
];

const faqColors = [c.indigo, c.rose, c.teal, c.amber, c.blue];

/* A small "browser window" made of CSS shapes, used in the hero collage */
function MockWindow({ gradient, accent, sx }) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(15,23,42,0.16)',
        border: '1px solid rgba(15,23,42,0.06)',
        position: 'absolute',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', gap: 0.6, px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
        {['#fca5a5', '#fcd34d', '#86efac'].map((d) => (
          <Box key={d} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d }} />
        ))}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ height: 54, borderRadius: 2, background: gradient, mb: 1.2 }} />
        <Box sx={{ height: 8, width: '70%', borderRadius: 1, bgcolor: '#e2e8f0', mb: 0.8 }} />
        <Box sx={{ height: 8, width: '45%', borderRadius: 1, bgcolor: '#e2e8f0', mb: 1.2 }} />
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
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 8, md: 14 },
        background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)',
      }}
    >
      {/* soft colour blobs */}
      <Box sx={{ position: 'absolute', top: -120, left: -100, width: 360, height: 360, borderRadius: '50%', bgcolor: c.indigo, opacity: 0.1, filter: 'blur(80px)' }} />
      <Box sx={{ position: 'absolute', bottom: -140, right: -80, width: 400, height: 400, borderRadius: '50%', bgcolor: c.teal, opacity: 0.12, filter: 'blur(90px)' }} />
      <Box sx={{ position: 'absolute', top: '30%', right: '35%', width: 240, height: 240, borderRadius: '50%', bgcolor: c.blue, opacity: 0.1, filter: 'blur(70px)' }} />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                mb: 3,
                borderRadius: 99,
                bgcolor: alpha(c.indigo, 0.08),
                border: `1px solid ${alpha(c.indigo, 0.2)}`,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.indigo }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: c.indigoDeep, letterSpacing: '0.05em' }}>
                PREMIUM TEMPLATE LIBRARY
              </Typography>
            </Box>

            <Typography
              variant="h3"
              gutterBottom
              sx={{
                color: c.ink,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              }}
            >
              Launch a high-performing site without starting from scratch
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              fontWeight={400}
              sx={{ mb: 5, maxWidth: 560, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.15rem' } }}
            >
              Professionally designed HTML templates, ready to customize, and built to grow with you.
              Browse templates made by Webflow's community of creators.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/templates')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: c.indigo,
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  py: 1.4,
                  borderRadius: 2,
                  boxShadow: '0 10px 24px rgba(79,70,229,0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: c.indigoDeep,
                    boxShadow: '0 14px 28px rgba(79,70,229,0.4)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Browse Templates
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  borderColor: c.indigo,
                  color: c.indigo,
                  borderWidth: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  py: 1.4,
                  borderRadius: 2,
                  '&:hover': {
                    borderWidth: 1.5,
                    borderColor: c.indigoDeep,
                    color: c.indigoDeep,
                    bgcolor: alpha(c.indigo, 0.06),
                  },
                }}
              >
                Become a Creator
              </Button>
            </Stack>
          </Grid>

          {/* Collage of template previews */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'relative', height: 380 }}>
              <MockWindow
                gradient={`linear-gradient(135deg, ${c.indigo}, ${c.blue})`}
                accent={c.amber}
                sx={{ top: 0, left: 10, width: 190, transform: 'rotate(-6deg)' }}
              />
              <MockWindow
                gradient={`linear-gradient(135deg, ${c.rose}, ${c.amber})`}
                accent={c.indigo}
                sx={{ top: 70, right: 0, width: 200, transform: 'rotate(5deg)' }}
              />
              <MockWindow
                gradient={`linear-gradient(135deg, ${c.teal}, ${c.indigo})`}
                accent={c.rose}
                sx={{ bottom: 0, left: 50, width: 210, transform: 'rotate(-2deg)' }}
              />
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
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, letterSpacing: '0.12em', color: c.indigo }}
        >
          Starter Templates
        </Typography>
        <Typography
          variant="h3"
          sx={{
            color: c.ink,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            mt: 1,
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
          }}
        >
          Everything you need, built in
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
          Jumpstart your build with a template that already has the essentials.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {starters.map(({ title, desc, color, tint, Icon }) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={title}>
            <Card
              onClick={() => navigate('/viewtemp')}
              elevation={0}
              sx={{
                height: '100%',
                bgcolor: tint,
                borderRadius: 4,
                border: `1px solid ${alpha(color, 0.15)}`,
                borderTop: `4px solid ${color}`,
                cursor: 'pointer',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 20px 40px ${alpha(color, 0.18)}`,
                },
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2.5,
                    bgcolor: color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: `0 8px 20px ${alpha(color, 0.35)}`,
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ color: c.ink, fontWeight: 700 }}>
                  {title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {desc}
                </Typography>
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
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            borderRadius: 5,
            p: { xs: 4, sm: 6, md: 8 },
            textAlign: 'center',
            background: `linear-gradient(120deg, ${c.indigoDeep} 0%, ${c.indigo} 50%, ${c.teal} 100%)`,
          }}
        >
          {/* decorative shapes */}
          <Box sx={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: '50%', bgcolor: '#fff', opacity: 0.06 }} />
          <Box sx={{ position: 'absolute', bottom: -70, right: -40, width: 240, height: 240, borderRadius: '50%', bgcolor: '#fff', opacity: 0.05 }} />
          <Box sx={{ position: 'absolute', top: 40, right: '15%', width: 44, height: 44, borderRadius: 2, bgcolor: '#fff', opacity: 0.1, transform: 'rotate(20deg)' }} />

          <Box sx={{ position: 'relative' }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
            >
              Create and sell custom website templates with Webflow
            </Typography>
            <Typography
              sx={{
                mb: 4,
                opacity: 0.9,
                maxWidth: 640,
                mx: 'auto',
                lineHeight: 1.7,
                fontSize: { xs: '0.95rem', md: '1.05rem' },
              }}
            >
              Discover how to submit your own website templates and meet Webflow's quality guidelines,
              or explore our collection of stunning templates created by talented designers.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#fff',
                color: c.indigoDeep,
                fontWeight: 700,
                textTransform: 'none',
                px: 3.5,
                py: 1.4,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
                },
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
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, letterSpacing: '0.12em', color: c.indigo }}
        >
          Support
        </Typography>
        <Typography
          variant="h3"
          sx={{
            color: c.ink,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            mt: 1,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
          }}
        >
          Frequently asked questions
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress size={32} sx={{ color: c.indigo }} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 4, borderRadius: 2 }}>{error}</Alert>}

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {faqs.map((f, i) => {
          const color = faqColors[i % faqColors.length];
          return (
            <Accordion
              key={f.faqId}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: '#fff',
                borderRadius: '12px !important',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${color}`,
                transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  boxShadow: `0 10px 24px ${alpha(color, 0.12)}`,
                  bgcolor: alpha(color, 0.03),
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color }} />}
                sx={{ px: 2.5, py: 0.5 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: c.ink }}>
                  {f.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {f.answer}
                </Typography>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#fff' }}>
      <Box component="main" sx={{ flex: 1 }}>
        <Hero />
        <StarterFeatures />
        <CTASection />
        <FAQ />
      </Box>
    </Box>
  );
}