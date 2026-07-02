const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signupUser = async (req, res) => {
    try {
        // 1. Destructure all fields coming from your React frontend
        const { name, email, password, university, branch, semester, targetRole } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Pass all parameters into your MongoDB creation block
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            university: university || "",
            branch: branch || "",
            semester: semester || "",
            targetRole: targetRole || ""
        });

        // 3. Generate a token immediately so they are auto-logged in
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send back BOTH token and profile data to the client
        // ... inside signupUser, change the user object to match the model
res.status(201).json({
    message: "User created successfully",
    token,
    user: {
        id: user._id,
        name: user.name, // Changed from fullName to name
        email: user.email,
        university: user.university,
        branch: user.branch,
        semester: user.semester,
        targetRole: user.targetRole
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

        const user = await User.findOne({ email });
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
            { id: user._id },
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
                university: user.university,
                branch: user.branch,
                semester: user.semester,
                targetRole: user.targetRole
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

module.exports = {
    signupUser,
    loginUser,
    getProfile
};