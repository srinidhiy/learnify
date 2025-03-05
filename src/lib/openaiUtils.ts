import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, proxy through your backend
});

export const generateEmbedding = async (text: string) => {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-3-small"
  });
  return response.data[0].embedding;
};

export const generateSummary = async (text: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate a concise summary of the following text. Focus on key points and main ideas."
      },
      { role: "user", content: text }
    ]
  });
  return response.choices[0].message.content;
};

export const chatWithDocuments = async (
  query: string, 
  relevantTexts: { text: string, documentId: string, position: number }[]
) => {
  const context = relevantTexts.map(t => t.text).join('\n\n');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the provided context. 
        When you use information from the context, cite it using <cite data-doc-id="[documentId]" data-position="[position]">quoted text</cite> tags.
        Always ground your answers in the provided context.`
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${query}`
      }
    ]
  });
  return response.choices[0].message.content;
}; 