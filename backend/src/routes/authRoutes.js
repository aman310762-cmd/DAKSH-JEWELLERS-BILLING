const express = require("express");
const router = express.Router();
const { register, login, logout, getProfile } = require("../controllers/authController");
const { forgotPassword, verifyOTP } = require("../controllers/otpController");
const { requireAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getProfile);

// OTP Recovery
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);

module.exports = router;
