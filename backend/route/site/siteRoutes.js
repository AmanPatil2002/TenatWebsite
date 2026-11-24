const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const { getMySites, resolvePublicSite } = require("../../controller/site/siteController");

router.get("/my", authenticateToken, getMySites);
router.get("/public/resolve/:slug", resolvePublicSite);
module.exports = router;
