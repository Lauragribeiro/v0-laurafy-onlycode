# Templates de Documentos

Este diretório contém os templates `.docx` necessários para gerar os documentos do sistema.

## Estrutura de Diretórios

\`\`\`
src/templates/
├── folha_rosto/     # Templates para Folha de Rosto
├── mapa/            # Templates para Mapa de Cotação
└── dispensa/        # Templates para Justificativa de Dispensa
\`\`\`

## Templates Necessários

### Folha de Rosto (`folha_rosto/`)
- `folha_rosto_edge.docx` - Template para instituição EDGE
- `folha_rosto_vertex.docx` - Template para instituição VERTEX
- `custos_incorridos_edge.docx` - Template para Custos Incorridos (EDGE)
- `custos_incorridos_vertex.docx` - Template para Custos Incorridos (VERTEX)

### Mapa de Cotação (`mapa/`)
- `mapa_edge.docx` - Template para Mapa de Cotações (EDGE)
- `mapa_vertex.docx` - Template para Mapa de Cotações (VERTEX)

### Justificativa de Dispensa (`dispensa/`)
- `justificativa_dispensa.docx` - Template para Justificativa de Dispensa

## Variáveis dos Templates

Os templates devem conter as seguintes variáveis (tags) que serão substituídas pelo sistema:

### Folha de Rosto
- `{instituicao}` - Nome da instituição (EDGE ou VERTEX)
- `{projeto_codigo}` - Código do projeto
- `{projeto_nome}` - Nome do projeto
- `{pc_numero}` - Número da prestação de contas
- `{natureza_disp}` - Natureza do dispêndio/rubrica
- `{favorecido}` - Nome do favorecido
- `{cnpj}` - CNPJ/CPF do favorecido
- `{n_extrato}` - Número do extrato
- `{nf_recibo}` - Número da NF/Recibo
- `{data_emissao}` - Data de emissão
- `{data_pagamento}` - Data do pagamento
- `{valor_pago}` - Valor pago

### Mapa de Cotação
- `{instituicao}` - Nome da instituição
- `{cnpj_inst}` - CNPJ da instituição
- `{termo_parceria}` - Número do termo de parceria
- `{projeto_nome}` - Nome do projeto
- `{projeto_codigo}` - Código do projeto
- `{natureza_disp}` - Natureza do dispêndio
- `{objeto}` - Descrição do objeto
- `{propostas}` - Array de propostas (loop)
  - `{selecao}` - Status da seleção
  - `{ofertante}` - Nome do ofertante
  - `{cnpj}` - CNPJ do ofertante
  - `{data_cotacao}` - Data da cotação
  - `{valor}` - Valor da proposta
- `{data_aquisicao}` - Data da aquisição
- `{justificativa}` - Justificativa da escolha
- `{local_data}` - Local e data por extenso
- `{coordenador_nome}` - Nome do coordenador

### Justificativa de Dispensa
Usa tabelas e parágrafos com labels específicos:
- Tabela com "Instituição Executora:", "CNPJ:", "Termo de Parceria nº:", etc.
- Parágrafo após "Objeto da cotação"
- Parágrafo após "Justificativa da dispensa da cotação"
- Parágrafo após "Assinatura e nome do Coordenador"

## Como Criar os Templates

1. Crie um documento Word (.docx) com o layout desejado
2. Insira as variáveis usando a sintaxe `{nome_variavel}`
3. Para loops (como propostas), use a sintaxe do docxtemplater
4. Salve o arquivo na pasta correspondente com o nome exato listado acima

## Verificação de Templates

Execute o script de verificação para listar templates ausentes:

\`\`\`bash
node scripts/check-templates.js
\`\`\`

## Restauração de Templates

Se você perdeu os templates originais, entre em contato com o administrador do sistema ou restaure de um backup.
