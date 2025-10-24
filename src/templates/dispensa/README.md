# Template de Justificativa de Dispensa

Esta pasta deve conter o seguinte arquivo:

## Arquivo Necessário

**justificativa_dispensa.docx**
- Template para Justificativa de Dispensa de Cotação

## Estrutura do Template

Este template usa uma abordagem diferente dos outros. Em vez de variáveis simples `{nome}`, ele usa:

### Tabelas com Labels
O sistema procura por células de tabela com os seguintes textos e preenche a célula adjacente:

- "Instituição Executora:"
- "CNPJ:"
- "Termo de Parceria nº:"
- "Projeto:"
- "Natureza de Dispêndio:"
- "Fornecedor Contratado:"
- "CNPJ do Contratado:"
- "Valor Contratado:"
- "Data da Aquisição:"

### Parágrafos após Títulos
O sistema procura por títulos específicos e preenche o parágrafo seguinte:

- "Objeto da cotação" → parágrafo seguinte recebe a descrição do objeto
- "Justificativa da dispensa da cotação" → parágrafo seguinte recebe a justificativa
- "Assinatura e nome do Coordenador" → parágrafo seguinte recebe a assinatura eletrônica

### Texto de Data
O sistema substitui o texto:
- "__________, ____ de ___________ de _______" → por "Cidade, DD de Mês de AAAA"

### Texto de Assinatura Digital
O sistema remove o texto:
- "{assinatura eletrônica com certificado digital ICP}"

## Dados Preenchidos

- **Instituição**: Nome da instituição executora
- **CNPJ**: CNPJ da instituição
- **Termo de Parceria**: Número do termo
- **Projeto**: Nome e código do projeto
- **Natureza de Dispêndio**: Tipo de rubrica
- **Objeto**: Descrição do que está sendo adquirido
- **Fornecedor**: Nome do contratado
- **CNPJ do Contratado**: Documento do fornecedor
- **Valor**: Valor contratado formatado em R$
- **Data da Aquisição**: Data do pagamento
- **Justificativa**: Texto explicando a dispensa
- **Local e Data**: Cidade e data por extenso
- **Coordenador**: Nome do coordenador (assinatura eletrônica)

## Status

⚠️ **ATENÇÃO**: Esta pasta está vazia. O template precisa ser adicionado para que o sistema funcione corretamente.
