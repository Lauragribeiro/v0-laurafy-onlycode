// src/autoCreateTemplates.js
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

// Diretórios de templates
const TEMPLATES_DIR = path.join(rootDir, "src", "templates")
const FOLHA_DIR = path.join(TEMPLATES_DIR, "folha_rosto")
const MAPA_DIR = path.join(TEMPLATES_DIR, "mapa")
const DISPENSA_DIR = path.join(TEMPLATES_DIR, "dispensa")

console.log("[autoCreateTemplates] Módulo carregado")
console.log("[autoCreateTemplates] TEMPLATES_DIR:", TEMPLATES_DIR)
console.log("[autoCreateTemplates] FOLHA_DIR:", FOLHA_DIR)
console.log("[autoCreateTemplates] MAPA_DIR:", MAPA_DIR)

function placeholder(name) {
  return `{${name}}`
}

function createFolhaRostoTemplate(instituicao) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: instituicao === "edge" ? "EDGE CAPITAL" : "VERTEX CAPITAL",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "FOLHA DE ROSTO",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: ", bold: true }), new TextRun({ text: placeholder("projeto") })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "CNPJ Instituição: ", bold: true }),
              new TextRun({ text: placeholder("cnpj_instituicao") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Termo de Parceria: ", bold: true }),
              new TextRun({ text: placeholder("termo_parceria") }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Rubrica: ", bold: true }), new TextRun({ text: placeholder("rubrica") })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Descrição: ", bold: true }),
              new TextRun({ text: placeholder("descricao") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Valor Total: ", bold: true }),
              new TextRun({ text: placeholder("valor_total") }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Data: ", bold: true }), new TextRun({ text: placeholder("data") })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "PROPOSTAS",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("#propostas") })],
          }),
        ],
      },
    ],
  })
  return doc
}

function createMapaCotacoesTemplate(instituicao) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: instituicao === "edge" ? "EDGE CAPITAL" : "VERTEX CAPITAL",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "MAPA DE COTAÇÕES",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: ", bold: true }), new TextRun({ text: placeholder("projeto") })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "CNPJ Instituição: ", bold: true }),
              new TextRun({ text: placeholder("cnpj_instituicao") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Termo de Parceria: ", bold: true }),
              new TextRun({ text: placeholder("termo_parceria") }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Rubrica: ", bold: true }), new TextRun({ text: placeholder("rubrica") })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Descrição: ", bold: true }),
              new TextRun({ text: placeholder("descricao") }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "COTAÇÕES",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("#cotacoes") })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "AVISOS",
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("#cotacoesAvisos") })],
          }),
        ],
      },
    ],
  })
  return doc
}

function createJustificativaTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "JUSTIFICATIVA DE DISPENSA DE LICITAÇÃO",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: ", bold: true }), new TextRun({ text: placeholder("projeto") })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Rubrica: ", bold: true }), new TextRun({ text: placeholder("rubrica") })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Descrição: ", bold: true }),
              new TextRun({ text: placeholder("descricao") }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Valor: ", bold: true }), new TextRun({ text: placeholder("valor") })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "JUSTIFICATIVA",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("justificativa") })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "OBJETO",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("objeto") })],
          }),
        ],
      },
    ],
  })
  return doc
}

async function saveDocument(doc, filePath, fileName) {
  try {
    console.log(`[autoCreateTemplates] 🔄 Criando: ${fileName}`)
    console.log(`[autoCreateTemplates] 📁 Diretório: ${filePath}`)

    if (!fs.existsSync(filePath)) {
      console.log(`[autoCreateTemplates] 📂 Criando diretório: ${filePath}`)
      fs.mkdirSync(filePath, { recursive: true })
    }

    const buffer = await Packer.toBuffer(doc)
    const fullPath = path.join(filePath, fileName)

    console.log(`[autoCreateTemplates] 💾 Salvando em: ${fullPath}`)
    fs.writeFileSync(fullPath, buffer)

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      console.log(`[autoCreateTemplates] ✅ Template criado com sucesso: ${fileName} (${stats.size} bytes)`)
      return true
    } else {
      console.error(`[autoCreateTemplates] ❌ Arquivo não foi criado: ${fullPath}`)
      return false
    }
  } catch (error) {
    console.error(`[autoCreateTemplates] ❌ Erro ao criar ${fileName}:`, error.message)
    console.error(`[autoCreateTemplates] Stack trace:`, error.stack)
    return false
  }
}

