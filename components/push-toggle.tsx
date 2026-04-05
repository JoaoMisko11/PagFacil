"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { savePushSubscription, removePushSubscription } from "@/lib/actions"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })
  }, [])

  if (!supported) return null

  async function handleToggle() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await removePushSubscription(sub.endpoint)
          await sub.unsubscribe()
        }
        setSubscribed(false)
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        const json = sub.toJSON()
        await savePushSubscription({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys!.p256dh!,
            auth: json.keys!.auth!,
          },
        })
        setSubscribed(true)
      }
    } catch (err) {
      console.error("Push toggle error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={subscribed ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
    >
      {subscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          {loading ? "Desativando..." : "Desativar push"}
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          {loading ? "Ativando..." : "Ativar push"}
        </>
      )}
    </Button>
  )
}
