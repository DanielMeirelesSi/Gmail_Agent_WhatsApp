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
  COMMANDS,
  detectCommand,
  getGmailQuery,
  getMaxResults,
  getSummaryMode,
  getProcessingMessage,
  getHelpMessage,
} = require("../utils/commandUtils");
const {
  wasMessageProcessed,
  markMessageAsProcessed,
} = require("../utils/messageCache");
const { getNewEmails, markEmailsAsSeen } = require("../utils/emailState");

const router = express.Router();

function maskPhone(phone) {
  if (!phone) {
    return "";
  }

  return `${phone.slice(0, 4)}*****${phone.slice(-2)}`;
}

async function processIncomingMessage(message) {
  const from = message.from;
  const { recipientPhone } = getWhatsAppConfig();

  console.log("Mensagem recebida:", {
    id: message.id,
    from: maskPhone(from),
    type: message.type,
  });

  if (from !== recipientPhone) {
    console.log(`Mensagem ignorada de número não autorizado: ${maskPhone(from)}`);
    return;
  }

  if (message.type !== "text") {
    await sendWhatsAppText(
      from,
      "Por enquanto, consigo responder apenas mensagens de texto."
    );

    return;
  }

  const userText = message.text?.body?.trim();

  if (!userText) {
    return;
  }

  const command = detectCommand(userText);

  if (command === COMMANDS.HELP) {
    await sendWhatsAppText(from, getHelpMessage());
    return;
  }

  if (command) {
    if (!isGmailConnected()) {
      await sendWhatsAppText(
        from,
        "Daniel, seu Gmail ainda não está conectado. Acesse http://localhost:3000/auth/google para conectar."
      );

      return;
    }

    console.log("Comando detectado:", command);

    await sendWhatsAppText(from, getProcessingMessage(command));

    const emails = await getRecentEmails({
      maxResults: getMaxResults(command),
      query: getGmailQuery(command),
    });

    if (command === COMMANDS.NEW_EMAILS) {
      const newEmails = getNewEmails(emails);

      if (newEmails.length === 0) {
        await sendWhatsAppText(
          from,
          "Daniel, não encontrei e-mails novos desde a última conferência."
        );

        return;
      }

      const summary = await summarizeEmails(newEmails, {
        mode: getSummaryMode(command),
      });

      markEmailsAsSeen(newEmails);

      await sendWhatsAppText(from, summary);

      return;
    }

    const summary = await summarizeEmails(emails, {
      mode: getSummaryMode(command),
    });

    markEmailsAsSeen(emails);

    await sendWhatsAppText(from, summary);

    return;
  }

  const aiResponse = await generateAgentResponse(userText, {
    gmailConnected: isGmailConnected(),
  });

  await sendWhatsAppText(from, aiResponse);
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

router.post("/webhook", (req, res) => {
  const change = req.body?.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (!message) {
    return res.sendStatus(200);
  }

  const messageId = message.id;

  if (messageId && wasMessageProcessed(messageId)) {
    console.log(`Mensagem duplicada ignorada: ${messageId}`);
    return res.sendStatus(200);
  }

  if (messageId) {
    markMessageAsProcessed(messageId);
  }

  res.sendStatus(200);

  processIncomingMessage(message).catch((error) => {
    const apiError = error.response?.data || error.message;
    console.error("Erro ao processar mensagem em segundo plano:", apiError);
  });
});

module.exports = router;