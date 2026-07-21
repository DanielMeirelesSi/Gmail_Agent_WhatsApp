const express = require("express");
const { testOpenAI } = require("../services/openaiService");

const router = express.Router();

router.get("/ai/test", async (req, res) => {
  try {
    const response = await testOpenAI();

    return res.status(200).json({
      status: "success",
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      response,
    });
  } catch (error) {
    console.error("Erro ao testar OpenAI:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Falha ao chamar a OpenAI API",
      error: error.message,
    });
  }
});

module.exports = router;