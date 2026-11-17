const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const { getSiteHeader, updateSiteHeader } = require("../../controller/site/headerController");

router.get("/:siteId/header", authenticateToken, getSiteHeader);
router.put("/:siteId/header", authenticateToken, updateSiteHeader);
router.get("/client-admin/:siteId/header", authenticateSiteAdmin, getSiteHeader);
router.put("/client-admin/:siteId/header", authenticateSiteAdmin, updateSiteHeader);
module.exports = router;
