// src/autoCreateTemplates.js
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
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

console.log("[autoCreateTemplates] Módulo carregado")
console.log("[autoCreateTemplates] TEMPLATES_DIR:", TEMPLATES_DIR)

function createPlaceholderText(placeholder) {
  return new TextRun({
    text: `{{${placeholder}}}`,
    font: "Arial",
  })
}

function createTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: rows,
  })
}

function createFolhaRostoEdge() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Instituição Executora: " }), createPlaceholderText("instituicao")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "CNPJ:",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Termo de Parceria nº: " }), createPlaceholderText("projeto_codigo")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: " }), createPlaceholderText("projeto_nome")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Prestação de Contas: " }), createPlaceholderText("pc_numero")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Natureza de Dispêndio",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("rubrica")],
            spacing: { after: 400 },
          }),

          createTable([
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Favorecido")] }),
                new TableCell({ children: [new Paragraph("CNPJ OU CPF")] }),
                new TableCell({ children: [new Paragraph("Nº Extrato")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("favorecido")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("cnpj")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("n_extrato")] })] }),
              ],
            }),
          ]),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          createTable([
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("NF/ND")] }),
                new TableCell({ children: [new Paragraph("Data de emissão da NF/ND")] }),
                new TableCell({ children: [new Paragraph("Data do pagamento")] }),
                new TableCell({ children: [new Paragraph("Valor")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("nf_recibo")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_emissao")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_pagamento")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("valor_pago")] })] }),
              ],
            }),
          ]),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          new Paragraph({ text: "● Mapa de cotação ou justificativa para dispensa" }),
          new Paragraph({ text: "● 3 propostas" }),
          new Paragraph({ text: "● Contrato (se houver)" }),
          new Paragraph({ text: "● Notas fiscais ou Invoice" }),
          new Paragraph({ text: "● Comprovante de pagamento" }),
        ],
      },
    ],
  })

  return doc
}

function createFolhaRostoVertex() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "VERTEX - Instituto de Tecnologia e Inovação",
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Rua Melo Póvoas, 110 - Centro de Inovação do Jaraguá, Sala 113",
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Maceió, Alagoas",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Instituição Executora: " }), createPlaceholderText("instituicao")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "CNPJ:",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Termo de Parceria nº: " }), createPlaceholderText("projeto_codigo")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: " }), createPlaceholderText("projeto_nome")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Prestação de Contas: " }), createPlaceholderText("pc_numero")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Natureza de Dispêndio",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("rubrica")],
            spacing: { after: 400 },
          }),

          createTable([
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Favorecido")] }),
                new TableCell({ children: [new Paragraph("CNPJ OU CPF")] }),
                new TableCell({ children: [new Paragraph("Nº Extrato")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("favorecido")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("cnpj")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("n_extrato")] })] }),
              ],
            }),
          ]),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          createTable([
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("NF/ND")] }),
                new TableCell({ children: [new Paragraph("Data de emissão da NF/ND")] }),
                new TableCell({ children: [new Paragraph("Data do pagamento")] }),
                new TableCell({ children: [new Paragraph("Valor")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("nf_recibo")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_emissao")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_pagamento")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("valor_pago")] })] }),
              ],
            }),
          ]),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          new Paragraph({ text: "● Mapa de cotação ou justificativa para dispensa" }),
          new Paragraph({ text: "● 3 propostas" }),
          new Paragraph({ text: "● Contrato (se houver)" }),
          new Paragraph({ text: "● Notas fiscais ou Invoice" }),
          new Paragraph({ text: "● Comprovante de pagamento" }),
        ],
      },
    ],
  })

  return doc
}

function createMapaCotacaoEdge() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "MAPA DE COTAÇÃO",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Instituição Executora: " }), createPlaceholderText("instituicao")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "CNPJ:",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Termo de Parceria nº: " }), createPlaceholderText("termo_parceria")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: " }), createPlaceholderText("projeto_nome")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Natureza de Dispêndio: " }), createPlaceholderText("natureza_disp")],
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Objeto da cotação",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("objeto")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Propostas",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "{{#propostas}}",
            spacing: { after: 0 },
          }),

          createTable([
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("SELEÇÃO")] }),
                new TableCell({ children: [new Paragraph("OFERTANTE")] }),
                new TableCell({ children: [new Paragraph("CNPJ / CPF")] }),
                new TableCell({ children: [new Paragraph("DATA DA COTAÇÃO")] }),
                new TableCell({ children: [new Paragraph("VALOR")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("selecao")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("cnpj_ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_cotacao")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("valor")] })] }),
              ],
            }),
          ]),

          new Paragraph({
            text: "{{/propostas}}",
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Data da Aquisição: " }), createPlaceholderText("data_aquisicao")],
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Justificativa da seleção",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("justificativa")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [createPlaceholderText("local_data")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "_______________________________",
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [createPlaceholderText("coordenador_nome")],
          }),
        ],
      },
    ],
  })

  return doc
}

