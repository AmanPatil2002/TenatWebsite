const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const siteData = require("../../controller/siteDataController");

router.get("/client-admin/:siteId/data", authenticateSiteAdmin, siteData.sections);
router.get("/client-admin/:siteId/data/:resource", authenticateSiteAdmin, siteData.list);
router.post("/client-admin/:siteId/data/:resource", authenticateSiteAdmin, siteData.create);
router.put("/client-admin/:siteId/data/:resource/:id", authenticateSiteAdmin, siteData.update);
router.delete("/client-admin/:siteId/data/:resource/:id", authenticateSiteAdmin, siteData.remove);
router.get("/:siteId/data/:resource", authenticateToken, siteData.list);
module.exports = router;
