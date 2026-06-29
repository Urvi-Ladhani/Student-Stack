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
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = await Folder.create({ userId: req.user._id, name, parentId: parentId || null });
    res.status(201).json(folder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content, folderId, sourceModule, tags, editorMode } = req.body;
    // Force empty folder strings to null so MongoDB doesn't throw a 500 error
    const validFolderId = (folderId === '' || folderId === 'null' || !folderId) ? null : folderId;

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
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateNoteContent = async (req, res) => {
  try {
    const { title, content, folderId, sourceModule, tags, editorMode } = req.body;
    const validFolderId = (folderId === '' || folderId === 'null' || !folderId) ? null : folderId;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, content, folderId: validFolderId, sourceModule, tags, editorMode, lastEditedAt: Date.now() },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) { res.status(500).json({ message: error.message }); }
};