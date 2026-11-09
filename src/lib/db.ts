import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      const isRemoteHost = parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
      const hasSsl = parsed.searchParams.has("sslaccept") || parsed.searchParams.has("ssl") || isRemoteHost;
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || "3306"),
        user: decodeURIComponent(parsed.username || "root"),
        password: decodeURIComponent(parsed.password || ""),
        database: parsed.pathname.replace(/^\//, "") || "digimind",
        ssl: hasSsl ? ({ minVersion: "TLSv1.2" as const, rejectUnauthorized: true }) : undefined,
      };
    } catch (e) {
      console.warn("Failed to parse DATABASE_URL, falling back to individual MYSQL_* vars", e);
    }
  }

  const isRemote =
    process.env.MYSQL_SSL === "true" ||
    (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== "localhost" && process.env.MYSQL_HOST !== "127.0.0.1");

  const sslConfig = isRemote
    ? { minVersion: "TLSv1.2" as const, rejectUnauthorized: true }
    : undefined;

  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "digimind",
    ssl: sslConfig,
  };
}

const config = getDbConfig();

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    connectionLimit: 10,
    connectTimeout: 15000,
  });
  prisma = new PrismaClient({ adapter });
} else {
  // In development, use a global variable so the database connection
  // is preserved across Next.js hot-reloads.
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaMariaDb({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
      connectionLimit: 5,
      connectTimeout: 15000,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
export default prisma;
