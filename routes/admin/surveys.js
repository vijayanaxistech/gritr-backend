const express = require('express');
const router = express.Router();
let surveysManagement = require('../../Controller/admin/surveysController');
const { isAuth,adminAuth } = require("../../middleware/auth");

// Survey Management Routes
router.post('/create-surveys',adminAuth, surveysManagement.create);  // Create a new survey
router.post('/edit-surveys/:id', adminAuth ,surveysManagement.editSurvey);  // Edit an existing survey




// router.put('/api/surveys/:id', editSurvey);  // Edit an existing survey
// router.get('/api/surveys', getAllSurveys);  // Get all surveys
// router.get('/api/surveys/:id', getSurveyById);  // Get survey by ID
// router.delete('/api/surveys/:id', deleteSurvey);  // Delete survey

// // Flag Survey Routes
// router.put('/api/surveys/:id/flag', flagSurvey);  // Flag survey as Product/Customer Experience

// // Survey Approval Routes
// router.put('/api/surveys/:id/approve', approveSurvey);  // Approve survey
// router.put('/api/surveys/:id/reject', rejectSurvey);  // Reject survey
// router.put('/api/surveys/:id/approve-similar', approveSimilarSurveys);  // Approve similar surveys

// // Question Management Routes
// router.get('/api/surveys/:surveyId/questions', getAllQuestions);  // Get all questions for a survey
// router.post('/api/surveys/:surveyId/questions', createQuestion);  // Add a new question
// router.put('/api/surveys/:surveyId/questions/:questionId', editQuestion);  // Edit a question
// router.delete('/api/surveys/:surveyId/questions/:questionId', deleteQuestion);  // Delete a question
// router.put('/api/surveys/:surveyId/questions/:questionId/duplicate', markQuestionAsDuplicate);  // Mark a question as duplicate

// // Bulk Create AI Questions
// router.post('/api/surveys/:surveyId/questions/bulk', bulkCreateQuestions);  // Bulk create questions using AI

module.exports = router;
