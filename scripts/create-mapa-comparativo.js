// Script para criar template de Mapa de Cotação como Quadro Comparativo
// Estrutura: Informações gerais (uma vez) + Tabela comparativa (múltiplas linhas)
// Formatação profissional de documento oficial

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
  BorderStyle,
  ShadingType,
  UnderlineType,
} from "docx"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const MAPA_DIR = path.join(rootDir, "src", "templates", "mapa")
const ASSETS_DIR = path.join(rootDir, "public", "assets")

// Função para criar placeholder
function placeholder(name) {
  return `{{${name}}}`
}

// Função para criar template EDGE como Quadro Comparativo
function createMapaEdgeComparativo() {
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: "portrait",
              width: 11906, // A4 width in twips (21cm)
              height: 16838, // A4 height in twips (29.7cm)
            },
            margins: {
              top: 1440, // 2.54cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // ===== CABEÇALHO COM LOGOS (3 logos lado a lado: UFAL, EDGE, PaqTcPB) =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "[Logo UFAL]",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                      }),
                    ],
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    verticalAlign: "center",
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "[Logo EDGE]",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                      }),
                    ],
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    verticalAlign: "center",
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "[Logo PaqTcPB]",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                      }),
                    ],
                    width: { size: 34, type: WidthType.PERCENTAGE },
                    verticalAlign: "center",
                  }),
                ],
              }),
            ],
          }),
          
          new Paragraph({
            text: "",
            spacing: { after: 300 },
          }),
          
          // Título principal - Formatação profissional
          new Paragraph({
            children: [
              new TextRun({
                text: "MAPA DE COTAÇÃO",
                bold: true,
                size: 32, // 16pt
                color: "15365C", // Azul escuro profissional
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600, before: 0 },
          }),

          // ===== INFORMAÇÕES GERAIS (UMA VEZ) - Tabela formatada =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Instituição Executora:",
                            bold: true,
                            size: 22, // 11pt
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("instituicao"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "CNPJ da Executora:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("cnpj_instituicao"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Termo de Parceria nº:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("termo_parceria"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Projeto:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("projeto_nome"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Natureza de Dispêndio:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("natureza_disp"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Objeto da cotação:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("objeto"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 500 } }),

          // ===== TÍTULO DA TABELA COMPARATIVA =====
          new Paragraph({
            children: [
              new TextRun({
                text: "QUADRO COMPARATIVO DE COTAÇÕES",
                bold: true,
                size: 24, // 12pt
                color: "15365C",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300, before: 0 },
          }),

          // ===== TABELA COMPARATIVA (UMA ÚNICA TABELA COM MÚLTIPLAS LINHAS) =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "15365C" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "15365C" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              // Cabeçalho da tabela - Formatação profissional
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "SELEÇÃO",
                            bold: true,
                            size: 20, // 10pt
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 12, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C", // Azul escuro
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "OFERTANTE",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 28, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "CNPJ / CPF",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "DATA DA COTAÇÃO",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "VALOR",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                ],
              }),
              // LINHA DE DADOS COM LOOP - Esta linha será replicada para cada cotação
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "{{#propostas}}" }),
                          new TextRun({
                            text: placeholder("selecao"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("ofertante"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("cnpj_ofertante"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("data_cotacao"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("valor"),
                            size: 20,
                            bold: true,
                          }),
                          new TextRun({ text: "{{/propostas}}" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 500 } }),

          // ===== DATA DA GERAÇÃO DO DOCUMENTO =====
          new Paragraph({
            children: [
              new TextRun({
                text: "Data da Geração do Documento: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: placeholder("data_geracao"),
                size: 22,
              }),
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // ===== ASSINATURA =====
          new Paragraph({
            text: "_______________________________",
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: placeholder("usuario_gerador"),
                size: 22,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  })
}

// Função para criar template VERTEX (similar ao EDGE, mas com logo único)
function createMapaVertexComparativo() {
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: "portrait",
              width: 11906,
              height: 16838,
            },
            margins: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // ===== CABEÇALHO COM LOGO VERTEX (apenas logo do VERTEX) =====
          new Paragraph({
            text: "[Logo VERTEX]",
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Título principal
          new Paragraph({
            children: [
              new TextRun({
                text: "MAPA DE COTAÇÃO",
                bold: true,
                size: 32,
                color: "15365C",
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600, before: 0 },
          }),

          // ===== INFORMAÇÕES GERAIS (UMA VEZ) =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Instituição Executora:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("instituicao"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "CNPJ da Executora:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("cnpj_instituicao"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Termo de Parceria nº:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("termo_parceria"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Projeto:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("projeto_nome"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Natureza de Dispêndio:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("natureza_disp"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Objeto da cotação:",
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                      }),
                    ],
                    shading: {
                      fill: "E3E6ED",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("objeto"),
                            size: 22,
                          }),
                        ],
                        spacing: { after: 120, before: 120 },
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 500 } }),

          // ===== TÍTULO DA TABELA COMPARATIVA =====
          new Paragraph({
            children: [
              new TextRun({
                text: "QUADRO COMPARATIVO DE COTAÇÕES",
                bold: true,
                size: 24,
                color: "15365C",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300, before: 0 },
          }),

          // ===== TABELA COMPARATIVA (UMA ÚNICA TABELA COM MÚLTIPLAS LINHAS) =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "15365C" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "15365C" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              // Cabeçalho da tabela
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "SELEÇÃO",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 12, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "OFERTANTE",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 28, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "CNPJ / CPF",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "DATA DA COTAÇÃO",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "VALOR",
                            bold: true,
                            size: 20,
                            color: "FFFFFF",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "15365C",
                      type: ShadingType.SOLID,
                    },
                  }),
                ],
              }),
              // LINHA DE DADOS COM LOOP
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "{{#propostas}}" }),
                          new TextRun({
                            text: placeholder("selecao"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("ofertante"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("cnpj_ofertante"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("data_cotacao"),
                            size: 20,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: placeholder("valor"),
                            size: 20,
                            bold: true,
                          }),
                          new TextRun({ text: "{{/propostas}}" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100, before: 100 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 500 } }),

          // ===== DATA DA GERAÇÃO DO DOCUMENTO =====
          new Paragraph({
            children: [
              new TextRun({
                text: "Data da Geração do Documento: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: placeholder("data_geracao"),
                size: 22,
              }),
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // ===== ASSINATURA =====
          new Paragraph({
            text: "_______________________________",
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: placeholder("usuario_gerador"),
                size: 22,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  })
}

// Função principal
async function main() {
  console.log("🔧 Criando templates de Mapa de Cotação como Quadro Comparativo...")

  // Criar diretório se não existir
  if (!fs.existsSync(MAPA_DIR)) {
    fs.mkdirSync(MAPA_DIR, { recursive: true })
  }

  // Gerar template EDGE
  console.log("📄 Gerando mapa_edge.docx...")
  const docEdge = createMapaEdgeComparativo()
  const bufferEdge = await Packer.toBuffer(docEdge)
  fs.writeFileSync(path.join(MAPA_DIR, "mapa_edge.docx"), bufferEdge)
  console.log("✅ mapa_edge.docx criado com sucesso!")

  // Gerar template VERTEX
  console.log("📄 Gerando mapa_vertex.docx...")
  const docVertex = createMapaVertexComparativo()
  const bufferVertex = await Packer.toBuffer(docVertex)
  fs.writeFileSync(path.join(MAPA_DIR, "mapa_vertex.docx"), bufferVertex)
  console.log("✅ mapa_vertex.docx criado com sucesso!")

  console.log("\n✨ Templates criados com sucesso!")
  console.log("\n📋 Estrutura do template:")
  console.log("   1. Logo (espaço reservado no topo)")
  console.log("   2. Título: MAPA DE COTAÇÃO (formatado profissionalmente)")
  console.log("   3. Cabeçalho (UMA VEZ) - Tabela formatada:")
  console.log("      - Instituição Executora")
  console.log("      - CNPJ da Executora")
  console.log("      - Termo de Parceria nº")
  console.log("      - Projeto")
  console.log("      - Natureza de Dispêndio")
  console.log("      - Objeto da cotação")
  console.log("   4. Título: QUADRO COMPARATIVO DE COTAÇÕES")
  console.log("   5. Tabela comparativa (UMA ÚNICA TABELA):")
  console.log("      - Cabeçalho: SELEÇÃO | OFERTANTE | CNPJ | DATA DA COTAÇÃO | VALOR")
  console.log("      - Linhas: Uma linha por cotação (Cotação 1, Cotação 2, Cotação 3, etc.)")
  console.log("   6. Data da Geração do Documento")
  console.log("   7. Assinatura: Nome do usuário que gerou o mapa")
  console.log("\n✅ Estrutura correta: Sem repetições, uma única tabela comparativa!")
  console.log("✅ Formatação profissional: Textos justificados, tabelas bonitas, cores oficiais!")
}

main().catch(console.error)
