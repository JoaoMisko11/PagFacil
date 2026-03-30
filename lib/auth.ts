import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Nodemailer from "next-auth/providers/nodemailer"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Nodemailer({
      server: {
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    }),
    Credentials({
      id: "telegram-otp",
      name: "Telegram",
      credentials: {
        chatId: { label: "Chat ID", type: "text" },
        code: { label: "Código", type: "text" },
      },
      async authorize(credentials) {
        const chatId = credentials.chatId as string
        const code = credentials.code as string

        if (!chatId || !code) return null

        // Busca OTP válido
        const otp = await db.telegramOtp.findFirst({
          where: {
            chatId,
            code,
            used: false,
            expires: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        })

        if (!otp) return null

        // Marca como usado
        await db.telegramOtp.update({
          where: { id: otp.id },
          data: { used: true },
        })

        // Busca ou cria usuário pelo telegramChatId
        let user = await db.user.findUnique({
          where: { telegramChatId: chatId },
        })

        if (!user) {
          user = await db.user.create({
            data: {
              email: `telegram_${chatId}@pagafacil.local`,
              telegramChatId: chatId,
              notifyVia: "telegram",
            },
          })
        }

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      // Na primeira autenticação, user vem do adapter (DB)
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      // Atualiza o name do token a partir do DB (caso tenha mudado no onboarding)
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { name: true },
        })
        if (dbUser) {
          token.name = dbUser.name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.name = token.name as string | null
        session.user.email = token.email as string
      }
      return session
    },
  },
})
