import { Box, Container, Typography, Button, Stack } from '@mui/material';

export default function Hero() {
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
          <Button variant="contained" size="large">Browse Templates</Button>
          <Button variant="outlined" size="large">Become a Creator</Button>
        </Stack>
      </Container>
    </Box>
  );
}