import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Normaliza tags quebradas no XML do Word
 * O Word quebra tags como {{instituicao}} em múltiplos elementos <w:r><w:t>
 * Exemplo: <w:r><w:t>{</w:t></w:r><w:r><w:t>{</w:t></w:r><w:r><w:t>instituicao</w:t></w:r><w:r><w:t>}</w:t></w:r><w:r><w:t>}</w:t></w:r>
 * Esta função junta essas tags quebradas em um único <w:r><w:t>{{instituicao}}</w:t></w:r>
 */
function normalizeBrokenTags(xml) {
  let normalized = xml
  
  // O Word quebra tags em múltiplos <w:r><w:t> e pode incluir <w:proofErr>
  // Exemplos:
  // 1. <w:r><w:t>{</w:t></w:r><w:r><w:t>{</w:t></w:r><w:proofErr.../><w:r><w:t>instituicao</w:t></w:r><w:proofErr.../><w:r><w:t>}</w:t></w:r><w:r><w:t>}</w:t></w:r>
  // 2. <w:r><w:t>{{</w:t></w:r><w:proofErr.../><w:r><w:t>termo_parceria</w:t></w:r><w:proofErr.../><w:r><w:t>}}</w:t></w:r>
  // 3. <w:r><w:t>{</w:t></w:r><w:r><w:t>{</w:t></w:r><w:r><w:t>objeto}}</w:t></w:r>
  
  // Primeiro, remover <w:proofErr> que podem estar entre as tags
  normalized = normalized.replace(/<w:proofErr[^>]*\/>/g, '')
  normalized = normalized.replace(/<w:proofErr[^>]*>.*?<\/w:proofErr>/g, '')
  
  // Caso 1: Tags completamente quebradas: { + { + conteúdo + } + }
  normalized = normalized.replace(
    /<w:r[^>]*><w:t[^>]*>\{<\/w:t><\/w:r>\s*<w:r[^>]*><w:t[^>]*>\{<\/w:t><\/w:r>\s*((?:<w:r[^>]*><w:t[^>]*>[^<]*<\/w:t><\/w:r>\s*)*?)<w:r[^>]*><w:t[^>]*>\}<\/w:t><\/w:r>\s*<w:r[^>]*><w:t[^>]*>\}<\/w:t><\/w:r>/g,
    (match, p1) => {
      const tagName = p1.replace(/<w:r[^>]*><w:t[^>]*>([^<]*)<\/w:t><\/w:r>/g, '$1').trim()
      return `<w:r><w:t>{{${tagName}}}</w:t></w:r>`
    }
  )
  
  // Caso 2: Tags parcialmente quebradas: {{ + conteúdo + }}
  // Exemplo: <w:t>{{</w:t>...<w:t>termo_parceria</w:t>...<w:t>}}</w:t>
  normalized = normalized.replace(
    /<w:t[^>]*>\{\{<\/w:t><\/w:r>\s*((?:<w:r[^>]*><w:t[^>]*>[^<]*<\/w:t><\/w:r>\s*)*?)<w:r[^>]*><w:t[^>]*>\}\}<\/w:t>/g,
    (match, p1) => {
      const tagName = p1.replace(/<w:r[^>]*><w:t[^>]*>([^<]*)<\/w:t><\/w:r>/g, '$1').trim()
      return `<w:r><w:t>{{${tagName}}}</w:t></w:r>`
    }
  )
  
  // Caso 3: Tags com parte já junta: { + { + conteúdo}}
  normalized = normalized.replace(
    /<w:r[^>]*><w:t[^>]*>\{<\/w:t><\/w:r>\s*<w:r[^>]*><w:t[^>]*>\{<\/w:t><\/w:r>\s*((?:<w:r[^>]*><w:t[^>]*>[^<]*<\/w:t><\/w:r>\s*)*?)<w:r[^>]*><w:t[^>]*>\}\}<\/w:t><\/w:r>/g,
    (match, p1) => {
      const tagName = p1.replace(/<w:r[^>]*><w:t[^>]*>([^<]*)<\/w:t><\/w:r>/g, '$1').trim()
      return `<w:r><w:t>{{${tagName}}}</w:t></w:r>`
    }
  )
  
  // Caso 4: Tags com parte já junta: {{ + conteúdo + } + }
  normalized = normalized.replace(
    /<w:r[^>]*><w:t[^>]*>\{\{<\/w:t><\/w:r>\s*((?:<w:r[^>]*><w:t[^>]*>[^<]*<\/w:t><\/w:r>\s*)*?)<w:r[^>]*><w:t[^>]*>\}<\/w:t><\/w:r>\s*<w:r[^>]*><w:t[^>]*>\}<\/w:t><\/w:r>/g,
    (match, p1) => {
      const tagName = p1.replace(/<w:r[^>]*><w:t[^>]*>([^<]*)<\/w:t><\/w:r>/g, '$1').trim()
      return `<w:r><w:t>{{${tagName}}}</w:t></w:r>`
    }
  )
  
  return normalized
}

