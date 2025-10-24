# wireframesoftexv0deploy

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/pedroivodesouza-3996s-projects/v0-wireframesoftexv0deploy)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/bcNvfhMxzwl)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/pedroivodesouza-3996s-projects/v0-wireframesoftexv0deploy](https://vercel.com/pedroivodesouza-3996s-projects/v0-wireframesoftexv0deploy)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/bcNvfhMxzwl](https://v0.app/chat/projects/bcNvfhMxzwl)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

---

## ⚠️ Configuração Necessária: Templates de Documentos

### Problema Atual

O sistema está retornando erro **404 (Template não encontrado)** porque os arquivos `.docx` necessários não estão presentes no diretório `src/templates/`.

### ✨ Solução Automática (RECOMENDADO)

**Execute este comando para criar todos os templates automaticamente:**

\`\`\`bash
npm run create-templates
\`\`\`

Este script criará todos os 7 templates .docx necessários com os placeholders corretos. Após executar, reinicie o servidor e tudo funcionará normalmente.

### Solução Manual

1. **Verifique os templates ausentes:**
   \`\`\`bash
   npm run check-templates
   \`\`\`

2. **Adicione os arquivos .docx nas pastas corretas:**
   - `src/templates/folha_rosto/` - Templates de Folha de Rosto
   - `src/templates/mapa/` - Templates de Mapa de Cotação
   - `src/templates/dispensa/` - Template de Justificativa

3. **Consulte a documentação detalhada:**
   - Leia `src/templates/README.md` para lista completa de templates
   - Cada subpasta tem um README.md com especificações das variáveis

### Templates Necessários

#### Folha de Rosto (`src/templates/folha_rosto/`)
- `folha_rosto_edge.docx`
- `folha_rosto_vertex.docx`
- `custos_incorridos_edge.docx`
- `custos_incorridos_vertex.docx`

#### Mapa de Cotação (`src/templates/mapa/`)
- `mapa_edge.docx`
- `mapa_vertex.docx`

#### Justificativa (`src/templates/dispensa/`)
- `justificativa_dispensa.docx`

### Como Criar os Templates Manualmente

1. Crie um documento Word (.docx) com o layout desejado
2. Insira variáveis usando a sintaxe `{nome_variavel}`
3. Para loops (propostas), use a sintaxe do docxtemplater
4. Salve na pasta correspondente com o nome exato

**Documentação completa:** Consulte `src/templates/README.md` para lista de variáveis e estrutura de cada template.

### Restauração de Backup

Se você tinha os templates anteriormente e eles foram perdidos:
- Restaure de um backup do projeto
- Ou entre em contato com o administrador do sistema
- Ou recrie os templates seguindo a documentação em `src/templates/`

---

## Scripts Disponíveis

- `npm start` - Inicia o servidor de produção
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run check-templates` - Verifica templates ausentes
- `npm run create-templates` - **Cria todos os templates automaticamente** ✨
- `npm test` - Executa testes

## Estrutura do Projeto

\`\`\`
wireframesoftexv0deploy/
├── src/
│   ├── templates/          # ⚠️ Templates .docx necessários
│   │   ├── folha_rosto/
│   │   ├── mapa/
│   │   └── dispensa/
│   ├── generateDocs.js     # Geração de documentos
│   └── utils/
├── public/
│   └── docfin.js          # Frontend
├── data/
│   ├── uploads/           # Arquivos enviados
│   ├── projects.json
│   ├── purchases.json
│   └── vendors.json
├── scripts/
│   ├── check-templates.js # Script de verificação
│   └── create-templates.js # Script de criação automática ✨
└── server.js              # Servidor Express
\`\`\`

## Início Rápido

1. **Instale as dependências:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Crie os templates automaticamente:**
   \`\`\`bash
   npm run create-templates
   \`\`\`

3. **Inicie o servidor:**
   \`\`\`bash
   npm start
   \`\`\`

4. **Acesse o sistema:**
   - Abra seu navegador em `http://localhost:3000`
   - Os botões de gerar documentos agora funcionarão normalmente

---

*Built with ❤️ using [v0.app](https://v0.app)*
