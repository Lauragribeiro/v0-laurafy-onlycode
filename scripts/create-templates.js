// scripts/create-templates.js
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  WidthType,
} from "docx"
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

function placeholder(name) {
  return `{{${name}}}`
}

function createFolhaRostoTemplate(instituicao) {
  const isEdge = instituicao.toLowerCase() === "edge"

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho da instituição
          new Paragraph({
            text: isEdge ? "EDGE CAPITAL" : "VERTEX - Instituto de Tecnologia e Inovação",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),

          // Informações do projeto
          new Paragraph({
            children: [
              new TextRun({ text: "Instituição Executora: ", bold: true }),
              new TextRun({ text: placeholder("instituicao") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "CNPJ: ", bold: true }),
              new TextRun({ text: placeholder("cnpj_instituicao") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Termo de Parceria nº: ", bold: true }),
              new TextRun({ text: placeholder("termo_parceria") }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Projeto: ", bold: true }),
              new TextRun({ text: placeholder("projeto_nome") }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Prestação de Contas: ", bold: true }),
              new TextRun({ text: placeholder("pc_numero") }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Natureza de Dispêndio
          new Paragraph({
            children: [new TextRun({ text: "Natureza de Dispêndio", bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("rubrica") })],
          }),
          new Paragraph({ text: "" }),

          // Tabela de dados
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Cabeçalho da tabela
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Favorecido", bold: true })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "CNPJ OU CPF", bold: true })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Nº Extrato", bold: true })],
                  }),
                ],
              }),
              // Linha de dados
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("favorecido") })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("cnpj") })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("n_extrato") })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Segunda tabela
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Cabeçalho
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "NF/ND", bold: true })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Data de emissão da NF/ND", bold: true })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Data do pagamento", bold: true })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Valor", bold: true })],
                  }),
                ],
              }),
              // Linha de dados
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("nf_recibo") })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("data_emissao") })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("data_pagamento") })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("valor_pago") })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          // Lista de documentos necessários
          new Paragraph({
            children: [new TextRun({ text: "● Mapa de cotação ou justificativa para dispensa" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "● 3 propostas" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "● Contrato (se houver)" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "● Notas fiscais ou Invoice" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "● Comprovante de pagamento" })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          // Rodapé para VERTEX
          ...(isEdge
            ? []
            : [
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                  text: "VERTEX - Instituto de Tecnologia e Inovação",
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  text: "Rua Melo Póvoas, 110 - Centro de Inovação do Jaraguá, Sala 113",
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  text: "Maceió, Alagoas",
                  alignment: AlignmentType.CENTER,
                }),
              ]),
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
