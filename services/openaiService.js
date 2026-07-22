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

Tom da resposta:
- Fale como uma secretária pessoal cuidadosa e objetiva.
- Seja natural, educado e direto.
- Use português do Brasil.
- Não use emojis.
- Não use linguagem exageradamente informal.
- Não use texto longo.
- Não invente informações.

Contexto:
- Você ajuda Daniel com e-mails, processos seletivos, oportunidades, tarefas e organização.
- Estado atual do Gmail: ${
      gmailConnected
        ? "conectado e disponível para consultar e-mails quando Daniel pedir"
        : "não conectado"
    }.
- Se Daniel pedir para verificar e-mails, resumir e-mails ou consultar Gmail, essa tarefa deve ser tratada pelo fluxo específico de e-mails.
    `,
    input: userMessage,
    max_output_tokens: 120,
  });

  return response.output_text || "Não consegui gerar uma resposta agora.";
}

function getSummaryInstructions(mode) {
  const baseRules = `
Você é a secretária pessoal do Daniel analisando os e-mails dele.

Estilo obrigatório:
- Escreva como uma pessoa cuidadosa informando Daniel.
- Seja claro, objetivo e útil.
- Use português do Brasil.
- Não use emojis.
- Não use tom alarmista.
- Não use markdown exagerado.
- Não exponha e-mails completos.
- Se aparecer e-mail mascarado, mantenha mascarado.
- Não invente informações.
- Use apenas os dados fornecidos.
- A resposta deve ser curta e caber bem no WhatsApp.
- Não crie título sem conteúdo.
- Não termine a resposta com um tópico vazio.
- Seja específico com o que encontrou.
`;

  if (mode === "important") {
    return `
${baseRules}

Objetivo:
Encontrar apenas o que merece atenção do Daniel.

Priorize:
- segurança da conta
- processos seletivos
- entrevistas
- oportunidades de emprego
- mensagens que exigem resposta
- clientes ou freelas
- prazos e compromissos

Formato obrigatório:
Daniel, encontrei alguns pontos que merecem sua atenção.

Principal:
Explique o item mais importante em até 2 frases.

Também vale conferir:
Explique outras pendências ou oportunidades em até 2 frases.

Sugestão:
Diga o que Daniel deve abrir primeiro.
    `;
  }

  if (mode === "jobs") {
    return `
${baseRules}

Objetivo:
Analisar somente vagas, processos seletivos e oportunidades profissionais.

Priorize:
- convite de recrutador
- candidatura
- entrevista
- vaga compatível com tecnologia, desenvolvimento, suporte técnico ou estágio
- LinkedIn, Gupy, Indeed, empresas e recrutadores

Ignore:
- newsletters genéricas
- propaganda
- alerta repetitivo sem vaga clara

Formato obrigatório:
Daniel, encontrei oportunidades nos seus e-mails.

Mais relevante:
Informe a melhor oportunidade encontrada em até 2 frases.

Outras opções:
Liste outras vagas, convites ou alertas úteis em até 2 frases.

Sugestão:
Diga o que Daniel deve conferir primeiro.
    `;
  }

  if (mode === "today") {
    return `
${baseRules}

Objetivo:
Resumir os e-mails recebidos hoje.

Priorize:
- mensagens importantes
- respostas pendentes
- oportunidades
- segurança
- compromissos

Formato obrigatório:
Daniel, seus e-mails de hoje têm estes pontos principais.

Importante:
Resumo curto do que merece atenção.

Pode esperar:
Resumo curto do que parece menos urgente.

Sugestão:
Diga o que Daniel deve abrir primeiro.
    `;
  }

  return `
${baseRules}

Objetivo:
Fazer um resumo geral dos e-mails recentes.

Formato obrigatório:
Daniel, revisei seus e-mails recentes.

Mais importante:
Resumo curto do principal.

Pode exigir ação:
Resumo curto do que Daniel talvez precise responder ou abrir.

Baixa prioridade:
Resumo curto do que parece apenas notificação.
  `;
}

function buildFallbackEmailSummary(emails, mode) {
  const firstEmails = emails.slice(0, 3);

  if (mode === "jobs") {
    const items = firstEmails
      .map((email) => `- ${email.subject || "Sem assunto"}`)
      .join("\n");

    return `Daniel, encontrei alguns e-mails recentes que podem ter relação com oportunidades.

${items}

Sugestão:
Eu abriria primeiro os que mencionam vaga, candidatura, entrevista ou LinkedIn.`;
  }

  const items = firstEmails
    .map((email) => `- ${email.subject || "Sem assunto"}`)
    .join("\n");

  return `Daniel, consegui encontrar e-mails recentes, mas não consegui gerar um resumo completo agora.

Principais assuntos encontrados:
${items}`;
}

function ensureCompleteSummary(summary, mode) {
  if (!summary) {
    return "";
  }

  const cleanedSummary = summary.trim();

  const incompleteEndings = [
    "3. Próximo passo",
    "3. Sugestão",
    "Próximo passo:",
    "Sugestão:",
    "Sugestão",
  ];

  const isIncomplete = incompleteEndings.some((ending) =>
    cleanedSummary.endsWith(ending)
  );

  if (!isIncomplete) {
    return cleanedSummary;
  }

  if (mode === "jobs") {
    return `${cleanedSummary}
Abra primeiro as vagas com prazo ou indicação de candidatura hoje, depois confira os convites de recrutadores.`;
  }

  if (mode === "important") {
    return `${cleanedSummary}
Abra primeiro o que envolve segurança, resposta pendente ou oportunidade profissional.`;
  }

  return `${cleanedSummary}
Abra primeiro os e-mails que parecem exigir resposta ou alguma ação sua.`;
}

async function summarizeEmails(emails, options = {}) {
  if (!emails || emails.length === 0) {
    return "Daniel, não encontrei e-mails recentes para analisar.";
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

E-mails encontrados:

${formattedEmails}

Faça uma resposta curta, humanizada e útil para WhatsApp.
Não ultrapasse 850 caracteres.
Não use emojis.
Não exponha e-mails completos.
Evite repetir o mesmo assunto em blocos diferentes.
Sempre termine a resposta com uma sugestão prática.
`,
    max_output_tokens: 320,
  });

  const summary = response.output_text || buildFallbackEmailSummary(emails, mode);

  return ensureCompleteSummary(summary, mode);
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