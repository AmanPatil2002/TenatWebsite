import { Box, Container, Typography, Button } from '@mui/material';

export default function CTASection() {
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
          <Button variant="contained" sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f0f0f0' } }}>
            Get started
          </Button>
        </Box>
      </Container>
    </Box>
  );
}