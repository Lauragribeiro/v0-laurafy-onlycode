import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const TEMPLATES_DIR = path.join(rootDir, "src", "templates")

function verifyTemplate(templatePath, templateName) {
  console.log(`\n========================================`)
  console.log(`Verificando: ${templateName}`)
  console.log(`========================================`)

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template não existe: ${templatePath}`)
    return false
  }

  const stats = fs.statSync(templatePath)
  console.log(`✅ Arquivo existe (${stats.size} bytes)`)

  try {
    const content = fs.readFileSync(templatePath, "binary")
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    const tags = doc.getFullText()
    console.log(`\n📄 Conteúdo do template (primeiros 500 caracteres):`)
    console.log(tags.substring(0, 500))

    const placeholders = tags.match(/\{\{[^}]+\}\}/g) || []
    console.log(`\n🏷️  Placeholders encontrados (${placeholders.length}):`)
    placeholders.forEach((p) => console.log(`   - ${p}`))

    const loops = tags.match(/\{\{#[^}]+\}\}/g) || []
    if (loops.length > 0) {
      console.log(`\n🔄 Loops encontrados (${loops.length}):`)
      loops.forEach((l) => console.log(`   - ${l}`))
    }

    console.log(`\n✅ Template válido e pode ser processado pelo docxtemplater`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao verificar template:`, error.message)
    return false
  }
}

console.log(`\n🔍 VERIFICAÇÃO DE TEMPLATES`)
console.log(`Diretório base: ${TEMPLATES_DIR}\n`)

const templates = [
  { path: path.join(TEMPLATES_DIR, "folha_rosto", "folha_rosto_edge.docx"), name: "Folha de Rosto EDGE" },
  { path: path.join(TEMPLATES_DIR, "folha_rosto", "folha_rosto_vertex.docx"), name: "Folha de Rosto VERTEX" },
  { path: path.join(TEMPLATES_DIR, "mapa", "mapa_edge.docx"), name: "Mapa de Cotação EDGE" },
  { path: path.join(TEMPLATES_DIR, "mapa", "mapa_vertex.docx"), name: "Mapa de Cotação VERTEX" },
]

let allValid = true
for (const template of templates) {
  const valid = verifyTemplate(template.path, template.name)
  if (!valid) allValid = false
}

console.log(`\n========================================`)
if (allValid) {
  console.log(`✅ Todos os templates são válidos!`)
} else {
  console.log(`❌ Alguns templates têm problemas`)
  process.exit(1)
}
console.log(`========================================\n`)
