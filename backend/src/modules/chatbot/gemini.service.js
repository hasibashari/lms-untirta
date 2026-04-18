import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../../config/logger.js";
import { AppError } from "../../config/errors.js";

const apiKey = process.env.GEMINI_API;

let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  logger.warn("GEMINI_API_KEY is not defined. Chatbot features will fail.");
}

/**
 * Send a prompt to Gemini
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const generateChatResponse = async (prompt) => {
  if (!genAI) {
    throw new AppError(500, "Integrasi AI belum dikonfigurasi (Missing API Key).");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use latest flash model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error({ err: error }, "Error calling Gemini API");
    throw new AppError(500, "Gagal memproses permintaan dari layanan AI.");
  }
};
