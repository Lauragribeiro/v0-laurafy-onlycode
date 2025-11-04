// server.js — ESM (entrypoint único)
import "./src/envLoader.js"
import express, { Router } from "express"
import cors from "cors"
import helmet from "helmet"
import fileUpload from "express-fileupload"

import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path" // Import path module
import { dirname, join, extname } from "node:path"
import { fileURLToPath } from "node:url"

import { renderDocxBuffer } from "./src/utils/docxTemplate.js"
import { ensureTemplatesExist } from "./src/autoCreateTemplates.js"

import dayjs from "dayjs"
import "dayjs/locale/pt-br.js"
dayjs.locale("pt-br")

// Routers externos (mantidos; adiciono fallbacks mais abaixo)
import uploadsRouter from "./src/uploads.js"
import parseDocsRouter, { extractPurchaseDocData } from "./src/parseDocs.js"
import vendorsRouter from "./src/vendors.js"
// import purchasesRouter               from "./src/purchases.js"; // ⇐ NÃO usar (router interno abaixo)
import { registerDocRoutes } from "./src/generateDocs.js"
import { ensureOpenAIClient, hasOpenAIKey, invalidateOpenAIClient } from "./src/openaiProvider.js"
import cnpjProxyRouter from "./src/cnpjProxy.js"

// __dirname helpers (ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = __dirname // Define rootDir

// Caminhos úteis
const PUB = (...p) => join(__dirname, "public", ...p)
const DATA_DIR = join(__dirname, "data")
const UPLOADS_DIR = join(DATA_DIR, "uploads")
const PROJECTS_FILE = join(DATA_DIR, "projects.json")
const PURCHASES_FILE = join(DATA_DIR, "purchases.json")
const TEMPLATE_BASE = join(__dirname, "src", "templates")

// ===== OpenAI opcional =====
const hasOpenAI = hasOpenAIKey()
const useLegacyMapaRoute = process.env.LEGACY_MAPA === "1"

/* ========================================================================== *
 *  Preparação de diretórios
 * ========================================================================== */
async function ensureBaseDirs() {
  console.log("[server] ========================================")
  console.log("[server] Inicializando servidor...")
  console.log("[server] ========================================")

  await fsp.mkdir(DATA_DIR, { recursive: true }).catch(() => {})
  await fsp.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {})

  try {
    console.log("[server] 🔄 Verificando e criando templates...")
    const created = await ensureTemplatesExist()

    if (created > 0) {
      console.log(`[server] ✅ ${created} template(s) criado(s) com sucesso`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("[server] ⏸️  Aguardando 1 segundo para garantir que os templates foram salvos...")
    } else {
      console.log("[server] ✓ Todos os templates já existem")
    }

    const criticalTemplates = [
      path.join(rootDir, "src", "templates", "folha_rosto", "folha_rosto_edge.docx"),
      path.join(rootDir, "src", "templates", "folha_rosto", "folha_rosto_vertex.docx"),
      path.join(rootDir, "src", "templates", "mapa", "mapa_edge.docx"),
      path.join(rootDir, "src", "templates", "mapa", "mapa_vertex.docx"),
    ]

    console.log("[server] 🔍 Verificando templates críticos:")
    let allExist = true
    for (const templatePath of criticalTemplates) {
      const exists = fs.existsSync(templatePath)
      const status = exists ? "✅" : "❌"
      const size = exists ? `(${fs.statSync(templatePath).size} bytes)` : ""
      console.log(`[server]   ${status} ${path.basename(templatePath)} ${size}`)
      if (!exists) allExist = false
    }

    if (!allExist) {
      console.error("[server] ⚠️  ATENÇÃO: Alguns templates críticos não foram criados!")
      console.error("[server] Execute 'npm run generate-templates' para recriar os templates")
    } else {
      console.log("[server] ✅ Todos os templates críticos estão disponíveis")
    }
  } catch (error) {
    console.error("[server] ❌ Erro ao verificar templates:", error.message)
    console.error("[server] Stack:", error.stack)
  }

  console.log("[server] ========================================")
}
await ensureBaseDirs()

console.log("[server] TEMPLATE_BASE:", TEMPLATE_BASE)

/* ========================================================================== *
 *  purchasesRouter (interno, à prova de falhas)
 * ========================================================================== */
const purchasesRouter = Router()

async function ensurePurchasesFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true })
  try {
    await fsp.access(PURCHASES_FILE, fs.constants.F_OK)
  } catch {
    await fsp.writeFile(PURCHASES_FILE, "[]", "utf8")
  }
}
async function readPurchases() {
  await ensurePurchasesFile()
  let raw = await fsp.readFile(PURCHASES_FILE, "utf8").catch(() => "[]")
  raw = (raw || "").trim()
  if (!raw) return []
  let json
  try {
    json = JSON.parse(raw)
  } catch {
    return []
  }
  if (Array.isArray(json)) return json
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.items)) return json.items
  if (json && typeof json === "object") return Object.values(json)
  return []
}
async function writePurchases(list) {
  await ensurePurchasesFile()
  const clean = Array.isArray(list) ? list : []
  await fsp.writeFile(PURCHASES_FILE, JSON.stringify(clean, null, 2), "utf8")
}

// LISTAR
purchasesRouter.get("/purchases", async (req, res) => {
  try {
    const qProject = String(req.query.projectId || "").trim()
    let list = await readPurchases()
    if (!Array.isArray(list)) list = []

    // filtra por projeto, mas NUNCA injeta valores do formulário atual
    const dataRaw = qProject ? list.filter((x) => String(x?.projectId ?? "") === qProject) : list

    const data = await Promise.all(dataRaw.map((row) => presentPurchaseRow(row)))

    return res.json({ ok: true, data })
  } catch (e) {
    console.error("[purchases] GET erro:", e)
    return res.json({ ok: true, data: [] })
  }
})

// CRIAR/ATUALIZAR
purchasesRouter.post("/purchases", async (req, res) => {
  try {
    const fallbackProject = req.body?.projectId ?? req.body?.projetoId ?? req.body?.projId ?? req.query?.projectId ?? ""

    const incoming = await normalizePurchaseInput(req.body || {}, fallbackProject)
    let list = await readPurchases()
    if (!Array.isArray(list)) list = []

    // garante id único caso venha vazio/duplicado
    if (!incoming.id) incoming.id = Date.now() + Math.floor(Math.random() * 1000)

    const idx = list.findIndex((x) => String(x.id) === String(incoming.id))
    let stored
    if (idx >= 0) {
      stored = mergeDefined(list[idx], incoming)
      list[idx] = stored
    } else {
      stored = incoming
      list.push(stored)
    }

    await writePurchases(list)
    return res.json({ ok: true, data: await presentPurchaseRow(stored) })
  } catch (e) {
    console.error("[purchases] POST erro:", e)
    return res.status(200).json({ ok: false, error: String(e?.message || e) })
  }
})

purchasesRouter.put("/purchases", async (req, res) => {
  try {
    const body = req.body || {}
    const projectId = String(body.projectId ?? body.projetoId ?? body.projId ?? "").trim()

    if (!projectId) {
      return res.status(400).json({ ok: false, error: "project_required" })
    }

    const rows = Array.isArray(body.rows) ? body.rows : []

    let list = await readPurchases()
    if (!Array.isArray(list)) list = []

    // remove entradas anteriores do mesmo projeto
    list = list.filter((item) => String(item?.projectId ?? "") !== projectId)

    const sanitized = await Promise.all(
      rows.map((row) => normalizePurchaseInput(row || {}, projectId, { assignId: true })),
    )

    list.push(...sanitized)
    await writePurchases(list)

    const response = await Promise.all(sanitized.map((row) => presentPurchaseRow(row)))

    return res.json({ ok: true, data: response })
  } catch (e) {
    console.error("[purchases] PUT erro:", e)
    return res.status(500).json({ ok: false, error: "save_failed" })
  }
})

