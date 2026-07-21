const OpenAI = require("openai");
const { formatEmailList } = require("../utils/emailUtils");

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no .env");
  }

  return new OpenAI({
    apiKey,
  });
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-5.6-luna";
}

async function generateAgentResponse(userMessage, options = {}) {
  const openai = getOpenAIClient();

  const gmailConnected = options.gmailConnected || false;

  const response = await openai.responses.create({
    model: getOpenAIModel(),
    instructions: `
Você é o assistente pessoal de e-mails do Daniel.

Seu papel:
- Ajudar Daniel a lidar com e-mails, processos seletivos, oportunidades, tarefas e organização.
- Responder pelo WhatsApp de forma curta, direta e útil.
- Usar português do Brasil.
- Não inventar informações.
- Não dizer que verificou e-mails se ainda não buscou dados reais do Gmail.
- Estado atual da conexão Gmail: ${
      gmailConnected
        ? "conectado e já é possível buscar e-mails recentes quando Daniel pedir"
        : "não conectado"
    }.
- Se Daniel pedir para verificar e-mails, resumir e-mails ou consultar Gmail, essa tarefa deve ser tratada pelo fluxo específico de e-mails.
- Quando não souber algo, seja honesto.
- Evite respostas longas.
    `,
    input: userMessage,
    max_output_tokens: 150,
  });

  return response.output_text || "Não consegui gerar uma resposta agora.";
}

function getSummaryInstructions(mode) {
  if (mode === "important") {
    return `
Você é o assistente pessoal de e-mails do Daniel.

Analise os e-mails recentes e encontre apenas o que parece importante.
Priorize:
- processos seletivos
- entrevistas
- oportunidades de emprego
- mensagens que exigem resposta
- clientes ou freelas
- prazos, alertas relevantes e compromissos
Ignore notificações genéricas, newsletters fracas e mensagens automáticas sem ação clara.

Responda em português do Brasil, em formato curto para WhatsApp.
Não invente informações.
Use apenas os dados fornecidos.
    `;
  }

  if (mode === "jobs") {
    return `
Você é o assistente pessoal de e-mails do Daniel.

Analise os e-mails e foque somente em vagas, processos seletivos e oportunidades profissionais.
Procure sinais como:
- convite de recrutador
- candidatura
- entrevista
- processo seletivo
- vaga compatível
- LinkedIn, Gupy, Indeed, empresas e recrutadores

Responda em português do Brasil, em formato curto para WhatsApp.
Separe o que exige ação do que parece apenas alerta automático.
Não invente informações.
Use apenas os dados fornecidos.
    `;
  }

  if (mode === "today") {
    return `
Você é o assistente pessoal de e-mails do Daniel.

Analise os e-mails de hoje e faça um resumo curto.
Priorize o que exige ação, resposta ou atenção.
Diga também se a maioria parece ser apenas notificação automática.

Responda em português do Brasil, em formato curto para WhatsApp.
Não invente informações.
Use apenas os dados fornecidos.
    `;
  }

  return `
Você é o assistente pessoal de e-mails do Daniel.

Analise a lista de e-mails recentes e responda em português do Brasil.
Seja direto, útil e econômico.

Priorize:
- processos seletivos
- oportunidades de emprego
- mensagens que exigem resposta
- assuntos urgentes ou importantes
- clientes e freelas
- faculdade ou compromissos relevantes

Regras:
- Não invente informações.
- Use apenas os dados fornecidos.
- Se houver muitos e-mails irrelevantes, diga isso.
- Não seja longo.
- Responda em formato adequado para WhatsApp.
  `;
}

async function summarizeEmails(emails, options = {}) {
  if (!emails || emails.length === 0) {
    return "Não encontrei e-mails recentes para analisar.";
  }

  const openai = getOpenAIClient();

  const mode = options.mode || "summary";
  const formattedEmails = formatEmailList(emails);

  const response = await openai.responses.create({
    model: getOpenAIModel(),
    instructions: getSummaryInstructions(mode),
    input: `
Daniel pediu uma análise dos e-mails.

Modo da análise: ${mode}

Aqui estão os e-mails encontrados:

${formattedEmails}

Faça uma resposta curta com:
1. O que parece importante
2. O que pode exigir ação
3. O que parece só notificação ou baixo valor
`,
    max_output_tokens: 350,
  });

  return response.output_text || "Não consegui resumir os e-mails agora.";
}

async function testOpenAI() {
  const openai = getOpenAIClient();

  const response = await openai.responses.create({
    model: getOpenAIModel(),
    instructions:
      "Você é um assistente pessoal de e-mails do Daniel. Responda sempre de forma curta, direta e em português.",
    input: "Diga em uma frase que a integração com IA está funcionando.",
    max_output_tokens: 80,
  });

  return response.output_text;
}

module.exports = {
  generateAgentResponse,
  summarizeEmails,
  testOpenAI,
};