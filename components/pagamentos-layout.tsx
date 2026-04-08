"use client"

import { CalendarPositionToggle, type CalendarPosition } from "@/components/calendar-position-toggle"
import type { ReactNode } from "react"

interface PagamentosLayoutProps {
  billsSection: ReactNode
  calendarSection: ReactNode
}

export function PagamentosLayout({ billsSection, calendarSection }: PagamentosLayoutProps) {
  return (
    <CalendarPositionToggle>
      {(position: CalendarPosition) => (
        <LayoutByPosition
          position={position}
          billsSection={billsSection}
          calendarSection={calendarSection}
        />
      )}
    </CalendarPositionToggle>
  )
}

function LayoutByPosition({
  position,
  billsSection,
  calendarSection,
}: {
  position: CalendarPosition
  billsSection: ReactNode
  calendarSection: ReactNode
}) {
  if (position === "above") {
    return (
      <div className="space-y-4">
        {calendarSection}
        {billsSection}
      </div>
    )
  }

  if (position === "side") {
    return (
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Lista de contas — ocupa mais espaço */}
        <div className="min-w-0 flex-1 space-y-4">{billsSection}</div>
        {/* Calendário na lateral — largura fixa no desktop */}
        <div className="w-full shrink-0 lg:w-[320px]">{calendarSection}</div>
      </div>
    )
  }

  // "below" (padrão atual)
  return (
    <div className="space-y-4">
      {billsSection}
      {calendarSection}
    </div>
  )
}