/* ========================================================================== *
 *  Rota auxiliar: extração de CNPJ/CPF a partir de texto (fallback local)
 * ========================================================================== */
const docRouter = Router()
const reCNPJ = /(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/g
const reCPF = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)/g

docRouter.post("/parse/extract-docs", async (req, res) => {
  try {
    const text = req.body?.text || req.body?.ocrText || ""
    const found = new Set()
    ;(text.match(reCNPJ) || []).forEach((m) => found.add(m))
    ;(text.match(reCPF) || []).forEach((m) => found.add(m))
    return res.json({ documentos: Array.from(found) })
  } catch (e) {
    console.error("[parse/extract-docs] erro:", e)
    return res.json({ documentos: [] })
  }
})

/* ========================================================================== *
 *  Helpers de persistência/normalização para projects.json
 * ========================================================================== */
async function readProjects() {
  try {
    const raw = await fsp.readFile(PROJECTS_FILE, "utf8")
    const json = JSON.parse(raw)
    if (Array.isArray(json)) return json
    if (Array.isArray(json?.data)) return json.data
    return []
  } catch {
    return []
  }
}
async function writeProjects(list) {
  await fsp.mkdir(DATA_DIR, { recursive: true })
  const clean = Array.isArray(list) ? list : []
  await fsp.writeFile(PROJECTS_FILE, JSON.stringify({ data: clean }, null, 2), "utf8")
}
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function toStringSafe(v) {
  if (v === undefined || v === null) return ""
  if (typeof v === "string") return v.trim()
  if (typeof v === "number" || typeof v === "boolean") return String(v).trim()
  return ""
}

// ** FIX: Declare onlyDigits or remove it if not used elsewhere **
function onlyDigits(str = "") {
  return String(str || "").replace(/\D/g, "")
}

function normalizeDate(value) {
  if (!value) return ""
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
    return trimmed // devolve como veio (o front lida com outros formatos)
  }
  if (typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
  }
  if (typeof value === "object") {
    if (value.iso) return normalizeDate(value.iso)
    if (value.data) return normalizeDate(value.data)
    if (value.date) return normalizeDate(value.date)
  }
  return ""
}

function normalizeMoney(value) {
  if (value === undefined || value === null || value === "") return ""
  if (typeof value === "number") return Number.isFinite(value) ? value : ""
  if (typeof value === "object") {
    if (typeof value.valor_pago_num === "number") return value.valor_pago_num
    if (typeof value.valor === "number") return value.valor
    if (value.raw) return normalizeMoney(value.raw)
  }
  const str = String(value).replace(/R\$/gi, "").replace(/\s+/g, "").replace(/\./g, "").replace(",", ".")
  const num = Number(str)
  return Number.isFinite(num) ? num : ""
}

function maskDocBR(doc = "") {
  const digits = onlyDigits(doc)
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*$/, "$1.$2.$3/$4-$5")
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*$/, "$1.$2.$3-$4")
  return toStringSafe(doc)
}

function safeParseJSON(value) {
  if (typeof value !== "string") return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parsePropostasList(body = {}) {
  const sources = []
  if (Array.isArray(body.propostas)) sources.push(body.propostas)
  const propJson = safeParseJSON(body.propostas_json || body.propostasJSON)
  if (Array.isArray(propJson)) sources.push(propJson)
  if (Array.isArray(body.cotacoes_propostas)) sources.push(body.cotacoes_propostas)
  const cotJson = safeParseJSON(body.cotacoes_propostas_json || body.cotacoesJson)
  if (Array.isArray(cotJson)) sources.push(cotJson)
  if (Array.isArray(body.mapaPropostas)) sources.push(body.mapaPropostas)

  const rawList = sources.find((arr) => Array.isArray(arr) && arr.length) || []
  const normalized = []

  rawList.forEach((item, idx) => {
    if (!item || typeof item !== "object") return

    const selecaoRaw = toStringSafe(item.selecao ?? (item.selecionada ? "SELECIONADA" : ""))
    const ofertante = toStringSafe(item.ofertante ?? item.fornecedor ?? item.nome)
    const doc = maskDocBR(item.cnpj ?? item.cnpj_ofertante ?? item.cnpjCpf ?? item.cnpj_cpf ?? item.cpf)
    const dataISO = normalizeDate(
      item.dataCotacao ?? item.data_cotacao ?? item.data ?? item.dataCotacaoISO ?? item.data_cotacao_iso,
    )
    const valorNum = normalizeMoney(item.valor_num ?? item.valor ?? item.preco ?? item.total ?? item.valor_proposta)

    const proposal = {
      selecao: selecaoRaw || (item.selecionada ? "SELECIONADA" : `Cotação ${idx + 1}`),
      ofertante,
      cnpj: doc,
      cnpj_ofertante: doc,
      data_cotacao: dataISO || toStringSafe(item.data_cotacao ?? item.dataCotacao ?? item.data),
    }

    if (dataISO) proposal.data_cotacao_iso = dataISO

    if (typeof valorNum === "number" && Number.isFinite(valorNum)) {
      proposal.valor = valorNum
      proposal.valor_num = valorNum
    } else {
      const rawValor = toStringSafe(item.valor ?? item.preco ?? item.total ?? item.valor_proposta)
      proposal.valor = rawValor
      if (typeof item.valor_num === "number" && Number.isFinite(item.valor_num)) {
        proposal.valor_num = item.valor_num
      } else {
        proposal.valor_num = null
      }
    }

    normalized.push(proposal)
  })

  return normalized
}

function normalizeDocs(body = {}) {
  const src = body.docs || body.documentacao || body.documentos || {}
  const ordemVal = src.ordem ?? src.ordem_fornecimento ?? src.ordemFornecimento ?? null
  const docs = {
    nf: src.nf ?? src.notaFiscal ?? body.docNf ?? null,
    oficio: src.oficio ?? src.oficio_solicitacao ?? null,
    ordem: ordemVal,
    ordem_fornecimento: src.ordem_fornecimento ?? ordemVal,
    comprovante: src.comprovante ?? src.pagamento ?? null,
    folhaAssinada: src.folhaAssinada ?? src.folha_assinada ?? body.folhaAssinada ?? null,
    decisaoAssinada:
      src.decisaoAssinada ??
      src.decisao_assinada ??
      src.mapaAssinado ??
      src.mapa_assinado ??
      src.justificativaAssinada ??
      src.justificativa_assinada ??
      body.decisaoAssinada ??
      body.mapaAssinado ??
      body.justificativaAssinada ??
      null,
    cotacoes: Array.isArray(src.cotacoes) ? src.cotacoes : Array.isArray(body.cotacoes) ? body.cotacoes : [],
  }
  return docs
}

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".ofx": "application/x-ofx",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}

function guessMimeFromPath(filePath = "") {
  const ext = extname(String(filePath || "")).toLowerCase()
  return MIME_BY_EXT[ext] || "application/octet-stream"
}

async function loadDocFile(entry) {
  if (!entry || typeof entry !== "object") return null
  if (entry.buffer && entry.buffer.length) return entry
  const filePath =
    entry.path || entry.filepath || entry.fullpath || entry.tempFilePath || entry.dest || entry.destination
  if (!filePath) return null
  try {
    const buffer = await fsp.readFile(filePath)
    const mimetype = entry.mimetype || guessMimeFromPath(filePath)
    const originalname = entry.originalname || entry.name || entry.filename || filePath.split(/[/\\]/).pop()
    return { ...entry, buffer, mimetype, originalname }
  } catch (err) {
    console.warn("[purchases] falha ao ler arquivo de doc:", filePath, err?.message || err)
    return null
  }
}

