# ⚠️ PROBLEMA: Node.js Desatualizado

## 🔴 Erro Atual

```
SyntaxError: Unexpected reserved word
```

**Causa**: Node.js v12.22.9 é muito antigo para o Vite 5

**Solução**: Atualizar para Node.js v18 ou v20

---

## 🚀 Opção 1: Instalar NVM (Recomendado)

NVM permite gerenciar múltiplas versões do Node.js facilmente.

### Passo 1: Instalar NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Passo 2: Carregar NVM

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Ou feche e abra o terminal novamente.

### Passo 3: Instalar Node.js 20

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Passo 4: Verificar

```bash
node --version  # Deve mostrar v20.x.x
```

### Passo 5: Reiniciar Frontend

```bash
cd /home/alex/Software/script/agendamento/site
npm run dev
```

---

## 🚀 Opção 2: Instalar Node.js Manualmente

### Ubuntu/Debian

```bash
# Remover versão antiga
sudo apt remove nodejs npm

# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js 20
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

---

## 🚀 Opção 3: Usar NodeSource Diretamente

```bash
# Baixar e instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

---

## ✅ Após Atualizar

1. **Verificar versão**:
   ```bash
   node --version  # Deve ser v18.x.x ou v20.x.x
   ```

2. **Reinstalar dependências do frontend** (opcional, mas recomendado):
   ```bash
   cd /home/alex/Software/script/agendamento/site
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Iniciar frontend**:
   ```bash
   npm run dev
   ```

4. **Acessar aplicação**:
   - Abrir navegador em: http://localhost:3000
   - Login: admin@exemplo.invalid
   - Senha: EXEMPLO_SENHA_FORTE

---

## 🐛 Troubleshooting

### Erro: "nvm: command not found"

Adicione ao seu `~/.bashrc` ou `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Depois execute:
```bash
source ~/.bashrc
```

### Erro: "Permission denied"

Use `sudo` nos comandos de instalação:
```bash
sudo apt install nodejs
```

### Backend ainda funciona?

Sim! O backend está rodando com Node.js v12 sem problemas. Apenas o frontend (Vite) precisa de versão mais nova.

---

## 📊 Comparação de Versões

| Versão | Status | Vite 5 | Suporte |
|--------|--------|--------|---------|
| v12.x  | ❌ Antiga | ❌ Não | Fim em 2022 |
| v14.x  | ⚠️ EOL | ⚠️ Limitado | Fim em 2023 |
| v16.x  | ⚠️ EOL | ⚠️ Limitado | Fim em 2024 |
| v18.x  | ✅ LTS | ✅ Sim | Até 2025 |
| v20.x  | ✅ LTS | ✅ Sim | Até 2026 |

**Recomendado**: Node.js v20 (LTS)

---

## 🎯 Resumo Rápido

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar terminal
source ~/.bashrc

# Instalar Node 20
nvm install 20
nvm use 20

# Verificar
node --version

# Iniciar frontend
cd /home/alex/Software/script/agendamento/site
npm run dev
```

---

**Depois de atualizar, a aplicação funcionará perfeitamente!** ✅








