# Instruções para Gerar Templates

## Problema Atual

O sistema está gerando documentos com templates incorretos. Os templates precisam ser recriados com a estrutura correta.

## Solução

Execute os seguintes comandos no diretório do projeto (`/home/laura/v0-laurafy-onlycode/`):

\`\`\`bash
# 1. Navegue para o diretório do projeto
cd /home/laura/v0-laurafy-onlycode/

# 2. Execute o script de geração de templates
npm run generate-templates

# 3. Verifique se os templates foram criados
ls -lh src/templates/folha_rosto/
ls -lh src/templates/mapa/

# 4. Reinicie o servidor
npm run dev
\`\`\`

## Verificação

Após executar os comandos acima, você deverá ver os seguintes arquivos:

- `src/templates/folha_rosto/folha_rosto_edge.docx`
- `src/templates/folha_rosto/folha_rosto_vertex.docx`
- `src/templates/mapa/mapa_edge.docx`
- `src/templates/mapa/mapa_vertex.docx`

Cada arquivo deve ter aproximadamente 5-10 KB de tamanho.

## Estrutura dos Templates

### Folha de Rosto (EDGE e VERTEX)

- Instituição Executora: {{instituicao}}
- CNPJ: (vazio)
- Termo de Parceria nº: {{projeto_codigo}}
- Projeto: {{projeto_nome}}
- Prestação de Contas: {{pc_numero}}
- Natureza de Dispêndio: {{rubrica}}
- Tabela 1: Favorecido | CNPJ OU CPF | Nº Extrato
- Tabela 2: NF/ND | Data de emissão | Data do pagamento | Valor
- Lista de documentos necessários

**VERTEX** tem rodapé no topo com endereço.

### Mapa de Cotação (EDGE e VERTEX)

- Título: MAPA DE COTAÇÃO
- Instituição Executora: {{instituicao}}
- CNPJ: (vazio)
- Termo de Parceria nº: {{termo_parceria}} (EDGE) ou {{codigo_projeto}} (VERTEX)
- Projeto: {{projeto_nome}} (EDGE) ou {{projeto}} (VERTEX)
- Natureza de Dispêndio: {{natureza_disp}} (EDGE) ou {{rubrica}} (VERTEX)
- Objeto da cotação: {{objeto}}
- Tabela de Propostas com loop: {{#propostas}}...{{/propostas}}
- Data da Aquisição: {{data_aquisicao}}
- Justificativa: {{justificativa}}
- Data: {{local_data}} (EDGE) ou {{localidade}}, {{dia}} de {{mes}} de {{ano}} (VERTEX)
- Assinatura: {{coordenador_nome}} (EDGE) ou {{coordenador}} (VERTEX)

**VERTEX** tem rodapé no topo com endereço.

## Logs de Debug

Quando o servidor iniciar, você verá logs detalhados no terminal mostrando:

- Quais templates foram criados
- Tamanho de cada template em bytes
- Status de cada template (existe ou não)

Quando gerar um documento, você verá logs mostrando:

- Dados enviados para o template
- Caminho do template usado
- Se o template existe ou não

## Troubleshooting

Se os templates não forem criados:

1. Verifique as permissões do diretório `src/templates/`
2. Verifique se há espaço em disco disponível
3. Verifique os logs do servidor para erros específicos
4. Tente criar os diretórios manualmente:
   \`\`\`bash
   mkdir -p src/templates/folha_rosto
   mkdir -p src/templates/mapa
   mkdir -p src/templates/dispensa
   \`\`\`
5. Execute o script novamente: `npm run generate-templates`
