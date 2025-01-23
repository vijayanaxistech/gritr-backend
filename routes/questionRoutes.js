const express = require("express");
const router = express.Router();
const questionController = require("../Controller/questionController");
const { isAuth } = require("../middleware/auth");

/**
 * @route   POST /create-question
 * @desc    Create a new question
 * @access  Protected
 */
router.post("/create-question", isAuth, questionController.createQuestion);
router.get("/getAllQuestions", isAuth, questionController.getAllQuestions);
router.get('/:id',isAuth, questionController.getQuestionById);
router.post('/editquestion/:id',isAuth, questionController.editQuestionById);
router.patch('/:id/archive',isAuth,questionController.archiveQuestionById);
router.delete('/:id',isAuth, questionController.deleteQuestionById);
router.patch('/:id/duplicate',isAuth, questionController.markQuestionAsDuplicate);
// Get a question's moderation history
router.get('/:id/moderation', isAuth, questionController.getModerationHistory);


module.exports = router;