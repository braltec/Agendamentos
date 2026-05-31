# 🚀 Sistema de Agendamento

Sistema completo de gestão de agendamentos multi-tenant com integração WhatsApp e Google Calendar.

## 📁 Estrutura do Projeto

```
agendamento/
├── site/                    # Frontend (React + Vite + TailwindCSS)
├── api/                     # Backend (Node.js + Express + PostgreSQL)
├── docs/                    # Documentação
├── DOCUMENTACAO_BANCO_DADOS.md
├── PLANEJAMENTO_APLICACAO.md
└── README.md
```

## 🛠️ Tecnologias

### Frontend
- React 18
- Vite 5
- TailwindCSS 3
- React Router 6
- React Query
- Axios

### Backend
- Node.js 20
- Express 4
- PostgreSQL 16.9
- JWT Authentication
- Bcrypt

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- npm ou yarn

### 1. Configurar Banco de Dados

```bash
# Criar banco de dados
createdb agendamento

# Importar estrutura
psql agendamento < estrutura_banco.sql

# Ou restaurar backup
psql agendamento < backup_25_10_25
```

### 2. Configurar Backend

```bash
cd api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor estará rodando em: http://localhost:5000

### 3. Configurar Frontend

```bash
cd site

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env se necessário

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em: http://localhost:3000

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agendamento
DB_USER=postgres
DB_PASSWORD=EXEMPLO_DB_PASSWORD
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Sistema de Agendamento
VITE_APP_VERSION=1.0.0
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação.

### Login
```
POST /api/auth/login
{
  "email": "usuario@email.com",
  "password": "senha"
}
```

### Resposta
```json
{
  "success": true,
  "token": "EXEMPLO_JWT_TOKEN",
  "user": {
    "id": "uuid",
    "nome": "Nome do Usuário",
    "email": "usuario@email.com",
    "empresa_id": "uuid",
    "empresa_nome": "Nome da Empresa",
    "nivel_acesso": "administrador"
  }
}
```

## 📚 Documentação

- [Documentação do Banco de Dados](./DOCUMENTACAO_BANCO_DADOS.md)
- [Planejamento da Aplicação](./PLANEJAMENTO_APLICACAO.md)

## 🎯 Status do Projeto

### ✅ Concluído
- [x] Estrutura de diretórios
- [x] Configuração do frontend (React + Vite + Tailwind)
- [x] Configuração do backend (Node.js + Express)
- [x] Sistema de autenticação (JWT)
- [x] Componentes base (Button, Input, Card)
- [x] Layouts (MainLayout, AuthLayout)
- [x] Página de Login
- [x] Dashboard básico
- [x] Middleware de autenticação
- [x] Middleware multi-tenant

### 🚧 Em Desenvolvimento
- [ ] CRUD de Agendamentos
- [ ] CRUD de Profissionais
- [ ] CRUD de Clientes
- [ ] CRUD de Serviços
- [ ] Validação de disponibilidade
- [ ] Integração Google Calendar
- [ ] Relatórios

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- Alex Lima

## 📞 Suporte

Para suporte, envie um email para suporte@exemplo.com

---

**Desenvolvido com ❤️ usando React, Node.js e PostgreSQL**








