import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../../config/logger.js";
import { AppError } from "../../config/errors.js";

let genAI = null;

/**
 * Lazily initialize and return the GoogleGenerativeAI instance.
 * This guarantees process.env.GEMINI_API is read *after* dotenv.config() has run,
 * avoiding ES module static import hoisting issues.
 */
const getGenAI = () => {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API;
  if (!apiKey) {
    logger.error("GEMINI_API is not defined in environment variables. Chatbot features will fail.");
    throw new AppError(500, "Integrasi AI belum dikonfigurasi (Missing API Key).");
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

/**
 * Send a prompt to Gemini
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const generateChatResponse = async (prompt) => {
  try {
    const aiInstance = getGenAI();

    // Menggunakan Gemini Flash Lite Latest (500 RPD) sebagai model utama
    const model = aiInstance.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error({ err: error }, "Error calling Gemini API");
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `Gagal memproses permintaan dari layanan AI: ${error.message}`);
  }
};

