const express = require("express");

const router = express.Router();
const protect = require(
    "../middleware/authMiddleware"
);
const {
    signupUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get(
    "/profile",
    protect,
    getProfile
);

module.exports = router;