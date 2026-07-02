const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getWorkspace, createFolder, createNote, updateNoteContent, getNoteById, deleteNote, uploadPdfNote } = require('../controllers/notesController');

const protect = require('../middleware/authMiddleware');

// --- Multer config for PDF uploads (PDF-only, 10MB max) ---
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// --- Routes (order matters: specific paths BEFORE /:id) ---
router.get('/workspace', protect, getWorkspace);
router.post('/folders', protect, createFolder);
router.post('/upload-pdf', protect, upload.single('pdfFile'), uploadPdfNote);
router.post('/', protect, createNote);
router.get('/:id', protect, getNoteById);
router.put('/:id', protect, updateNoteContent);
router.delete('/:id', protect, deleteNote);

module.exports = router;