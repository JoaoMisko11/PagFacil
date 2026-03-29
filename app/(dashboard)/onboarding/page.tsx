import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { OnboardingSteps } from "@/components/onboarding-steps"

interface OnboardingPageProps {
  searchParams: Promise<{ step?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  const billCount = await db.bill.count({
    where: { userId: session.user.id, deletedAt: null },
  })

  // Se já tem nome e conta, vai pro dashboard
  if (user?.name && billCount > 0) redirect("/")

  // Se já tem nome, pula pro passo da conta
  const step = params.step === "bill" || user?.name ? "bill" : "name"

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center gap-2">
            <div className={`h-2 w-12 rounded-full ${step === "name" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-12 rounded-full ${step === "bill" ? "bg-primary" : "bg-muted"}`} />
          </div>
          <p className="text-xs text-muted-foreground">
            Passo {step === "name" ? "1" : "2"} de 2
          </p>
        </div>

        <OnboardingSteps step={step} />
      </div>
    </div>
  )
}
