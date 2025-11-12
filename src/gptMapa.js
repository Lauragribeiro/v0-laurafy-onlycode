// src/gptMapa.js
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { ensureOpenAIClient, invalidateOpenAIClient } from "./openaiProvider.js"
import {
  SYSTEM_EXTRACAO_COTACOES,
  USER_EXTRACAO_COTACOES,
  USER_EXTRACAO_COTACOES_REFINO,
  SYSTEM_GERACAO_TEXTO,
  USER_GERACAO_TEXTO,
  PROMPT_CONSOLIDA_PROPOSTAS,
} from "./promptsMapa.js"
import { extractCotacaoFromPdf } from "./gptExtracts.js"

function requireClient() {
  console.log("[v0] requireClient: Verificando cliente OpenAI...")
  const client = ensureOpenAIClient()
  console.log("[v0] requireClient: Cliente obtido:", !!client)

  if (!client) {
    const error = new Error("❌ OpenAI API key ausente ou inválida. Adicione OPENAI_API_KEY na seção 'Vars' do v0.")
    console.error("[v0] requireClient error:", error.message)
    throw error
  }
  return client
}

/**
 * Upload de arquivos PDF para OpenAI usando Files API (suporta PDFs)
 * Os arquivos podem ser usados com Assistants API ou Chat Completions
 */
/**
 * Busca arquivos alternativos quando o arquivo original está vazio ou corrompido
 */
async function buscarArquivoAlternativo(filePath, arquivo, arquivosUsados = new Set()) {
  if (!filePath || !arquivo) return null
  
  const fileName = arquivo?.name || arquivo?.label || path.basename(filePath) || ""
  const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase()
  
  // Extrair número da cotação (ex: "cotacao 3" -> "3")
  const numMatch = baseName.match(/(\d+)/)
  const cotacaoNum = numMatch ? numMatch[1] : null
  
  if (!cotacaoNum) return null
  
  try {
    // Encontrar o diretório raiz do projeto (onde está server.js)
    const currentFile = fileURLToPath(import.meta.url)
    const srcDir = path.dirname(currentFile) // src/
    const rootDir = path.dirname(srcDir) // raiz do projeto
    const uploadsBase = path.join(rootDir, "data", "uploads")
    
    if (!fs.existsSync(uploadsBase)) {
      console.warn(`[mapa] Diretório de uploads não encontrado: ${uploadsBase}`)
      return null
    }
    
    // Função recursiva para buscar - retorna o melhor match (maior score)
    let bestMatch = null
    let bestScore = 0
    
    const searchInDir = (dir, depth = 0) => {
      if (depth > 3) return
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        const files = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
        const dirs = entries.filter(e => e.isDirectory())
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name)
          if (arquivosUsados.has(fullPath)) continue
          
          const fileBase = path.basename(file.name, path.extname(file.name)).toLowerCase()
          
          // Verificar se contém o número da cotação
          // Priorizar arquivos que têm "cotacao" + número exato
          const hasCotacao = fileBase.includes("cotacao") || fileBase.includes("cot")
          const hasNum = fileBase.includes(cotacaoNum)
          
          if (hasNum) {
            const stats = fs.statSync(fullPath)
            // Só considerar se o arquivo não estiver vazio
            if (stats.size > 0) {
              // Calcular score: priorizar arquivos com "cotacao" + número exato
              let score = 0
              if (hasCotacao && hasNum) {
                // Verificar se o número está logo após "cotacao" (ex: "cotacao3")
                if (fileBase.match(new RegExp(`cotacao\\s*${cotacaoNum}`))) {
                  score = 100
                } else {
                  score = 80
                }
              } else if (hasNum) {
                score = 50
              }
              
              if (score > bestScore) {
                bestMatch = fullPath
                bestScore = score
              }
            }
          }
        }
        
        // Buscar em subdiretórios
        for (const subDir of dirs) {
          searchInDir(path.join(dir, subDir.name), depth + 1)
        }
      } catch (err) {
        // Ignorar erros
      }
    }
    
    searchInDir(uploadsBase)
    
    if (bestMatch && bestScore > 0) {
      console.log(`[mapa] 🔍 Melhor arquivo alternativo encontrado para cotação ${cotacaoNum}: ${bestMatch} (score: ${bestScore})`)
      return bestMatch
    }
    
    return null
  } catch (err) {
    console.warn("[mapa] Erro ao buscar arquivo alternativo:", err.message)
    return null
  }
}