/**
 * Renderiza um documento DOCX a partir de um template buffer e dados
 * Usa docxtemplater para processar placeholders e loops de forma confiável
 * Primeiro normaliza tags quebradas pelo Word
 */
export function renderDocxBuffer(templateBuffer, data = {}, options = {}) {
  try {
    console.log("[docxTemplate] Iniciando renderização com docxtemplater")
    console.log("[docxTemplate] Propostas:", Array.isArray(data.propostas) ? data.propostas.length : 0)
    
    // Carregar o template como binário
    const zip = new PizZip(templateBuffer)
    
    // Normalizar tags quebradas no XML principal
    const docXml = zip.files["word/document.xml"]
    if (docXml) {
      let xmlContent = docXml.asText()
      xmlContent = normalizeBrokenTags(xmlContent)
      zip.file("word/document.xml", xmlContent)
    }
    
    // Criar instância do docxtemplater com configurações otimizadas
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "{{",
        end: "}}",
      },
      nullGetter: () => "", // Retornar string vazia para valores null/undefined
    })

    // Renderizar o template com os dados
    // O docxtemplater automaticamente processa:
    // - Placeholders simples: {{instituicao}}
    // - Loops: {{#propostas}}...{{/propostas}}
    doc.render(data)

    // Gerar o buffer do documento final
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    })

    console.log("[docxTemplate] Documento gerado com sucesso:", buffer.length, "bytes")
    return buffer
  } catch (error) {
    console.error("[docxTemplate] ❌ Erro ao renderizar template:", error.message)
    
    // Log detalhado de erros de tags
    if (error.properties && error.properties.errors) {
      console.error("[docxTemplate] Erros de tags encontrados:")
      error.properties.errors.forEach((err, idx) => {
        console.error(`[docxTemplate]   ${idx + 1}. ${err.name}: ${err.message}`)
        if (err.properties && err.properties.context) {
          console.error(`[docxTemplate]      Contexto: ${err.properties.context.substring(0, 100)}`)
        }
      })
    }
    
    throw error
  }
}

/**
 * Renderiza um documento DOCX a partir de um arquivo de template
 */
export async function renderDocxFromTemplate(templateName, data, mode = "double") {
  const templatePath = path.join(__dirname, "..", "templates", templateName)

  if (!fs.existsSync(templatePath)) {
    const error = new Error(`Template não encontrado: ${templatePath}`)
    error.path = templatePath
    throw error
  }

  console.log("[docxTemplate] 📄 Carregando template:", templatePath)
  console.log("[docxTemplate] 📊 Dados para template:", {
    instituicao: data.instituicao,
    cnpj_instituicao: data.cnpj_instituicao ? "***" : "(vazio)",
    termo_parceria: data.termo_parceria ? "***" : "(vazio)",
    projeto_nome: data.projeto_nome ? "***" : "(vazio)",
    natureza_disp: data.natureza_disp ? "***" : "(vazio)",
    objeto: data.objeto ? data.objeto.substring(0, 50) + "..." : "(vazio)",
    propostas_count: Array.isArray(data.propostas) ? data.propostas.length : 0,
    data_geracao: data.data_geracao || "(vazio)",
    usuario_gerador: data.usuario_gerador || "(vazio)",
  })

  if (Array.isArray(data.propostas) && data.propostas.length > 0) {
    console.log("[docxTemplate] 📋 Primeira proposta:", {
      selecao: data.propostas[0].selecao,
      ofertante: data.propostas[0].ofertante,
      valor: data.propostas[0].valor,
    })
  }

  const templateBuffer = fs.readFileSync(templatePath)
  return renderDocxBuffer(templateBuffer, data, mode)
}

// Funções de compatibilidade (mantidas para não quebrar código existente)
export function preprocessDocxXml(xml) {
  return xml
}

export function applyDocxTemplate(xml, context = {}) {
  // Esta função não é mais usada, mas mantida para compatibilidade
  return xml
}
