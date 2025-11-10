// Teste rápido de sintaxe para encontrar o erro no server.js
import fs from "fs"

try {
  const code = fs.readFileSync("server.js", "utf-8")

  // Tenta avaliar a sintaxe
  new Function(code)

  console.log("✅ Sintaxe do server.js está correta!")
} catch (error) {
  console.error("❌ Erro de sintaxe encontrado:")
  console.error(error.message)
  console.error("\nLinha do erro:", error.lineNumber || "desconhecido")
  console.error("\nStack:", error.stack)
}