async function uploadCotacaoFiles(client, arquivos = [], arquivosUsados = new Set()) {
  const uploads = []
  for (const arquivo of arquivos || []) {
    let filePath = arquivo?.path
    if (!filePath) {
      console.warn("[mapa] Arquivo sem path:", arquivo?.name || "(sem nome)")
      continue
    }
    
    try {
      // Verificar se o arquivo existe e tem conteúdo
      let stats
      try {
        stats = await fs.promises.stat(filePath)
      } catch (err) {
        console.warn("[mapa] Arquivo não encontrado ou inacessível:", filePath, err.message)
        // Tentar buscar arquivo alternativo
        const altPath = await buscarArquivoAlternativo(filePath, arquivo, arquivosUsados)
        if (altPath) {
          filePath = altPath
          stats = await fs.promises.stat(filePath)
          console.log(`[mapa] ✅ Usando arquivo alternativo: ${filePath}`)
        } else {
          continue
        }
      }
      
      // Se arquivo está vazio, tentar buscar alternativo
      if (stats.size === 0) {
        console.warn("[mapa] ⚠️ Arquivo vazio detectado:", filePath)
        const altPath = await buscarArquivoAlternativo(filePath, arquivo, arquivosUsados)
        if (altPath) {
          const altStats = await fs.promises.stat(altPath)
          if (altStats.size > 0) {
            filePath = altPath
            stats = altStats
            console.log(`[mapa] ✅ Substituído por arquivo alternativo válido: ${filePath} (${stats.size} bytes)`)
          } else {
            console.warn("[mapa] ⚠️ Arquivo alternativo também está vazio, pulando upload")
            // Mesmo assim, criar entrada para garantir que a proposta seja criada
            uploads.push({
              file_id: null,
              label: arquivo?.name || arquivo?.label || "cotacao",
              path: filePath,
              empty: true,
            })
            continue
          }
        } else {
          console.warn("[mapa] ⚠️ Nenhum arquivo alternativo encontrado, criando entrada vazia")
          uploads.push({
            file_id: null,
            label: arquivo?.name || arquivo?.label || "cotacao",
            path: filePath,
            empty: true,
          })
          continue
        }
      }
      
      // Verificar se é PDF
      let buffer
      try {
        buffer = fs.readFileSync(filePath)
      } catch (err) {
        console.warn("[mapa] Erro ao ler arquivo:", filePath, err.message)
        continue
      }
      
      if (buffer.length < 4) {
        console.warn("[mapa] Arquivo muito pequeno (menos de 4 bytes):", filePath)
        // Tentar buscar alternativo
        const altPath = await buscarArquivoAlternativo(filePath, arquivo, arquivosUsados)
        if (altPath) {
          const altStats = await fs.promises.stat(altPath)
          if (altStats.size >= 4) {
            filePath = altPath
            buffer = fs.readFileSync(filePath)
            console.log(`[mapa] ✅ Substituído por arquivo alternativo maior: ${filePath}`)
          }
        }
      }
      
      // Verificar magic bytes do PDF
      if (buffer.length >= 4 && buffer[0] !== 0x25 && buffer[1] !== 0x50 && buffer[2] !== 0x44 && buffer[3] !== 0x46) {
        console.warn("[mapa] Arquivo não parece ser PDF válido (magic bytes incorretos):", filePath)
        // Tentar buscar alternativo
        const altPath = await buscarArquivoAlternativo(filePath, arquivo, arquivosUsados)
        if (altPath) {
          const altBuffer = fs.readFileSync(altPath)
          if (altBuffer.length >= 4 && altBuffer[0] === 0x25 && altBuffer[1] === 0x50 && altBuffer[2] === 0x44 && altBuffer[3] === 0x46) {
            filePath = altPath
            buffer = altBuffer
            console.log(`[mapa] ✅ Substituído por arquivo alternativo válido: ${filePath}`)
          }
        }
      }
      
      console.log(`[mapa] 📤 Enviando arquivo PDF para OpenAI: ${filePath} (${buffer.length} bytes)`)
      
      // Marcar arquivo como usado
      arquivosUsados.add(filePath)
      
      // A biblioteca OpenAI aceita streams, mas precisa estar no formato correto
      // Criar stream do arquivo
      const fileStream = fs.createReadStream(filePath)
      
      // Obter nome do arquivo para metadata
      const fileName = arquivo?.name || arquivo?.label || path.basename(filePath) || "cotacao.pdf"
      
      // Usar purpose "assistants" para suportar PDFs
      // A biblioteca OpenAI aceita stream diretamente
      const uploaded = await client.files.create({
        file: fileStream,
        purpose: "assistants", // Suporta PDFs, texto, código, etc.
      })
      
      uploads.push({
        file_id: uploaded?.id,
        label: arquivo?.name || arquivo?.label || "cotacao",
        path: filePath,
      })
      console.log(`[mapa] ✅ Arquivo PDF enviado com sucesso: ${uploaded.id}`)
      
      // Aguardar processamento do arquivo (opcional, mas recomendado)
      let fileStatus = uploaded.status
      let attempts = 0
      while (fileStatus === "uploaded" && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const fileInfo = await client.files.retrieve(uploaded.id)
        fileStatus = fileInfo.status
        attempts++
        if (fileStatus === "processed") {
          console.log(`[mapa] ✅ Arquivo processado pela OpenAI: ${uploaded.id}`)
          break
        }
      }
    } catch (err) {
      // Se erro for "File is empty", tentar buscar alternativo
      if (err?.message?.includes("empty") || err?.message?.includes("400")) {
        console.warn("[mapa] ⚠️ Erro ao enviar arquivo (possivelmente vazio), tentando buscar alternativo...")
        const altPath = await buscarArquivoAlternativo(filePath, arquivo, arquivosUsados)
        if (altPath) {
          try {
            const altStats = await fs.promises.stat(altPath)
            if (altStats.size > 0) {
              console.log(`[mapa] 🔄 Tentando arquivo alternativo: ${altPath}`)
              // Tentar novamente com arquivo alternativo (recursão limitada)
              const fileStream = fs.createReadStream(altPath)
              const uploaded = await client.files.create({
                file: fileStream,
                purpose: "assistants",
              })
              arquivosUsados.add(altPath)
              uploads.push({
                file_id: uploaded?.id,
                label: arquivo?.name || arquivo?.label || "cotacao",
                path: altPath,
              })
              console.log(`[mapa] ✅ Arquivo alternativo enviado com sucesso: ${uploaded.id}`)
              continue
            }
          } catch (altErr) {
            // Ignorar erro do alternativo
          }
        }
      }
      
      console.warn(
        "[mapa] ⚠️ Falha ao anexar cotação para leitura:",
        arquivo?.name || arquivo?.path || "(sem nome)",
        err?.message || err,
      )
      // Mesmo com erro, criar entrada para garantir proposta
      uploads.push({
        file_id: null,
        label: arquivo?.name || arquivo?.label || "cotacao",
        path: filePath,
        error: err?.message,
      })
    }
  }
  return uploads
}

