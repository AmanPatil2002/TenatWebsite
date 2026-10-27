import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Accordion, AccordionSummary, AccordionDetails,
  Box, CircularProgress, Alert, Button, Stack, Grid, Card, CardContent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const starters = [
  { title: 'Ecommerce', desc: 'Ecommerce functionality built in.' },
  { title: 'CMS', desc: 'CMS functionality built in.' },
  { title: 'Multi Layout', desc: 'Multiple layout variations built in.' },
];

function Hero() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
      <Container maxWidth="md">
        <Typography variant="h1" gutterBottom>
          Launch a high-performing site without starting from scratch
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 5 }}>
          Professionally designed HTML templates, ready to customize, and built to grow with you.
          Browse templates made by Webflow's community of creators.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
          <Button variant="contained" size="large" onClick={() => navigate('/viewtemp')}>
            Browse Templates
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/register')}>
            Become a Creator
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

function StarterFeatures() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
      <Typography variant="h2" sx={{ textAlign: 'center' }} gutterBottom>Starter templates</Typography>
      <Typography color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
        Jumpstart your build with a template that already has the essentials.
      </Typography>
      <Grid container spacing={3}>
        {starters.map((s) => (
          <Grid size={{ xs: 12, md: 4 }} key={s.title}>
            <Card
              onClick={() => navigate('/viewtemp')}
              sx={{
                height: '100%', bgcolor: 'background.paper', boxShadow: 'none',
                border: '1px solid #eceef5', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 2 },
              }}
            >
              <CardContent sx={{ py: 5 }}>
                <Typography variant="h6" gutterBottom>{s.title}</Typography>
                <Typography color="text.secondary">{s.desc}</Typography>
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
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box sx={{
          bgcolor: 'primary.main', color: '#fff', borderRadius: 4, p: { xs: 5, md: 8 },
          textAlign: 'center', backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #4361ee 100%)',
        }}>
          <Typography variant="h2" gutterBottom>Create and sell custom website templates with Webflow</Typography>
          <Typography sx={{ mb: 4, opacity: 0.85, maxWidth: 640, mx: 'auto' }}>
            Discover how to submit your own website templates and meet Webflow's quality guidelines,
            or explore our collection of stunning templates created by talented designers.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
            sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f0f0f0' } }}
          >
            Get started
          </Button>
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
      <Typography variant="h2" sx={{ textAlign: 'center' }} gutterBottom>
        Frequently asked questions
      </Typography>

      {loading && <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>}

      <Box sx={{ mt: 4 }}>
        {faqs.map((f) => (
          <Accordion
            key={f.faqId}
            disableGutters
            elevation={0}
            sx={{ bgcolor: 'transparent', borderBottom: '1px solid #eceef5', '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{f.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{f.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
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