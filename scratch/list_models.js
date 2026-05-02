import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const apiKey = process.env.GEMINI_API;
const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.forEach(m => console.log(`- ${m.name}`));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

list();
