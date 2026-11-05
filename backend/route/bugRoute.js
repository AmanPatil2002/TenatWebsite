const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const {
  uploadScreenshot,
  createBugReport,
  getMyBugReports,
  getAllBugReports,
  getBugReportById,
  updateBugReport,
} = require("../controller/bugController");

const router = express.Router();

router.use(authenticateToken);

router.post("/", uploadScreenshot, createBugReport);
router.get("/my", getMyBugReports);
router.get("/", getAllBugReports);
router.get("/:id", getBugReportById);
router.put("/:id", updateBugReport);

module.exports = router;