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
    const buffer = await Packer.toBuffer(doc)
    const fullPath = path.join(filePath, fileName)
    fs.writeFileSync(fullPath, buffer)
    return true
  } catch (error) {
    console.error(`[autoCreateTemplates] Erro ao criar ${fileName}:`, error.message)
    return false
  }
}

function templateExists(filePath, fileName) {
  return fs.existsSync(path.join(filePath, fileName))
}

export async function ensureTemplatesExist() {
  // Criar diretórios se não existirem
  ;[TEMPLATES_DIR, FOLHA_DIR, MAPA_DIR, DISPENSA_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  const templates = [
    { dir: FOLHA_DIR, name: "folha_rosto_edge.docx", create: () => createFolhaRostoTemplate("edge") },
    { dir: FOLHA_DIR, name: "folha_rosto_vertex.docx", create: () => createFolhaRostoTemplate("vertex") },
    { dir: MAPA_DIR, name: "mapa_edge.docx", create: () => createMapaCotacoesTemplate("edge") },
    { dir: MAPA_DIR, name: "mapa_vertex.docx", create: () => createMapaCotacoesTemplate("vertex") },
    { dir: DISPENSA_DIR, name: "justificativa_dispensa.docx", create: () => createJustificativaTemplate() },
  ]

  let created = 0
  for (const template of templates) {
    if (!templateExists(template.dir, template.name)) {
      console.log(`[autoCreateTemplates] Criando template ausente: ${template.name}`)
      const doc = template.create()
      if (await saveDocument(doc, template.dir, template.name)) {
        created++
      }
    }
  }

  if (created > 0) {
    console.log(`[autoCreateTemplates] ✅ ${created} template(s) criado(s) automaticamente`)
  }

  return created
}
