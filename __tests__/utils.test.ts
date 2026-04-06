import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("combina classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("remove duplicatas com tailwind-merge", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
  })

  it("lida com condicionais", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("lida com undefined e null", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra")
  })

  it("retorna string vazia sem argumentos", () => {
    expect(cn()).toBe("")
  })

  it("resolve conflitos de tailwind (último vence)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
    expect(cn("bg-white", "bg-black")).toBe("bg-black")
  })
})
