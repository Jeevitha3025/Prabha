import { Router } from "express";
import { answerSchemeQuestion } from "../ai/schemeChat.js";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, profile } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "message is required"
      });
    }

    const result = await answerSchemeQuestion(
      message,
      profile
    );

    return res.json(result);
  } catch (error) {
    console.error("Yojana Mitra error:", error);

    return res.status(500).json({
      error: "Unable to process your request"
    });
  }
});

export default router;