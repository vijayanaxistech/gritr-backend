const express = require('express');
const router = express.Router();
let surveysManagement = require('../../Controller/admin/surveysController');
const { isAuth,adminAuth } = require("../../middleware/auth");

// Survey Management Routes
router.post('/create-surveys',adminAuth, surveysManagement.create);
router.post('/edit-surveys/:id', adminAuth ,surveysManagement.editSurvey);
router.get('/getall',adminAuth, surveysManagement.getAllSurveys); 
router.get('/getSurveyById/:id', adminAuth ,surveysManagement.getSurveyById);
router.delete('/deletesurveys/:id',adminAuth, surveysManagement.deleteSurvey);

// Flag Survey Routes
router.post('/flagSurvey/:id/flag', adminAuth, surveysManagement.flagSurvey);

// // Survey Approval Routes
router.post('/approveSurvey/:id/approve',adminAuth,surveysManagement.approveSurvey);

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
