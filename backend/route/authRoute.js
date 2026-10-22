const express = require("express");
const router = express.Router();

const {
  getAuth,
  postAuth,
  checkLogin,
  getMe,
  updateUserStatus,
} = require("../controller/authControler");
const authenticateToken = require("../middleware/authenticate");

router.get("/register", authenticateToken, getAuth);
router.post("/register", postAuth);
router.post("/login", checkLogin);
router.get("/me", authenticateToken, getMe);
router.patch("/users/:userId/status", authenticateToken, updateUserStatus);

module.exports = router;