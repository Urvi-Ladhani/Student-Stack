const express = require("express");
const router = express.Router();

// Import all the controller functions you made earlier
const { signupUser, loginUser, getProfile } = require("../controllers/authController");

// Post routes for forms
router.post("/signup", signupUser);
router.post("/login", loginUser);

// Get route for fetching user info (since you had getProfile in your controller)
router.get("/profile", getProfile);

module.exports = router;