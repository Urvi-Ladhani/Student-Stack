const Note = require('../models/Note');
const Folder = require('../models/Folder');
const Tag = require('../models/Tag');

// ==========================================
// WORKSPACE INITIALIZATION
// ==========================================
exports.getWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch everything the UI needs in parallel for speed
    const [folders, tags, notes] = await Promise.all([
      Folder.find({ userId }).sort({ createdAt: 1 }),
      Tag.find({ userId }).sort({ name: 1 }),
      Note.find({ userId })
        .populate('tags', 'name color') // Inject tag data directly into the note
        .sort({ lastEditedAt: -1 })
    ]);

    res.status(200).json({ folders, tags, notes });
  } catch (error) {
    res.status(500).json({ message: "Failed to load workspace", error: error.message });
  }
};

// ==========================================
// FOLDER OPERATIONS
// ==========================================
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId, color, icon } = req.body;
    const folder = await Folder.create({ userId: req.user._id, name, parentId, color, icon });
    res.status(201).json(folder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// NOTE OPERATIONS
// ==========================================
exports.createNote = async (req, res) => {
  try {
    const { title, folderId, isWhiteboard } = req.body;
    const note = await Note.create({ 
      userId: req.user._id, 
      title: title || 'Untitled Note', 
      folderId,
      isWhiteboard 
    });
    res.status(201).json(note);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateNoteContent = async (req, res) => {
  try {
    const { content, title, tags } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { content, title, tags, lastEditedAt: Date.now() },
      { new: true }
    ).populate('tags', 'name color');
    
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// TAG OPERATIONS
// ==========================================
exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    const tag = await Tag.create({ userId: req.user._id, name, color });
    res.status(201).json(tag);
  } catch (error) { res.status(500).json({ message: error.message }); }
};