import { config } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Carrega .env.local em dev — em produção (Vercel) as vars já estão no environment
config({ path: ".env.local" })
config({ path: ".env" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
})
