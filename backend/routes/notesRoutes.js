const express = require('express');
const router = express.Router();
const { getWorkspace, createFolder, createNote, updateNoteContent } = require('../controllers/notesController');

// 🔥 IMPORTANT: If your folder is named "middlewares", add an 's' here!
const  protect  = require('../middleware/authMiddleware'); 

router.get('/workspace', protect, getWorkspace);
router.post('/folders', protect, createFolder);
router.post('/', protect, createNote);
router.put('/:id', protect, updateNoteContent); 

module.exports = router;