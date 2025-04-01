
import OpenAI from 'openai';

// Initialize OpenAI with optional API key from environment
// For client-side usage, we'll prompt users to input their API key
let openaiApiKey: string | undefined = undefined;

// Function to set the API key at runtime
export const setOpenAIApiKey = (apiKey: string) => {
  openaiApiKey = apiKey;
};

// Get the current OpenAI client with the latest API key
export const getOpenAIClient = () => {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not set. Please set it using setOpenAIApiKey().');
  }
  
  return new OpenAI({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true // Note: In production, proxy through your backend
  });
};

export const generateEmbedding = async (text: string) => {
  if (!text) return [];
  
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    input: text,
    model: "text-embedding-3-small"
  });
  return response.data[0].embedding;
};

export const generateSummary = async (text: string) => {
  if (!text) return '';
  
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate a concise summary of the following text. Focus on key points and main ideas."
      },
      { role: "user", content: text }
    ]
  });
  return response.choices[0].message.content || '';
};

export const chatWithDocuments = async (
  query: string, 
  relevantTexts: { text: string, documentId: string, position: number }[]
) => {
  if (!query || !relevantTexts.length) return '';
  
  const context = relevantTexts.map(t => t.text).join('\n\n');
  
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
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
  return response.choices[0].message.content || '';
}; 