const EXTRACAO_SCHEMA = {
  name: "cotacao_mapa",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["propostas", "objeto_rascunho", "avisos"],
    properties: {
      objeto_rascunho: { type: ["string", "null"], description: "Resumo objetivo do objeto comum." },
      avisos: {
        type: "array",
        items: { type: "string" },
        description: "Inconsistências ou dúvidas encontradas.",
      },
      propostas: {
        type: "array",
        description: "Lista das propostas detectadas nas cotações.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["selecao", "ofertante", "cnpj_cpf", "data_cotacao", "valor", "observacao"],
          properties: {
            selecao: { type: "string", description: "Identificador sequencial da proposta." },
            ofertante: { type: ["string", "null"] },
            cnpj_cpf: { type: ["string", "null"] },
            data_cotacao: { type: ["string", "null"], description: "Data no formato DD/MM/AAAA." },
            valor: { type: ["number", "string", "null"], description: "Valor total ofertado." },
            observacao: { type: ["string", "null"], description: "Observações adicionais sobre a proposta." },
          },
        },
      },
    },
  },
}

const DEFAULT_MAX_ATTEMPTS = 3

function buildUserContent(promptText, fileIds = []) {
  if (!fileIds.length) {
    return promptText
  }
  
  // Para Chat Completions com arquivos (gpt-4o), o formato correto baseado no erro da API é:
  // O erro "Missing required parameter: 'messages[1].content[1].file'" indica que
  // quando type: "file", deve haver uma propriedade "file" que é um objeto com "file_id"
  // Formato: { type: "file", file: { file_id: "file-xxx" } }
  const contentParts = [{ type: "text", text: promptText }]
  
  // Adicionar referências aos arquivos - formato correto com objeto "file"
  fileIds.forEach((fileId) => {
    contentParts.push({
      type: "file",
      file: {
        file_id: fileId, // file_id dentro de um objeto "file"
      },
    })
  })
  
  return contentParts
}

