#!/bin/bash
# Script para corrigir o problema do pdf-parse

# Criar diretório de teste se não existir
mkdir -p test/data

# Criar um arquivo PDF vazio para evitar o erro
echo "%PDF-1.4" > test/data/05-versions-space.pdf
echo "%%EOF" >> test/data/05-versions-space.pdf

echo "✓ Arquivo de teste criado"
