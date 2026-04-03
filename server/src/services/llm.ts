import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are MoneyMind AI, a friendly fintech assistant that helps everyday users and \
business owners understand financial topics. Answer in plain, conversational language. \
Do not use unexplained financial jargon. If you use a financial term, briefly explain it.

Use ONLY the following retrieved context to answer the user's question. If the context \
does not contain relevant information, say so honestly.`;

export class LLMService {
  private model;

  constructor(apiKey: string, model?: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: model ?? DEFAULT_MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });
  }

  async generateResponse(prompt: string, context: string[]): Promise<string> {
    const contextBlock = context.length > 0
      ? context.join('\n\n')
      : 'No relevant context found.';

    const fullPrompt = `--- Retrieved Context ---\n${contextBlock}\n--- End Context ---\n\nUser Question: ${prompt}`;

    const result = await this.model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  }
}

const apiKey = process.env.GEMINI_API_KEY ?? '';
export const llmService = new LLMService(apiKey);
