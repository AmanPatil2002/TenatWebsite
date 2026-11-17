const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const siteMedia = require("../../controller/siteMediaController");

router.get("/client-admin/:siteId/media", authenticateSiteAdmin, siteMedia.listPublishedMedia);
router.get("/:siteId/media", authenticateToken, siteMedia.listPublishedMedia);
router.post("/client-admin/:siteId/media/upload", authenticateSiteAdmin, ...siteMedia.uploadImage);

for (const contentType of ["news", "galleries", "slider"]) {
  const handlers = siteMedia[contentType];
  router.get(`/client-admin/:siteId/${contentType}`, authenticateSiteAdmin, handlers.list);
  router.post(`/client-admin/:siteId/${contentType}`, authenticateSiteAdmin, handlers.create);
  router.put(`/client-admin/:siteId/${contentType}/:itemId`, authenticateSiteAdmin, handlers.update);
  router.delete(`/client-admin/:siteId/${contentType}/:itemId`, authenticateSiteAdmin, handlers.remove);
}

module.exports = router;