async function extractDocsMetadata(docs) {
  if (!docs || typeof docs !== "object") return null
  const nfFile = await loadDocFile(docs.nf)
  const oficioFile = await loadDocFile(docs.oficio)
  const ordemFile = await loadDocFile(docs.ordem || docs.ordem_fornecimento)
  const cotacoes = Array.isArray(docs.cotacoes)
    ? (await Promise.all(docs.cotacoes.map(loadDocFile))).filter(Boolean)
    : []

  if (!nfFile && !oficioFile && !ordemFile && !cotacoes.length) return null

  try {
    return await extractPurchaseDocData({ nfFile, oficioFile, ordemFile, cotacoes })
  } catch (err) {
    console.warn("[purchases] falha ao extrair metadados dos documentos:", err?.message || err)
    return null
  }
}

function buildMesLabel(rawLabel, isoFromPayment = "") {
  const base = toStringSafe(rawLabel)
  if (base) {
    const mm = base.match(/^(\d{1,2})\/(\d{4})$/)
    if (mm) {
      const idx = Number(mm[1]) - 1
      return MONTH_LABELS[idx] ? `${MONTH_LABELS[idx]}/${mm[2]}` : base
    }
    return base
  }
  if (!isoFromPayment) return ""
  const d = new Date(`${isoFromPayment}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ""
  return `${MONTH_LABELS[d.getMonth()]}/${d.getFullYear()}`
}

function labelToMesAno(label = "") {
  const txt = toStringSafe(label)
  if (!txt) return ""
  const mm = txt.match(/^(\d{1,2})\/(\d{4})$/)
  if (mm) return `${mm[1].padStart(2, "0")}/${mm[2]}`
  const parts = txt.split("/")
  if (parts.length === 2) {
    const idx = MONTH_LABELS.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase())
    if (idx >= 0) return `${String(idx + 1).padStart(2, "0")}/${parts[1]}`
  }
  return txt
}

async function normalizePurchaseInput(body = {}, fallbackProjectId = "", opts = {}) {
  const assignId = opts.assignId ?? true

  const idRaw = body.id ?? body.ID ?? body._id
  const projectRaw = body.projectId ?? body.projetoId ?? body.projId ?? fallbackProjectId ?? ""

  let dataTitulo = normalizeDate(body.dataTitulo ?? body.data_titulo ?? body.data_titulo_nf ?? body.data_emissao_iso)
  let nf = toStringSafe(
    body.nf ?? body.nf_recibo ?? body.nfNumero ?? body.numeroNf ?? body.recibo ?? body.nf_num_9_mask ?? body.nf_num_9,
  )
  let just = toStringSafe(body.just ?? body.justificativa ?? body.justificativaCompra ?? body.justificativa_para_compra)
  const nExtrato = toStringSafe(
    body.nExtrato ?? body.numero_extrato ?? body.numeroExtrato ?? body.n_extrato ?? body.extrato,
  )
  const dataPagamento = normalizeDate(
    body.dataPagamento ?? body.data_pagamento ?? body.data_pagamento?.iso ?? body.data_pagto,
  )
  const valor = normalizeMoney(
    body.valor ?? body.valor_pago ?? body.valorPago ?? body.valor_pagamento ?? body.valor_pago_num,
  )
  const rubrica = toStringSafe(body.rubrica ?? body.tipo_rubrica ?? body.tipoRubrica ?? body.naturezaDisp)
  const mesAnoInput = toStringSafe(body.mesAno ?? body.mes_ano ?? "")
  const mesLabel = buildMesLabel(body.mesLabel ?? body.mes_label ?? mesAnoInput, dataPagamento)
  const mesAno = mesAnoInput || labelToMesAno(mesLabel)

  const docs = normalizeDocs(body)

  let objetoBase = toStringSafe(
    body.objeto ??
      body.objetoDescricao ??
      body.cotacaoObjeto ??
      body.cotacoes_objeto ??
      body.objeto_cotacao ??
      body.objeto_rascunho ??
      body.objetoMapa ??
      body.objetoDescricaoMapa ??
      "",
  )
  if (/^na[oã] informado$/i.test(objetoBase)) objetoBase = ""
  const propostasList = parsePropostasList(body)
  const cotAvisosSrc = body.cotacoesAvisos ?? body.cotacoes_avisos
  const cotacoesAvisos = Array.isArray(cotAvisosSrc) ? cotAvisosSrc.map((v) => toStringSafe(v)).filter(Boolean) : []

  const out = {
    favorecido: toStringSafe(body.favorecido ?? body.favorecidoNome ?? body.nomeFavorecido),
    cnpj: toStringSafe(body.cnpj ?? body.cnpjFav ?? body.favorecidoDoc),
    pcNumero: toStringSafe(body.pcNumero ?? body.numeroPc ?? body.n_pc),
    dataTitulo,
    nf,
    nExtrato,
    dataPagamento,
    valor,
    rubrica,
    mesLabel,
    mesAno,
    just,
    docs,
    objeto: objetoBase,
    cotacaoObjeto: objetoBase,
    cotacoes_objeto: objetoBase,
    objetoDescricao: objetoBase,
    propostas: propostasList,
    cotacoes_propostas: propostasList,
  }

  if (assignId || idRaw != null) {
    const id = idRaw != null ? String(idRaw) : String(Date.now() + Math.floor(Math.random() * 1000))
    out.id = id
  }
  if (projectRaw) out.projectId = String(projectRaw)

  if ((!dataTitulo || !nf || !just) && docs && typeof docs === "object") {
    const meta = await extractDocsMetadata(docs)
    if (meta) {
      if (!dataTitulo) {
        const iso = normalizeDate(meta.data_emissao_iso ?? meta.dataTitulo)
        if (iso) {
          dataTitulo = iso
          out.dataTitulo = iso
        }
      }
      if (!nf) {
        const nfCandidate = meta.nf_num_9_mask ?? meta.nf_num_9 ?? meta.nf_num ?? meta.nf_num_mask ?? meta.nf ?? ""
        const nfVal = toStringSafe(nfCandidate)
        if (nfVal) {
          nf = nfVal
          out.nf = nfVal
        }
      }
      if (!just) {
        const justVal = toStringSafe(meta.just)
        if (justVal) {
          just = justVal
          out.just = justVal
        }
      }
    }
  }

  // aliases para compatibilidade
  out.dataTitulo = dataTitulo
  out.data_titulo = dataTitulo
  out.data_emissao_iso = out.data_emissao_iso ?? dataTitulo
  out.data_emissao = out.data_emissao ?? dataTitulo
  out.nf = nf
  out.nf_recibo = nf
  out.nf_num = out.nf_num ?? nf
  out.nf_num_mask = out.nf_num_mask ?? nf
  out.nf_num_9 = out.nf_num_9 ?? nf
  out.nf_num_9_mask = out.nf_num_9_mask ?? nf
  if (!out.nf_mask && out.nf_num_9_mask) out.nf_mask = out.nf_num_9_mask
  out.justificativa = just
  out.justificativa_para_compra = out.justificativa_para_compra ?? just
  out.numero_extrato = nExtrato
  out.data_pagamento = dataPagamento
  out.valor_pago = valor
  out.valorPago = out.valorPago ?? valor
  if (out.valor_pago_num == null) {
    if (typeof valor === "number") out.valor_pago_num = valor
    else if (valor) {
      const parsed = Number(valor)
      out.valor_pago_num = Number.isFinite(parsed) ? parsed : null
    } else {
      out.valor_pago_num = null
    }
  }
  out.tipo_rubrica = rubrica
  out.tipoRubrica = out.tipoRubrica ?? rubrica
  out.mesLabel = mesLabel
  out.mesAno = mesAno
  out.mes_ano = mesAno
  out.docs = docs

  if (cotacoesAvisos.length) {
    out.cotacoesAvisos = cotacoesAvisos
    out.cotacoes_avisos = cotacoesAvisos
  }

  return out
}

// merge que preserva objetos aninhados
function mergeDefined(prev = {}, incoming = {}) {
  const out = Array.isArray(prev) ? [...prev] : { ...prev }
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prev &&
      typeof prev[key] === "object" &&
      !Array.isArray(prev[key])
    ) {
      out[key] = mergeDefined(prev[key], value)
    } else {
      out[key] = value
    }
  }
  return out
}

async function presentPurchaseRow(row = {}) {
  const normalized = await normalizePurchaseInput(row, row.projectId ?? row.projetoId ?? "", {
    assignId: false,
  })
  // valores normalizados devem sobrescrever para garantir campos exigidos
  const merged = { ...row, ...normalized }
  if (merged.id == null && normalized.id != null) merged.id = normalized.id
  if (merged.projectId == null && normalized.projectId != null) merged.projectId = normalized.projectId
  return merged
}

/* ========================================================================== *
 *  App & Middlewares
 * ========================================================================== */
const app = express()

// Segurança/CORS
app.use(helmet({ frameguard: false, contentSecurityPolicy: false }))
app.use(cors())

// ⚠️ fileUpload PRECISA vir ANTES dos parsers para evitar "Unexpected end of form"
app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: false,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
  }),
)

// Body parsers (agora depois do fileUpload)
app.use(express.json({ limit: "25mb" }))
app.use(express.urlencoded({ extended: true, limit: "25mb" }))

// Timeout mais folgado para OCR/parse
app.use((req, _res, next) => {
  req.setTimeout?.(120000)
  next()
})

// Logs leves
app.use((req, _res, next) => {
  if (req.url.startsWith("/api")) {
    const small = ["GET", "HEAD"].includes(req.method)
    console.log(`${req.method} ${req.url}${small ? "" : " (payload recebido)"}`)
  }
  next()
})

// Estáticos
app.use(express.static(PUB()))
app.use("/styles", express.static(join(__dirname, "styles")))
app.use("/src", express.static(join(__dirname, "src")))
app.use("/vendor/pdfjs", express.static(join(__dirname, "node_modules", "pdfjs-dist", "build")))
app.use("/uploads", express.static(UPLOADS_DIR))

/* ========================================================================== *
 *  Uploads — endpoints compatíveis com o front
 *    - /api/upload           (single/multi; campo "file" ou qualquer nome)
 *    - /api/uploads/single   (fallback)
 *    - /api/uploads/cotacoes (múltiplos)
 * ========================================================================== */
function normalizeIncomingFiles(req) {
  if (!req.files || Object.keys(req.files).length === 0) return []
  const arr = []
  for (const key of Object.keys(req.files)) {
    const v = req.files[key]
    if (Array.isArray(v)) arr.push(...v)
    else arr.push(v)
  }
  return arr
}

app.post("/api/upload", async (req, res) => {
  try {
    const files = normalizeIncomingFiles(req)
    if (!files.length) return res.status(400).json({ ok: false, message: "Nenhum arquivo enviado." })
    const saved = []
    for (const f of files) {
      const name = Date.now() + "-" + (f.name || "arquivo")
      const dest = join(UPLOADS_DIR, name)
      await f.mv(dest)
      saved.push({ name, url: `/uploads/${encodeURIComponent(name)}`, path: dest })
    }
    return res.json({ ok: true, files: saved })
  } catch (e) {
    console.error("[/api/upload] erro:", e)
    const isBusboy = /Unexpected end of form/i.test(String(e?.message || ""))
    return res
      .status(isBusboy ? 400 : 500)
      .json({ ok: false, message: isBusboy ? "Upload incompleto." : "Falha no upload." })
  }
})

const uploadFallback = Router()
uploadFallback.post("/uploads/single", async (req, res) => {
  try {
    const files = normalizeIncomingFiles(req)
    if (!files.length) return res.status(400).json({ ok: false, message: "Nenhum arquivo enviado." })
    const f = files[0]
    const name = Date.now() + "-" + (f.name || "arquivo")
    const dest = join(UPLOADS_DIR, name)
    await f.mv(dest)
    return res.json({ ok: true, files: [{ name, url: `/uploads/${encodeURIComponent(name)}`, path: dest }] })
  } catch (e) {
    console.error("[upload:single] erro:", e)
    return res.status(500).json({ ok: false, message: "Falha no upload." })
  }
})
uploadFallback.post("/uploads/cotacoes", async (req, res) => {
  try {
    const files = normalizeIncomingFiles(req)
    if (!files.length) return res.status(400).json({ ok: false, message: "Nenhum arquivo enviado." })
    const saved = []
    for (const f of files) {
      const name = Date.now() + "-" + (f.name || "cotacao.pdf")
      const dest = join(UPLOADS_DIR, name)
      await f.mv(dest)
      saved.push({ name, url: `/uploads/${encodeURIComponent(name)}`, path: dest })
    }
    return res.json({ ok: true, files: saved })
  } catch (e) {
    console.error("[upload:cotacoes] erro:", e)
    return res.status(500).json({ ok: false, message: "Falha no upload." })
  }
})

/* ========================================================================== *
 *  Rotas de Projects (listar/criar/editar/excluir)
 * ========================================================================== */
// ** FIX: Declare normalizeProjectInput or remove the call to it **
function normalizeProjectInput(body = {}) {
  return {
    titulo: toStringSafe(body.titulo ?? body.nome ?? ""),
    vigenciaInicio: normalizeDate(body.vigenciaInicio ?? body.inicio ?? body.dataInicio ?? ""),
    vigenciaFim: normalizeDate(body.vigenciaFim ?? body.fim ?? body.dataFim ?? ""),
    descricao: toStringSafe(body.descricao ?? body.desc ?? ""),
    gerente: toStringSafe(body.gerente ?? body.responsavel ?? ""),
    instituicao: toStringSafe(body.instituicao ?? body.nomeInstituicao ?? ""),
    status: toStringSafe(body.status ?? ""),
    observacoes: toStringSafe(body.observacoes ?? body.obs ?? ""),
    cnpj: toStringSafe(body.cnpj ?? body.cnpjInstituicao ?? ""),
    termoParceria: toStringSafe(body.termoParceria ?? body.termo_parceria ?? body.numeroTermo ?? ""),
    coordenador: toStringSafe(body.coordenador ?? ""),
    codigo: toStringSafe(body.codigo ?? ""),
  }
}

app.get("/api/projects", async (_req, res) => {
  const list = await readProjects()
  res.json({ ok: true, data: list })
})
app.post("/api/projects", async (req, res) => {
  const body = req.body || {}
  const data = normalizeProjectInput(body)
  if (!data.titulo || !data.vigenciaInicio || !data.vigenciaFim) {
    return res.status(400).json({
      ok: false,
      message: "Campos obrigatórios: título, vigência (início) e vigência (fim).",
    })
  }
  const list = await readProjects()
  const novo = {
    id: Date.now(),
    ...data,
    responsavel: data.gerente ?? body.responsavel ?? "",
    createdAt: new Date().toISOString(),
  }
  list.unshift(novo)
  await writeProjects(list)
  res.json({ ok: true, data: novo })
})
app.get("/api/projects/:id", async (req, res) => {
  const id = String(req.params.id)
  const list = await readProjects()
  const proj = list.find((p) => String(p.id) === id)
  if (!proj) return res.status(404).json({ ok: false, message: "Projeto não encontrado" })
  res.json({ ok: true, data: proj })
})
app.put("/api/projects/:id", async (req, res) => {
  try {
    const id = String(req.params.id)
    const list = await readProjects()
    const idx = list.findIndex((p) => String(p.id) === id)
    if (idx < 0) return res.status(404).json({ ok: false, message: "Projeto não encontrado" })

    const incoming = normalizeProjectInput(req.body || {})
    const curr = list[idx]
    const updated = {
      ...curr,
      ...incoming,
      responsavel: incoming.gerente ?? curr.gerente ?? curr.responsavel ?? null,
      status: curr.status ?? "pendente",
      instituicao: curr.instituicao ?? "EDGE",
      updatedAt: new Date().toISOString(),
    }
    if (!updated.titulo || String(updated.titulo).trim() === "") {
      return res.status(400).json({ ok: false, message: "Título é obrigatório" })
    }
    list[idx] = updated
    await writeProjects(list)
    res.json({ ok: true, data: updated })
  } catch (err) {
    console.error("[projects:PUT] error:", err)
    res.status(500).json({ ok: false, message: err?.message || "Falha ao atualizar projeto" })
  }
})
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const id = String(req.params.id)
    const list = await readProjects()
    const idx = list.findIndex((p) => String(p.id) === id)
    if (idx < 0) return res.status(404).json({ ok: false, message: "Projeto não encontrado" })

    const removed = list.splice(idx, 1)[0]
    await writeProjects(list)
    res.json({ ok: true, data: { id: removed.id } })
  } catch (err) {
    console.error("[projects:DELETE] error:", err)
    res.status(500).json({ ok: false, message: "Falha ao excluir projeto" })
  }
})

/* ========================================================================== *
 *  Registro de routers e rotas de geração de documentos
 * ========================================================================== */
app.use("/api", uploadFallback) // fallbacks de upload
app.use("/api", uploadsRouter)
app.use("/api", parseDocsRouter)
app.use("/api", vendorsRouter)
app.use("/api", purchasesRouter) // interno (este arquivo)
// app.use("/api/generate", generateDocsRouter);     // ❌ desabilitar
// registerDocRoutes(app, { openai, TEMPLATE_BASE }); // ❌ desabilitar
app.use("/api", cnpjProxyRouter)
app.use("/api", docRouter)

// Expor base de templates e registrar rotas de geração (seu módulo)
const openai = ensureOpenAIClient()
if (!useLegacyMapaRoute) {
  console.log("[mapa] rota aprimorada de geração habilitada.")
}
registerDocRoutes(app, { openai, TEMPLATE_BASE })

/* ========================================================================== *
 *  Depuração de templates
 * ========================================================================== */
app.get("/api/debug/templates", (_req, res) => {
  const dirs = [join(TEMPLATE_BASE, "folha_rosto"), join(TEMPLATE_BASE, "mapa")]
  const listing = {}
  for (const d of dirs) {
    try {
      listing[d] = fs.readdirSync(d)
    } catch (e) {
      listing[d] = `NÃO ENCONTREI (${e.message})`
    }
  }
  res.json({ TEMPLATE_BASE, listing })
})

/* ========================================================================== *
 *  Renderização DOCX (helpers locais)
 * ========================================================================== */
function readTemplateBuffer(rel) {
  const full = join(TEMPLATE_BASE, rel)
  if (!fs.existsSync(full)) {
    const msg = `Template não encontrado: ${full}`
    console.error(msg)
    throw new Error(msg)
  }
  return fs.readFileSync(full)
}
function renderDocxFromTemplate(templateRelPath, data, forceDelims = "auto") {
  const buf = readTemplateBuffer(templateRelPath)
  const forced = forceDelims === "single" || forceDelims === "double" ? forceDelims : undefined

  try {
    return renderDocxBuffer(buf, data, { forceDelimiters: forced })
  } catch (err) {
    console.error("[renderDocxFromTemplate] erro ao renderizar template", templateRelPath, err)
    throw err
  }
}

/* ===================== Helpers (formatação PT-BR) ===================== */
function fmtBRDate(s) {
  if (!s) return ""
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(s))) return String(s)
  const d = dayjs(s)
  return d.isValid() ? d.format("DD/MM/YYYY") : String(s)
}
function fmtBRL(v) {
  if (v == null || v === "") return ""
  if (typeof v === "string" && v.trim().startsWith("R$")) return v
  const n = typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."))
  return Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(v)
}
function todayParts() {
  const d = dayjs()
  return { localidade: "Maceió", dia: d.format("DD"), mes: d.format("MMMM"), ano: d.getFullYear() }
}

/* === NORMALIZAÇÃO DE PROPOSTAS (aceita aliases do front) ================ */
function normalizePropostas(arr = []) {
  let menorIdx = -1,
    menorVal = Number.POSITIVE_INFINITY,
    jaTemSelecionada = false
  const out = (arr || []).map((p, i) => {
    const ofertante = String(p.ofertante || p.fornecedor || p.nome || "")
    const cnpj_ofertante = String(p.cnpj_ofertante || p.cnpj || p.cpf || p.cnpjCpf || "")
    const data_raw = p.data_cotacao || p.data || p.dataCotacao || p.dataCotacaoBR || ""
    const data_cotacao = fmtBRDate(data_raw)
    const valor_raw = p.valor || p.preco || p.total || p.valorBR || ""
    const valor = typeof valor_raw === "string" && valor_raw.includes("R$") ? valor_raw : fmtBRL(valor_raw)
    const selecionada = !!(
      p.selecionada ||
      p.selecao === "SELECIONADA" ||
      p.selecao === "Selecionada" ||
      p.selecao === "SIM"
    )
    if (selecionada) jaTemSelecionada = true
    const n = typeof valor_raw === "number" ? valor_raw : Number(String(valor_raw).replace(/\./g, "").replace(",", "."))
    if (Number.isFinite(n) && n < menorVal) {
      menorVal = n
      menorIdx = i
    }
    return {
      selecao: selecionada ? "SELECIONADA" : p.selecao || `Cotação ${i + 1}`,
      ofertante,
      cnpj_ofertante,
      data_cotacao,
      valor,
      cnpj: cnpj_ofertante || p.cnpj || p.cpf || p.cnpjCpf || "",
      data: data_cotacao || p.data || p.dataCotacao || p.dataCotacaoBR || "",
    }
  })
  if (!jaTemSelecionada && menorIdx >= 0 && out[menorIdx]) out[menorIdx].selecao = "SELECIONADA"
  return out.filter((p) => p.ofertante || p.cnpj_ofertante || p.data_cotacao || p.valor)
}

/* ===================== Leitura de PDFs e heurísticas ===================== */
async function pdfToTextFromBuffer(buf) {
  if (!buf || !buf.length) return ""
  try {
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buf)
    return (data?.text || "").replace(/\u0000/g, " ").trim()
  } catch (e) {
    console.warn("[pdf-parse] falhou:", e?.message || e)
    return ""
  }
}

async function parseCotacoes(cotacoes = []) {
  const out = []
  for (const c of cotacoes || []) {
    let name = "cotacao.pdf"
    let text = ""
    let buffer = null

    if (typeof c === "string") {
      name = c
      const clean = String(c)
        .replace(/^https?:\/\/[^/]+\//i, "")
        .replace(/^uploads\//i, "")
        .replace(/^\/+/, "")
        .split(/[\\/]/)
        .pop()
      if (clean) {
        const p = join(process.cwd(), "data", "uploads", clean)
        if (fs.existsSync(p)) {
          try {
            buffer = fs.readFileSync(p)
          } catch {}
        }
      }
    } else if (c && typeof c === "object") {
      name = String(c?.name || c?.filename || c?.fileName || name)
      text = String(c?.text || "")
      if (!text) {
        if (c?.base64) {
          try {
            const b64 = c.base64.replace(/^data:.*;base64,/, "")
            buffer = Buffer.from(b64, "base64")
          } catch {}
        } else if (c?.path && fs.existsSync(c.path)) {
          try {
            buffer = fs.readFileSync(c.path)
          } catch {}
        } else if (c?.url) {
          try {
            const base = `http://localhost:${process.env.PORT || 3000}`
            const u = new URL(c.url, base)
            if (u.pathname.startsWith("/uploads/")) {
              const file = decodeURIComponent(u.pathname.split("/").pop())
              const p = join(process.cwd(), "data", "uploads", file)
              if (fs.existsSync(p)) buffer = fs.readFileSync(p)
            }
          } catch {}
        }
      }
    }

    if (buffer) {
      text = await pdfToTextFromBuffer(buffer)
    }

    if (text) {
      out.push({ name, text })
    } else if (c && typeof c === "object" && (c.name || c.filename)) {
      out.push({ name: c.name || c.filename, text: "" }) // Manter o nome mesmo sem texto
    }
  }
  return out
}

