import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock fetch antes de importar o módulo
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// Precisa setar a env antes do import
vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token-123")

const { sendTelegramMessage } = await import("@/lib/telegram")

describe("sendTelegramMessage", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("envia mensagem com sucesso", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    const result = await sendTelegramMessage("12345", "Olá!")

    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bottest-token-123/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "12345",
          text: "Olá!",
          parse_mode: "HTML",
        }),
      }
    )
  })

  it("retorna false quando API falha", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Bad Request"),
    })

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await sendTelegramMessage("12345", "Teste")

    expect(result).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("envia HTML no corpo", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await sendTelegramMessage("99999", "<b>Negrito</b>")

    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.text).toBe("<b>Negrito</b>")
    expect(body.parse_mode).toBe("HTML")
  })
})
