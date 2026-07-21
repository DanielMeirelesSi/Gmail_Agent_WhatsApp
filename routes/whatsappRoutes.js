const express = require("express");
const {
  sendWhatsAppText,
  getWhatsAppConfig,
} = require("../services/whatsappService");
const { getRecentEmails, isGmailConnected } = require("../services/gmailService");
const {
  generateAgentResponse,
  summarizeEmails,
} = require("../services/openaiService");
const {
  detectCommand,
  getGmailQuery,
  getMaxResults,
  getSummaryMode,
  getProcessingMessage,
} = require("../utils/commandUtils");
const {
  wasMessageProcessed,
  markMessageAsProcessed,
} = require("../utils/messageCache");

const router = express.Router();

function maskPhone(phone) {
  if (!phone) {
    return "";
  }

  return `${phone.slice(0, 4)}*****${phone.slice(-2)}`;
}

router.post("/whatsapp/send-test", async (req, res) => {
  try {
    const { recipientPhone } = getWhatsAppConfig();

    if (!recipientPhone) {
      return res.status(400).json({
        status: "error",
        message: "WHATSAPP_RECIPIENT_PHONE não configurado no .env",
      });
    }

    const data = await sendWhatsAppText(
      recipientPhone,
      "Olá, Daniel. Mensagem enviada pelo backend do agente."
    );

    return res.status(200).json({
      status: "success",
      message: "Mensagem enviada com sucesso",
      data,
    });
  } catch (error) {
    const metaError = error.response?.data || error.message;

    console.error("Erro ao enviar mensagem:", metaError);

    return res.status(500).json({
      status: "error",
      message: "Falha ao enviar mensagem pelo WhatsApp",
      error: metaError,
    });
  }
});

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  try {
    const change = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const messageId = message.id;
    const from = message.from;
    const { recipientPhone } = getWhatsAppConfig();

    if (messageId && wasMessageProcessed(messageId)) {
      console.log(`Mensagem duplicada ignorada: ${messageId}`);
      return res.sendStatus(200);
    }

    if (messageId) {
      markMessageAsProcessed(messageId);
    }

    console.log("Mensagem recebida:", {
      id: messageId,
      from: maskPhone(from),
      type: message.type,
    });

    if (from !== recipientPhone) {
      console.log(`Mensagem ignorada de número não autorizado: ${maskPhone(from)}`);
      return res.sendStatus(200);
    }

    if (message.type !== "text") {
      await sendWhatsAppText(
        from,
        "Por enquanto, consigo responder apenas mensagens de texto."
      );

      return res.sendStatus(200);
    }

    const userText = message.text?.body?.trim();

    if (!userText) {
      return res.sendStatus(200);
    }

    const command = detectCommand(userText);

    if (command) {
      if (!isGmailConnected()) {
        await sendWhatsAppText(
          from,
          "Seu Gmail ainda não está conectado. Acesse http://localhost:3000/auth/google para conectar."
        );

        return res.sendStatus(200);
      }

      console.log("Comando detectado:", command);

      await sendWhatsAppText(from, getProcessingMessage(command));

      const emails = await getRecentEmails({
        maxResults: getMaxResults(command),
        query: getGmailQuery(command),
      });

      const summary = await summarizeEmails(emails, {
        mode: getSummaryMode(command),
      });

      await sendWhatsAppText(from, summary);

      return res.sendStatus(200);
    }

    const aiResponse = await generateAgentResponse(userText, {
      gmailConnected: isGmailConnected(),
    });

    await sendWhatsAppText(from, aiResponse);

    return res.sendStatus(200);
  } catch (error) {
    const apiError = error.response?.data || error.message;

    console.error("Erro ao processar webhook:", apiError);

    return res.sendStatus(200);
  }
});

module.exports = router;