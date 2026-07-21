const COMMANDS = {
  EMAIL_SUMMARY: "EMAIL_SUMMARY",
  IMPORTANT_EMAILS: "IMPORTANT_EMAILS",
  JOBS: "JOBS",
  EMAILS_TODAY: "EMAILS_TODAY",
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function detectCommand(userText) {
  const text = normalizeText(userText);

  const jobTerms = [
    "vaga",
    "vagas",
    "emprego",
    "processo seletivo",
    "entrevista",
    "recrutador",
    "recrutadora",
    "linkedin",
    "gupy",
    "indeed",
    "candidatura",
    "oportunidade",
  ];

  const importantTerms = [
    "importante",
    "urgente",
    "prioridade",
    "tem algo importante",
    "algo importante",
    "preciso responder",
    "exige resposta",
    "atencao",
  ];

  const todayTerms = [
    "email de hoje",
    "emails de hoje",
    "e-mail de hoje",
    "e-mails de hoje",
    "gmail de hoje",
    "hoje",
  ];

  const emailTerms = [
    "email",
    "emails",
    "e-mail",
    "e-mails",
    "gmail",
    "resuma meus emails",
    "resuma meus e-mails",
    "resumir meus emails",
    "resumir meus e-mails",
    "verificar meus emails",
    "verifique meus emails",
    "verifique meus e-mails",
  ];

  if (includesAny(text, jobTerms)) {
    return COMMANDS.JOBS;
  }

  if (includesAny(text, importantTerms)) {
    return COMMANDS.IMPORTANT_EMAILS;
  }

  if (includesAny(text, todayTerms) && includesAny(text, emailTerms)) {
    return COMMANDS.EMAILS_TODAY;
  }

  if (includesAny(text, emailTerms)) {
    return COMMANDS.EMAIL_SUMMARY;
  }

  return null;
}

function getGmailQuery(command) {
  if (command === COMMANDS.JOBS) {
    return 'newer_than:7d (vaga OR emprego OR entrevista OR recrutador OR candidatura OR oportunidade OR LinkedIn OR Gupy OR Indeed)';
  }

  if (command === COMMANDS.EMAILS_TODAY) {
    return "newer_than:1d";
  }

  if (command === COMMANDS.IMPORTANT_EMAILS) {
    return "newer_than:2d";
  }

  return "newer_than:2d";
}

function getMaxResults(command) {
  if (command === COMMANDS.JOBS) {
    return 10;
  }

  return 10;
}

function getSummaryMode(command) {
  if (command === COMMANDS.IMPORTANT_EMAILS) {
    return "important";
  }

  if (command === COMMANDS.JOBS) {
    return "jobs";
  }

  if (command === COMMANDS.EMAILS_TODAY) {
    return "today";
  }

  return "summary";
}

function getProcessingMessage(command) {
  if (command === COMMANDS.IMPORTANT_EMAILS) {
    return "Vou verificar se tem algo importante nos seus e-mails recentes. Um momento...";
  }

  if (command === COMMANDS.JOBS) {
    return "Vou procurar e-mails relacionados a vagas e processos seletivos. Um momento...";
  }

  if (command === COMMANDS.EMAILS_TODAY) {
    return "Vou verificar seus e-mails de hoje. Um momento...";
  }

  return "Vou verificar seus e-mails recentes. Um momento...";
}

module.exports = {
  COMMANDS,
  detectCommand,
  getGmailQuery,
  getMaxResults,
  getSummaryMode,
  getProcessingMessage,
};