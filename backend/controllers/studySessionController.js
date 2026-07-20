const StudySession = require("../models/StudySession");
const User = require("../models/User");

// Helper to check if two dates are on the same calendar day (local/UTC date check)
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper to check if date was yesterday
const isYesterday = (d) => {
  if (!d) return false;
  const date = new Date(d);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

// @desc    Create a new study session or log a completed/scheduled session
// @route   POST /api/study-sessions
// @access  Private
const createStudySession = async (req, res) => {
  try {
    const {
      module,
      topic,
      goal,
      startTime,
      endTime,
      duration, // in seconds
      mode,
      targetDuration,
      completionStatus,
      status,
      notes,
      mood,
      difficulty,
      relatedTask,
      relatedNote,
      relatedRoadmap,
      relatedTopic,
      relatedInternship,
      isScheduled,
      scheduledDate,
      scheduledDurationMinutes
    } = req.body;

    const sessionDurationSeconds = Number(duration) || 0;
    const sessionDurationMinutes = Math.round(sessionDurationSeconds / 60);

    const newSession = await StudySession.create({
      user: req.user._id,
      module: module || "Custom Study",
      topic: topic || "",
      goal: goal || "",
      startTime: startTime || Date.now(),
      endTime: endTime || Date.now(),
      duration: sessionDurationSeconds,
      mode: mode || "stopwatch",
      targetDuration: Number(targetDuration) || 0,
      completionStatus: completionStatus || "Yes",
      status: status || (isScheduled ? "scheduled" : "completed"),
      notes: notes || "",
      mood: Number(mood) || 5,
      difficulty: Number(difficulty) || 3,
      relatedTask: relatedTask || null,
      relatedNote: relatedNote || null,
      relatedRoadmap: relatedRoadmap || null,
      relatedTopic: relatedTopic || null,
      relatedInternship: relatedInternship || null,
      isScheduled: Boolean(isScheduled),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      scheduledDurationMinutes: Number(scheduledDurationMinutes) || 30
    });

    // If session is completed or partially completed, update user stats & streak
    if (!isScheduled && status !== "abandoned" && sessionDurationMinutes > 0) {
      const user = await User.findById(req.user._id);
      if (user) {
        if (!user.stats) {
          user.stats = { studyStreak: 0, longestStreak: 0, totalStudyMinutes: 0, totalProblemsSolved: 0, totalTasksCompleted: 0 };
        }

        user.stats.totalStudyMinutes = (user.stats.totalStudyMinutes || 0) + sessionDurationMinutes;

        const lastDate = user.stats.lastStudyDate;
        const now = new Date();

        if (!lastDate) {
          user.stats.studyStreak = 1;
        } else if (isSameDay(lastDate, now)) {
          // Streak remains unchanged if studied on the same day
        } else if (isYesterday(lastDate)) {
          user.stats.studyStreak = (user.stats.studyStreak || 0) + 1;
        } else {
          // Streak broken
          user.stats.studyStreak = 1;
        }

        if (user.stats.studyStreak > (user.stats.longestStreak || 0)) {
          user.stats.longestStreak = user.stats.studyStreak;
        }

        user.stats.lastStudyDate = now;

        // Also append to lightweight user.studySessions array for fast backwards-compatibility
        if (!user.studySessions) user.studySessions = [];
        user.studySessions.push({
          date: now,
          minutes: sessionDurationMinutes
        });

        await user.save();
      }
    }

    const populatedSession = await StudySession.findById(newSession._id)
      .populate("relatedTask")
      .populate("relatedNote")
      .populate("relatedRoadmap")
      .populate("relatedTopic")
      .populate("relatedInternship");

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error("Error creating study session:", error);
    res.status(500).json({ message: "Server error while creating study session", error: error.message });
  }
};

// @desc    Get all study sessions with filters
// @route   GET /api/study-sessions
// @access  Private
const getStudySessions = async (req, res) => {
  try {
    const { period, module: moduleFilter, topic, status, isScheduled } = req.query;

    const query = { user: req.user._id };

    if (moduleFilter && moduleFilter !== 'All') {
      query.module = moduleFilter;
    }

    if (topic && topic !== 'All') {
      query.topic = { $regex: topic, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (isScheduled !== undefined) {
      query.isScheduled = isScheduled === 'true';
    }

    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.createdAt = { $gte: startOfDay };
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfWeek };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: startOfMonth };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      query.createdAt = { $gte: startOfYear };
    }

    const sessions = await StudySession.find(query)
      .sort({ createdAt: -1 })
      .populate("relatedTask")
      .populate("relatedNote")
      .populate("relatedRoadmap")
      .populate("relatedTopic")
      .populate("relatedInternship");

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    res.status(500).json({ message: "Server error while fetching study sessions" });
  }
};

