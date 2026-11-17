const router = require("express").Router();

router.use(require("./adminRoutes"));
router.use(require("./siteRoutes"));
router.use(require("./headerRoutes"));
router.use(require("./pageRoutes"));
router.use(require("./dataRoutes"));
router.use(require("./employeeRoutes"));
router.use(require("./mediaRoutes"));

module.exports = router;
