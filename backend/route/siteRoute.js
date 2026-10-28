const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const { getMySites, getSitePages } = require("../controller/siteController");

const router = express.Router();

router.get("/my", authenticateToken, getMySites);
router.get("/:siteId/pages", authenticateToken, getSitePages);

module.exports = router;
