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
  return `{${name}}`
}

function createFolhaRostoTemplate(instituicao) {
  const isVertex = instituicao.toLowerCase() === "vertex"

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho VERTEX (se aplicável)
          ...(isVertex
            ? [
                new Paragraph({
                  text: "VERTEX - Instituto de Tecnologia e Inovação",
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  text: "Rua Melo Póvoas, 110 - Centro de Inovação do Jaraguá, Sala 113",
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  text: "Maceió, Alagoas",
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
              ]
            : []),

          // Informações do projeto
          new Paragraph({
            children: [
              new TextRun({ text: "Instituição Executora: ", bold: true }),
              new TextRun({ text: placeholder("instituicao") }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "CNPJ: ", bold: true }), new TextRun({ text: "  " })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Termo de Parceria nº: ", bold: true }),
              new TextRun({ text: placeholder("projeto_codigo") }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Projeto: ", bold: true }),
              new TextRun({ text: placeholder("projeto_nome") }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Prestação de Contas: ", bold: true }),
              new TextRun({ text: placeholder("pc_numero") }),
            ],
            spacing: { after: 300 },
          }),

          // Natureza de Dispêndio
          new Paragraph({
            children: [new TextRun({ text: "Natureza de Dispêndio", bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("rubrica") })],
            spacing: { after: 200 },
          }),

          // Primeira tabela: Favorecido, CNPJ, Nº Extrato
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Favorecido", bold: true })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "CNPJ OU CPF", bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Nº Extrato", bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
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

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Segunda tabela: NF/ND, Datas, Valor
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "NF/ND", bold: true })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Data de emissão da NF/ND", bold: true })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Data do pagamento", bold: true })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Valor", bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
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

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Lista de documentos necessários
          new Paragraph({
            children: [new TextRun({ text: "● Mapa de cotação ou justificativa para dispensa" })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "● 3 propostas" })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "● Contrato (se houver)" })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "● Notas fiscais ou Invoice" })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "● Comprovante de pagamento" })],
            spacing: { after: 400 },
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
  const isVertex = instituicao.toLowerCase() === "vertex"

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho VERTEX (se aplicável)
          ...(isVertex
            ? [
                new Paragraph({
                  text: "VERTEX - Instituto de Tecnologia e Inovação",
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  text: "Rua Melo Póvoas, 110 - Centro de Inovação do Jaraguá, Sala 113",
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  text: "Maceió, Alagoas",
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
              ]
            : []),

          // Título
          new Paragraph({
            text: "MAPA DE COTAÇÃO",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Informações do projeto
          new Paragraph({
            children: [
              new TextRun({ text: "Instituição Executora: ", bold: true }),
              new TextRun({ text: placeholder("instituicao") }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "CNPJ: ", bold: true }), new TextRun({ text: "  " })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Termo de Parceria nº: ", bold: true }),
              new TextRun({ text: isVertex ? placeholder("codigo_projeto") : placeholder("termo_parceria") }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Projeto: ", bold: true }),
              new TextRun({ text: isVertex ? placeholder("projeto") : placeholder("projeto_nome") }),
            ],
            spacing: { after: 300 },
          }),

          // Natureza de Dispêndio
          new Paragraph({
            children: [
              new TextRun({ text: "Natureza de Dispêndio: ", bold: true }),
              new TextRun({ text: isVertex ? placeholder("rubrica") : placeholder("natureza_disp") }),
            ],
            spacing: { after: 200 },
          }),

          // Objeto da cotação
          new Paragraph({
            children: [new TextRun({ text: "Objeto da cotação", bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("objeto") })],
            spacing: { after: 300 },
          }),

          // Título da tabela de propostas
          new Paragraph({
            children: [new TextRun({ text: "Propostas", bold: true })],
            spacing: { after: 100 },
          }),

          // Tabela de propostas
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "SELEÇÃO", bold: true })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "OFERTANTE", bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "CNPJ / CPF", bold: true })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "DATA DA COTAÇÃO", bold: true })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "VALOR", bold: true })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // Placeholder para loop de propostas
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: placeholder("#propostas") })],
                    columnSpan: 5,
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // Data da Aquisição
          new Paragraph({
            children: [
              new TextRun({ text: "Data da Aquisição: ", bold: true }),
              new TextRun({ text: placeholder("data_aquisicao") }),
            ],
            spacing: { after: 200 },
          }),

          // Justificativa da seleção
          new Paragraph({
            children: [new TextRun({ text: "Justificativa da seleção", bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: placeholder("justificativa") })],
            spacing: { after: 400 },
          }),

          // Data e local
          new Paragraph({
            children: [
              new TextRun({
                text: isVertex
                  ? `${placeholder("localidade")}, ${placeholder("dia")} de ${placeholder("mes")} de ${placeholder("ano")}`
                  : placeholder("local_data"),
              }),
            ],
            spacing: { after: 400 },
          }),

          // Assinatura
          new Paragraph({
            text: "_______________________________",
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: isVertex ? placeholder("coordenador") : placeholder("coordenador_nome") })],
            alignment: AlignmentType.CENTER,
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
