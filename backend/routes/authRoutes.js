const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

// Import all the controller functions you made earlier
const { signupUser, loginUser, getProfile, googleAuth, logStudySession } = require("../controllers/authController");

// Post routes for forms
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

// Get route for fetching user info (since you had getProfile in your controller)
router.get("/profile", protect, getProfile);
router.post("/study-session", protect, logStudySession);

module.exports = router;