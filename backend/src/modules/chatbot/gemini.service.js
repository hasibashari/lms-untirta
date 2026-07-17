import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../../config/logger.js";
import { AppError } from "../../config/errors.js";
import { getToolsForRole, executeToolCall } from "./chatbot.tools.js";

let genAI = null;

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
 * Handle a multi-turn chat conversation using Gemini Tools
 */
export const handleAgenticChat = async (user, message, history = []) => {
  try {
    const aiInstance = getGenAI();

    const tools = getToolsForRole(user.role);

    // Setup persona via systemInstruction
    const systemInstruction = `Kamu adalah "UntirtaBot", asisten AI resmi untuk LMS (Learning Management System) Universitas Sultan Ageng Tirtayasa.
Jawab pertanyaan pengguna dengan ramah, profesional, ringkas, dan gunakan Bahasa Indonesia.
PENTING:
- Gunakan Tool yang tersedia untuk mengecek jadwal, nilai, tugas, atau data lainnya HANYA jika diminta oleh pengguna. 
- Jika pengguna berbasa-basi atau bertanya ilmu umum, jawab langsung tanpa memanggil tool.
- Informasi pengguna yang sedang bicara denganmu saat ini: Nama: ${user.name}, NIM: ${user.nim || '-'}, Peran: ${user.role}.
- Jangan pernah membocorkan data orang lain yang tidak ada hubungannya.`;

    // Kita menggunakan gemini-1.5-flash karena lebih baik dalam function calling dibanding flash-lite (opsional, sesuaikan dgn limit)
    const model = aiInstance.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      tools,
      systemInstruction
    });

    // Mulai atau lanjutkan chat session
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    // Kirim pesan dari pengguna
    const result = await chat.sendMessage(message);
    let finalResponse = result.response;

    // Looping untuk menangani Tool Call
    // Gemini mungkin akan memanggil beberapa tool secara beruntun jika diperlukan
    let calls = finalResponse.functionCalls();

    while (calls && calls.length > 0) {
      const toolResponses = [];

      for (const call of calls) {
        logger.info({ tool: call.name, args: call.args }, "Gemini invoked a tool");
        const apiResponse = await executeToolCall(call, user);

        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: apiResponse }
          }
        });
      }

      // Kirim balik hasil tool ke Gemini
      const followUpResult = await chat.sendMessage(toolResponses);
      finalResponse = followUpResult.response;
      calls = finalResponse.functionCalls();
    }

    return {
      reply: finalResponse.text(),
      history: chat.history || [] // Bisa dikembalikan ke frontend jika butuh di-save di client
    };
  } catch (error) {
    logger.error({ err: error }, "Error calling Gemini API");
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `Gagal memproses permintaan dari layanan AI: ${error.message}`);
  }
};
