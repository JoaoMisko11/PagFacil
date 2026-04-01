import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { FeedbackWidget } from "@/components/feedback-widget"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { ConfettiCelebration } from "@/components/confetti-celebration"
import { DisplayModeProvider } from "@/components/display-mode-provider"
import { PageTransition } from "@/components/page-transition"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <DisplayModeProvider>
      <div className="min-h-screen bg-background">
        <DashboardNav user={session.user} />
        <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6">
          <PageTransition>{children}</PageTransition>
        </main>
        <FeedbackWidget />
        <KeyboardShortcuts />
        <ConfettiCelebration />
      </div>
    </DisplayModeProvider>
  )
}
