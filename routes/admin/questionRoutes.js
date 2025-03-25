import express from "express";
import { adminAuth } from "../../middleware/auth.js";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
} from "../../Controller/admin/questionController.js"; // Import functions directly

const router = express.Router();

router.post("/create-question", adminAuth, createQuestion); // Use createQuestion here
router.get("/all-questions", adminAuth, getAllQuestions); // Use getAllQuestions here
router.get("/:id", adminAuth, getQuestionById); // Use getQuestionById here

export default router;