function toPromptJSON(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return "{}"
  }
}

function hasFilledValue(value) {
  if (value == null) return false
  if (typeof value === "number") return Number.isFinite(value)
  const str = String(value).trim()
  return str.length > 0
}

function avaliarPropostas(propostas = []) {
  const list = Array.isArray(propostas) ? propostas : []
  const relevantes = list.filter((item) => {
    if (!item || typeof item !== "object") return false
    return (
      hasFilledValue(item.ofertante) ||
      hasFilledValue(item.cnpj_cpf ?? item.cnpj ?? item.cnpj_ofertante) ||
      hasFilledValue(item.valor) ||
      hasFilledValue(item.data_cotacao ?? item.data ?? item.dataCotacao)
    )
  })

  const missingMap = {
    ofertante: [],
    cnpj_cpf: [],
    data_cotacao: [],
    valor: [],
  }

  relevantes.forEach((row, idx) => {
    const label = `Cotação ${idx + 1}`
    if (!hasFilledValue(row.ofertante)) missingMap.ofertante.push(label)
    if (!hasFilledValue(row.cnpj_cpf ?? row.cnpj ?? row.cnpj_ofertante)) missingMap.cnpj_cpf.push(label)
    if (!hasFilledValue(row.data_cotacao ?? row.data ?? row.dataCotacao)) missingMap.data_cotacao.push(label)
    if (!hasFilledValue(row.valor)) missingMap.valor.push(label)
  })

  const issues = []
  if (!relevantes.length) {
    issues.push("Nenhuma proposta identificada nas cotações.")
  }
  Object.entries(missingMap).forEach(([field, refs]) => {
    if (refs.length) {
      const label = field.replace(/_/g, " ")
      issues.push(`${label} ausente em ${refs.join(", ")}.`)
    }
  })

  const complete = relevantes.length >= 3 && Object.values(missingMap).every((arr) => arr.length === 0)

  return {
    complete,
    issues,
    missingMap,
    count: relevantes.length,
  }
}

