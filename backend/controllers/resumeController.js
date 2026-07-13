const Resume = require('../models/Resume');
const Internship = require('../models/Internship');
const fs = require('fs');
const path = require('path');

// @desc    Get all resumes for the logged-in user
// @route   GET /api/resumes
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch resumes", error: error.message });
  }
};

// @desc    Upload a new resume version
// @route   POST /api/resumes
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { versionName } = req.body;
    if (!versionName) {
      // Clean up file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Version name is required" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const newResume = await Resume.create({
      userId: req.user._id,
      versionName,
      fileUrl
    });

    res.status(201).json(newResume);
  } catch (error) {
    // Clean up file on exception
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Failed to upload resume", error: error.message });
  }
};

// @desc    Delete a resume version
// @route   DELETE /api/resumes/:id
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Delete the file from the disk
    const filePath = path.join(__dirname, '..', resume.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from MongoDB
    await Resume.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete resume", error: error.message });
  }
};
