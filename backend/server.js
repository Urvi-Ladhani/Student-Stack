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

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dsa', dsaRoutes);
app.use(express.json({ limit: '50mb' }));
app.use('/api/notes', notesRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get("/", (req,res) => {
   res.send("StudentStack Backend Running");
});

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Files saved here

app.post('/api/notes/upload-pdf', upload.single('pdfFile'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    
    // Here you would save the file path (req.file.path) to your MongoDB Note document
    res.status(200).json({ filePath: req.file.path });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`Server Running on ${PORT}`);
});