async function extractCotacoesFromFiles(cotacoes = [], { instituicao = "", rubrica = "" } = {}) {
  console.log("[v0] extractCotacoesFromFiles - Iniciando extração de cotações")
  console.log("[v0] Número de cotações recebidas:", cotacoes?.length || 0)

  const parsed = await parseCotacoes(cotacoes)
  console.log("[v0] Cotações parseadas:", parsed.length)

  if (!parsed.length) {
    console.log("[v0] Nenhuma cotação foi parseada com sucesso")
    return { objeto: "", propostas: [] }
  }

  let aiResult = { objeto: "", propostas: [] }
  let usedAI = false

  try {
    console.log("[v0] Tentando extrair dados com IA...")
    aiResult = await extractFromCotacoesWithAI({ instituicao, rubrica, cotacoes: parsed })
    usedAI = true
    console.log("[v0] IA extraiu:", aiResult.propostas.length, "propostas")
  } catch (err) {
    console.log("[v0] IA falhou:", err.message)
    console.log("[v0] Usando fallback de extração de texto...")
  }

  if (!aiResult.propostas || aiResult.propostas.length === 0) {
    console.log("[v0] Criando propostas usando extração de texto (fallback)")

    const fallbackPropostas = parsed.map((cot, idx) => {
      const extracted = guessFieldsFromText(cot.text || "")
      console.log(`[v0] Cotação ${idx + 1} (${cot.name}):`, {
        ofertante: extracted.ofertante || "NÃO ENCONTRADO",
        cnpj: extracted.cnpj_ofertante || "NÃO ENCONTRADO",
        valor: extracted.valor || "NÃO ENCONTRADO",
      })

      return {
        selecao: `Cotação ${idx + 1}`,
        ofertante: extracted.ofertante || `Fornecedor ${idx + 1}`,
        cnpj_ofertante: extracted.cnpj_ofertante || "",
        data_cotacao: extracted.data_cotacao || "",
        valor: extracted.valor || "R$ 0,00",
      }
    })

    aiResult.propostas = fallbackPropostas
    console.log("[v0] Total de propostas criadas via fallback:", fallbackPropostas.length)
  }

  if (!aiResult.objeto && rubrica) {
    aiResult.objeto = rubrica
    console.log("[v0] Usando rubrica como objeto:", rubrica)
  }

  console.log("[v0] Resultado final da extração:", {
    objeto: aiResult.objeto || "NÃO DEFINIDO",
    propostas_count: aiResult.propostas.length,
    usedAI,
  })

  return aiResult
}

