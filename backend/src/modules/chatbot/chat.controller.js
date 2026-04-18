import { z } from "zod";
import { sendSuccess, sendError } from "../../utils/response.js";
import { processChat } from "./chat.service.js";
import logger from "../../config/logger.js";

const chatSchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong").max(1000, "Pesan terlalu panjang")
});

export const handleChat = async (req, res) => {
  try {
    const { message } = chatSchema.parse(req.body);

    // userId diambil dari JWT middleware (req.user)
    const userId = req.user.id;

    const data = await processChat(userId, message);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Berhasil mendapatkan respon",
      data
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, {
        statusCode: 400,
        message: "Validasi gagal",
        details: error.errors
      });
    }

    logger.error({ err: error }, "Error in Chat Controller");
    return sendError(res, {
      statusCode: 500,
      message: error.message || "Gagal memproses pesan chatbot"
    });
  }
};