function createMapaCotacaoVertex() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "VERTEX - Instituto de Tecnologia e Inovação",
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Rua Melo Póvoas, 110 - Centro de Inovação do Jaraguá, Sala 113",
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Maceió, Alagoas",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "MAPA DE COTAÇÃO",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Instituição Executora: " }), createPlaceholderText("instituicao")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "CNPJ:",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Termo de Parceria nº: " }), createPlaceholderText("codigo_projeto")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: " }), createPlaceholderText("projeto")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Natureza de Dispêndio: " }), createPlaceholderText("rubrica")],
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Objeto da cotação",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("objeto")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Propostas",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "{{#propostas}}",
            spacing: { after: 0 },
          }),

          createTable([
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("SELEÇÃO")] }),
                new TableCell({ children: [new Paragraph("OFERTANTE")] }),
                new TableCell({ children: [new Paragraph("CNPJ / CPF")] }),
                new TableCell({ children: [new Paragraph("DATA DA COTAÇÃO")] }),
                new TableCell({ children: [new Paragraph("VALOR")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("selecao")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("cnpj_ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_cotacao")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("valor")] })] }),
              ],
            }),
          ]),

          new Paragraph({
            text: "{{/propostas}}",
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "Data da Aquisição: " }), createPlaceholderText("data_aquisicao")],
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Justificativa da seleção",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("justificativa")],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              createPlaceholderText("localidade"),
              new TextRun(", "),
              createPlaceholderText("dia"),
              new TextRun(" de "),
              createPlaceholderText("mes"),
              new TextRun(" de "),
              createPlaceholderText("ano"),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "_______________________________",
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [createPlaceholderText("coordenador")],
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
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Projeto: " }), createPlaceholderText("projeto")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Rubrica: " }), createPlaceholderText("rubrica")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Objeto: " }), createPlaceholderText("objeto")],
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: "JUSTIFICATIVA",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("justificativa")],
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
  console.log("[autoCreateTemplates] 🚀 Iniciando verificação de templates...")
  console.log("[autoCreateTemplates] ========================================")
  console.log(`[autoCreateTemplates] 📁 Diretório base: ${TEMPLATES_DIR}`)

  const dirs = [TEMPLATES_DIR, FOLHA_DIR, MAPA_DIR, DISPENSA_DIR]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.log(`[autoCreateTemplates] 📂 Criando diretório: ${dir}`)
      try {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`[autoCreateTemplates] ✅ Diretório criado: ${dir}`)
      } catch (error) {
        console.error(`[autoCreateTemplates] ❌ Erro ao criar diretório ${dir}:`, error.message)
        return 0
      }
    } else {
      console.log(`[autoCreateTemplates] ✓ Diretório existe: ${dir}`)
    }
  }

  const templates = [
    { dir: FOLHA_DIR, name: "folha_rosto_edge.docx", create: () => createFolhaRostoEdge() },
    { dir: FOLHA_DIR, name: "folha_rosto_vertex.docx", create: () => createFolhaRostoVertex() },
    { dir: MAPA_DIR, name: "mapa_edge.docx", create: () => createMapaCotacaoEdge() },
    { dir: MAPA_DIR, name: "mapa_vertex.docx", create: () => createMapaCotacaoVertex() },
    { dir: DISPENSA_DIR, name: "justificativa_dispensa.docx", create: () => createJustificativaTemplate() },
  ]

  let created = 0
  let checked = 0
  let failed = 0

  for (const template of templates) {
    checked++
    const fullPath = path.join(template.dir, template.name)

    console.log(`[autoCreateTemplates] ----------------------------------------`)
    console.log(`[autoCreateTemplates] 🔍 Verificando template ${checked}/${templates.length}: ${template.name}`)

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
  console.log(`[autoCreateTemplates] 📊 Verificação concluída:`)
  console.log(`[autoCreateTemplates]   - Templates verificados: ${checked}`)
  console.log(`[autoCreateTemplates]   - Templates criados: ${created}`)
  console.log(`[autoCreateTemplates]   - Falhas: ${failed}`)
  console.log(`[autoCreateTemplates] ========================================`)

  console.log(`[autoCreateTemplates] 📋 Listando templates críticos:`)
  const criticalTemplates = [
    path.join(FOLHA_DIR, "folha_rosto_edge.docx"),
    path.join(FOLHA_DIR, "folha_rosto_vertex.docx"),
    path.join(MAPA_DIR, "mapa_edge.docx"),
    path.join(MAPA_DIR, "mapa_vertex.docx"),
  ]

  for (const templatePath of criticalTemplates) {
    const exists = fs.existsSync(templatePath)
    const status = exists ? "✅ EXISTE" : "❌ AUSENTE"
    const size = exists ? `(${fs.statSync(templatePath).size} bytes)` : ""
    console.log(`[autoCreateTemplates]   ${status} ${path.basename(templatePath)} ${size}`)
  }

  if (created > 0) {
    console.log(`[autoCreateTemplates] ✅ ${created} template(s) criado(s) com sucesso`)
  }

  if (failed > 0) {
    console.error(`[autoCreateTemplates] ⚠️  ${failed} template(s) falharam ao ser criados`)
  }

  console.log(`[autoCreateTemplates] ========================================`)

  return created
}
