const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const requireSiteAccess = require("../middleware/siteAccess");
const {
  listSiteMenuItems,
  createSiteMenuItem,
  updateSiteMenuItem,
  deleteSiteMenuItem,
  reorderSiteMenuItems,
} = require("../controller/siteMenuController");

const router = express.Router();

router.get("/:siteId/menu", authenticateToken, requireSiteAccess, listSiteMenuItems);
router.post("/:siteId/menu", authenticateToken, requireSiteAccess, createSiteMenuItem);
router.put("/:siteId/menu/reorder", authenticateToken, requireSiteAccess, reorderSiteMenuItems);
router.put("/:siteId/menu/:menuItemId", authenticateToken, requireSiteAccess, updateSiteMenuItem);
router.delete("/:siteId/menu/:menuItemId", authenticateToken, requireSiteAccess, deleteSiteMenuItem);

module.exports = router;
