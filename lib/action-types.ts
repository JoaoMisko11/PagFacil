export type ActionState = {
  errors?: Record<string, string[]>
  message?: string
}

export type ImportBillRow = {
  row: number
  supplier: string
  amount: string
  dueDate: string
  category: string
  notes: string
  valid: boolean
  error?: string
}

export type ImportResult = {
  rows?: ImportBillRow[]
  imported?: number
  message?: string
}

export type BatchBillInput = {
  supplier: string
  amount: string
  dueDate: string
  category: string
  notes: string
  isRecurring: boolean
  recurrenceFrequency: string
  recurrenceEndDate: string
}

export type BatchResult = {
  created?: number
  errors?: { row: number; fields: Record<string, string> }[]
  message?: string
}
