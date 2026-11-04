import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isRemote =
  process.env.MYSQL_SSL === "true" ||
  (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== "localhost" && process.env.MYSQL_HOST !== "127.0.0.1");

const sslConfig = isRemote
  ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
  : undefined;

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaMariaDb({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "digimind",
    ssl: sslConfig,
    connectionLimit: 10,
  });
  prisma = new PrismaClient({ adapter });
} else {
  // In development, use a global variable so the database connection
  // is preserved across Next.js hot-reloads.
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaMariaDb({
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "digimind",
      ssl: sslConfig,
      connectionLimit: 5,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
export default prisma;
