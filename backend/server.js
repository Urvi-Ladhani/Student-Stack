require("dotenv").config();
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("FATAL ERROR: .env variables are missing.");
    process.exit(1);
}

// 1. ALL IMPORTS AT THE TOP
const express = require("express");
const cors = require("cors");
const path = require('path');
const connectDB = require("./config/db");

const app = express();
const authRoutes = require("./routes/authRoutes");
const dsaRoutes = require('./routes/dsaRoutes');
const notesRoutes = require('./routes/notesRoutes');

connectDB();

// 2. MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// Serves the uploads folder so the frontend can read the saved PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. ROUTES
app.use("/api/auth", authRoutes);
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dsa', dsaRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/internships', require('./routes/internshipRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/study-sessions', require('./routes/studySessionRoutes'));

app.get("/", (req,res) => {
   res.send("StudentStack Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`Server Running on ${PORT}`);
});