// controllers/questionController.js
import Question from "../../models/admin/question.js"; // Change to import statement
import helper from "../../helpers/helper.js"; // Change to import statement

export const createQuestion = async (req, res) => {
  try {
    const { content, category } = req.body;
    let authorId = req.user.id;

    // Validate the required fields
    if (!content || !category || !authorId) {
      return helper.error(res, "All fields are required.");
    }

    // Create a new question document
    const newQuestion = new Question({
      content,
      category,
      authorId,
    });

    // Save the question to the database
    await newQuestion.save();

    // Return success response with the created question
    return helper.success(res, "Question created successfully!", {
      question: newQuestion,
    });
  } catch (err) {
    console.error(err);
    return helper.error(res, "Server error, please try again.", err, 500);
  }
};

// Get all questions
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({
      isActive: true,
    });

    if (!questions || questions.length === 0) {
      return helper.error(res, "No questions found", null, 404);
    }
    return helper.success(res, "Questions fetched successfully", { questions });
  } catch (err) {
    return helper.error(res, "Server error, please try again.", err, 500);
  }
};

// Get a single question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return helper.error(res, "Question not found", null, 404);
    }

    // Return the success response with the question
    return helper.success(res, "Question fetched successfully", {
      question,
    });
  } catch (err) {
    console.error(err);
    return helper.error(res, "Server error, please try again.", err, 500);
  }
};

// Edit a question by ID
export const editQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tags, category } = req.body;

    console.log(req.params);
    console.log(req.body);

    // Find and update the question by ID
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { content, tags, category }, // Fields to update
      { new: true } // Return the updated document
    );

    // If no question is found to update
    if (!updatedQuestion) {
      return helper.error(res, "Question not found", null, 404);
    }

    // Return the success response with the updated question
    return helper.success(res, "Question updated successfully", {
      question: updatedQuestion,
    });
  } catch (err) {
    console.error(err);
    return helper.error(res, "Server error, please try again.", err, 500);
  }
};

// Archive a question by ID
export const archiveQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body; // Assuming you are passing the adminId in the body or from the session

    // Archive the question by setting isArchived to true
    const archivedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        isArchived: true,
        $push: {
          // Add the action to the moderationHistory array
          moderationHistory: {
            action: "Archived", // The action taken (archived)
            adminId: adminId, // Admin who performed the action
            timestamp: new Date(), // Timestamp of when the action occurred
          },
        },
      },
      { new: true } // Return the updated question
    );

    // If the question does not exist
    if (!archivedQuestion) {
      return helper.error(res, "Question not found", null, 404);
    }

    // Return success response with the updated question
    return helper.success(res, "Question archived successfully", {
      question: archivedQuestion,
    });
  } catch (err) {
    console.error(err);
    return helper.error(res, "Server error, please try again.", err, 500);
  }
};

export const deleteQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    // If the question does not exist
    if (!updatedQuestion) {
      return helper.error(res, "Question not found", null, 404);
    }

    // Return success response
    return helper.success(res, "Question deleted successfully", {
      question: updatedQuestion,
    });
  } catch (err) {
    console.error(err);
    return helper.error(res, "Server error, please try again.", err, 500);
  }
};

export const markQuestionAsDuplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { duplicateOf, adminId } = req.body; // Assuming adminId is passed in the body

    // Find the original question that the current question is marked as duplicate of
    const originalQuestion = await Question.findById(duplicateOf);
    if (!originalQuestion) {
      return helper.error(res, "Original question not found", null, 404);
    }

    // Update the question to mark it as a duplicate
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        duplicateOf,
        $push: {
          // Add the moderation action to the moderationHistory array
          moderationHistory: {
            action: "Marked as Duplicate", // The action being performed
            duplicateOf: duplicateOf, // The ID of the original question
            adminId: adminId, // The admin performing the action
            timestamp: new Date(), // Timestamp of the action
          },
        },
      },
      { new: true } // Return the updated question document
    );

    if (!updatedQuestion) {
      return helper.error(res, "Question not found", null, 404);
    }

    // Return success response with the updated question
    return helper.success(res, "Question marked as duplicate successfully", {
      question: updatedQuestion,
    });
  } catch (err) {
    console.error(err);
    return helper.error(
      res,
      "An error occurred while processing your request.",
      err,
      500
    );
  }
};

// Get the question's moderation history
export const getModerationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return helper.error(res, "Question not found", null, 404);
    }

    return helper.success(res, "Moderation history retrieved successfully", {
      moderationHistory: question.moderationHistory,
    });
  } catch (err) {
    console.error(err);
    return helper.error(
      res,
      "An error occurred while processing your request.",
      err,
      500
    );
  }
};
