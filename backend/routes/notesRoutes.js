const express = require('express');
const router = express.Router();
const { getWorkspace, createFolder, createNote, updateNoteContent } = require('../controllers/notesController');

// 🔥 THE FINAL BOSS BUG KILLED: No curly braces!
const protect = require('../middleware/authMiddleware'); 

router.get('/workspace', protect, getWorkspace);
router.post('/folders', protect, createFolder);
router.post('/', protect, createNote);
router.put('/:id', protect, updateNoteContent); 

module.exports = router;