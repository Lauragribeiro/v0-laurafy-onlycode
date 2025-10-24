# Templates de Mapa de Cotação

Esta pasta deve conter os seguintes arquivos:

## Arquivos Necessários

1. **mapa_edge.docx**
   - Template de Mapa de Cotação para instituição EDGE

2. **mapa_vertex.docx**
   - Template de Mapa de Cotação para instituição VERTEX

## Variáveis do Template

Cada template deve conter as seguintes variáveis:

### Cabeçalho
- `{instituicao}` - Nome da instituição (EDGE ou VERTEX)
- `{cnpj_inst}` - CNPJ da instituição
- `{termo_parceria}` - Número do termo de parceria
- `{projeto_nome}` - Nome do projeto
- `{projeto_codigo}` - Código do projeto

### Corpo
- `{natureza_disp}` - Natureza do dispêndio/tipo de rubrica
- `{objeto}` - Descrição detalhada do objeto da cotação

### Tabela de Propostas (Loop)
- `{propostas}` - Array de propostas
  - `{selecao}` - Status ("SELECIONADA" ou "Cotação N")
  - `{ofertante}` - Nome do fornecedor/ofertante
  - `{cnpj}` - CNPJ/CPF do ofertante
  - `{data_cotacao}` - Data da cotação (formato DD/MM/AAAA)
  - `{valor}` - Valor da proposta (formato R$ X.XXX,XX)

### Rodapé
- `{data_aquisicao}` - Data da aquisição
- `{justificativa}` - Justificativa da escolha do fornecedor
- `{local_data}` - Local e data por extenso (ex: "Maceió, 15 de janeiro de 2025")
- `{coordenador_nome}` - Nome do coordenador do projeto

## Estrutura Recomendada

O template deve seguir esta estrutura:

1. **Cabeçalho** com dados da instituição e projeto
2. **Seção de Identificação** com natureza do dispêndio e objeto
3. **Tabela de Cotações** com no mínimo 3 linhas para propostas
4. **Seção de Justificativa** com data e assinatura

## Status

⚠️ **ATENÇÃO**: Esta pasta está vazia. Os templates precisam ser adicionados para que o sistema funcione corretamente.
