import { getContextForUser } from "./context.service.js";
import { generateChatResponse } from "./gemini.service.js";
import prisma from "../../config/prisma.js";

// Memproses pesan chat dari pengguna dengan mengambil konteks yang relevan berdasarkan peran dan data LMS, kemudian menghasilkan respons menggunakan model Gemini.
export const processChat = async (userId, message) => {
  // Ambil profil user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, nim: true, role: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Ambil konteks DB
  const contextData = await getContextForUser(user, message);

  // Build prompt
  const prompt = `
Kamu adalah "UntirtaBot", asisten AI resmi untuk LMS (Learning Management System) Universitas Sultan Ageng Tirtayasa.
Jawab pertanyaan pengguna dengan ramah, profesional, ringkas, dan gunakan Bahasa Indonesia.

Informasi Pengguna yang sedang bertanya:
- Nama: ${user.name}
- NIM: ${user.nim || '-'}
- Role: ${user.role}

Konteks Data dari Database LMS saat ini (Gunakan informasi ini untuk menjawab pertanyaan):
${JSON.stringify(contextData, null, 2)}

Instruksi utama:
- Jika jawaban ada di dalam Konteks Data, jawab berdasarkan data tersebut secara natural.
- Jika pengguna menanyakan hal yang TIDAK ada di Konteks Data, katakan bahwa data tersebut belum tersedia atau tidak ditemukan di LMS untuk profil mereka.
- Format respon dengan markdown jika perlu (bold, list, dll).

Pertanyaan Pengguna: "${message}"
`;

  // Panggil Gemini
  const reply = await generateChatResponse(prompt);

  return { reply };
};
