import { describe, it, expect } from "vitest"
import { escapeHtml } from "@/lib/telegram"

describe("escapeHtml", () => {
  it("escapa &", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B")
  })

  it("escapa <", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;")
  })

  it("escapa >", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b")
  })

  it('escapa "', () => {
    expect(escapeHtml('diz "oi"')).toBe("diz &quot;oi&quot;")
  })

  it("escapa múltiplos caracteres", () => {
    expect(escapeHtml('<b>"Olá" & tchau</b>')).toBe(
      "&lt;b&gt;&quot;Olá&quot; &amp; tchau&lt;/b&gt;"
    )
  })

  it("não altera texto sem caracteres especiais", () => {
    expect(escapeHtml("Texto normal 123")).toBe("Texto normal 123")
  })

  it("lida com string vazia", () => {
    expect(escapeHtml("")).toBe("")
  })
})
