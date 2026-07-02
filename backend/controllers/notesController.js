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
    const { title, content, folderId, sourceModule, tags, attachments, editorMode } = req.body;

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
      attachments: Array.isArray(attachments) ? attachments : [], // 🔥 CAPTURES ATTACHMENTS
      editorMode: editorMode || 'text'
    });

    res.status(201).json(note);
  } catch (error) { res.status(500).json({ message: "Database Error: " + error.message }); }
};

exports.updateNoteContent = async (req, res) => {
  try {
    const { title, content, folderId, sourceModule, tags, attachments, editorMode } = req.body;

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
        attachments: Array.isArray(attachments) ? attachments : [], // 🔥 CAPTURES ATTACHMENTS
        editorMode: editorMode || 'text',
        lastEditedAt: Date.now()
      },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) { res.status(500).json({ message: "Database Error: " + error.message }); }
};

// 🔥 GET NOTE BY ID (FOR RETRIEVING PDF ANNOTATIONS)
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) { res.status(500).json({ message: "Database Error: " + error.message }); }
};

// 🔥 DELETE NOTE
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) { res.status(500).json({ message: "Database Error: " + error.message }); }
};

// PDF UPLOAD — Creates a note with the uploaded PDF as an attachment
exports.uploadPdfNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was received by the server.' });
    }

    const { title, path, notes } = req.body;
    const userId = req.user._id;

    const pdfNote = await Note.create({
      userId: userId,
      title: title || 'PDF Annotation',
      content: notes || '',
      folderId: null,
      sourceModule: 'General',
      editorMode: 'pdf',
      tags: ['PDF', 'Annotation'],
      attachments: [{
        attachmentType: 'pdf',
        url: `/uploads/${req.file.filename}`,
        title: title || 'PDF'
      }]
    });

    console.log("✅ PDF Note saved to:", req.file.path);

    res.status(201).json({
      message: "PDF annotation saved successfully",
      note: pdfNote,
      filePath: `/uploads/${req.file.filename}`
    });

  } catch (error) {
    console.error("❌ Backend Upload Crash:", error);
    res.status(500).json({ error: "Server crashed during upload." });
  }
};