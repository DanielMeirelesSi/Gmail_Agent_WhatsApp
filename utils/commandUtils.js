const COMMANDS = {
  HELP: "HELP",
  EMAIL_SUMMARY: "EMAIL_SUMMARY",
  IMPORTANT_EMAILS: "IMPORTANT_EMAILS",
  JOBS: "JOBS",
  EMAILS_TODAY: "EMAILS_TODAY",
  NEW_EMAILS: "NEW_EMAILS",
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

  const helpTerms = [
    "ajuda",
    "comandos",
    "menu",
    "o que voce faz",
    "o que você faz",
    "como funciona",
    "opcoes",
    "opções",
  ];

  const newEmailTerms = [
    "novos emails",
    "novos e-mails",
    "email novo",
    "e-mail novo",
    "tem algo novo",
    "chegou algo novo",
    "alguma novidade",
    "novidades",
    "ver novos",
  ];

  const jobTerms = [
    "vaga",
    "vagas",
    "emprego",
    "processo seletivo",
    "processos seletivos",
    "entrevista",
    "recrutador",
    "recrutadora",
    "linkedin",
    "gupy",
    "indeed",
    "candidatura",
    "candidaturas",
    "oportunidade",
    "oportunidades",
    "carreira",
    "trabalho",
  ];

  const importantTerms = [
    "importante",
    "urgente",
    "prioridade",
    "tem algo importante",
    "algo importante",
    "preciso responder",
    "tenho que responder",
    "exige resposta",
    "exigem resposta",
    "atencao",
    "pendente",
    "pendencias",
    "o que preciso ver",
    "o que merece atencao",
  ];

  const todayTerms = [
    "hoje",
    "email de hoje",
    "emails de hoje",
    "e-mail de hoje",
    "e-mails de hoje",
    "gmail de hoje",
    "recebi hoje",
    "chegou hoje",
  ];

  const summaryTerms = [
    "email",
    "emails",
    "e-mail",
    "e-mails",
    "gmail",
    "resuma",
    "resumir",
    "resumo",
    "ultimos emails",
    "ultimos e-mails",
    "verificar emails",
    "verifique emails",
    "verifique meus emails",
    "verifique meus e-mails",
    "caixa de entrada",
  ];

  if (includesAny(text, helpTerms)) {
    return COMMANDS.HELP;
  }

  if (includesAny(text, newEmailTerms)) {
    return COMMANDS.NEW_EMAILS;
  }

  if (includesAny(text, jobTerms)) {
    return COMMANDS.JOBS;
  }

  if (includesAny(text, todayTerms) && includesAny(text, summaryTerms)) {
    return COMMANDS.EMAILS_TODAY;
  }

  if (includesAny(text, importantTerms)) {
    return COMMANDS.IMPORTANT_EMAILS;
  }

  if (includesAny(text, summaryTerms)) {
    return COMMANDS.EMAIL_SUMMARY;
  }

  return null;
}

function getGmailQuery(command) {
  if (command === COMMANDS.JOBS) {
    return "newer_than:14d";
  }

  if (command === COMMANDS.EMAILS_TODAY) {
    return "newer_than:1d";
  }

  if (command === COMMANDS.IMPORTANT_EMAILS) {
    return "newer_than:3d";
  }

  if (command === COMMANDS.NEW_EMAILS) {
    return "newer_than:3d";
  }

  return "newer_than:2d";
}

function getMaxResults(command) {
  if (command === COMMANDS.JOBS) {
    return 10;
  }

  if (command === COMMANDS.EMAILS_TODAY) {
    return 8;
  }

  if (command === COMMANDS.IMPORTANT_EMAILS) {
    return 10;
  }

  if (command === COMMANDS.NEW_EMAILS) {
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

  if (command === COMMANDS.NEW_EMAILS) {
    return "summary";
  }

  return "summary";
}

function getProcessingMessage(command) {
  if (command === COMMANDS.IMPORTANT_EMAILS) {
    return "Vou conferir seus e-mails recentes e separar o que realmente merece atenção.";
  }

  if (command === COMMANDS.JOBS) {
    return "Vou procurar oportunidades, vagas e processos seletivos nos seus e-mails.";
  }

  if (command === COMMANDS.EMAILS_TODAY) {
    return "Vou verificar os e-mails recebidos hoje e resumir o que importa.";
  }

  if (command === COMMANDS.NEW_EMAILS) {
    return "Vou verificar se chegaram e-mails novos desde a última conferência.";
  }

  return "Vou revisar seus e-mails recentes e te passar um resumo objetivo.";
}

function getHelpMessage() {
  return `Daniel, posso te ajudar com estes comandos:

tem algo importante?
Vejo seus e-mails recentes e separo o que merece atenção.

ver vagas
Procuro oportunidades, processos seletivos e mensagens de recrutadores.

novos e-mails
Mostro apenas e-mails que ainda não foram vistos nas últimas verificações.

e-mails de hoje
Resumo o que chegou hoje.

resuma meus e-mails
Faço um resumo geral dos e-mails recentes.

Por enquanto, eu apenas leio e resumo. Ainda não respondo, arquivo ou apago e-mails.`;
}

module.exports = {
  COMMANDS,
  detectCommand,
  getGmailQuery,
  getMaxResults,
  getSummaryMode,
  getProcessingMessage,
  getHelpMessage,
};