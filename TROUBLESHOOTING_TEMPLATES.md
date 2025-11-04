# Troubleshooting - Templates de Documentos

## Problema: Documentos gerados estão incorretos

### Sintomas
- Folha de Rosto ou Mapa de Cotação não correspondem aos modelos esperados
- Campos não estão sendo preenchidos corretamente
- Placeholders aparecem no documento final

### Solução Passo a Passo

#### 1. Verificar se os templates existem

\`\`\`bash
cd /home/laura/v0-laurafy-onlycode
ls -la src/templates/folha_rosto/
ls -la src/templates/mapa/
\`\`\`

Você deve ver:
- `folha_rosto_edge.docx`
- `folha_rosto_vertex.docx`
- `mapa_edge.docx`
- `mapa_vertex.docx`

#### 2. Recriar os templates

Se os templates não existirem ou estiverem incorretos:

\`\`\`bash
cd /home/laura/v0-laurafy-onlycode
npm run generate-templates
\`\`\`

Você verá logs detalhados mostrando a criação de cada template.

#### 3. Verificar se os templates são válidos

\`\`\`bash
npm run verify-templates
\`\`\`

Este comando verifica se os templates podem ser processados pelo docxtemplater e lista todos os placeholders encontrados.

#### 4. Reiniciar o servidor

Após recriar os templates, reinicie o servidor:

\`\`\`bash
# Parar o servidor (Ctrl+C)
npm start
\`\`\`

Observe os logs de inicialização. Você deve ver:

\`\`\`
[autoCreateTemplates] ========================================
[autoCreateTemplates] 🚀 Iniciando verificação de templates...
[autoCreateTemplates] ========================================
...
[autoCreateTemplates] ✅ EXISTE folha_rosto_edge.docx (XXXXX bytes)
[autoCreateTemplates] ✅ EXISTE folha_rosto_vertex.docx (XXXXX bytes)
[autoCreateTemplates] ✅ EXISTE mapa_edge.docx (XXXXX bytes)
[autoCreateTemplates] ✅ EXISTE mapa_vertex.docx (XXXXX bytes)
\`\`\`

#### 5. Testar a geração de documentos

No navegador, tente gerar uma Folha de Rosto ou Mapa de Cotação. Observe os logs do servidor:

\`\`\`
[FOLHA ROSTO] Dados para template: { ... }
[FOLHA ROSTO] Template path: /home/laura/v0-laurafy-onlycode/src/templates/folha_rosto/folha_rosto_edge.docx
[FOLHA ROSTO] Template exists: true
\`\`\`

### Problemas Comuns

#### Erro: "Template não encontrado"

**Causa**: Os templates não foram criados ou estão no diretório errado.

**Solução**:
\`\`\`bash
npm run generate-templates
npm start
\`\`\`

#### Erro: "ENOENT: no such file or directory"

**Causa**: O diretório `src/templates` não existe.

**Solução**:
\`\`\`bash
mkdir -p src/templates/folha_rosto
mkdir -p src/templates/mapa
mkdir -p src/templates/dispensa
npm run generate-templates
\`\`\`

#### Placeholders não são substituídos

**Causa**: O template pode estar corrompido ou os placeholders estão em formato incorreto.

**Solução**:
\`\`\`bash
# Deletar templates antigos
rm -rf src/templates/folha_rosto/*.docx
rm -rf src/templates/mapa/*.docx

# Recriar templates
npm run generate-templates

# Verificar templates
npm run verify-templates
\`\`\`

#### Campos aparecem como "—" ou vazios

**Causa**: Os dados não estão sendo enviados corretamente do frontend.

**Solução**: Verifique os logs do servidor quando você clica em "Gerar Folha de Rosto" ou "Gerar Mapa de Cotação". Você deve ver:

\`\`\`
[FOLHA ROSTO] Campos recebidos: {
  cnpj_instituicao: '12.345.678/0001-90',
  termo_parceria: '002/2025',
  instituicao: 'EDGE',
  projeto: 'PROJETO TIC 222'
}
\`\`\`

Se os campos estiverem vazios, o problema está no frontend (docfin.js) não enviando os dados corretamente.

### Estrutura dos Templates

#### Folha de Rosto (EDGE e VERTEX)

Placeholders:
- `{{instituicao}}` - Nome da instituição (EDGE ou VERTEX)
- `{{projeto_codigo}}` - Código do termo de parceria
- `{{projeto_nome}}` - Nome do projeto
- `{{pc_numero}}` - Número da prestação de contas
- `{{rubrica}}` - Natureza de dispêndio
- `{{favorecido}}` - Nome do favorecido
- `{{cnpj}}` - CNPJ/CPF do favorecido
- `{{n_extrato}}` - Número do extrato
- `{{nf_recibo}}` - Número da NF/ND
- `{{data_emissao}}` - Data de emissão da NF
- `{{data_pagamento}}` - Data do pagamento
- `{{valor_pago}}` - Valor pago

#### Mapa de Cotação (EDGE e VERTEX)

Placeholders:
- `{{instituicao}}` - Nome da instituição
- `{{termo_parceria}}` ou `{{codigo_projeto}}` - Código do termo
- `{{projeto_nome}}` ou `{{projeto}}` - Nome do projeto
- `{{natureza_disp}}` ou `{{rubrica}}` - Natureza de dispêndio
- `{{objeto}}` - Objeto da cotação
- `{{#propostas}}` - Início do loop de propostas
  - `{{selecao}}` - Seleção (X ou vazio)
  - `{{ofertante}}` - Nome do ofertante
  - `{{cnpj_ofertante}}` - CNPJ/CPF do ofertante
  - `{{data_cotacao}}` - Data da cotação
  - `{{valor}}` - Valor da proposta
- `{{/propostas}}` - Fim do loop de propostas
- `{{data_aquisicao}}` - Data da aquisição
- `{{justificativa}}` - Justificativa da seleção
- `{{local_data}}` ou `{{localidade}}, {{dia}} de {{mes}} de {{ano}}` - Data e local
- `{{coordenador_nome}}` ou `{{coordenador}}` - Nome do coordenador

### Contato

Se o problema persistir após seguir todos os passos acima, verifique:
1. Permissões do diretório `src/templates`
2. Espaço em disco disponível
3. Logs completos do servidor para erros específicos
