import { handleAgenticChat } from "./gemini.service.js";
import prisma from "../../config/prisma.js";

// Memproses pesan chat dari pengguna menggunakan Gemini Function Calling
export const processChat = async (userId, message, history = []) => {
  // Ambil profil user untuk konteks persona
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, nim: true, role: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Panggil layanan gemini agentic
  const result = await handleAgenticChat(user, message, history);

  return result; // mengembalikan { reply, history }
};
