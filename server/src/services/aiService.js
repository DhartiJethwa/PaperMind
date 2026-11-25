
let aiClientPromise;

async function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from server/.env');
  }

  if (!aiClientPromise) {
    aiClientPromise = import('@google/genai').then(
      ({ GoogleGenAI }) =>
        new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        })
    );
  }

  return aiClientPromise;
}

// Retry temporary API errors
async function withRetry(apiCall, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const status = error.status || error.code;

      const temporary =
        [429, 500, 503, 'UNAVAILABLE',
         'RESOURCE_EXHAUSTED', 'INTERNAL'].includes(status);

      if (!temporary || attempt === retries) {
        throw error;
      }

      const delay = 1000 * (attempt + 1);

      console.log(`Gemini retry ${attempt + 1}`);

      await new Promise(resolve =>
        setTimeout(resolve, delay)
      );
      console.log('Gemini API error:', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
  }
}

async function createEmbedding(
  text,
  taskType = 'RETRIEVAL_DOCUMENT'
) {
  const ai = await getClient();

  console.time('Gemini embedding API');

  try {
    const result = await withRetry(() =>
      ai.models.embedContent({
        model:
          process.env.GEMINI_EMBEDDING_MODEL ||
          'gemini-embedding-001',
        contents: String(text).slice(0, 12000),
        config: { taskType },
      })
    );

    const embedding = result.embeddings?.[0]?.values;

    if (!embedding?.length) {
      throw new Error('Gemini returned an empty embedding.');
    }

    return embedding;
  } finally {
    console.timeEnd('Gemini embedding API');
  }
}

async function answerFromContext(
  question,
  contexts,
  history = []
) {
  const ai = await getClient();

  const contextText = contexts
    .map((c, i) =>
      `[Source ${i + 1}${c.pageNumber ? `, Page ${c.pageNumber}` : ''}]\n${c.text}`
    )
    .join('\n\n');

  const historyText = history
    .slice(-4)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `
You are PaperMind, a document assistant.

Answer using only the supplied document excerpts.
Do not invent information.
If the answer is unavailable, say so clearly.
Be concise and cite page numbers when available.

History:
${historyText || 'No previous messages.'}

Document excerpts:
${contextText || 'No relevant excerpts found.'}

Question:
${question}
`;

  console.time('Gemini answer API');

  try {
    const result = await withRetry(() =>
      ai.models.generateContent({
        model:
          process.env.GEMINI_CHAT_MODEL ||
          'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      })
    );

    const answer = result.text?.trim();

    if (!answer) {
      throw new Error('Gemini returned an empty answer.');
    }

    return answer;
  } finally {
    console.timeEnd('Gemini answer API');
  }
}

module.exports = {
  createEmbedding,
  answerFromContext,
};
