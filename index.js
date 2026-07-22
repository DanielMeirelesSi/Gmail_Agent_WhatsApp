const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const gmailRoutes = require("./routes/gmailRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.status(200).json({
    status: "ok",
    name: "Gmail Agent WhatsApp",
    message: "Assistente de e-mail com WhatsApp, Gmail e IA está rodando.",
    routes: {
      health: "/health",
      gmailStatus: "/gmail/status",
      gmailRecent: "/gmail/recent",
      gmailSummary: "/gmail/summary",
      aiTest: "/ai/test",
      googleAuth: "/auth/google",
      whatsappSendTest: "POST /whatsapp/send-test",
      webhook: "/webhook",
    },
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "Assistente de e-mail rodando",
  });
});

app.use(authRoutes);
app.use(gmailRoutes);
app.use(whatsappRoutes);
app.use(aiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});