import { Container, Typography, Grid, Card, CardContent } from '@mui/material';

const starters = [
  { title: 'Ecommerce', desc: 'Ecommerce functionality built in.' },
  { title: 'CMS', desc: 'CMS functionality built in.' },
  { title: 'Multi Layout', desc: 'Multiple layout variations built in.' },
];

export default function StarterFeatures() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
      <Typography variant="h2" sx={{ textAlign: 'center' }} gutterBottom>Starter templates</Typography>
      <Typography color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
        Jumpstart your build with a template that already has the essentials.
      </Typography>
      <Grid container spacing={3}>
        {starters.map((s) => (
          <Grid size={{ xs: 12, md: 4 }} key={s.title}>
            <Card sx={{ height: '100%', bgcolor: 'background.paper', boxShadow: 'none', border: '1px solid #eceef5' }}>
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