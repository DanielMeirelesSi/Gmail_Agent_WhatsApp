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