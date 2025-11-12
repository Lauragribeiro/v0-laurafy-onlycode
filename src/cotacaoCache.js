// src/cotacaoCache.js
// Sistema de cache para dados processados de cotações
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import crypto from "node:crypto"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CACHE_DIR = path.join(__dirname, "..", "data", "cotacoes_cache")
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos

// Garantir que o diretório de cache existe
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

/**
 * Gera uma chave de cache baseada no caminho do arquivo e seu tamanho
 */
function getCacheKey(filePath, fileSize = null) {
  if (!filePath) return null
  
  const stats = fs.statSync(filePath)
  const fileHash = `${filePath}:${stats.size}:${stats.mtimeMs}`
  return crypto.createHash("md5").update(fileHash).digest("hex")
}

/**
 * Salva dados processados de uma cotação no cache
 */
export function saveCotacaoCache(filePath, processedData) {
  try {
    const cacheKey = getCacheKey(filePath)
    if (!cacheKey) return false
    
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`)
    const cacheData = {
      filePath,
      processedAt: new Date().toISOString(),
      data: processedData,
    }
    
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), "utf8")
    console.log(`[cache] ✅ Dados salvos no cache: ${cacheKey}`)
    return true
  } catch (err) {
    console.error(`[cache] ❌ Erro ao salvar cache:`, err.message)
    return false
  }
}

/**
 * Recupera dados processados de uma cotação do cache
 */
export function getCotacaoCache(filePath) {
  try {
    const cacheKey = getCacheKey(filePath)
    if (!cacheKey) return null
    
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`)
    
    if (!fs.existsSync(cacheFile)) {
      return null
    }
    
    const cacheContent = fs.readFileSync(cacheFile, "utf8")
    const cacheData = JSON.parse(cacheContent)
    
    // Verificar TTL
    const processedAt = new Date(cacheData.processedAt)
    const age = Date.now() - processedAt.getTime()
    
    if (age > CACHE_TTL) {
      console.log(`[cache] ⚠️ Cache expirado para ${cacheKey} (${Math.floor(age / (24 * 60 * 60 * 1000))} dias)`)
      fs.unlinkSync(cacheFile)
      return null
    }
    
    // Verificar se o arquivo ainda existe e não foi modificado
    if (!fs.existsSync(filePath)) {
      console.log(`[cache] ⚠️ Arquivo não existe mais: ${filePath}`)
      fs.unlinkSync(cacheFile)
      return null
    }
    
    const stats = fs.statSync(filePath)
    const currentKey = getCacheKey(filePath, stats.size)
    if (currentKey !== cacheKey) {
      console.log(`[cache] ⚠️ Arquivo foi modificado, cache inválido`)
      fs.unlinkSync(cacheFile)
      return null
    }
    
    console.log(`[cache] ✅ Dados recuperados do cache: ${cacheKey}`)
    return cacheData.data
  } catch (err) {
    console.error(`[cache] ❌ Erro ao recuperar cache:`, err.message)
    return null
  }
}

/**
 * Limpa caches expirados
 */
export function cleanExpiredCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return
    
    const files = fs.readdirSync(CACHE_DIR)
    let cleaned = 0
    
    for (const file of files) {
      if (!file.endsWith(".json")) continue
      
      const cacheFile = path.join(CACHE_DIR, file)
      try {
        const cacheContent = fs.readFileSync(cacheFile, "utf8")
        const cacheData = JSON.parse(cacheContent)
        
        const processedAt = new Date(cacheData.processedAt)
        const age = Date.now() - processedAt.getTime()
        
        if (age > CACHE_TTL) {
          fs.unlinkSync(cacheFile)
          cleaned++
        }
      } catch (err) {
        // Se não conseguir ler, deletar
        fs.unlinkSync(cacheFile)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`[cache] 🧹 Limpeza: ${cleaned} cache(s) expirado(s) removido(s)`)
    }
  } catch (err) {
    console.error(`[cache] ❌ Erro ao limpar cache:`, err.message)
  }
}

// Limpar cache expirado na inicialização
cleanExpiredCache()

