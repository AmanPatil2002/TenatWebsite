const express = require("express");
const router = express.Router();
const { getPublicSite, getPublicPage } = require("../controller/publicController");

router.get("/sites/:subdomain", getPublicSite);
router.get("/sites/:subdomain/pages/:slug", getPublicPage);

module.exports = router;