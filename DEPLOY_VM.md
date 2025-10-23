# 🚀 Guia de Deploy na VM - Sistema de Prestação de Contas Softex

Este guia explica como instalar e executar o sistema em uma máquina virtual (VM).

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de que sua VM tem:

- **Node.js** versão 18 ou superior
- **npm** (geralmente vem com Node.js)
- **Git** (opcional, para clonar do GitHub)
- **Acesso SSH** à VM
- **Portas liberadas:** 3000 (ou outra porta que você configurar)

### Verificar instalações:

\`\`\`bash
node --version   # Deve mostrar v18.x.x ou superior
npm --version    # Deve mostrar 9.x.x ou superior
\`\`\`

### Instalar Node.js (se necessário):

\`\`\`bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
\`\`\`

---

## 📦 Opção 1: Download do ZIP do v0

### 1. Baixar o código

No v0, clique nos **três pontos** no canto superior direito → **Download ZIP**

### 2. Transferir para a VM

\`\`\`bash
# Do seu computador local, envie o arquivo para a VM
scp wireframesoftexv0deploy.zip usuario@ip-da-vm:/home/usuario/

# Conecte-se à VM
ssh usuario@ip-da-vm

# Descompacte o arquivo
cd /home/usuario
unzip wireframesoftexv0deploy.zip
cd wireframesoftexv0deploy
\`\`\`

### 3. Instalar dependências

\`\`\`bash
npm install
\`\`\`

---

## 📦 Opção 2: Clone do GitHub

### 1. Clonar o repositório

\`\`\`bash
# Conecte-se à VM
ssh usuario@ip-da-vm

# Clone o repositório
cd /home/usuario
git clone https://github.com/Lauragribeiro/Wireframe-do-Sistema-de-Gerenciamento-Softex.git
cd Wireframe-do-Sistema-de-Gerenciamento-Softex
\`\`\`

### 2. Instalar dependências

\`\`\`bash
npm install
\`\`\`

---

## 🔑 Configurar Variáveis de Ambiente

### 1. Criar arquivo .env

\`\`\`bash
nano .env
\`\`\`

### 2. Adicionar as variáveis:

\`\`\`env
# Porta do servidor (opcional, padrão é 3000)
PORT=3000

# Chave da OpenAI (OBRIGATÓRIA para funcionalidades de IA)
OPENAI_API_KEY=sk-proj-sua-chave-aqui

# Modo legado do mapa (opcional, padrão é 0)
LEGACY_MAPA=0
\`\`\`

### 3. Salvar e fechar

- Pressione `Ctrl + O` para salvar
- Pressione `Enter` para confirmar
- Pressione `Ctrl + X` para sair

---

## ▶️ Executar o Sistema

### Modo de Desenvolvimento (com auto-reload)

\`\`\`bash
npm run dev
\`\`\`

### Modo de Produção

\`\`\`bash
npm start
\`\`\`

### Executar em Background (continua rodando após logout)

\`\`\`bash
# Usando nohup
nohup npm start > server.log 2>&1 &

# Ou usando PM2 (recomendado para produção)
npm install -g pm2
pm2 start server.js --name softex-prestacao
pm2 save
pm2 startup  # Configura para iniciar automaticamente
\`\`\`

---

## 🌐 Acessar o Sistema

### Localmente na VM:

\`\`\`
http://localhost:3000
\`\`\`

### Remotamente (do seu navegador):

\`\`\`
http://ip-da-vm:3000
\`\`\`

**Importante:** Certifique-se de que a porta 3000 está liberada no firewall da VM:

\`\`\`bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3000/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
\`\`\`

---

## 📁 Estrutura de Diretórios

Após a instalação, você terá:

\`\`\`
wireframesoftexv0deploy/
├── server.js              # Servidor principal
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente (você cria)
├── data/                  # Dados do sistema
│   ├── projects.json      # Projetos cadastrados
│   ├── purchases.json     # Compras/prestações
│   ├── vendors.json       # Fornecedores
│   └── uploads/           # Arquivos enviados
├── src/                   # Código-fonte
│   ├── parseDocs.js       # Processamento de documentos
│   ├── generateDocs.js    # Geração de documentos
│   ├── gptMapa.js         # IA para mapas de cotação
│   └── ...
├── templates/             # Templates DOCX
└── styles/                # Estilos CSS
\`\`\`

---

## 🔧 Comandos Úteis

### Verificar se o servidor está rodando:

\`\`\`bash
# Ver processos Node.js
ps aux | grep node

# Ver porta 3000
netstat -tulpn | grep 3000
# ou
lsof -i :3000
\`\`\`

### Parar o servidor:

\`\`\`bash
# Se rodando em foreground
Ctrl + C

# Se rodando com nohup
pkill -f "node.*server.js"

# Se usando PM2
pm2 stop softex-prestacao
\`\`\`

### Ver logs:

\`\`\`bash
# Se usando nohup
tail -f server.log

# Se usando PM2
pm2 logs softex-prestacao
\`\`\`

### Reiniciar o servidor:

\`\`\`bash
# Com PM2
pm2 restart softex-prestacao

# Manualmente
pkill -f "node.*server.js"
npm start
\`\`\`

---

## 🐛 Troubleshooting

### Erro: "Port 3000 is already in use"

\`\`\`bash
# Encontrar o processo usando a porta
lsof -i :3000

# Matar o processo
kill -9 <PID>

# Ou usar outra porta
PORT=3001 npm start
\`\`\`

### Erro: "Cannot find module"

\`\`\`bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Erro: "EACCES: permission denied"

\`\`\`bash
# Dar permissões corretas
sudo chown -R $USER:$USER .
chmod -R 755 .
\`\`\`

### Erro: "OpenAI API key not found"

Certifique-se de que:
1. O arquivo `.env` existe na raiz do projeto
2. A variável `OPENAI_API_KEY` está definida corretamente
3. Não há espaços extras na chave

### Sistema não responde externamente:

\`\`\`bash
# Verificar se está escutando em todas as interfaces
# No server.js, deve ter:
app.listen(PORT, '0.0.0.0', () => { ... })

# Verificar firewall
sudo ufw status
sudo firewall-cmd --list-all
\`\`\`

---

## 🔒 Segurança em Produção

### 1. Usar HTTPS com certificado SSL

\`\`\`bash
# Instalar Certbot
sudo apt install certbot

# Obter certificado (requer domínio)
sudo certbot certonly --standalone -d seu-dominio.com
\`\`\`

### 2. Usar proxy reverso (Nginx)

\`\`\`bash
# Instalar Nginx
sudo apt install nginx

# Configurar proxy
sudo nano /etc/nginx/sites-available/softex
\`\`\`

\`\`\`nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

\`\`\`bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/softex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### 3. Proteger variáveis de ambiente

\`\`\`bash
# Permissões restritas no .env
chmod 600 .env
\`\`\`

---

## 📊 Monitoramento

### Com PM2:

\`\`\`bash
# Dashboard em tempo real
pm2 monit

# Status dos processos
pm2 status

# Informações detalhadas
pm2 info softex-prestacao
\`\`\`

---

## 🔄 Atualizar o Sistema

### Se usando Git:

\`\`\`bash
cd /home/usuario/Wireframe-do-Sistema-de-Gerenciamento-Softex
git pull origin main
npm install
pm2 restart softex-prestacao
\`\`\`

### Se usando ZIP:

1. Faça backup dos dados:
\`\`\`bash
cp -r data/ data_backup/
\`\`\`

2. Baixe o novo ZIP e substitua os arquivos

3. Restaure os dados:
\`\`\`bash
cp -r data_backup/* data/
\`\`\`

4. Reinstale dependências:
\`\`\`bash
npm install
pm2 restart softex-prestacao
\`\`\`

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs` ou `tail -f server.log`
2. Verifique as variáveis de ambiente: `cat .env`
3. Verifique as permissões: `ls -la`
4. Verifique a porta: `netstat -tulpn | grep 3000`

---

## ✅ Checklist de Deploy

- [ ] Node.js 18+ instalado
- [ ] Código baixado/clonado
- [ ] `npm install` executado
- [ ] Arquivo `.env` criado com `OPENAI_API_KEY`
- [ ] Porta 3000 liberada no firewall
- [ ] Servidor iniciado (`npm start` ou `pm2 start`)
- [ ] Sistema acessível via navegador
- [ ] Teste de upload de documento
- [ ] Teste de geração de mapa de cotação

---

**Pronto! Seu sistema está rodando na VM! 🎉**
