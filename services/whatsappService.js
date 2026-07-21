const axios = require("axios");

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    recipientPhone: process.env.WHATSAPP_RECIPIENT_PHONE,
  };
}

async function sendWhatsAppText(to, body) {
  const { accessToken, phoneNumberId } = getWhatsAppConfig();

  if (!accessToken || !phoneNumberId) {
    throw new Error("Credenciais do WhatsApp não configuradas no .env");
  }

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body,
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

module.exports = {
  getWhatsAppConfig,
  sendWhatsAppText,
};