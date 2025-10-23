// src/openaiProvider.js
import OpenAI from "openai"

let cachedKey = null
let cachedClient = null

export function resolveOpenAIKey() {
  const key = (process.env.OPENAI_API_KEY || "").trim()
  return key
}

export function ensureOpenAIClient() {
  const key = resolveOpenAIKey()

  console.log("[v0] OpenAI key check:")
  console.log("[v0]   - Key exists:", !!key)
  console.log("[v0]   - Key length:", key?.length || 0)
  console.log("[v0]   - Key prefix:", key ? key.substring(0, 8) + "..." : "none")
  console.log("[v0]   - Source: process.env.OPENAI_API_KEY")

  if (!key) {
    cachedKey = null
    cachedClient = null
    console.error("[v0] ❌ ERRO: Nenhuma chave OpenAI encontrada!")
    console.error("[v0] Por favor, adicione OPENAI_API_KEY na seção 'Vars' do v0")
    return null
  }

  if (cachedClient && cachedKey === key) {
    console.log("[v0] ✓ Usando cliente OpenAI em cache")
    return cachedClient
  }

  try {
    console.log("[v0] Criando novo cliente OpenAI...")
    cachedClient = new OpenAI({ apiKey: key })
    cachedKey = key
    console.log("[v0] ✓ Cliente OpenAI criado com sucesso")
  } catch (err) {
    console.error("[v0] ❌ Falha ao criar cliente OpenAI:", err?.message || err)
    cachedClient = null
    cachedKey = null
  }
  return cachedClient
}

export function invalidateOpenAIClient() {
  console.log("[v0] Invalidando cliente OpenAI (será recriado na próxima chamada)")
  cachedClient = null
  cachedKey = null
}

export function hasOpenAIKey() {
  return !!resolveOpenAIKey()
}
