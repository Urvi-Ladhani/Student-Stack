const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const { 
  signupUser, loginUser, getProfile, googleAuth, logStudySession,
  updateProfile, updatePassword, logoutAllDevices, deleteAccount 
} = require("../controllers/authController");

// Post routes for forms
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

// Get route for fetching user info
router.get("/profile", protect, getProfile);
router.post("/study-session", protect, logStudySession);

// Settings and security updates
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.post("/logout-all", protect, logoutAllDevices);
router.delete("/account", protect, deleteAccount);

module.exports = router;