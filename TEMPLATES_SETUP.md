# Guia de Configuração dos Templates

## 🚨 Problema: Erro 404 ao Gerar Documentos

Se você está vendo erros como:
\`\`\`
HTTP 404 {"ok":false,"error":"Template não encontrado: folha_rosto_edge.docx"}
HTTP 404 {"ok":false,"error":"Template não encontrado: mapa_edge.docx"}
\`\`\`

Isso significa que os arquivos de template `.docx` não estão presentes no sistema.

## ✅ Solução Passo a Passo

### 1. Verificar Templates Ausentes

Execute o comando:
\`\`\`bash
npm run check-templates
\`\`\`

Você verá uma lista de todos os templates necessários e quais estão ausentes.

### 2. Estrutura de Diretórios

Os templates devem estar organizados assim:

\`\`\`
src/templates/
├── folha_rosto/
│   ├── folha_rosto_edge.docx
│   ├── folha_rosto_vertex.docx
│   ├── custos_incorridos_edge.docx
│   └── custos_incorridos_vertex.docx
├── mapa/
│   ├── mapa_edge.docx
│   └── mapa_vertex.docx
└── dispensa/
    └── justificativa_dispensa.docx
\`\`\`

### 3. Obter os Templates

Você tem três opções:

#### Opção A: Restaurar de Backup
Se você tinha os templates anteriormente:
1. Localize o backup do projeto
2. Copie a pasta `src/templates/` completa
3. Cole no projeto atual

#### Opção B: Solicitar ao Administrador
Entre em contato com o administrador do sistema para obter os templates oficiais.

#### Opção C: Criar Novos Templates
Siga as instruções em `src/templates/README.md` para criar templates do zero.

### 4. Validar Instalação

Após adicionar os templates, execute novamente:
\`\`\`bash
npm run check-templates
\`\`\`

Você deve ver:
\`\`\`
✅ Todos os templates estão presentes!
\`\`\`

### 5. Testar o Sistema

1. Reinicie o servidor: `npm start`
2. Tente gerar uma Folha de Rosto ou Mapa de Cotação
3. O documento deve ser gerado sem erros

## 📋 Especificações dos Templates

### Folha de Rosto

**Variáveis necessárias:**
- `{instituicao}` - EDGE ou VERTEX
- `{projeto_codigo}` - Código do projeto
- `{pc_numero}` - Número da prestação de contas
- `{natureza_disp}` - Tipo de rubrica
- `{favorecido}` - Nome do favorecido
- `{cnpj}` - CNPJ/CPF
- `{n_extrato}` - Número do extrato
- `{nf_recibo}` - Número da NF
- `{data_emissao}` - Data de emissão
- `{data_pagamento}` - Data do pagamento
- `{valor_pago}` - Valor total

### Mapa de Cotação

**Variáveis necessárias:**
- `{instituicao}` - Nome da instituição
- `{cnpj_inst}` - CNPJ da instituição
- `{termo_parceria}` - Número do termo
- `{projeto_nome}` - Nome do projeto
- `{projeto_codigo}` - Código do projeto
- `{natureza_disp}` - Natureza do dispêndio
- `{objeto}` - Descrição do objeto
- `{propostas}` - Array de propostas (loop)
  - `{selecao}` - Status
  - `{ofertante}` - Fornecedor
  - `{cnpj}` - CNPJ
  - `{data_cotacao}` - Data
  - `{valor}` - Valor
- `{data_aquisicao}` - Data da aquisição
- `{justificativa}` - Justificativa
- `{local_data}` - Local e data
- `{coordenador_nome}` - Coordenador

### Justificativa de Dispensa

**Estrutura especial:**
- Usa tabelas com labels específicos
- Parágrafos após títulos específicos
- Consulte `src/templates/dispensa/README.md` para detalhes

## 🔧 Criando Templates do Zero

### Passo 1: Criar Documento Word
1. Abra o Microsoft Word ou LibreOffice Writer
2. Crie o layout desejado (cabeçalho, tabelas, rodapé)

### Passo 2: Inserir Variáveis
1. Digite as variáveis usando a sintaxe `{nome_variavel}`
2. Para loops (como propostas), use:
   \`\`\`
   {#propostas}
   {selecao} | {ofertante} | {cnpj} | {data_cotacao} | {valor}
   {/propostas}
   \`\`\`

### Passo 3: Formatar
1. Aplique estilos (fontes, cores, alinhamento)
2. Configure margens e tamanho da página
3. Adicione logotipos se necessário

### Passo 4: Salvar
1. Salve como `.docx` (não use .doc ou .docm)
2. Use o nome exato especificado na documentação
3. Coloque na pasta correta em `src/templates/`

## ❓ Perguntas Frequentes

**P: Posso usar .doc em vez de .docx?**
R: Não. O sistema requer arquivos .docx (Office Open XML).

**P: Posso renomear os templates?**
R: Não. Os nomes são fixos no código. Use exatamente os nomes especificados.

**P: Como faço loops de propostas?**
R: Use a sintaxe do docxtemplater: `{#propostas}...{/propostas}`

**P: Os templates funcionam no LibreOffice?**
R: Sim, desde que salve no formato .docx.

**P: Preciso de todos os templates?**
R: Sim. Cada funcionalidade requer seu template específico.

## 🆘 Suporte

Se você continuar tendo problemas:
1. Verifique os logs do servidor para erros específicos
2. Confirme que os arquivos têm extensão .docx
3. Verifique permissões de leitura dos arquivos
4. Consulte a documentação em `src/templates/README.md`
