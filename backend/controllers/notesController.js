const Note = require('../models/Note');
const Folder = require('../models/Folder');
const Tag = require('../models/Tag');

exports.getWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;
    const [folders, tags, notes] = await Promise.all([
      Folder.find({ userId }).sort({ createdAt: 1 }),
      Tag.find({ userId }).sort({ name: 1 }),
      Note.find({ userId }).sort({ lastEditedAt: -1 })
    ]);
    res.status(200).json({ folders: folders || [], tags: tags || [], notes: notes || [] });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = await Folder.create({ userId: req.user._id, name, parentId: parentId || null });
    res.status(201).json(folder);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content, folderId, sourceModule, tags, editorMode } = req.body;
    
    // 🛡️ THE IRONCLAD FIX: 
    // We default to null. We ONLY use the folderId if it is exactly 24 characters long.
    // Empty strings ("") will be ignored and remain null.
    let validFolderId = null;
    if (folderId && typeof folderId === 'string' && folderId.trim().length === 24) {
        validFolderId = folderId.trim();
    }

    const note = await Note.create({
      userId: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
      folderId: validFolderId,
      sourceModule: sourceModule || 'General',
      tags: Array.isArray(tags) ? tags : [],
      editorMode: editorMode || 'text'
    });

    res.status(201).json(note);
  } catch (error) { 
    console.error("🔥 FATAL CREATE ERROR:", error); // Will log exactly why it failed in your terminal
    res.status(500).json({ message: "Database Error: " + error.message }); 
  }
};

exports.updateNoteContent = async (req, res) => {
  try {
    const { title, content, folderId, sourceModule, tags, editorMode } = req.body;
    
    // 🛡️ SAME IRONCLAD FIX FOR UPDATES
    let validFolderId = null;
    if (folderId && typeof folderId === 'string' && folderId.trim().length === 24) {
        validFolderId = folderId.trim();
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        title: title || 'Untitled Note',
        content: content || '',
        folderId: validFolderId,
        sourceModule: sourceModule || 'General',
        tags: Array.isArray(tags) ? tags : [],
        editorMode: editorMode || 'text',
        lastEditedAt: Date.now()
      },
      { new: true }
    );
    
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) { 
    console.error("🔥 FATAL UPDATE ERROR:", error);
    res.status(500).json({ message: "Database Error: " + error.message }); 
  }
};