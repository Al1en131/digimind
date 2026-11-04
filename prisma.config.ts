import "dotenv/config";
import { defineConfig } from "prisma/config";

// Construct database URL from environment variables or fallback for build step
const host = process.env.MYSQL_HOST || "localhost";
const port = process.env.MYSQL_PORT || "3306";
const user = process.env.MYSQL_USER || "root";
const password = encodeURIComponent(process.env.MYSQL_PASSWORD || "");
const database = process.env.MYSQL_DATABASE || "digimind";
const ssl = process.env.MYSQL_SSL === "true" ? "?sslaccept=strict" : "";

const defaultUrl = `mysql://${user}:${password}@${host}:${port}/${database}${ssl}`;
const dbUrl = process.env.DATABASE_URL || defaultUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbUrl,
  },
});
