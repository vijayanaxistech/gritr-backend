const express = require("express");
const router = express.Router();
let surveysManagement = require("../../Controller/admin/surveysController");
const { isAuth, adminAuth } = require("../../middleware/auth");

// ============================
// Survey Management Routes
// ============================

// Create a new survey (requires admin authentication)
router.post("/create-surveys", isAuth, surveysManagement.create);

/**
 * @route   POST /updateSurveyStatus/:id
 * @desc    Update the status of a user (e.g., activate or deactivate)
 * @access  Protected
 */
router.post(
  "/updateSurveyStatus/:id",
  adminAuth,
  surveysManagement.updateSurveyStatus
);

router.post("/mark-duplicate", adminAuth, surveysManagement.markDuplicate);

// Edit an existing survey by ID (requires admin authentication)
router.post("/edit-surveys/:id", adminAuth, surveysManagement.editSurvey);

router.get("/getFrontUserById/:id", surveysManagement.getFrontUserById);

// Get all surveys for frontend (requires admin authentication)
router.get("/getall", isAuth, surveysManagement.getAllSurveys);

// Get all surveys (requires admin authentication)
router.get("/admin/getall", adminAuth, surveysManagement.getAllSurveys);

// Get a specific survey by its ID (requires admin authentication)
router.get("/:id", adminAuth, surveysManagement.getSurveyById);

// Delete a survey by its ID (requires admin authentication)
router.delete("/:id", adminAuth, surveysManagement.deleteSurvey);

router.post("/cityListSurvey", surveysManagement.getCitySurvey);

// ============================
// Flag Survey Routes
// ============================

// Flag a survey for review (requires admin authentication)
router.post("/:id/flag", adminAuth, surveysManagement.flagSurvey);

// ============================
// Survey Approval Routes
// ============================

// Approve a survey by ID (requires admin authentication)
//router.post('/:id/approve', adminAuth, surveysManagement.approveSurvey);

// Reject a survey by ID (requires admin authentication)
//router.post('/rejectSurvey/:id/reject', adminAuth, surveysManagement.rejectSurvey);

// Approve surveys that are similar (requires admin authentication)
router.post(
  "/:id/approve-similar",
  adminAuth,
  surveysManagement.approveSimilarSurveys
);

// penindg task
// // Question Management Routes
// router.get('/api/surveys/:surveyId/questions', getAllQuestions);  // Get all questions for a survey
// router.post('/api/surveys/:surveyId/questions', createQuestion);  // Add a new question
// router.put('/api/surveys/:surveyId/questions/:questionId', editQuestion);  // Edit a question
// router.delete('/api/surveys/:surveyId/questions/:questionId', deleteQuestion);  // Delete a question
// router.put('/api/surveys/:surveyId/questions/:questionId/duplicate', markQuestionAsDuplicate);  // Mark a question as duplicate

// // Bulk Create AI Questions
// router.post('/api/surveys/:surveyId/questions/bulk', bulkCreateQuestions);  // Bulk create questions using AI

module.exports = router;
