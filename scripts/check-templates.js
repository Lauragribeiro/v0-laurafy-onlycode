// scripts/check-templates.js
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const REQUIRED_TEMPLATES = {
  folha_rosto: [
    "folha_rosto_edge.docx",
    "folha_rosto_vertex.docx",
    "custos_incorridos_edge.docx",
    "custos_incorridos_vertex.docx",
  ],
  mapa: ["mapa_edge.docx", "mapa_vertex.docx"],
  dispensa: ["justificativa_dispensa.docx"],
}

console.log("🔍 Verificando templates necessários...\n")

let allPresent = true
let missingCount = 0

for (const [folder, files] of Object.entries(REQUIRED_TEMPLATES)) {
  const folderPath = path.join(rootDir, "src", "templates", folder)

  console.log(`📁 ${folder}/`)

  // Verifica se a pasta existe
  if (!fs.existsSync(folderPath)) {
    console.log(`   ⚠️  Pasta não existe: ${folderPath}`)
    console.log(`   Criando pasta...`)
    fs.mkdirSync(folderPath, { recursive: true })
    console.log(`   ✅ Pasta criada\n`)
  }

  // Verifica cada arquivo
  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const exists = fs.existsSync(filePath)

    if (exists) {
      const stats = fs.statSync(filePath)
      const sizeKB = (stats.size / 1024).toFixed(2)
      console.log(`   ✅ ${file} (${sizeKB} KB)`)
    } else {
      console.log(`   ❌ ${file} - AUSENTE`)
      allPresent = false
      missingCount++
    }
  }

  console.log("")
}

console.log("═".repeat(60))

if (allPresent) {
  console.log("✅ Todos os templates estão presentes!")
} else {
  console.log(`❌ ${missingCount} template(s) ausente(s)`)
  console.log("\n📋 Próximos passos:")
  console.log("   1. Adicione os arquivos .docx ausentes nas pastas correspondentes")
  console.log("   2. Consulte os arquivos README.md em cada pasta para detalhes")
  console.log("   3. Execute este script novamente para verificar")
  console.log("\n💡 Dica: Os templates devem ser arquivos Word (.docx) válidos")
  console.log("   com as variáveis corretas conforme documentação.")
}

console.log("═".repeat(60))

process.exit(allPresent ? 0 : 1)
