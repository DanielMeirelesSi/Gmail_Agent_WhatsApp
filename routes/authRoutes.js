const express = require("express");
const {
  getGoogleAuthUrl,
  saveGoogleTokenFromCode,
} = require("../services/gmailService");

const router = express.Router();

router.get("/auth/google", (req, res) => {
  try {
    const authUrl = getGoogleAuthUrl();

    return res.redirect(authUrl);
  } catch (error) {
    console.error("Erro ao gerar URL de autenticação:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Falha ao gerar URL de autenticação do Google.",
      error: error.message,
    });
  }
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Código de autorização não recebido.",
      });
    }

    await saveGoogleTokenFromCode(code);

    return res.status(200).send(`
      <h1>Gmail conectado com sucesso!</h1>
      <p>Você já pode fechar esta aba e voltar para o VS Code.</p>
    `);
  } catch (error) {
    console.error("Erro no callback do Google:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Falha ao conectar com o Google.",
      error: error.message,
    });
  }
});

module.exports = router;