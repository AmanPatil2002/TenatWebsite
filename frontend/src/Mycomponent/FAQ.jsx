import { useEffect, useState } from 'react';
import {
  Container, Typography, Accordion, AccordionSummary, AccordionDetails,
  Box, CircularProgress, Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FAQ() {
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