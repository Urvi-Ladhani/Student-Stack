const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware'); // Ensures only logged-in users access this
const { 
    getInternships, 
    createInternship, 
    updateInternship, 
    deleteInternship,
    scrapeLinkedInJobs
} = require('../controllers/internshipController');

// Routes for /api/internships
router.route('/')
  .get(protect, getInternships)
  .post(protect, createInternship);

// Route for LinkedIn scraping
router.post('/linkedin/scrape', protect, scrapeLinkedInJobs);

// Routes for /api/internships/:id
router.route('/:id')
  .put(protect, updateInternship)
  .delete(protect, deleteInternship);

module.exports = router;