const express = require("express");
const {
  isGmailConnected,
  getRecentEmails,
} = require("../services/gmailService");
const { summarizeEmails } = require("../services/openaiService");

const router = express.Router();

router.get("/gmail/status", (req, res) => {
  return res.status(200).json({
    status: "ok",
    connected: isGmailConnected(),
    message: isGmailConnected()
      ? "Gmail conectado."
      : "Gmail ainda não conectado.",
  });
});

router.get("/gmail/recent", async (req, res) => {
  try {
    const emails = await getRecentEmails({
      maxResults: req.query.max || 10,
      query: req.query.q || "newer_than:2d",
    });

    return res.status(200).json({
      status: "success",
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Erro ao buscar e-mails:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Falha ao buscar e-mails recentes.",
      error: error.message,
    });
  }
});

router.get("/gmail/summary", async (req, res) => {
  try {
    const emails = await getRecentEmails({
      maxResults: 10,
      query: "newer_than:2d",
    });

    const summary = await summarizeEmails(emails, {
      mode: "summary",
    });

    return res.status(200).json({
      status: "success",
      summary,
    });
  } catch (error) {
    console.error("Erro ao resumir e-mails:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Falha ao resumir e-mails recentes.",
      error: error.message,
    });
  }
});

module.exports = router;