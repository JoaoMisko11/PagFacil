import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { BankConnectButton } from "@/components/bank-connect-button"
import { BankConnectionCard } from "@/components/bank-connection-card"
import { MatchSuggestionCard } from "@/components/match-suggestion-card"
import { getFamilyUserIds } from "@/lib/family"
import { Landmark } from "lucide-react"

export default async function BancosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userIds = await getFamilyUserIds(session.user.id)

  const [connections, suggestedTxs] = await Promise.all([
    db.bankConnection.findMany({
      where: { userId: session.user.id },
      include: {
        accounts: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.bankTransaction.findMany({
      where: {
        matchStatus: "SUGGESTED",
        account: { connection: { userId: { in: userIds } } },
      },
      include: {
        matchedBill: {
          select: { id: true, supplier: true, amount: true, dueDate: true },
        },
      },
      orderBy: { date: "desc" },
    }),
  ])

  // Sandbox habilitado quando rodando localmente (sem PLUGGY_BASE_URL custom)
  const includeSandbox = process.env.NODE_ENV !== "production"

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bancos</h1>
          <p className="text-sm text-muted-foreground">
            Conecte sua conta bancária para detectar pagamentos automaticamente.
          </p>
        </div>
      </div>

      {suggestedTxs.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {suggestedTxs.length} pagamento{suggestedTxs.length > 1 ? "s" : ""} para confirmar
          </h2>
          {suggestedTxs.map((tx) =>
            tx.matchedBill ? (
              <MatchSuggestionCard
                key={tx.id}
                transaction={{
                  id: tx.id,
                  amount: tx.amount,
                  date: tx.date,
                  description: tx.description,
                  matchScore: tx.matchScore,
                }}
                bill={tx.matchedBill}
              />
            ) : null
          )}
        </div>
      )}

      {connections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Landmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-semibold text-foreground">
            Nenhum banco conectado
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ao conectar sua conta, o PagaFácil detecta seus pagamentos e marca
            contas como pagas automaticamente.
          </p>
          <div className="mt-4 flex justify-center">
            <BankConnectButton includeSandbox={includeSandbox} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {connections.map((conn) => (
              <BankConnectionCard key={conn.id} connection={conn} />
            ))}
          </div>
          <div className="border-t border-border pt-4">
            <BankConnectButton includeSandbox={includeSandbox} />
          </div>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Como funciona:</strong> usamos a
        Pluggy (provedor certificado de Open Finance) para ler suas transações
        com sua autorização. Nada é alterado na sua conta — apenas leitura. Você
        pode desconectar a qualquer momento.
      </div>
    </div>
  )
}
