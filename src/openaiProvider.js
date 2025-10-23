// src/openaiProvider.js
import OpenAI from "openai"

const DEFAULT_OPENAI_KEY =
  "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"

let cachedKey = null
let cachedClient = null

export function resolveOpenAIKey() {
  const key = (process.env.OPENAI_API_KEY || DEFAULT_OPENAI_KEY || "").trim()
  return key
}

export function ensureOpenAIClient() {
  const key = resolveOpenAIKey()
  console.log("[v0] OpenAI key exists:", !!key)
  console.log("[v0] OpenAI key length:", key?.length || 0)

  if (!key) {
    cachedKey = null
    cachedClient = null
    console.log("[v0] No OpenAI key found, returning null")
    return null
  }
  if (cachedClient && cachedKey === key) {
    console.log("[v0] Returning cached OpenAI client")
    return cachedClient
  }
  try {
    console.log("[v0] Creating new OpenAI client")
    cachedClient = new OpenAI({ apiKey: key })
    cachedKey = key
    console.log("[v0] OpenAI client created successfully")
  } catch (err) {
    console.error("[v0] Failed to create OpenAI client:", err?.message || err)
    cachedClient = null
    cachedKey = null
  }
  return cachedClient
}

export function invalidateOpenAIClient() {
  cachedClient = null
}

export function hasOpenAIKey() {
  return !!resolveOpenAIKey()
}
