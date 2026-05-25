import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import logger from "./logger.js";

const isProduction = process.env.NODE_ENV === "production";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: isProduction
    ? [{ level: "error", emit: "event" }]
    : [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
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