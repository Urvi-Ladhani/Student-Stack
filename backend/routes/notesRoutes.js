const express = require('express');
const router = express.Router();
const { getWorkspace, createFolder, createNote, updateNoteContent } = require('../controllers/notesController');
const protect = require('../middleware/authMiddleware'); 
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Note = require('../models/Note'); // Ensure this points to your Note model!

// 1. MULTER CONFIGURATION
const uploadDir = path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("Upload directory creation skipped (read-only filesystem):", err.message);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')); }
});
const upload = multer({ storage: storage });

// 2. YOUR STANDARD ROUTES
router.get('/workspace', protect, getWorkspace);
router.post('/folders', protect, createFolder);
router.post('/', protect, createNote);
router.put('/:id', protect, updateNoteContent); 

// 3. 🔥 NEW: PDF UPLOAD ROUTE (SAVES TO DISK AND MONGODB)
router.post('/upload-pdf', protect, upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file received' });

        // Actually saves the PDF data to your MongoDB so the NotesPage can fetch it!
        const newNote = new Note({
            userId: req.user._id, // 🔥 CHANGED from 'user' to 'userId'
            title: req.body.title || 'Untitled PDF',
            content: req.body.notes || 'No typed notes.', 
            editorMode: 'pdf', 
            fileUrl: `/uploads/${req.file.filename}` 
        });

        await newNote.save();
        res.status(200).json({ message: "Saved to DB and Disk!", note: newNote });
        
    } catch (error) {
        console.error("DB Save Error:", error);
        res.status(500).json({ error: "Failed to save PDF to database." });
    }
});

// 4. 🔥 NEW: DELETE ROUTE (REMOVES FROM DB AND DISK)
router.delete('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.status(404).json({ error: "Note not found" });

        // Delete the physical file from the hard drive
        if (note.fileUrl) {
            const filePath = path.join(__dirname, '..', note.fileUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
        }

        // Delete from MongoDB
        await Note.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Note permanently deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

module.exports = router;