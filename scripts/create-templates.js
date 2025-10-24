// scripts/create-templates.js
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

// Criar diretórios se não existirem
;[TEMPLATES_DIR, FOLHA_DIR, MAPA_DIR, DISPENSA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Função auxiliar para criar placeholders
function placeholder(name) {
  return `{${name}}`
}

// Template: Folha de Rosto
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

// Template: Custos Incorridos
function createCustosIncorridosTemplate(instituicao) {
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
            text: "CUSTOS INCORRIDOS",
            heading: HeadingLevel.HEADING_2,
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
            children: [
              new TextRun({ text: "Valor Total: ", bold: true }),
              new TextRun({ text: placeholder("valor_total") }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "CUSTOS",
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

// Template: Mapa de Cotações
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

// Template: Justificativa de Dispensa
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

// Função para salvar documento
async function saveDocument(doc, filePath, fileName) {
  try {
    const buffer = await Packer.toBuffer(doc)
    const fullPath = path.join(filePath, fileName)
    fs.writeFileSync(fullPath, buffer)
    console.log(`✅ Criado: ${fileName}`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao criar ${fileName}:`, error.message)
    return false
  }
}

// Função principal
async function createAllTemplates() {
  console.log("🚀 Criando templates .docx...\n")

  let successCount = 0
  let totalCount = 0

  // Folhas de Rosto
  console.log("📄 Folhas de Rosto:")
  totalCount++
  if (await saveDocument(createFolhaRostoTemplate("edge"), FOLHA_DIR, "folha_rosto_edge.docx")) successCount++
  totalCount++
  if (await saveDocument(createFolhaRostoTemplate("vertex"), FOLHA_DIR, "folha_rosto_vertex.docx")) successCount++

  // Custos Incorridos
  console.log("\n💰 Custos Incorridos:")
  totalCount++
  if (await saveDocument(createCustosIncorridosTemplate("edge"), FOLHA_DIR, "custos_incorridos_edge.docx"))
    successCount++
  totalCount++
  if (await saveDocument(createCustosIncorridosTemplate("vertex"), FOLHA_DIR, "custos_incorridos_vertex.docx"))
    successCount++

  // Mapas de Cotações
  console.log("\n📊 Mapas de Cotações:")
  totalCount++
  if (await saveDocument(createMapaCotacoesTemplate("edge"), MAPA_DIR, "mapa_edge.docx")) successCount++
  totalCount++
  if (await saveDocument(createMapaCotacoesTemplate("vertex"), MAPA_DIR, "mapa_vertex.docx")) successCount++

  // Justificativa
  console.log("\n📝 Justificativa:")
  totalCount++
  if (await saveDocument(createJustificativaTemplate(), DISPENSA_DIR, "justificativa_dispensa.docx")) successCount++

  console.log(`\n✨ Concluído! ${successCount}/${totalCount} templates criados com sucesso.`)

  if (successCount === totalCount) {
    console.log("\n✅ Todos os templates foram criados!")
    console.log("🎉 Agora você pode gerar documentos normalmente.")
  } else {
    console.log("\n⚠️  Alguns templates não foram criados. Verifique os erros acima.")
  }
}

// Executar
createAllTemplates().catch((error) => {
  console.error("❌ Erro fatal:", error)
  process.exit(1)
})