async function runExtracaoCotacoes(client, promptText, fileIds = []) {
  const content = buildUserContent(promptText, fileIds)

  console.log("[v0] 🤖 Chamando OpenAI API para extração...")
  console.log(`[v0] Arquivos anexados: ${fileIds.length}`)
  console.log("[v0] Content type:", typeof content, Array.isArray(content) ? `(array with ${content.length} items)` : "")
  if (Array.isArray(content) && content.length > 0) {
    console.log("[v0] First item type:", typeof content[0], content[0]?.type || "")
  }

  try {
    // Usar gpt-4o para melhor suporte a arquivos PDF
    const model = fileIds.length > 0 ? "gpt-4o" : "gpt-4o-mini"
    console.log(`[v0] Usando modelo: ${model}`)
    console.log(`[v0] Content format:`, Array.isArray(content) ? `array with ${content.length} items` : typeof content)
    if (Array.isArray(content)) {
      content.forEach((item, idx) => {
        if (item.type === 'text') {
          console.log(`[v0]   Content[${idx}]: type=text, text length=${item.text?.length}`)
        } else if (item.type === 'file') {
          const fileId = item.file?.file_id || item.file_id || item.file || 'MISSING'
          console.log(`[v0]   Content[${idx}]: type=file, file.file_id=${fileId}`)
        } else {
          console.log(`[v0]   Content[${idx}]: type=${item.type}, keys=${Object.keys(item).join(', ')}`)
        }
      })
    }
    
    const resp = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_EXTRACAO_COTACOES },
        { role: "user", content: content },
      ],
      temperature: 0.1,
      response_format: { type: "json_schema", json_schema: EXTRACAO_SCHEMA },
    })
    
    const raw = resp?.choices?.[0]?.message?.content || "{}"
    console.log("[v0] OpenAI response received, parsing...")

    try {
      return JSON.parse(raw)
    } catch {
      return {
        propostas: [],
        objeto_rascunho: null,
        avisos: ["JSON inválido retornado pelo modelo."],
      }
    }
  } catch (err) {
    console.error("[v0] ❌ Erro na chamada OpenAI API:", err.message)
    console.error("[v0] Erro completo:", err)
    
    // Se for erro 401, pode ser problema com a chave ou formato
    if (err.status === 401 || err.message?.includes("401") || err.message?.includes("Incorrect API key")) {
      throw new Error("❌ Chave da OpenAI inválida ou expirada (erro 401). Verifique a chave no arquivo .env e reinicie o servidor.")
    }
    
    throw err
  }
}

/**
 * Extrai propostas de cotações (texto já OCRizado)
 * @param {Object} params
 * @param {string} params.instituicao
 * @param {string} params.codigo_projeto
 * @param {string} params.rubrica
 * @param {string} params.lista_cotacoes_texto  // concatenação do texto das cotações
 * @param {Array<{name?: string, path: string}>} [params.cotacoes_arquivos]
 * @param {string} [params.cotacoes_anexos]
 * @returns {Promise<{propostas: Array, objeto_rascunho: string|null, avisos: string[]}>}
 */
