# Correção Rápida - Templates Ausentes

## Problema
O sistema está retornando erro 404 ao tentar gerar documentos porque os templates `.docx` não existem.

## Solução Imediata

Execute o seguinte comando no terminal:

\`\`\`bash
npm run create-templates
\`\`\`

Este comando irá:
1. Criar automaticamente todos os 7 templates .docx necessários
2. Colocá-los nas pastas corretas em `src/templates/`
3. Incluir todos os placeholders necessários

## Após Executar o Script

1. **Reinicie o servidor** (Ctrl+C e depois `npm start`)
2. **Atualize os projetos** no dashboard para incluir:
   - CNPJ da Instituição
   - Número do Termo de Parceria
3. **Teste a geração** de documentos

## Campos Obrigatórios para Geração de Documentos

### Para Folha de Rosto:
- ✅ CNPJ da Instituição (agora disponível no formulário de projeto)
- ✅ Termo de Parceria (agora disponível no formulário de projeto)
- ✅ Dados do favorecido
- ✅ Número da NF
- ✅ Valor

### Para Mapa de Cotação:
- ✅ CNPJ da Instituição
- ✅ Termo de Parceria
- ✅ Objeto da cotação
- ✅ Propostas (mínimo 3)

## Verificação

Para verificar se os templates foram criados corretamente:

\`\`\`bash
npm run check-templates
\`\`\`

## Problemas Conhecidos

### Chave OpenAI Inválida
Se você ver erros relacionados à OpenAI (erro 401), a chave API está inválida ou expirada. 
O sistema funcionará normalmente para geração de documentos, mas a extração automática de dados de PDFs não funcionará.

Para corrigir:
1. Obtenha uma nova chave em https://platform.openai.com/api-keys
2. Atualize a variável `OPENAI_API_KEY` no arquivo `.env`
3. Reinicie o servidor

### Templates Ainda Não Encontrados
Se após executar `npm run create-templates` os templates ainda não forem encontrados:

1. Verifique se a pasta `src/templates/` existe
2. Verifique se há erros no console ao executar o script
3. Verifique as permissões de escrita na pasta `src/templates/`

## Suporte

Se os problemas persistirem, verifique:
- Os logs do servidor no terminal
- O console do navegador (F12)
- O arquivo `README.md` para instruções detalhadas
