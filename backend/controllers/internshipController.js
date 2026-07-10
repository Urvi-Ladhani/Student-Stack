const Internship = require('../models/Internship');

// @desc    Get all internships for a user
// @route   GET /api/internships
exports.getInternships = async (req, res) => {
  try {
    // Fetches all applications for the logged-in user, newest first
    const internships = await Internship.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(internships);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch internships", error: error.message });
  }
};

// @desc    Create a new internship application (Card)
// @route   POST /api/internships
exports.createInternship = async (req, res) => {
  try {
    // 🟢 FIXED: Catching ALL the fields sent by the Chrome Extension
    const { 
      company, 
      role, 
      status, 
      jobLink, 
      jobDescription, 
      location, 
      workType, 
      stipend 
    } = req.body;

    const internship = await Internship.create({
      userId: req.user._id,
      company,
      role,
      status: status || 'wishlist', // Defaults to wishlist if not provided
      jobLink,
      jobDescription,
      location,      // 🟢 ADDED
      workType,      // 🟢 ADDED
      stipend        // 🟢 ADDED
    });

    res.status(201).json(internship);
  } catch (error) {
    res.status(500).json({ message: "Failed to create internship", error: error.message });
  }
};

// @desc    Update an internship (Used for drag-and-drop status changes)
// @route   PUT /api/internships/:id
exports.updateInternship = async (req, res) => {
  try {
    // Finds the specific card and updates whatever fields you sent (like the status)
    const updatedInternship = await Internship.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true } // Returns the updated document
    );

    if (!updatedInternship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.status(200).json(updatedInternship);
  } catch (error) {
    res.status(500).json({ message: "Failed to update internship", error: error.message });
  }
};

// @desc    Delete an internship
// @route   DELETE /api/internships/:id
exports.deleteInternship = async (req, res) => {
  try {
    const deletedInternship = await Internship.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!deletedInternship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.status(200).json({ message: "Internship deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete internship", error: error.message });
  }
};