# Como Gerar os Templates de Documentos

## Problema
O sistema precisa de templates .docx para gerar a Folha de Rosto e o Mapa de Cotação, mas o v0 não aceita upload de arquivos .docx.

## Solução
Criamos um script que gera automaticamente os templates .docx baseados nas especificações fornecidas.

## Passo a Passo

### 1. Navegue até o diretório do projeto
\`\`\`bash
cd /home/laura/v0-laurafy-onlycode
\`\`\`

### 2. Execute o script de geração de templates
\`\`\`bash
npm run generate-templates
\`\`\`

### 3. Verifique se os templates foram criados
\`\`\`bash
ls -la src/templates/folha_rosto/
ls -la src/templates/mapa/
\`\`\`

Você deve ver os seguintes arquivos:
- `src/templates/folha_rosto/folha_rosto_edge.docx`
- `src/templates/folha_rosto/folha_rosto_vertex.docx`
- `src/templates/mapa/mapa_edge.docx`
- `src/templates/mapa/mapa_vertex.docx`

### 4. Reinicie o servidor
\`\`\`bash
npm start
\`\`\`

## Templates Criados

### Folha de Rosto (EDGE e VERTEX)
Contém os seguintes placeholders:
- `{{instituicao}}` - Nome da instituição executora
- `{{projeto_codigo}}` - Código do termo de parceria
- `{{projeto_nome}}` - Nome do projeto
- `{{pc_numero}}` - Número da prestação de contas
- `{{rubrica}}` - Natureza de dispêndio
- `{{favorecido}}` - Nome do favorecido
- `{{cnpj}}` - CNPJ ou CPF do favorecido
- `{{n_extrato}}` - Número do extrato
- `{{nf_recibo}}` - Número da NF/ND
- `{{data_emissao}}` - Data de emissão da NF/ND
- `{{data_pagamento}}` - Data do pagamento
- `{{valor_pago}}` - Valor pago

### Mapa de Cotação (EDGE)
Contém os seguintes placeholders:
- `{{instituicao}}` - Nome da instituição executora
- `{{termo_parceria}}` - Número do termo de parceria
- `{{projeto_nome}}` - Nome do projeto
- `{{natureza_disp}}` - Natureza de dispêndio
- `{{objeto}}` - Objeto da cotação
- `{{#propostas}}...{{/propostas}}` - Loop de propostas
- `{{data_aquisicao}}` - Data da aquisição
- `{{justificativa}}` - Justificativa da seleção
- `{{local_data}}` - Local e data
- `{{coordenador_nome}}` - Nome do coordenador

### Mapa de Cotação (VERTEX)
Similar ao EDGE, mas com:
- `{{codigo_projeto}}` - Código do projeto
- `{{projeto}}` - Nome do projeto
- `{{rubrica}}` - Natureza de dispêndio
- `{{localidade}}`, `{{dia}}`, `{{mes}}`, `{{ano}}` - Data formatada
- `{{coordenador}}` - Nome do coordenador

## Troubleshooting

### Erro: "Cannot find module 'docx'"
Execute: `npm install`

### Erro: "ENOENT: no such file or directory"
Certifique-se de estar no diretório correto: `/home/laura/v0-laurafy-onlycode/`

### Templates não aparecem
Verifique se os diretórios foram criados:
\`\`\`bash
mkdir -p src/templates/folha_rosto
mkdir -p src/templates/mapa
\`\`\`

Depois execute novamente: `npm run generate-templates`

## Próximos Passos

Após gerar os templates:
1. Edite os projetos no dashboard para adicionar CNPJ e Termo de Parceria
2. Adicione documentos financeiros na aba "Documentação Financeira"
3. Clique em "Gerar Folha de Rosto" ou "Gerar Mapa de Cotação"
4. Os documentos serão gerados com os dados preenchidos automaticamente
