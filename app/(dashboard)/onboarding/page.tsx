import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { OnboardingSteps } from "@/components/onboarding-steps"
import { getFamilyUserIds } from "@/lib/family"

interface OnboardingPageProps {
  searchParams: Promise<{ step?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  const userIds = await getFamilyUserIds(session.user.id)
  const billCount = await db.bill.count({
    where: { userId: { in: userIds }, deletedAt: null },
  })

  // Determina o step atual
  let step: "name" | "bill" | "reminders"

  if (params.step === "reminders" && user?.name && billCount > 0) {
    step = "reminders"
  } else if (!user?.name) {
    step = "name"
  } else if (billCount === 0) {
    step = "bill"
  } else {
    redirect("/")
  }

  const stepNumber = step === "name" ? 1 : step === "bill" ? 2 : 3

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center gap-2">
            <div className={`h-2 w-12 rounded-full ${stepNumber >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-12 rounded-full ${stepNumber >= 2 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-12 rounded-full ${stepNumber >= 3 ? "bg-primary" : "bg-muted"}`} />
          </div>
          <p className="text-xs text-muted-foreground">
            Passo {stepNumber} de 3
          </p>
        </div>

        <OnboardingSteps step={step} userEmail={user?.email} />
      </div>
    </div>
  )
}
