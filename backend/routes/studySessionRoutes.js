const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createStudySession,
  getStudySessions,
  getStudySessionStats,
  updateStudySession,
  deleteStudySession
} = require("../controllers/studySessionController");

router.use(protect);

router.post("/", createStudySession);
router.get("/", getStudySessions);
router.get("/stats", getStudySessionStats);
router.put("/:id", updateStudySession);
router.delete("/:id", deleteStudySession);

module.exports = router;
