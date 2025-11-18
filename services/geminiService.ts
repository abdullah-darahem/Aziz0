import { GoogleGenAI, Chat, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Singleton instance to hold the chat session
let chatSession: Chat | null = null;

export const startChatSession = (history: Content[] = []) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Friendly and creative but grounded
    },
    history: history,
  });
  
  return chatSession;
};

export const getChatSession = (): Chat => {
  if (!chatSession) {
    return startChatSession([]);
  }
  return chatSession;
};

export const sendMessageToGeminiStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const session = getChatSession();
  
  try {
    const result = await session.sendMessageStream({ message });
    
    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    onChunk("\n\n**(Error: حصل مشكلة في الاتصال، حاول تاني يا بطل 😔)**");
  }
};

export const resetSession = () => {
    chatSession = null;
};