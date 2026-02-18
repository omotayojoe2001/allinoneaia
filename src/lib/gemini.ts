import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function chatWithAI(userMessage: string, chatHistory: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const chat = model.startChat({
      history: chatHistory.length > 0 ? chatHistory : [],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: any) {
    if (error.message.includes('404')) {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(userMessage);
      return result.response.text();
    }
    throw error;
  }
}