function templateExists(filePath, fileName) {
  const fullPath = path.join(filePath, fileName)
  const exists = fs.existsSync(fullPath)
  console.log(`[autoCreateTemplates] Verificando ${fileName}: ${exists ? "✓ existe" : "✗ não existe"}`)
  return exists
}

export async function ensureTemplatesExist() {
  console.log("[autoCreateTemplates] ========================================")
  console.log("[autoCreateTemplates] Iniciando verificação de templates...")
  console.log("[autoCreateTemplates] ========================================")
  console.log(`[autoCreateTemplates] Diretório base: ${TEMPLATES_DIR}`)

  const dirs = [TEMPLATES_DIR, FOLHA_DIR, MAPA_DIR, DISPENSA_DIR]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.log(`[autoCreateTemplates] 📂 Criando diretório: ${dir}`)
      try {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`[autoCreateTemplates] ✅ Diretório criado: ${dir}`)
      } catch (error) {
        console.error(`[autoCreateTemplates] ❌ Erro ao criar diretório ${dir}:`, error.message)
      }
    } else {
      console.log(`[autoCreateTemplates] ✓ Diretório existe: ${dir}`)
    }
  }

  const templates = [
    { dir: FOLHA_DIR, name: "folha_rosto_edge.docx", create: () => createFolhaRostoTemplate("edge") },
    { dir: FOLHA_DIR, name: "folha_rosto_vertex.docx", create: () => createFolhaRostoTemplate("vertex") },
    { dir: MAPA_DIR, name: "mapa_edge.docx", create: () => createMapaCotacoesTemplate("edge") },
    { dir: MAPA_DIR, name: "mapa_vertex.docx", create: () => createMapaCotacoesTemplate("vertex") },
    { dir: DISPENSA_DIR, name: "justificativa_dispensa.docx", create: () => createJustificativaTemplate() },
  ]

  let created = 0
  let checked = 0
  let failed = 0

  for (const template of templates) {
    checked++
    const fullPath = path.join(template.dir, template.name)

    console.log(`[autoCreateTemplates] ----------------------------------------`)
    console.log(`[autoCreateTemplates] Verificando template ${checked}/${templates.length}: ${template.name}`)

    if (!templateExists(template.dir, template.name)) {
      console.log(`[autoCreateTemplates] ⚠️  Template ausente, criando...`)

      try {
        const doc = template.create()
        const success = await saveDocument(doc, template.dir, template.name)

        if (success) {
          created++
          console.log(`[autoCreateTemplates] ✅ Template criado: ${template.name}`)
        } else {
          failed++
          console.error(`[autoCreateTemplates] ❌ Falha ao criar: ${template.name}`)
        }
      } catch (error) {
        failed++
        console.error(`[autoCreateTemplates] ❌ Erro ao criar ${template.name}:`, error.message)
        console.error(`[autoCreateTemplates] Stack:`, error.stack)
      }
    } else {
      console.log(`[autoCreateTemplates] ✓ Template já existe: ${template.name}`)
    }
  }

  console.log(`[autoCreateTemplates] ========================================`)
  console.log(`[autoCreateTemplates] Verificação concluída:`)
  console.log(`[autoCreateTemplates]   - Templates verificados: ${checked}`)
  console.log(`[autoCreateTemplates]   - Templates criados: ${created}`)
  console.log(`[autoCreateTemplates]   - Falhas: ${failed}`)
  console.log(`[autoCreateTemplates] ========================================`)

  if (created > 0) {
    console.log(`[autoCreateTemplates] ✅ ${created} template(s) criado(s) com sucesso`)
  }

  if (failed > 0) {
    console.error(`[autoCreateTemplates] ⚠️  ${failed} template(s) falharam ao ser criados`)
  }

  return created
}
