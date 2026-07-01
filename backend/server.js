require("dotenv").config();
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("FATAL ERROR: .env variables are missing.");
    process.exit(1);
}

// 1. ALL IMPORTS AT THE TOP
const express = require("express");
const cors = require("cors");
const multer = require('multer');
const fs = require('fs');
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

// 3. ROUTES
app.use("/api/auth", authRoutes);
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dsa', dsaRoutes);
app.use('/api/notes', notesRoutes);

// Serves the uploads folder so your React frontend can view the PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req,res) => {
   res.send("StudentStack Backend Running");
});

// 4. PDF UPLOAD CONFIGURATION (MULTER)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir); // Auto-creates the folder if it's missing
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({ storage: storage });

// 5. PDF UPLOAD ENDPOINT
app.post('/api/notes/upload-pdf', upload.single('pdfFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file was received by the server.' });
        }
        
        console.log("✅ PDF successfully saved to:", req.file.path);
        
        res.status(200).json({ 
            message: "File saved successfully", 
            filePath: req.file.path 
        });
        
    } catch (error) {
        console.error("❌ Backend Upload Crash:", error);
        res.status(500).json({ error: "Server crashed during upload." });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`Server Running on ${PORT}`);
});