async function extractFromCotacoesWithAI({ instituicao = "", rubrica = "", cotacoes = [] } = {}) {
  if (!hasOpenAI) return { objeto: "", propostas: [] }
  try {
    const client = ensureOpenAIClient()
    if (!client) return { objeto: "", propostas: [] }
    const blocks = (cotacoes || [])
      .map((c, idx) => {
        const name = c?.name || c?.filename || c?.fileName || `Cotacao_${idx + 1}`
        const text = String(c?.text || "").slice(0, 20000)
        return `### COTAÇÃO ${idx + 1} (${name})\n${text}`
      })
      .filter(Boolean)

    if (!blocks.length) return { objeto: "", propostas: [] }

    const prompt = `Instituição: ${instituicao || ""}\nRubrica: ${rubrica || ""}\n\nAnalise as cotações a seguir e retorne um JSON com os campos {\n  "objeto": string,\n  "propostas": [ {\"selecao\", \"ofertante\", \"cnpj\", \"dataCotacao\", \"valor\"} ]\n}.\n\n${blocks.join("\n\n")}`

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "Você extrai dados estruturados de cotações comerciais e responde em JSON válido." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    })

    const raw = resp.output_text || "{}"
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      data = {}
    }

    const objeto = typeof data.objeto === "string" ? data.objeto.trim() : ""
    const propostas = Array.isArray(data.propostas)
      ? data.propostas.map((p, idx) => ({
          selecao: p.selecao || `Cotação ${idx + 1}`,
          ofertante: p.ofertante || "",
          cnpj_ofertante: p.cnpj_ofertante || p.cnpj || "",
          data_cotacao: fmtBRDate(p.dataCotacao || p.data_cotacao || p.data || ""),
          valor: fmtBRL(p.valor || p.valorBR || ""),
        }))
      : []

    return { objeto, propostas }
  } catch (err) {
    const code = err?.status || err?.statusCode || err?.code
    const msg = String(err?.message || "").toLowerCase()
    if (code === 401 || code === "401" || msg.includes("incorrect api key") || msg.includes("invalid api key")) {
      invalidateOpenAIClient()
      throw new Error("OPENAI_KEY_INVALID")
    }
    console.warn("[mapa] extractFromCotacoesWithAI falhou:", err?.message || err)
    return { objeto: "", propostas: [] }
  }
}

