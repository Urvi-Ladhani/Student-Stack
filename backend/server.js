require("dotenv").config();
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("FATAL ERROR: .env variables are missing.");
    process.exit(1);
}

const express = require("express");
const cors = require("cors");
const path = require('path');
const connectDB = require("./config/db");

const app = express();
const authRoutes = require("./routes/authRoutes");
const dsaRoutes = require('./routes/dsaRoutes');
const notesRoutes = require('./routes/notesRoutes');

connectDB();

// MIDDLEWARE
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// ROUTES
app.use("/api/auth", authRoutes);
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dsa', dsaRoutes);
app.use('/api/notes', notesRoutes);

// Serves the uploads folder so the React frontend can view PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
    res.send("StudentStack Backend Running");
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`);
});