export async function extrairCotacoesDeTexto(params, options = {}) {
  console.log("[v0] extrairCotacoesDeTexto iniciado")
  console.log("[v0] Parâmetros:", {
    instituicao: params?.instituicao,
    codigo_projeto: params?.codigo_projeto,
    rubrica: params?.rubrica,
    has_lista_cotacoes: !!params?.lista_cotacoes_texto,
    cotacoes_arquivos_count: params?.cotacoes_arquivos?.length || 0,
  })

  let client
  try {
    client = requireClient()
    console.log("[v0] ✓ Cliente OpenAI pronto para extração")
  } catch (err) {
    console.error("[v0] ❌ Erro ao obter cliente OpenAI:", err.message)
    throw err
  }

  // Usar Assistants API com upload de arquivos PDF (suporta PDFs diretamente)
  const arquivos = Array.isArray(params?.cotacoes_arquivos) ? params.cotacoes_arquivos : []
  // Criar Set para rastrear arquivos já usados (evitar duplicatas)
  const arquivosUsados = new Set(arquivos.map(a => a.path).filter(Boolean))
  const anexos = await uploadCotacaoFiles(client, arquivos, arquivosUsados)
  const fileIds = anexos.filter((item) => item?.file_id).map(item => item.file_id)
  
  console.log(`[v0] Arquivos PDF carregados: ${fileIds.length}`)
  
  const maxAttempts = Math.max(1, Number(options?.maxAttempts) || DEFAULT_MAX_ATTEMPTS)

  const avisosSet = new Set()
  const tentativas = []
  let ultimoResultado = { propostas: [], objeto_rascunho: null, avisos: [] }
  let avaliacao = avaliarPropostas(ultimoResultado.propostas)

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tentativaNumero = attempt + 1
      console.log(`[v0] Tentativa ${tentativaNumero}/${maxAttempts}`)

      const prompt =
        attempt === 0
          ? USER_EXTRACAO_COTACOES(params)
          : USER_EXTRACAO_COTACOES_REFINO({
              ...params,
              tentativa: tentativaNumero,
              resultado_anterior: toPromptJSON(ultimoResultado),
              pendencias: avaliacao.issues,
            })

      let json
      try {
        json = await runExtracaoCotacoes(client, prompt, fileIds)
        console.log(`[v0] ✓ Tentativa ${tentativaNumero} concluída com sucesso`)
      } catch (err) {
        let errorMsg = err?.message || String(err)

        if (errorMsg.includes("401") || errorMsg.includes("Incorrect API key")) {
          errorMsg = `❌ Chave da OpenAI inválida ou expirada (erro 401). Verifique a chave na seção 'Vars' do v0.`
          console.error("[v0]", errorMsg)
          invalidateOpenAIClient()
        } else if (errorMsg.includes("400")) {
          errorMsg = `❌ Erro na requisição OpenAI (erro 400): ${errorMsg}`
          console.error("[v0]", errorMsg)
        }

        const msg = `Falha na leitura das cotações (tentativa ${tentativaNumero}): ${errorMsg}`
        avisosSet.add(msg)
        tentativas.push({
          tentativa: tentativaNumero,
          propostas: ultimoResultado?.propostas?.length ?? 0,
          completo: false,
          pendencias: [msg],
          erro: true,
        })

        if (attempt + 1 >= maxAttempts) {
          console.error(`[v0] ❌ Todas as ${maxAttempts} tentativas falharam`)
          break
        }
        continue
      }

      const propostas = Array.isArray(json?.propostas) ? json.propostas : []
      const avisos = Array.isArray(json?.avisos) ? json.avisos : []
      ultimoResultado = {
        propostas,
        objeto_rascunho: json?.objeto_rascunho ?? null,
        avisos,
      }

      avisos.forEach((item) => avisosSet.add(String(item || "")))

      avaliacao = avaliarPropostas(propostas)
      if (avaliacao.issues.length) {
        avaliacao.issues.forEach((item) => avisosSet.add(item))
      }

      tentativas.push({
        tentativa: tentativaNumero,
        propostas: avaliacao.count,
        completo: avaliacao.complete,
        pendencias: avaliacao.issues,
      })

      if (avaliacao.complete) {
        console.log(`[v0] ✓ Extração completa na tentativa ${tentativaNumero}`)
        break
      }
    }
  } finally {
    // Limpar arquivos temporários após o uso
    if (anexos && anexos.length > 0) {
      const deletions = anexos
        .filter((item) => item?.file_id)
        .map((item) =>
          client.files
            .del(item.file_id)
            .catch((err) =>
              console.warn("[mapa] falha ao remover arquivo temporário da cotação:", item.file_id, err?.message || err),
            ),
        )
      await Promise.allSettled(deletions)
      console.log(`[mapa] 🧹 Limpeza: ${deletions.length} arquivo(s) temporário(s) removido(s)`)
    }
  }

  const finalAvisos = new Set(Array.isArray(ultimoResultado.avisos) ? ultimoResultado.avisos : [])
  avisosSet.forEach((item) => finalAvisos.add(item))

  return {
    propostas: Array.isArray(ultimoResultado.propostas) ? ultimoResultado.propostas : [],
    objeto_rascunho: ultimoResultado.objeto_rascunho ?? null,
    avisos: Array.from(finalAvisos).filter(Boolean),
    tentativas,
    completo: avaliacao.complete,
    pendencias: avaliacao.issues,
  }
}

