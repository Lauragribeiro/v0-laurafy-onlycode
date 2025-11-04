const fs = require("fs")
const path = require("path")
const {
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
} = require("docx")

// Função auxiliar para criar placeholders que o docxtemplater reconhece
function createPlaceholderText(placeholder) {
  return new TextRun({
    text: `{{${placeholder}}}`,
    font: "Arial",
  })
}

// Função para criar tabela com bordas
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

// Função para criar loops do docxtemplater corretamente
function createLoopPlaceholder(arrayName, content) {
  return [
    new TextRun({ text: `{{#${arrayName}}}`, font: "Arial" }),
    ...content,
    new TextRun({ text: `{{/${arrayName}}}`, font: "Arial" }),
  ]
}

// FOLHA DE ROSTO - EDGE
function createFolhaRostoEdge() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho
          new Paragraph({
            text: "EDGE CAPITAL",
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "FOLHA DE ROSTO",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Informações do projeto
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

          // Natureza de Dispêndio
          new Paragraph({
            text: "Natureza de Dispêndio",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("rubrica")],
            spacing: { after: 400 },
          }),

          // Tabela 1: Favorecido, CNPJ, Nº Extrato
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

          // Tabela 2: NF/ND, Datas, Valor
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

          // Lista de documentos
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

// FOLHA DE ROSTO - VERTEX
function createFolhaRostoVertex() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho VERTEX
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

          // Informações do projeto
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

          // Natureza de Dispêndio
          new Paragraph({
            text: "Natureza de Dispêndio",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [createPlaceholderText("rubrica")],
            spacing: { after: 400 },
          }),

          // Tabela 1
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

          // Tabela 2
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

          // Lista de documentos
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

// MAPA DE COTAÇÃO - EDGE
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
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "{{#propostas}}", font: "Arial" }),
                        createPlaceholderText("selecao"),
                      ],
                    }),
                  ],
                }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("cnpj_ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_cotacao")] })] }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        createPlaceholderText("valor"),
                        new TextRun({ text: "{{/propostas}}", font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ]),

          new Paragraph({ text: "", spacing: { after: 400 } }),

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

// MAPA DE COTAÇÃO - VERTEX
function createMapaCotacaoVertex() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho VERTEX
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
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "{{#propostas}}", font: "Arial" }),
                        createPlaceholderText("selecao"),
                      ],
                    }),
                  ],
                }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("cnpj_ofertante")] })] }),
                new TableCell({ children: [new Paragraph({ children: [createPlaceholderText("data_cotacao")] })] }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        createPlaceholderText("valor"),
                        new TextRun({ text: "{{/propostas}}", font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ]),

          new Paragraph({ text: "", spacing: { after: 400 } }),

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

// Função principal
async function generateAllTemplates() {
  const templatesDir = path.join(__dirname, "..", "src", "templates")

  // Criar diretórios
  const dirs = [path.join(templatesDir, "folha_rosto"), path.join(templatesDir, "mapa")]

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✓ Criado diretório: ${dir}`)
    }
  })

  // Gerar templates
  const templates = [
    { name: "folha_rosto_edge.docx", path: path.join(templatesDir, "folha_rosto"), doc: createFolhaRostoEdge() },
    { name: "folha_rosto_vertex.docx", path: path.join(templatesDir, "folha_rosto"), doc: createFolhaRostoVertex() },
    { name: "mapa_edge.docx", path: path.join(templatesDir, "mapa"), doc: createMapaCotacaoEdge() },
    { name: "mapa_vertex.docx", path: path.join(templatesDir, "mapa"), doc: createMapaCotacaoVertex() },
  ]

  for (const template of templates) {
    const buffer = await Packer.toBuffer(template.doc)
    const filePath = path.join(template.path, template.name)
    fs.writeFileSync(filePath, buffer)
    console.log(`✓ Criado template: ${filePath}`)
  }

  console.log("\n✅ Todos os templates foram criados com sucesso!")
  console.log("📁 Localização: src/templates/")
  console.log("\n🚀 Reinicie o servidor para usar os novos templates.")
}

// Executar
generateAllTemplates().catch(console.error)
