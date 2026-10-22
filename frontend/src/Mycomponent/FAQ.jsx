import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    q: 'What is a Webflow template?',
    a: 'A Webflow template is a professionally designed starting point for building a website — complete with responsive layouts, pre-built sections, and styled components you can customize visually without writing code.',
  },
  {
    q: 'Are Webflow templates free?',
    a: 'Webflow offers both free and paid templates. Free templates are a useful way to start building without upfront cost, while paid templates often include more advanced layouts, additional pages, CMS structures, ecommerce features, and polished interactions.',
  },
  {
    q: 'Can I customize a Webflow template?',
    a: 'Yes, every Webflow template is fully customizable in the visual Designer without writing code. You can edit colors, typography, images, layouts, page structures, and navigation.',
  },
  {
    q: 'Do I need a paid Webflow plan to use a template?',
    a: 'No, you can explore, build, and customize templates for free in the Designer using a free Starter workspace. A paid Site Plan is needed when you are ready to connect a custom domain or unlock additional features.',
  },
  {
    q: "What's the difference between One Page, Multi Page, and Multi Layout templates?",
    a: 'One Page templates are built around a single scrolling page. Multi Page templates include several connected pages. Multi Layout templates include multiple page variations and alternative design directions in one build.',
  },
];

export default function FAQ() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 } }}>
      <Typography variant="h2" textAlign="center" gutterBottom>Frequently asked questions</Typography>
      <Box sx={{ mt: 4 }}>
        {faqs.map((f, i) => (
          <Accordion key={i} disableGutters elevation={0}
            sx={{ bgcolor: 'transparent', borderBottom: '1px solid #eceef5', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{f.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{f.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}