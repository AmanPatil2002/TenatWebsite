const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const siteData = require("../../controller/siteDataController");

const publicWindows = new Map();
const publicDuplicates = new Map();
const publicSubmissionLimit = (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const key = `${ip}:${req.params.siteId}:${req.params.resource}`;
  let window = publicWindows.get(key);
  if (!window || now - window.startedAt > 60_000) {
    window = { startedAt: now, count: 0 };
  }
  window.count += 1;
  publicWindows.set(key, window);
  if (window.count > 20) {
    return res.status(429).json({ message: "Too many submissions. Please try again later." });
  }

  const fingerprint = `${key}:${JSON.stringify(req.body || {})}`;
  const previous = publicDuplicates.get(fingerprint);
  if (previous && now - previous < 3_000) {
    return res.status(429).json({ message: "Duplicate submission prevented" });
  }
  publicDuplicates.set(fingerprint, now);
  next();
};

router.get("/client-admin/:siteId/data", authenticateSiteAdmin, siteData.sections);
router.get("/client-admin/:siteId/data/schema", authenticateSiteAdmin, siteData.schema);
router.get("/client-admin/:siteId/data/:resource", authenticateSiteAdmin, siteData.list);
router.post("/client-admin/:siteId/data/:resource", authenticateSiteAdmin, siteData.create);
router.put("/client-admin/:siteId/data/:resource/:id", authenticateSiteAdmin, siteData.update);
router.delete("/client-admin/:siteId/data/:resource/:id", authenticateSiteAdmin, siteData.remove);
router.get("/:siteId/public/data", siteData.publicSections);
router.get("/:siteId/public/data/:resource", siteData.publicList);
router.post("/:siteId/public/:resource", publicSubmissionLimit, siteData.publicSubmit);
router.get("/:siteId/data/schema", authenticateToken, siteData.schema);
router.get("/:siteId/data/:resource", authenticateToken, siteData.list);
module.exports = router;
