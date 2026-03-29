import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
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
