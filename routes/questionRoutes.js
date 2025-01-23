const express = require("express");
const router = express.Router();
const questionController = require("../Controller/questionController");
const { isAuth } = require("../middleware/auth");

/**
 * Routes for Question Management
 * These routes handle creating, retrieving, updating, archiving, and deleting questions.
 */

// Route to create a new question
router.post("/create-question", isAuth, questionController.createQuestion);

/**
 * @route   GET /getAllQuestions
 * @desc    Retrieve all questions
 * @access  Protected
 */
router.get("/getAllQuestions", isAuth, questionController.getAllQuestions);

/**
 * @route   GET /:id
 * @desc    Retrieve a question by its ID
 * @access  Protected
 */
router.get("/:id", isAuth, questionController.getQuestionById);

/**
 * @route   POST /editquestion/:id
 * @desc    Edit a question by its ID
 * @access  Protected
 */
router.post("/editquestion/:id", isAuth, questionController.editQuestionById);

/**
 * @route   PATCH /:id/archive
 * @desc    Archive a question by its ID
 * @access  Protected
 */
router.patch("/:id/archive", isAuth, questionController.archiveQuestionById);

/**
 * @route   DELETE /:id
 * @desc    Delete a question by its ID
 * @access  Protected
 */
router.delete("/:id", isAuth, questionController.deleteQuestionById);

/**
 * @route   PATCH /:id/duplicate
 * @desc    Mark a question as duplicate by its ID
 * @access  Protected
 */
router.patch("/:id/duplicate", isAuth, questionController.markQuestionAsDuplicate);

/**
 * @route   GET /:id/moderation
 * @desc    Retrieve the moderation history of a question by its ID
 * @access  Protected
 */
router.get("/:id/moderation", isAuth, questionController.getModerationHistory);

module.exports = router;
