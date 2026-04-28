"use client"

import { useState, useTransition, useEffect } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { requestBankConnectToken, confirmBankConnection } from "@/lib/bank-actions"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    PluggyConnect?: new (config: PluggyConnectConfig) => { init: () => void }
  }
}

interface PluggyConnectConfig {
  connectToken: string
  includeSandbox?: boolean
  onSuccess: (itemData: { item: { id: string } }) => void
  onError?: (error: unknown) => void
  onClose?: () => void
  onEvent?: (event: { event: string }) => void
}

interface BankConnectButtonProps {
  /** Habilita conectores sandbox (apenas em dev/staging). */
  includeSandbox?: boolean
}

export function BankConnectButton({ includeSandbox = false }: BankConnectButtonProps) {
  const router = useRouter()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Verifica se o script já foi carregado em sessão anterior (StrictMode/HMR)
  useEffect(() => {
    if (typeof window !== "undefined" && window.PluggyConnect) {
      setScriptLoaded(true)
    }
  }, [])

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await requestBankConnectToken()
      if ("error" in result) {
        setError(result.error)
        return
      }
      if (!window.PluggyConnect) {
        setError("Widget Pluggy não carregou. Tente novamente em instantes.")
        return
      }

      const connect = new window.PluggyConnect({
        connectToken: result.accessToken,
        includeSandbox,
        onSuccess: async (itemData) => {
          const confirm = await confirmBankConnection(itemData.item.id)
          if ("error" in confirm) {
            setError(confirm.error)
            return
          }
          router.refresh()
        },
        onError: (err) => {
          console.error("[Pluggy onError]", err)
          setError("Falha ao conectar com o banco. Tente novamente.")
        },
        onClose: () => {
          // user cancelou — não é erro
        },
      })
      connect.init()
    })
  }

  return (
    <>
      <Script
        src="https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
      <div className="space-y-2">
        <Button
          onClick={handleClick}
          disabled={isPending || !scriptLoaded}
          className="h-11 gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Conectar banco
        </Button>
        {!scriptLoaded && (
          <p className="text-xs text-muted-foreground">Carregando integração…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </>
  )
}