function guessFieldsFromText(txt = "") {
  const text = String(txt || "")

  const rxCNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g
  const rxCPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g

  let cnpj = ""
  let cpf = ""

  // Procurar CNPJ primeiro
  const cnpjMatches = Array.from(text.matchAll(rxCNPJ))
  if (cnpjMatches.length > 0) {
    cnpj = cnpjMatches[0][0].replace(/[^\d]/g, "").replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  // Se não encontrou CNPJ, procurar CPF
  if (!cnpj) {
    const cpfMatches = Array.from(text.matchAll(rxCPF))
    if (cpfMatches.length > 0) {
      cpf = cpfMatches[0][0].replace(/[^\d]/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
  }

  const docNum = cnpj || cpf || ""

  const rxDate = /\b([0-3]?\d)[/\-.]([01]?\d)[/\-.](\d{2}|\d{4})\b/g
  let dataCot = ""
  for (const m of text.matchAll(rxDate)) {
    const dd = +m[1],
      mm = +m[2]
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      let year = m[3]
      if (year.length === 2) year = "20" + year
      dataCot = `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${year}`
      break
    }
  }

  const rxBRL = /R?\$?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\b/g
  let valor = ""
  let max = -1
  for (const m of text.matchAll(rxBRL)) {
    const raw = m[0].replace(/[^\d,]/g, "")
    const normalized = raw.replace(/\./g, "").replace(",", ".")
    const n = Number(normalized)
    if (Number.isFinite(n) && n > max) {
      max = n
      // Formatar como BRL
      valor = `R$ ${n
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
    }
  }

  let ofertante = ""
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Procurar por "Razão Social" ou variações
  const razaoSocialPatterns = [
    /raz[aã]o\s+social\s*[:\-–]?\s*(.+)/i,
    /empresa\s*[:\-–]?\s*(.+)/i,
    /fornecedor\s*[:\-–]?\s*(.+)/i,
    /nome\s+fantasia\s*[:\-–]?\s*(.+)/i,
  ]

  for (const pattern of razaoSocialPatterns) {
    const m = text.match(pattern)
    if (m && m[1]) {
      ofertante = m[1].split(/\r?\n/)[0].trim()
      // Limpar caracteres especiais e limitar tamanho
      ofertante = ofertante.replace(/[^\w\s\-.]/g, "").slice(0, 100)
      if (ofertante.length > 5) break
    }
  }

  // Se não encontrou, tentar pegar a primeira linha que parece um nome de empresa
  if (!ofertante) {
    for (const line of lines.slice(0, 10)) {
      // Linha com mais de 10 caracteres e sem números demais
      if (line.length > 10 && line.length < 100) {
        const digitCount = (line.match(/\d/g) || []).length
        if (digitCount < line.length / 3) {
          ofertante = line
          break
        }
      }
    }
  }

  console.log("[v0] guessFieldsFromText extraiu:", {
    ofertante: ofertante || "NÃO ENCONTRADO",
    cnpj_ofertante: docNum || "NÃO ENCONTRADO",
    data_cotacao: dataCot || "NÃO ENCONTRADO",
    valor: valor || "NÃO ENCONTRADO",
  })

  return {
    ofertante,
    cnpj_ofertante: docNum,
    data_cotacao: dataCot,
    valor: valor || "",
  }
}

/* ---- Endpoints diretos (mantidos antes do generateDocsRouter) ---- */
// FOLHA DE ROSTO
app.post("/api/generate/folha-rosto", (req, res) => {
  console.log("Payload recebido em folha-rosto.")
  try {
    const b = req.body || {}
    const isVertex = String(b?.instituicao || "").toUpperCase() === "VERTEX"
    const templateName = isVertex ? "folha_rosto/folha_rosto_vertex.docx" : "folha_rosto/folha_rosto_edge.docx"
    const naturezaDisp = (
      b?.processo?.tipo_rubrica ||
      b?.tipoRubrica ||
      b?.rubrica ||
      b?.prestacao ||
      b?.naturezaDisp ||
      ""
    )
      .toString()
      .trim()
    const data = {
      instituicao: b.instituicao || "",
      projeto_codigo: b.proj?.projetoCodigo || b.projetoCodigo || b.codigo || "",
      projeto_nome: b.proj?.projetoNome || b.projeto || b.titulo || "",
      pc_numero: b.processo?.pcNumero || b.numeroPc || b.pc_numero || "",
      natureza_disp: naturezaDisp,
      rubrica: naturezaDisp,
      favorecido: b.favorecido || b.processo?.favorecidoNome || "",
      cnpj: b.cnpjFav || b.processo?.favorecidoDoc || b.cnpj || "",
      n_extrato: b.extrato || b.numeroExtrato || b.n_extrato || "",
      nf_recibo: b.nf || b.processo?.nfNumero || b.nf_recibo || "",
      data_emissao: b.dataEmissao || b.processo?.nfDataEmissaoISO || b.data_emissao || "",
      data_pagamento: b.dataPagamento || b.processo?.dataPagamentoISO || b.data_pagamento || "",
      valor_pago: b.valor || b.valorPago || b.processo?.valorTotalBR || "",
    }
    const buffer = renderDocxFromTemplate(templateName, data, "double")
    res
      .set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      .set("Content-Disposition", `attachment; filename="folha_rosto_${isVertex ? "vertex" : "edge"}.docx"`)
      .send(buffer)
  } catch (err) {
    console.error("[folha] erro:", err)
    res
      .status(500)
      .type("text/plain; charset=utf-8")
      .send("*** Folha de Rosto (FALLBACK) *** Template não encontrado ou com erro.\n\n" + String(err?.message || err))
  }
})

// MAPA DE COTAÇÃO
if (useLegacyMapaRoute) {
  console.warn("[mapa] LEGACY_MAPA=1 habilitado — utilizando rota legada /api/generate/mapa-cotacao.")
  app.post("/api/generate/mapa-cotacao", async (req, res) => {
    console.log("[v0] ========== MAPA DE COTAÇÃO ENDPOINT ==========")
    console.log("[v0] Request body keys:", Object.keys(req.body || {}))

    const warnings = []

    try {
      const b = req.body || {}
      const isVertex = String(b?.instituicao || "").toUpperCase() === "VERTEX"
      console.log("[v0] Institution:", isVertex ? "VERTEX" : "EDGE")

      const templateName = isVertex ? "mapa/mapa_vertex.docx" : "mapa/mapa_edge.docx"
      console.log("[v0] Template name:", templateName)

      const rubrica = (
        b?.processo?.tipo_rubrica ||
        b?.tipoRubrica ||
        b?.rubrica ||
        b?.prestacao ||
        b?.naturezaDisp ||
        ""
      )
        .toString()
        .trim()
      console.log("[v0] Rubrica:", rubrica)

      const frontPropsRaw = Array.isArray(b.propostas) ? b.propostas : []
      console.log("[v0] Front propostas count:", frontPropsRaw.length)
      console.log("[v0] Front propostas:", JSON.stringify(frontPropsRaw, null, 2))

      let propostas = normalizePropostas(frontPropsRaw)
      console.log("[v0] Normalized propostas count:", propostas.length)

      let objeto = String(b.objeto || b.objetoDescricao || b.processo?.objeto || "")
      console.log("[v0] Objeto inicial:", objeto ? objeto : "(empty)")

      if (objeto && rubrica && objeto.trim().toLowerCase() === rubrica.trim().toLowerCase()) objeto = ""

      const cotacoesInput =
        (Array.isArray(b?.docs?.cotacoes) ? b.docs.cotacoes : null) ?? (Array.isArray(b?.cotacoes) ? b.cotacoes : [])

      console.log("[v0] Cotacoes input count:", cotacoesInput.length)
      console.log(
        "[v0] Cotacoes input structure:",
        cotacoesInput.map((c) => ({
          name: c?.name || c?.filename || c?.key,
          hasData: !!c?.data,
          hasUrl: !!c?.url,
          hasPath: !!c?.path,
        })),
      )

      if (cotacoesInput.length > 0) {
        console.log("[v0] Tentando extrair dados de", cotacoesInput.length, "cotações...")

        try {
          const { objeto: extractedObjeto, propostas: extractedPropostas } = await extractCotacoesFromFiles(
            cotacoesInput,
            {
              instituicao: b.instituicao || "",
              rubrica,
            },
          )

          console.log("[v0] Extração concluída:")
          console.log("[v0] - Objeto extraído:", extractedObjeto || "(vazio)")
          console.log("[v0] - Propostas extraídas:", extractedPropostas?.length || 0)

          if (extractedObjeto) objeto = extractedObjeto

          if (extractedPropostas && extractedPropostas.length > 0) {
            propostas = extractedPropostas
            console.log("[v0] Usando propostas extraídas")
          } else {
            console.log("[v0] Nenhuma proposta extraída, criando propostas vazias para cada cotação")
            propostas = cotacoesInput.map((cot, idx) => ({
              selecao: `Cotação ${idx + 1}`,
              ofertante: cot?.name || cot?.filename || `Fornecedor ${idx + 1}`,
              cnpj_ofertante: "",
              data_cotacao: "",
              valor: "",
            }))
            warnings.push(
              `Criadas ${propostas.length} propostas vazias. Preencha os dados manualmente ou verifique os arquivos de cotação.`,
            )
          }
        } catch (extractError) {
          console.error("[v0] Erro ao extrair cotações:", extractError)
          warnings.push(`Erro ao processar cotações: ${extractError.message}`)

          if (propostas.length === 0) {
            console.log("[v0] Criando propostas vazias após erro de extração")
            propostas = cotacoesInput.map((cot, idx) => ({
              selecao: `Cotação ${idx + 1}`,
              ofertante: cot?.name || cot?.filename || `Fornecedor ${idx + 1}`,
              cnpj_ofertante: "",
              data_cotacao: "",
              valor: "",
            }))
          }
        }
      }

      if (!propostas || propostas.length === 0) {
        if (cotacoesInput.length === 0) {
          warnings.push("Nenhuma cotação anexada.")
          console.log("[v0] Nenhuma cotação anexada, criando 3 propostas vazias padrão")
        } else {
          warnings.push("Nenhuma proposta identificada nas cotações.")
          console.log("[v0] Cotações anexadas mas nenhuma proposta identificada")
        }

        propostas = []
        for (let i = 0; i < Math.max(3, cotacoesInput.length); i++) {
          propostas.push({
            selecao: `Cotação ${i + 1}`,
            ofertante: "",
            cnpj_ofertante: "",
            data_cotacao: "",
            valor: "",
          })
        }
      }

      console.log("[v0] Propostas finais antes de MIN_ROWS:", propostas.length)
      const MIN_ROWS = 3
      while (propostas.length < MIN_ROWS) {
        propostas.push({
          selecao: `Cotação ${propostas.length + 1}`,
          ofertante: "",
          cnpj_ofertante: "",
          data_cotacao: "",
          valor: "",
        })
      }

      const propsForTemplate = (Array.isArray(propostas) ? propostas : []).map((p, i) => ({
        selecao: p.selecao || `Cotação ${i + 1}`,
        ofertante: p.ofertante || p.fornecedor || "",
        cnpj_ofertante: p.cnpj_ofertante || p.cnpj || p.cpf || p.cnpjCpf || "",
        cnpj: p.cnpj || p.cnpj_ofertante || p.cpf || p.cnpjCpf || "",
        data_cotacao: p.data_cotacao || p.data || p.dataCotacao || p.dataCotacaoBR || "",
        data: p.data || p.data_cotacao || p.dataCotacao || p.dataCotacaoBR || "",
        valor: p.valor || p.valorBR || p.total || "",
      }))

      console.log("[v0] propsForTemplate count:", propsForTemplate.length)

      const dtPg = b?.processo?.dataPagamentoISO || b?.dataPagamento || ""
      const baseDate = dtPg ? new Date(dtPg) : new Date()
      const dia = String(baseDate.getDate()).padStart(2, "0")
      const mesNome = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ][baseDate.getMonth()]
      const ano = String(baseDate.getFullYear())

      const data = {
        instituicao: b.instituicao || b.proj?.instituicao || "",
        cnpj_instituicao: b.cnpj_instituicao || b.proj?.cnpj || "",
        termo_parceria: b.termo_parceria || b.proj?.termoParceria || "",
        codigo_projeto: b.codigo_projeto || b.proj?.projetoCodigo || "",
        projeto: b.projeto || b.proj?.projetoNome || "",
        projeto_nome: b.projeto || b.proj?.projetoNome || "",
        rubrica,
        natureza_disp: rubrica,
        objeto: objeto || rubrica,
        propostas: propsForTemplate,
        data_aquisicao: fmtBRDate(dtPg),
        justificativa: b.justificativa || b.processo?.justificativa || "",
        localidade: b.localidade || b.extras?.cidade || "Maceió",
        dia,
        mes: mesNome,
        ano,
        local_data: `Maceió, ${dia} de ${mesNome} de ${ano}`,
        coordenador: b.coordenador || b.proj?.coordenador || "",
        coordenador_nome: b.coordenador || b.proj?.coordenador || "",
      }

      console.log("[v0] Final data for template:", {
        instituicao: data.instituicao,
        propostas_count: data.propostas.length,
        objeto: data.objeto,
        warnings_count: warnings.length,
      })

      if (warnings.length > 0) {
        console.log("[v0] Mapa generated with warnings:", warnings)
        return res.json({
          ok: true,
          warnings,
          message: "Mapa gerado com pendências",
          buffer: Buffer.from(renderDocxFromTemplate(templateName, data, "double")).toString("base64"),
        })
      }

      const buffer = renderDocxFromTemplate(templateName, data, "double")
      res
        .set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        .set("Content-Disposition", `attachment; filename="mapa_cotacao_${isVertex ? "vertex" : "edge"}.docx"`)
        .send(buffer)
    } catch (err) {
      console.error("[mapa] erro:", err)

      if (err?.message?.includes("Template não encontrado") || err?.message?.includes("ENOENT")) {
        return res.status(404).json({
          ok: false,
          error: "Template não encontrado. Execute 'npm run generate-templates' para criar os templates.",
          hint: "Os templates devem estar em src/templates/mapa/",
        })
      }

      res.status(500).json({
        ok: false,
        error: "Erro ao gerar mapa de cotação",
        details: err?.message || String(err),
      })
    }
  })
}

/* ===== Páginas ===== */
app.get("/", (_req, res) => res.sendFile(PUB("index.html")))
app.get("/login", (_req, res) => res.sendFile(PUB("index.html")))
app.get("/login.html", (_req, res) => res.sendFile(PUB("index.html")))
app.get("/dashboard", (_req, res) => res.sendFile(PUB("dashboard.html")))
app.get("/prestacao", (_req, res) => res.sendFile(PUB("prestacao.html")))
app.get("/docfin", (_req, res) => res.sendFile(PUB("docfin.html")))
app.get("/dashboard.html", (_req, res) => res.sendFile(PUB("dashboard.html")))
app.get("/prestacao.html", (_req, res) => res.sendFile(PUB("prestacao.html")))
app.get("/docfin.html", (_req, res) => res.sendFile(PUB("docfin.html")))

/* ===== Compat: alias antigo ===== */
app.post("/api/docs/folha-rosto", (req, res) => res.redirect(307, "/api/generate/folha-rosto"))
app.post("/api/docs/folha-rosto/", (req, res) => res.redirect(307, "/api/generate/folha-rosto"))

/* ===== Health & 404 ===== */
app.get("/api/health", (_req, res) => res.json({ ok: true, msg: "api up" }))
app.get("/healthz", (_req, res) => res.json({ ok: true }))
app.get("/health", (_req, res) => res.json({ ok: true }))

// 404 para /api
app.use("/api", (_req, res) => res.status(404).json({ ok: false, error: "Rota não encontrada." }))

// Handler de erros — trata busboy com 400 para o front entender
app.use((err, _req, res, _next) => {
  console.error("[UNHANDLED ERROR]", err)
  const isBusboy = /Unexpected end of form/i.test(String(err?.message || ""))
  res
    .status(isBusboy ? 400 : 500)
    .json({ ok: false, error: isBusboy ? "Upload incompleto." : "Erro interno do servidor." })
})

/* ===== Start (único) ===== */
const DEFAULT_PORT = Number.parseInt(process.env.PORT, 10) || 3000
const HOST = "0.0.0.0"
function startServer(port = DEFAULT_PORT) {
  if (globalThis.__serverStarted) return
  globalThis.__serverStarted = true
  const server = app.listen(port, HOST, () => {
    console.log(`✅ Servidor rodando em http://localhost:${port}`)
    console.log("TEMPLATE_BASE:", TEMPLATE_BASE)
  })
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Porta ${port} em uso. Tentando ${port + 1}...`)
      globalThis.__serverStarted = false
      startServer(port + 1)
    } else {
      throw err
    }
  })
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => server.close(() => process.exit(0)))
  }
}
startServer()
// Server() // The 'Server' variable was undeclared and has been removed.
// undeclared and has been removed. // Removed these lines as they caused errors.
