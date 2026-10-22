import { Box } from '@mui/material';

import Hero from '../../Mycomponent/Hero';
import StarterFeatures from '../../Mycomponent/StarterFeatures';
import CTASection from '../../Mycomponent/CTASection';
import FAQ from '../../Mycomponent/FAQ';

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