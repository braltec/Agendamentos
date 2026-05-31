# ✅ Instalação Completa - Sistema de Agendamento

## 🎉 Status: INSTALADO COM SUCESSO!

---

## 📊 Resumo da Instalação

### ✅ **Concluído:**

1. **Estrutura de Diretórios** - Criada
2. **Frontend (React)** - Configurado e dependências instaladas
3. **Backend (Node.js)** - Configurado e dependências instaladas
4. **Banco de Dados** - Conexão testada e funcionando
5. **Arquivos de Configuração** - Criados

---

## 🔌 Conexão com Banco de Dados

### **Status:** ✅ CONECTADO

```
Host: 91.99.153.89
Database: agendamentos
User: postgres
Tabelas: 20 tabelas encontradas
```

### ⚠️ **IMPORTANTE: BANCO EM PRODUÇÃO!**
- **NÃO ALTERAR** a estrutura do banco
- **NÃO EXECUTAR** migrations ou alterações de schema
- **APENAS LEITURA E INSERÇÃO** de dados

---

## 📦 Dependências Instaladas

### Backend
- ✅ Express 4.18.2
- ✅ PostgreSQL (pg) 8.16.3
- ✅ JWT (jsonwebtoken) 9.0.2
- ✅ Bcrypt 5.1.1
- ✅ CORS, Helmet, Winston
- **Total:** 208 pacotes

### Frontend
- ✅ React 18.2.0
- ✅ Vite 5.4.21
- ✅ TailwindCSS 3.4.18
- ✅ React Router 6.30.1
- ✅ React Query, Axios, etc.
- **Total:** 411 pacotes

---

## ⚠️ Avisos Importantes

### Versão do Node.js
```
Versão atual: v12.22.9
Versão recomendada: v18+ ou v20+
```

**Recomendação:** Atualizar Node.js para evitar problemas:
```bash
# Usando nvm (recomendado)
nvm install 20
nvm use 20

# Ou baixar de https://nodejs.org/
```

### Vulnerabilidades
- 2 vulnerabilidades moderadas detectadas
- Execute `npm audit` para detalhes
- Execute `npm audit fix` para corrigir automaticamente

---

## 🚀 Como Iniciar a Aplicação

### Opção 1: Manualmente (2 terminais)

**Terminal 1 - Backend:**
```bash
cd /home/alex/Software/script/agendamento/api
npm run dev
```
Servidor rodará em: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd /home/alex/Software/script/agendamento/site
npm run dev
```
Aplicação rodará em: http://localhost:3000

### Opção 2: Script Automático (criar)

Criar arquivo `start.sh`:
```bash
#!/bin/bash
cd /home/alex/Software/script/agendamento

# Iniciar backend em background
cd api
npm run dev > ../logs/backend.log 2>&1 &
echo "Backend iniciado (PID: $!)"

# Aguardar 3 segundos
sleep 3

# Iniciar frontend
cd ../site
npm run dev
```

---

## 🔐 Credenciais de Teste

⚠️ **ATENÇÃO:** Você precisa criar um usuário no banco de dados para fazer login!

### Criar Usuário de Teste (SQL):

```sql
-- 1. Buscar IDs necessários
SELECT nivel_acesso_id FROM nivel_acesso LIMIT 1;
SELECT empresa_id FROM empresa LIMIT 1;

-- 2. Criar usuário (substitua os UUIDs pelos valores reais)
INSERT INTO login (
  login_id,
  nivel_acesso_id,
  empresa_id,
  login,
  email,
  senha,
  nome
) VALUES (
  gen_random_uuid(),
  '<nivel_acesso_id>',
  '<empresa_id>',
  'admin',
  'admin@exemplo.invalid',
  '$2b$10$YourHashedPasswordHere', -- Use bcrypt para gerar
  'Administrador'
);
```

### Gerar Hash de Senha:

```javascript
// Criar arquivo: api/generate-password.js
import bcrypt from 'bcrypt'

const password = 'EXEMPLO_SENHA_FORTE'
const hash = await bcrypt.hash(password, 10)
console.log('Hash:', hash)
```

Execute:
```bash
cd api
node generate-password.js
```

---

## 📁 Estrutura de Arquivos

```
agendamento/
├── site/                    # Frontend
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── services/       # Serviços de API
│   │   ├── contexts/       # Context API
│   │   └── assets/         # Estilos e imagens
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── api/                     # Backend
│   ├── src/
│   │   ├── config/         # Configurações
│   │   ├── controllers/    # Controllers
│   │   ├── models/         # Models
│   │   ├── routes/         # Rotas
│   │   ├── middleware/     # Middlewares
│   │   └── utils/          # Utilitários
│   ├── package.json
│   └── .env
│
├── docs/                    # Documentação
├── DOCUMENTACAO_BANCO_DADOS.md
├── PLANEJAMENTO_APLICACAO.md
├── INSTALACAO_COMPLETA.md
└── README.md
```

---

## 🧪 Testes

### Testar Backend:
```bash
cd api

# Health check
curl http://localhost:5000/health

# Testar banco de dados
node test-db.js
```

### Testar Frontend:
Abra http://localhost:3000 no navegador

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
cd api && npm install
cd ../site && npm install
```

### Erro: "Port already in use"
```bash
# Mudar porta no .env
# Backend: PORT=5001
# Frontend: vite --port 3001
```

### Erro: "Database connection failed"
```bash
# Verificar credenciais no api/.env
# Testar conexão: node api/test-db.js
```

### Erro: Node.js version
```bash
# Atualizar Node.js para v18 ou v20
nvm install 20
nvm use 20
```

---

## 📝 Próximos Passos

1. ✅ **Criar usuário de teste** no banco de dados
2. ✅ **Iniciar servidores** (backend e frontend)
3. ✅ **Acessar aplicação** em http://localhost:3000
4. ✅ **Fazer login** com usuário criado
5. ✅ **Testar funcionalidades** básicas
6. 🚧 **Desenvolver CRUDs** (Agendamentos, Profissionais, etc.)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs do servidor
2. Consultar documentação
3. Verificar console do navegador (F12)

---

**Instalação concluída em:** 2025-10-25  
**Versão:** 1.0.0  
**Status:** ✅ PRONTO PARA USO

---

## 🎯 Checklist Final

- [x] Estrutura criada
- [x] Dependências instaladas
- [x] Banco de dados conectado
- [x] Configurações criadas
- [ ] Usuário de teste criado
- [ ] Servidores iniciados
- [ ] Login testado
- [ ] Funcionalidades básicas testadas








