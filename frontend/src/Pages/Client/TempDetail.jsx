import { useState } from "react";
import { Box, Button, Grid } from "@mui/material";

import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import StarBorder from "@mui/icons-material/StarBorder";

import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/mysite");
  };
  const [open, setOpen] = useState(true);

  const handleClick = () => {
    setOpen(!open);
  };
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb" }}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 2, sm: 4, md: 4 }}>
            <List
              sx={{
                width: "100%",
                maxWidth: 250,
                bgcolor: "background.paper",
              }}
              component="nav"
              aria-labelledby="nested-list-subheader"
              subheader={
                <ListSubheader component="div" id="nested-list-subheader">
                  Template Edit
                </ListSubheader>
              }
            >
              <ListItemButton onClick={handleClick}>
                <ListItemText primary="Theme" />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText primary="Dark" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText primary="light" />
                  </ListItemButton>
                </List>
              </Collapse>

              <ListItemButton onClick={handleClick}>
                <ListItemText primary="Pages" />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText primary="Home Page" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText primary="Contact Page" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText primary="Contact Page" />
                  </ListItemButton>
                </List>
              </Collapse>
            </List>
          </Grid>
        </Grid>
      </Box>

      <Button onClick={handleLogout}>Exit site</Button>
    </Box>
  );
}
