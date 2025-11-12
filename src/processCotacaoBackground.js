// src/processCotacaoBackground.js
// Processamento em background de cotações individuais
import fs from "node:fs"
import path from "node:path"
import pdfParse from "pdf-parse"
import { extrairCotacoesDeTexto } from "./gptMapa.js"
import { saveCotacaoCache, getCotacaoCache } from "./cotacaoCache.js"

/**
 * Processa uma cotação individual em background
 * Extrai texto, usa IA para processar e salva no cache
 */
export async function processCotacaoBackground(filePath, options = {}) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.log(`[bg] ⚠️ Arquivo não encontrado: ${filePath}`)
    return null
  }

  // Verificar se já existe no cache
  const cached = getCotacaoCache(filePath)
  if (cached) {
    console.log(`[bg] ✅ Dados já processados encontrados no cache para: ${path.basename(filePath)}`)
    return cached
  }

  console.log(`[bg] 🔄 Iniciando processamento em background: ${path.basename(filePath)}`)

  try {
    // 1. Extrair texto do PDF
    let extractedText = ""
    try {
      const pdfBuffer = fs.readFileSync(filePath)
      const pdfData = await pdfParse(pdfBuffer)
      extractedText = (pdfData.text || "").replace(/\u0000/g, " ").trim()
      
      if (!extractedText || extractedText.length < 50) {
        console.log(`[bg] ⚠️ Texto extraído muito curto (${extractedText.length} chars), tentando processar mesmo assim`)
      } else {
        console.log(`[bg] ✅ Texto extraído: ${extractedText.length} chars`)
      }
    } catch (err) {
      console.log(`[bg] ⚠️ Erro ao extrair texto: ${err.message}`)
      // Continuar mesmo sem texto, a IA pode processar o PDF diretamente
    }

    // 2. Processar com IA
    const params = {
      lista_cotacoes_texto: extractedText ? [{ text: extractedText, name: path.basename(filePath) }] : [],
      cotacoes_arquivos: [{ path: filePath, name: path.basename(filePath) }],
      instituicao: options.instituicao || "EDGE",
      rubrica: options.rubrica || "",
      codigo_projeto: options.codigo_projeto || "",
    }

    const resultado = await extrairCotacoesDeTexto(params, {
      maxAttempts: 1, // Apenas 1 tentativa para processamento em background
    })

    // 3. Preparar dados para cache
    const processedData = {
      extractedText,
      propostas: resultado?.propostas || [],
      objeto_rascunho: resultado?.objeto_rascunho || null,
      avisos: resultado?.avisos || [],
      processedAt: new Date().toISOString(),
    }

    // 4. Salvar no cache
    saveCotacaoCache(filePath, processedData)

    console.log(`[bg] ✅ Processamento concluído: ${path.basename(filePath)}`)
    console.log(`[bg]   - Propostas extraídas: ${processedData.propostas.length}`)
    console.log(`[bg]   - Objeto: ${processedData.objeto_rascunho || "(nenhum)"}`)

    return processedData
  } catch (err) {
    console.error(`[bg] ❌ Erro ao processar cotação em background:`, err.message)
    // Salvar dados parciais mesmo em caso de erro
    const partialData = {
      extractedText: "",
      propostas: [],
      objeto_rascunho: null,
      avisos: [`Erro no processamento: ${err.message}`],
      processedAt: new Date().toISOString(),
      error: true,
    }
    saveCotacaoCache(filePath, partialData)
    return partialData
  }
}

