const express = require('express');
const router = express.Router();
const { getWorkspace, createFolder, createNote, updateNoteContent, createTag } = require('../controllers/notesController');
const protect = require('../middleware/authMiddleware');  // Assuming you have your auth middleware

router.use(protect); // Lock down all notes routes

// Workspace (Fetches all folders, notes, and tags in one go)
router.get('/workspace', getWorkspace);

// Folders
router.post('/folders', createFolder);

// Notes
router.post('/', createNote);
router.put('/:id', updateNoteContent);

// Tags
router.post('/tags', createTag);

module.exports = router;