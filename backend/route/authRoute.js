const express = require("express");
const router = express.Router();

const {
  getAuth,
  postAuth,
  checkLogin,
  getMe,
  getUser,
  updateMe,
  changePassword,
  forgotPassword,
  resetPasswordStatus,
  resetPassword,
  updateUser,
  updateUserStatus,
} = require("../controller/authControler");
const authenticateToken = require("../middleware/authenticate");

router.get("/register", authenticateToken, getAuth);
router.post("/register", postAuth);
router.post("/login", checkLogin);

router.post("/forgot-password", forgotPassword);
router.get("/reset-password/status", resetPasswordStatus);
router.post("/reset-password", resetPassword);

router.get("/me", authenticateToken, getMe);
router.put("/me", authenticateToken, updateMe);
router.put("/me/password", authenticateToken, changePassword);

router.get("/users/:userId", authenticateToken, getUser);
router.put("/users/:userId", authenticateToken, updateUser);
router.patch("/users/:userId/status", authenticateToken, updateUserStatus);

module.exports = router;
