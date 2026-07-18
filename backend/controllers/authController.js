const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signupUser = async (req, res) => {
    try {
        // 1. Destructure all fields coming from your React frontend
        const { name, email, password, university, branch, semester, targetRole } = req.body;

        const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered. Please sign in."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Pass all parameters into your MongoDB creation block
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            university: university || "",
            branch: branch || "",
            semester: semester || "",
            targetRole: targetRole || ""
        });

        // 3. Generate a token immediately so they are auto-logged in
        const token = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion || 0 },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send back BOTH token and profile data to the client
        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                isGoogleConnected: user.isGoogleConnected || false,
                university: user.university,
                branch: user.branch,
                semester: user.semester,
                targetRole: user.targetRole,
                degree: user.degree || "",
                graduationYear: user.graduationYear || "",
                bio: user.bio || "",
                settings: user.settings
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (!user) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion || 0 },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Return user data along with the token here as well
        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                isGoogleConnected: user.isGoogleConnected || false,
                university: user.university,
                branch: user.branch,
                semester: user.semester,
                targetRole: user.targetRole,
                degree: user.degree || "",
                graduationYear: user.graduationYear || "",
                bio: user.bio || "",
                settings: user.settings
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getProfile = async (req, res) => {
    res.status(200).json(req.user);
};

const googleAuth = async (req, res) => {
    try {
        const { idToken, name: directName, email: directEmail, isSignup } = req.body;
        let name = directName;
        let email = directEmail;

        if (idToken) {
            // Verify the Google ID token securely with Google's API
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            if (!googleRes.ok) {
                return res.status(400).json({ message: "Invalid Google OAuth token" });
            }
            const payload = await googleRes.json();

            // Verify audience matches our Client ID if configured
            if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
                return res.status(400).json({ message: "Google OAuth token client ID mismatch" });
            }

            name = payload.name;
            email = payload.email;
        }

        if (!email) {
            return res.status(400).json({ message: "Email is required for authentication" });
        }

        let user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (user) {
            if (isSignup) {
                return res.status(400).json({ message: "Email already registered. Please sign in." });
            }
            if (!user.isGoogleConnected) {
                user.isGoogleConnected = true;
                await user.save();
            }
        } else {
            // Create user in the database
            const placeholderPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
            user = await User.create({
                name: name || "Google User",
                email: email.toLowerCase(),
                password: hashedPassword,
                university: "Tech University",
                branch: "Computer Science",
                semester: "6th",
                targetRole: "Software Engineer",
                isGoogleConnected: true
            });
        }

        const token = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion || 0 },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Google Auth successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                isGoogleConnected: user.isGoogleConnected || false,
                university: user.university,
                branch: user.branch,
                semester: user.semester,
                targetRole: user.targetRole,
                degree: user.degree || "",
                graduationYear: user.graduationYear || "",
                bio: user.bio || "",
                settings: user.settings
            }
        });
    } catch (error) {
        console.error("Google Auth controller error:", error);
        res.status(500).json({ message: error.message });
    }
};

const logStudySession = async (req, res) => {
    try {
        const { minutes } = req.body;
        if (!minutes || isNaN(minutes)) {
            return res.status(400).json({ message: "Invalid minutes value" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Log session
        user.studySessions.push({ date: new Date(), minutes: Number(minutes) });

        // Streak calculations
        const today = new Date();
        today.setHours(0,0,0,0);

        const lastDate = user.stats.lastStudyDate ? new Date(user.stats.lastStudyDate) : null;
        if (lastDate) {
            lastDate.setHours(0,0,0,0);
            const diffTime = today - lastDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                user.stats.studyStreak += 1;
            } else if (diffDays > 1) {
                user.stats.studyStreak = 1;
            }
        } else {
            user.stats.studyStreak = 1;
        }

        user.stats.lastStudyDate = new Date();
        user.stats.longestStreak = Math.max(user.stats.longestStreak, user.stats.studyStreak);
        user.stats.totalStudyMinutes = (user.stats.totalStudyMinutes || 0) + Number(minutes);

        await user.save();
        res.status(200).json({ message: "Study session logged successfully", stats: user.stats });
    } catch (error) {
        console.error("Log study session error:", error);
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, university, degree, graduationYear, bio, avatar, settings } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name !== undefined) user.name = name;
        if (university !== undefined) user.university = university;
        if (degree !== undefined) user.degree = degree;
        if (graduationYear !== undefined) user.graduationYear = graduationYear;
        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar; 

        if (settings !== undefined) {
            user.settings = {
                ...user.settings.toObject(),
                ...settings
            };
        }

        await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
                isGoogleConnected: user.isGoogleConnected || false,
                university: user.university,
                branch: user.branch,
                semester: user.semester,
                targetRole: user.targetRole,
                degree: user.degree || "",
                graduationYear: user.graduationYear || "",
                bio: user.bio || "",
                settings: user.settings
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: error.message });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.password) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect current password" });
            }
        }

        if (!newPassword || newPassword.length < 6 || !/\d/.test(newPassword)) {
            return res.status(400).json({ message: "New password must be at least 6 characters long and contain at least one number." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Update password error:", error);
        res.status(500).json({ message: error.message });
    }
};

const logoutAllDevices = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        res.status(200).json({ message: "Logged out from all devices successfully." });
    } catch (error) {
        console.error("Logout all devices error:", error);
        res.status(500).json({ message: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        const Task = require("../models/Task");
        const Note = require("../models/Note");
        const Folder = require("../models/Folder");
        const DSAProblem = require("../models/DSAProblem");
        const Internship = require("../models/Internship");
        const Resume = require("../models/Resume");

        await Task.deleteMany({ userId });
        await Note.deleteMany({ userId });
        await Folder.deleteMany({ userId });
        await DSAProblem.deleteMany({ userId });
        await Internship.deleteMany({ userId });
        await Resume.deleteMany({ userId });

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    signupUser,
    loginUser,
    getProfile,
    googleAuth,
    logStudySession,
    updateProfile,
    updatePassword,
    logoutAllDevices,
    deleteAccount
};