/**
 * Gera Objeto e Justificativa finais
 * @param {Object} params
 * @param {string} params.instituicao
 * @param {string} params.projeto
 * @param {string} params.codigo_projeto
 * @param {string} params.rubrica
 * @param {string} params.justificativa_base
 * @param {string} params.json_propostas  // string JSON das propostas
 * @param {string} params.data_pagamento  // DD/MM/AAAA
 * @param {string} params.localidade      // ex.: "Maceió"
 * @returns {Promise<{objeto: string, justificativa: string}>}
 */
export async function gerarObjetoEJustificativa(params) {
  console.log("[v0] gerarObjetoEJustificativa iniciado")
  console.log("[v0] Parâmetros:", {
    instituicao: params?.instituicao,
    projeto: params?.projeto,
    rubrica: params?.rubrica,
    has_propostas: !!params?.json_propostas,
  })

  const userPrompt = USER_GERACAO_TEXTO(params)

  let client
  try {
    client = requireClient()
    console.log("[v0] ✓ Cliente OpenAI pronto")
  } catch (err) {
    console.error("[v0] ❌ Erro ao obter cliente OpenAI:", err.message)
    throw err
  }

  console.log("[v0] Chamando OpenAI para gerar objeto e justificativa...")

  const resp = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_GERACAO_TEXTO },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "objeto_justificativa",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["objeto", "justificativa"],
          properties: {
            objeto: { type: "string" },
            justificativa: { type: "string" },
          },
        },
      },
    },
  })

  const raw = resp?.choices?.[0]?.message?.content || "{}"
  console.log("[v0] ✓ Resposta recebida, processando...")

  let json
  try {
    json = JSON.parse(raw)
  } catch {
    json = { objeto: "", justificativa: "" }
  }
  return {
    objeto: String(json.objeto || "").trim(),
    justificativa: String(json.justificativa || "").trim(),
  }
}

function parseBRL(v) {
  if (!v) return Number.NaN
  const n = Number(
    String(v)
      .replace(/[R$\s.]/g, "")
      .replace(",", "."),
  )
  return Number.isFinite(n) ? n : Number.NaN
}

export async function buildPropostas(openai, cotacoesPaths = []) {
  const extracoes = []
  for (const p of cotacoesPaths) {
    const data = await extractCotacaoFromPdf(openai, p)
    extracoes.push(data)
  }

  if (openai) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PROMPT_CONSOLIDA_PROPOSTAS.system },
        {
          role: "user",
          content: `${PROMPT_CONSOLIDA_PROPOSTAS.user}\n\n${JSON.stringify(extracoes)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "consolida_propostas",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              propostas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    selecao: { type: ["string", "null"] },
                    ofertante: { type: ["string", "null"] },
                    cnpj_ofertante: { type: ["string", "null"] },
                    data_cotacao: { type: ["string", "null"] },
                    valor: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
        },
      },
    })
    const out = JSON.parse(res?.choices?.[0]?.message?.content ?? "{}")
    if (Array.isArray(out?.propostas) && out.propostas.length) {
      return out.propostas
    }
  }

  const base = extracoes.map((x) => ({
    selecao: "",
    ofertante: x?.ofertante ?? "",
    cnpj_ofertante: x?.cnpj_ofertante ?? null,
    data_cotacao: x?.data_cotacao ?? null,
    valor: x?.valor ?? null,
    _num: parseBRL(x?.valor),
  }))
  const allHave = base.every((b) => Number.isFinite(b._num))
  return (allHave ? base.sort((a, b) => a._num - b._num) : base).map(({ _num, ...r }) => r)
}