// @desc    Get computed study session statistics
// @route   GET /api/study-sessions/stats
// @access  Private
const getStudySessionStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const allSessions = await StudySession.find({ user: userId });
    const completedSessions = allSessions.filter(s => !s.isScheduled && s.status !== 'abandoned');

    const now = new Date();

    // Today's Minutes
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayMinutes = completedSessions
      .filter(s => new Date(s.createdAt) >= startOfToday)
      .reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);

    // This Week's Minutes (Monday start)
    const currentDay = now.getDay();
    const diffToMon = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMon, 0, 0, 0);
    const weeklyMinutes = completedSessions
      .filter(s => new Date(s.createdAt) >= startOfWeek)
      .reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);

    // This Month's Minutes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyMinutes = completedSessions
      .filter(s => new Date(s.createdAt) >= startOfMonth)
      .reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);

    // Lifetime Minutes
    const totalLifetimeMinutes = completedSessions.reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);

    // Average Session Length (minutes)
    const totalSessionsCount = completedSessions.length;
    const avgSessionMinutes = totalSessionsCount > 0 ? Math.round(totalLifetimeMinutes / totalSessionsCount) : 0;

    // Longest Session (minutes)
    const longestSessionSeconds = completedSessions.reduce((max, s) => Math.max(max, s.duration || 0), 0);
    const longestSessionMinutes = Math.round(longestSessionSeconds / 60);

    // Most Studied Module & Topic
    const moduleMap = {};
    const topicMap = {};

    completedSessions.forEach(s => {
      const dur = Math.round((s.duration || 0) / 60);
      if (s.module) moduleMap[s.module] = (moduleMap[s.module] || 0) + dur;
      if (s.topic && s.topic.trim()) topicMap[s.topic.trim()] = (topicMap[s.topic.trim()] || 0) + dur;
    });

    let mostStudiedModule = 'None';
    let maxModTime = 0;
    Object.entries(moduleMap).forEach(([mod, time]) => {
      if (time > maxModTime) {
        maxModTime = time;
        mostStudiedModule = mod;
      }
    });

    let mostStudiedTopic = 'None';
    let maxTopTime = 0;
    Object.entries(topicMap).forEach(([top, time]) => {
      if (time > maxTopTime) {
        maxTopTime = time;
        mostStudiedTopic = top;
      }
    });

    // Next Planned / Scheduled Session
    const nextScheduledSession = await StudySession.findOne({
      user: userId,
      isScheduled: true,
      scheduledDate: { $gte: now }
    }).sort({ scheduledDate: 1 });

    // Recent Sessions
    const recentSessions = await StudySession.find({ user: userId, isScheduled: false })
      .sort({ createdAt: -1 })
      .limit(5);

    const user = await User.findById(userId);

    res.json({
      todaysHours: (todayMinutes / 60).toFixed(1),
      todayMinutes,
      weeklyHours: (weeklyMinutes / 60).toFixed(1),
      weeklyMinutes,
      monthlyHours: (monthlyMinutes / 60).toFixed(1),
      monthlyMinutes,
      totalLifetimeHours: (totalLifetimeMinutes / 60).toFixed(1),
      totalLifetimeMinutes,
      averageSessionLengthMinutes: avgSessionMinutes,
      longestSessionMinutes,
      sessionsCompleted: totalSessionsCount,
      mostStudiedModule,
      mostStudiedTopic,
      studyStreak: user?.stats?.studyStreak || 0,
      longestStreak: user?.stats?.longestStreak || 0,
      nextScheduledSession,
      recentSessions
    });
  } catch (error) {
    console.error("Error calculating study session stats:", error);
    res.status(500).json({ message: "Server error calculating stats" });
  }
};

// @desc    Update a study session
// @route   PUT /api/study-sessions/:id
// @access  Private
const updateStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    const { notes, mood, difficulty, completionStatus, status, isScheduled, scheduledDate } = req.body;

    if (notes !== undefined) session.notes = notes;
    if (mood !== undefined) session.mood = Number(mood);
    if (difficulty !== undefined) session.difficulty = Number(difficulty);
    if (completionStatus !== undefined) session.completionStatus = completionStatus;
    if (status !== undefined) session.status = status;
    if (isScheduled !== undefined) session.isScheduled = Boolean(isScheduled);
    if (scheduledDate !== undefined) session.scheduledDate = new Date(scheduledDate);

    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Error updating study session:", error);
    res.status(500).json({ message: "Server error updating study session" });
  }
};

// @desc    Delete a study session
// @route   DELETE /api/study-sessions/:id
// @access  Private
const deleteStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }
    res.json({ message: "Study session deleted successfully" });
  } catch (error) {
    console.error("Error deleting study session:", error);
    res.status(500).json({ message: "Server error deleting study session" });
  }
};

module.exports = {
  createStudySession,
  getStudySessions,
  getStudySessionStats,
  updateStudySession,
  deleteStudySession
};
