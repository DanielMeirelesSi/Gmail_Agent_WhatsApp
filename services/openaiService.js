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
- Não use muitos emojis. Evite emojis, exceto se for realmente necessário.
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
- Não use muitos emojis. O ideal é não usar nenhum.
- Não use tom alarmista.
- Não use markdown exagerado.
- Não exponha e-mails completos, nomes de contas sensíveis ou dados privados além do necessário.
- Se aparecer e-mail mascarado, mantenha mascarado.
- Não invente informações.
- Use apenas os dados fornecidos.
- A resposta deve caber bem no WhatsApp, sem ficar grande.
- Máximo de 3 blocos curtos.
- Cada bloco deve ter no máximo 2 frases.
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

Ignore ou reduza:
- newsletters
- notificações genéricas
- alertas automáticos sem ação clara

Formato desejado:
Daniel, encontrei alguns pontos que merecem sua atenção.

1. Ponto principal
Explique em uma frase curta.

2. Oportunidades ou mensagens
Explique em uma frase curta.

3. Ação sugerida
Diga o que ele deveria abrir primeiro.
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
- vaga compatível
- LinkedIn, Gupy, Indeed, empresas e recrutadores

Formato desejado:
Daniel, encontrei estas oportunidades nos seus e-mails.

1. Mais relevante
Resumo curto.

2. Outras oportunidades
Resumo curto.

3. Próximo passo
Diga o que vale conferir primeiro.
    `;
  }

  if (mode === "today") {
    return `
${baseRules}

Objetivo:
Resumir os e-mails de hoje.

Priorize:
- mensagens importantes
- respostas pendentes
- oportunidades
- segurança
- compromissos

Formato desejado:
Daniel, seus e-mails de hoje têm estes pontos principais.

1. Importante
Resumo curto.

2. Pode esperar
Resumo curto.

3. Ação sugerida
Resumo curto.
    `;
  }

  return `
${baseRules}

Objetivo:
Fazer um resumo geral dos e-mails recentes.

Formato desejado:
Daniel, aqui está um resumo dos seus e-mails recentes.

1. Mais importante
Resumo curto.

2. O que pode exigir ação
Resumo curto.

3. Baixa prioridade
Resumo curto.
  `;
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
Não ultrapasse 900 caracteres.
Não use emojis desnecessários.
Não exponha e-mails completos.
`,
    max_output_tokens: 260,
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