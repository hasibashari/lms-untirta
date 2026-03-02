import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

const isProduction = process.env.NODE_ENV === "production";

const prisma = new PrismaClient({
  log: isProduction
    ? [{ level: "error", emit: "event" }]
    : [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  // Connection pool — conservative for university VPS
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

// Route Prisma logs through pino
prisma.$on("error", (e) => logger.error({ prisma: e }, "Prisma error"));

if (!isProduction) {
  prisma.$on("query", (e) =>
    logger.debug({ duration: e.duration, query: e.query }, "Prisma query")
  );
  prisma.$on("warn", (e) => logger.warn({ prisma: e }, "Prisma warning"));
}

export default prisma;