// controllers/questionController.js
const Question = require('../models/question');
const helper = require('../helpers/helper');


module.exports = {
    // Create a new question
    createQuestion : async (req, res) => {
    try {
        const { content, tags, category, authorId } = req.body;

        // Validate the required fields
        if (!content || !tags || !category || !authorId) {
        return helper.error(res, 'All fields are required.');
        }

        // Create a new question document
        const newQuestion = new Question({
        content,
        tags,
        category,
        authorId,
        });

        // Save the question to the database
        await newQuestion.save();

        // Return success response with the created question
        return helper.success(res, 'Question created successfully!', {
        question: newQuestion,
        });
    } catch (err) {
        console.error(err);
        return helper.error(res, 'Server error, please try again.', err, 500);
    }
    },

    // Get all questions
    getAllQuestions : async (req, res) => {
        try {
        const questions = await Question.find();
        if (!questions || questions.length === 0) {
            return helper.error(res, 'No questions found', null, 404);
        }  
        return helper.success(res, 'Questions fetched successfully', {questions});
        } catch (err) {
        return helper.error(res, 'Server error, please try again.', err, 500);
        }
    },

    // Get a single question by ID
    getQuestionById : async (req, res) => {
    try {
      const { id } = req.params; 
      const question = await Question.findById(id);
  
      if (!question) {
        return helper.error(res, 'Question not found', null, 404);
      }
  
      // Return the success response with the question
      return helper.success(res, 'Question fetched successfully', {
        question,
      });
    } catch (err) {
      console.error(err);
      return helper.error(res, 'Server error, please try again.', err, 500);
    }
    },

    // Edit a question by ID
    editQuestionById : async (req, res) => {
    try {
      const { id } = req.params; 
      const { content, tags, category } = req.body;

      console.log(req.params);
      console.log(req.body);
  
      // Find and update the question by ID
      const updatedQuestion = await Question.findByIdAndUpdate(
        id,
        { content, tags, category },  // Fields to update
        { new: true }  // Return the updated document
      );
  
      // If no question is found to update
      if (!updatedQuestion) {
        return helper.error(res, 'Question not found', null, 404);
      }
  
      // Return the success response with the updated question
      return helper.success(res, 'Question updated successfully', {
        question: updatedQuestion,
      });
    } catch (err) {
      console.error(err);
      return helper.error(res, 'Server error, please try again.', err, 500);
    }
     },

     // Archive a question by ID
    archiveQuestionById : async (req, res) => {
        try {
        const { id } = req.params;
        const archivedQuestion = await Question.findByIdAndUpdate(
            id,
            { isArchived: true },
            { new: true } 
        ); 
    
        // If the question does not exist
        if (!archivedQuestion) {
            return helper.error(res, 'Question not found', null, 404);
        }
    
        // Return success response
        return helper.success(res, 'Question archived successfully', {
            question: archivedQuestion,
        });
        } catch (err) {
        console.error(err);
        return helper.error(res, 'Server error, please try again.', err, 500);
        }
    },

    
    deleteQuestionById : async (req, res) => {
    try {
      const { id } = req.params;
      const updatedQuestion = await Question.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );
  
      // If the question does not exist
      if (!updatedQuestion) {
        return helper.error(res, 'Question not found', null, 404);
      }
  
      // Return success response
      return helper.success(res, 'Question deleted successfully', {
        question: updatedQuestion,
      });
    } catch (err) {
      console.error(err);
      return helper.error(res, 'Server error, please try again.', err, 500);
    }
    },

}

