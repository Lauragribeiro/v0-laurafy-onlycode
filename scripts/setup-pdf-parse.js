// Script para criar estrutura de teste necessária para pdf-parse
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, "..")

const testDir = path.join(rootDir, "test", "data")
const testFile = path.join(testDir, "05-versions-space.pdf")

// Criar diretórios
fs.mkdirSync(testDir, { recursive: true })

// Criar um PDF mínimo válido
const minimalPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
203
%%EOF`

fs.writeFileSync(testFile, minimalPDF, "utf8")

console.log("✓ Estrutura de teste criada com sucesso")
console.log("✓ Arquivo test/data/05-versions-space.pdf criado")
