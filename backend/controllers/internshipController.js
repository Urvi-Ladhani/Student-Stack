const Internship = require('../models/Internship');
const axios = require('axios');
const cheerio = require('cheerio');

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

// @desc    Scrape jobs from a LinkedIn jobs URL
// @route   POST /api/internships/linkedin/scrape
exports.scrapeLinkedInJobs = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'No URL provided.' });
    }

    // Make the HTTP request to LinkedIn with a strict 8-second timeout
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = response.data || '';
    const $ = cheerio.load(html);
    const jobs = [];

    // Simple cheerio selectors for public/logged-out LinkedIn Job search page cards
    $('.jobs-search__results-list li, .base-card, .base-search-card').each((index, element) => {
      const titleEl = $(element).find('.base-search-card__title, .job-search-card__title');
      const companyEl = $(element).find('.base-search-card__subtitle, .job-search-card__subtitle');
      const locationEl = $(element).find('.job-search-card__location');
      const linkEl = $(element).find('a.base-card__full-link, a.job-search-card__link');

      const role = titleEl.text().trim();
      const company = companyEl.text().trim();
      const location = locationEl.text().trim();
      const jobLink = linkEl.attr('href') || '';

      if (role && company) {
        jobs.push({
          role,
          company,
          location: location || 'Not specified',
          jobLink,
          status: 'wishlist'
        });
      }
    });

    return res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error("LinkedIn scraping error:", error.message);
    let statusCode = 500;
    let errorMessage = 'Failed to scrape LinkedIn jobs';

    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      statusCode = 400;
      errorMessage = 'LinkedIn scrape request timed out. Please try again.';
    } else if (error.response) {
      statusCode = error.response.status === 404 ? 404 : 400;
      errorMessage = `LinkedIn responded with HTTP ${error.response.status}`;
    }

    return res.status(statusCode).json({ success: false, message: errorMessage });
  }
};