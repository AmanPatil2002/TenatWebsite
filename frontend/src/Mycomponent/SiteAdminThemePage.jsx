import React from "react";
import { useOutletContext } from "react-router-dom";
import ThemeCustomizer from "../Mycomponent/ThemeCustomizer";
import { Box } from "@mui/material";

export default function SiteAdminThemePage() {
  const { siteId } = useOutletContext();
  return (
    <Box sx={{ maxWidth: 800 }}>
      <ThemeCustomizer siteId={siteId} isAdminContext={true} />
    </Box>
  );
}
