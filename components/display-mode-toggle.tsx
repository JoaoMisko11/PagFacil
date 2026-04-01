"use client"

import { LayoutList, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDisplayMode } from "@/components/display-mode-provider"

export function DisplayModeToggle() {
  const { mode, toggle } = useDisplayMode()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 min-w-[44px] p-0"
      onClick={toggle}
      title={mode === "comfortable" ? "Modo compacto" : "Modo espaçado"}
    >
      {mode === "comfortable" ? (
        <LayoutList className="h-4 w-4" />
      ) : (
        <LayoutGrid className="h-4 w-4" />
      )}
    </Button>
  )
}
