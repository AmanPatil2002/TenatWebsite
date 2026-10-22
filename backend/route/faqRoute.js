const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const { getFaq, postFaq, updateFaq, deleteFaq } = require("../controller/faqController");

router.get("/faq", getFaq);
router.post("/faq", authenticateToken, postFaq);
router.put("/faq/:faqId", authenticateToken, updateFaq);
router.delete("/faq/:faqId", authenticateToken, deleteFaq);

module.exports = router;