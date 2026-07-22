const { google } = require("googleapis");
const fs = require("fs");
const { getEmailHeader } = require("../utils/emailUtils");
const { getStoragePath } = require("../utils/storagePaths");

const GMAIL_TOKEN_PATH = getStoragePath("gmail-token.json");

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function createOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais do Google não configuradas no .env");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function isGmailConnected() {
  return fs.existsSync(GMAIL_TOKEN_PATH);
}

function getGoogleAuthUrl() {
  const oauth2Client = createOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

async function saveGoogleTokenFromCode(code) {
  const oauth2Client = createOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  fs.writeFileSync(GMAIL_TOKEN_PATH, JSON.stringify(tokens, null, 2));

  return tokens;
}

function getGmailAuthClient() {
  if (!fs.existsSync(GMAIL_TOKEN_PATH)) {
    throw new Error("Gmail ainda não conectado. Acesse /auth/google primeiro.");
  }

  const oauth2Client = createOAuthClient();

  const tokens = JSON.parse(fs.readFileSync(GMAIL_TOKEN_PATH, "utf8"));

  oauth2Client.setCredentials(tokens);

  oauth2Client.on("tokens", (newTokens) => {
    const currentTokens = JSON.parse(fs.readFileSync(GMAIL_TOKEN_PATH, "utf8"));
    const updatedTokens = {
      ...currentTokens,
      ...newTokens,
    };

    fs.writeFileSync(GMAIL_TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
  });

  return oauth2Client;
}

async function getRecentEmails(options = {}) {
  const auth = getGmailAuthClient();

  const gmail = google.gmail({
    version: "v1",
    auth,
  });

  const maxResults = Math.min(Number(options.maxResults || 10), 10);
  const query = options.query || "newer_than:2d";

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query,
  });

  const messages = listResponse.data.messages || [];

  const emails = [];

  for (const message of messages) {
    const emailResponse = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });

    const payload = emailResponse.data.payload;
    const headers = payload?.headers || [];

    emails.push({
      id: emailResponse.data.id,
      from: getEmailHeader(headers, "From"),
      subject: getEmailHeader(headers, "Subject"),
      date: getEmailHeader(headers, "Date"),
      snippet: emailResponse.data.snippet || "",
    });
  }

  return emails;
}

module.exports = {
  isGmailConnected,
  getGoogleAuthUrl,
  saveGoogleTokenFromCode,
  getRecentEmails,
};