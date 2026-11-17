const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const { getMySites } = require("../../controller/site/siteController");

router.get("/my", authenticateToken, getMySites);
module.exports = router;
