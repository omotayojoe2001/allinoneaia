import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const tools = [
  {
    type: "function" as const,
    function: {
      name: "schedule_email",
      description: "Schedule an email campaign to a specific list",
      parameters: {
        type: "object",
        properties: {
          list_name: { type: "string", description: "Name of the email list" },
          subject: { type: "string", description: "Email subject line" },
          scheduled_time: { type: "string", description: "When to send" },
        },
        required: ["list_name", "scheduled_time"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_whatsapp_campaign",
      description: "Create a WhatsApp bulk message campaign",
      parameters: {
        type: "object",
        properties: {
          list_name: { type: "string", description: "WhatsApp contact list name" },
          message: { type: "string", description: "Message to send" },
        },
        required: ["list_name", "message"],
      },
    },
  },
];

export async function chatWithAI(userMessage: string, chatHistory: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(userMessage);
    return result.response.text();
  } catch (error: any) {
    throw new Error(`AI service failed: ${error.message}`);
  }
}

async function executeFunction(name: string, args: any) {
  switch (name) {
    case "schedule_email":
      return {
        success: true,
        message: `Email scheduled to "${args.list_name}" list for ${args.scheduled_time}`,
      };
    
    case "create_whatsapp_campaign":
      return {
        success: true,
        message: `WhatsApp campaign created for "${args.list_name}" list`,
      };
    
    default:
      return { success: false, message: "Unknown function" };
  }
}
