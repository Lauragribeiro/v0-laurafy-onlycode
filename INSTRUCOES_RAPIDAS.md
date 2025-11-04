# Instruções Rápidas - Corrigir Templates

## Se os documentos gerados estão incorretos:

### 1. Recriar templates (no diretório do projeto)

\`\`\`bash
cd /home/laura/v0-laurafy-onlycode
npm run generate-templates
\`\`\`

### 2. Verificar se foram criados corretamente

\`\`\`bash
npm run verify-templates
\`\`\`

### 3. Reiniciar o servidor

\`\`\`bash
# Parar o servidor (Ctrl+C se estiver rodando)
npm start
\`\`\`

### 4. Testar no navegador

Acesse http://localhost:3000 e tente gerar uma Folha de Rosto ou Mapa de Cotação.

## Observar os logs

Quando o servidor iniciar, você deve ver:

\`\`\`
[autoCreateTemplates] ✅ EXISTE folha_rosto_edge.docx (XXXXX bytes)
[autoCreateTemplates] ✅ EXISTE folha_rosto_vertex.docx (XXXXX bytes)
[autoCreateTemplates] ✅ EXISTE mapa_edge.docx (XXXXX bytes)
[autoCreateTemplates] ✅ EXISTE mapa_vertex.docx (XXXXX bytes)
\`\`\`

Quando gerar um documento, você deve ver:

\`\`\`
[FOLHA ROSTO] Template path: .../folha_rosto_edge.docx
[FOLHA ROSTO] Template exists: true
[FOLHA ROSTO] Dados para template: { instituicao: 'EDGE', ... }
\`\`\`

## Problemas?

Consulte o arquivo `TROUBLESHOOTING_TEMPLATES.md` para soluções detalhadas.
