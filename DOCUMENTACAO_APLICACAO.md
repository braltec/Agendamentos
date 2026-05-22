# 📚 Documentação Completa - Sistema de Agendamento AIResolve

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Funcionalidades](#funcionalidades)
6. [Fluxos de Trabalho](#fluxos-de-trabalho)
7. [API Backend](#api-backend)
8. [Frontend](#frontend)
9. [Banco de Dados](#banco-de-dados)
10. [Autenticação e Segurança](#autenticação-e-segurança)
11. [Multi-Tenancy](#multi-tenancy)
12. [Instalação e Configuração](#instalação-e-configuração)
13. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Descrição do Sistema

O **Sistema de Agendamento AIResolve** é uma aplicação web completa para gerenciamento de agendamentos, clientes, profissionais e serviços. O sistema foi desenvolvido com foco em multi-tenancy (múltiplas empresas), integração com WhatsApp via Evolution API e Google Calendar.

### Objetivos

- ✅ Gerenciar agendamentos de múltiplas empresas
- ✅ Automatizar comunicação com clientes via WhatsApp
- ✅ Sincronizar agendamentos com Google Calendar
- ✅ Fornecer dashboard com métricas e gráficos
- ✅ Facilitar configuração inicial através de wizard
- ✅ Garantir segurança e isolamento de dados entre empresas

### Público-Alvo

- 🏢 Empresas de serviços (salões de beleza, clínicas, consultórios)
- 👥 Profissionais autônomos
- 🏪 Estabelecimentos com múltiplos profissionais

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                      │
│                    React + Vite + Tailwind                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
                      │ JSON
┌─────────────────────▼───────────────────────────────────────┐
│                    API REST (Backend)                       │
│                  Node.js + Express.js                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Controllers  │  │  Middleware  │  │   Services   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Models    │  │    Routes    │  │     Auth     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQL
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Multi-Tenant Data (empresa_id isolation)             │  │
│  │ • agendamento  • clientes  • profissional            │  │
│  │ • servicos     • empresa   • login                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────┐           ┌────────▼────────┐
│ Evolution API│           │ Google Calendar │
│  (WhatsApp)  │           │      API        │
└──────────────┘           └─────────────────┘
```

### Padrões Arquiteturais

1. **MVC (Model-View-Controller)**
   - Model: Camada de dados (PostgreSQL)
   - View: Interface React
   - Controller: API REST

2. **RESTful API**
   - Endpoints padronizados
   - Verbos HTTP semânticos
   - Respostas JSON

3. **Multi-Tenancy**
   - Isolamento por `empresa_id`
   - Middleware de segurança
   - Queries filtradas automaticamente

---

## 💻 Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React** | 18.x | Biblioteca JavaScript para UI |
| **Vite** | 5.x | Build tool e dev server |
| **React Router** | 6.x | Roteamento SPA |
| **TailwindCSS** | 3.x | Framework CSS utility-first |
| **Lucide React** | Latest | Ícones SVG |
| **Axios** | Latest | Cliente HTTP |

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 20.x | Runtime JavaScript |
| **Express.js** | 4.x | Framework web |
| **PostgreSQL** | Latest | Banco de dados relacional |
| **pg** | Latest | Driver PostgreSQL para Node.js |
| **jsonwebtoken** | Latest | Autenticação JWT |
| **bcrypt** | Latest | Hash de senhas |
| **dotenv** | Latest | Variáveis de ambiente |
| **cors** | Latest | Cross-Origin Resource Sharing |

### Ferramentas de Desenvolvimento

- **NVM** - Node Version Manager
- **Git** - Controle de versão
- **VS Code / Cursor** - IDE

---

## 📁 Estrutura do Projeto

```
agendamento/
├── api/                          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/              # Configurações
│   │   │   └── database.js      # Conexão PostgreSQL
│   │   ├── controllers/         # Lógica de negócio
│   │   │   ├── auth.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── empresas.controller.js
│   │   │   └── wizard.controller.js
│   │   ├── middleware/          # Middlewares
│   │   │   ├── auth.middleware.js
│   │   │   └── multiTenant.middleware.js
│   │   ├── models/              # Acesso a dados
│   │   │   ├── empresa.model.js
│   │   │   ├── wizard.model.js
│   │   │   └── user.model.js
│   │   ├── routes/              # Rotas da API
│   │   │   ├── auth.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── empresas.routes.js
│   │   │   └── wizard.routes.js
│   │   ├── app.js               # Configuração Express
│   │   └── server.js            # Inicialização do servidor
│   ├── package.json
│   └── .env                     # Variáveis de ambiente
│
├── site/                         # Frontend (React + Vite)
│   ├── public/                  # Arquivos estáticos
│   ├── src/
│   │   ├── assets/              # Imagens, estilos
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │       └── index.css
│   │   ├── components/          # Componentes React
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── AuthLayout.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── MainLayout.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── ui/              # UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Logo.jsx
│   │   │   └── features/        # Feature components
│   │   ├── contexts/            # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/               # Páginas
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Agendamentos/
│   │   │   ├── Clientes/
│   │   │   ├── Configuracoes/
│   │   │   ├── Empresas/
│   │   │   ├── Profissionais/
│   │   │   ├── Servicos/
│   │   │   └── Wizard/
│   │   ├── services/            # Serviços API
│   │   │   ├── api.js
│   │   │   ├── auth.service.js
│   │   │   ├── dashboard.service.js
│   │   │   ├── empresas.service.js
│   │   │   └── wizard.service.js
│   │   ├── utils/               # Utilitários
│   │   ├── App.jsx              # Componente raiz
│   │   ├── main.jsx             # Entry point
│   │   └── router.jsx           # Configuração de rotas
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── conecta_db.conf               # Configuração do banco
├── estrutura_banco.sql           # Schema do banco
├── backup_25_10_25               # Backup do banco
├── DOCUMENTACAO_BANCO_DADOS.md  # Doc do banco de dados
├── DOCUMENTACAO_APLICACAO.md    # Esta documentação
└── EXCLUSAO_SEGURA.md           # Doc sobre soft delete

```

---

## ⚙️ Funcionalidades

### 1. Autenticação e Autorização

#### Login
- ✅ Autenticação via email e senha
- ✅ Geração de token JWT
- ✅ Armazenamento seguro de senhas (bcrypt)
- ✅ Sessão persistente (localStorage)

#### Níveis de Acesso
- **Super Admin** (`nivel_acesso_id = 1`): Acesso total a todas as empresas
- **Admin Empresa**: Acesso total à sua empresa
- **Usuário Normal**: Acesso limitado à sua empresa

### 2. Dashboard

#### Métricas Principais
- 📊 **Agendamentos Hoje**: Quantidade de agendamentos do dia
- 👥 **Clientes Ativos**: Últimos 90 dias
- 💼 **Serviços Realizados**: Total do mês (excluindo cancelados)
- 💰 **Receita do Mês**: Soma dos valores dos agendamentos (excluindo cancelados)

#### Gráfico de Agendamentos
- 📈 **Gráfico de Linhas**: Agendamentos vs Cancelamentos por dia do mês
- ✨ **Curvas Suaves**: Curvas Bézier para melhor visualização
- 🎨 **Responsivo**: Adapta-se ao tamanho da tela
- 🖱️ **Interativo**: Tooltips ao passar o mouse

#### Listas
- 📅 **Próximos Agendamentos**: Lista dos próximos agendamentos
- 👨‍💼 **Profissionais Hoje**: Profissionais com agendamentos hoje

#### Dashboard Super Admin
- 📊 **Estatísticas por Empresa**: Tabela agregada de todas as empresas
- 🌐 **Visão Global**: Métricas consolidadas de todo o sistema

### 3. Gestão de Empresas

#### Cadastro de Empresas
- ✅ Criação de nova empresa
- ✅ Criação automática de usuário admin
- ✅ Geração de senha aleatória
- ✅ Transações atômicas (rollback em caso de erro)

#### Listagem de Empresas
- 📋 **Multi-Tenant**: Usuários normais veem apenas sua empresa
- 🌐 **Super Admin**: Vê todas as empresas
- 🔍 **Informações**: Nome, contato, endereço

### 4. Wizard de Configuração Inicial

O wizard guia novas empresas através de 7 etapas de configuração:

#### Etapa 1: Configurações Básicas
- 📝 Antecedência mínima para agendamento
- ⏱️ Intervalo entre agendamentos

#### Etapa 2: Horários de Funcionamento
- 📅 Definição de horários por dia da semana
- ⏰ Suporte a múltiplos períodos (ex: manhã e tarde)
- 🍽️ Permite configurar horário de almoço

#### Etapa 3: Profissionais
- 👤 Cadastro de profissionais
- 📞 Nome, especialidade, contato
- 🏠 Endereço (usa endereço da empresa)

#### Etapa 4: Serviços
- 💼 Cadastro de serviços
- ⏱️ Duração em minutos
- 💰 Valor do serviço

#### Etapa 5: Vínculos Profissional-Serviço
- 🔗 Associação de serviços aos profissionais
- ✅ Seleção múltipla

#### Etapa 6: WhatsApp (Evolution API)
- 📱 Configuração da instância WhatsApp
- 🔑 UUID da instância Evolution API
- 📝 Nome amigável da instância

#### Etapa 7: Revisão
- 👁️ Visualização de todas as configurações
- ✅ Confirmação e salvamento

### 5. Configurações da Empresa

Permite editar todas as informações configuradas no wizard:

#### Aba Empresa
- ✏️ Nome, contato, observações
- 📍 Endereço completo (CEP, logradouro, número, bairro, cidade, UF)
- 📞 Contato do agente

#### Aba Agendamentos
- ⏱️ Antecedência mínima
- ⏱️ Intervalo entre agendamentos
- 📅 Horários de funcionamento (editável)
- ➕ Adicionar múltiplos períodos por dia

#### Aba WhatsApp
- 🔑 UUID da instância
- 📝 Nome da instância
- ⚠️ Alerta ao editar (pode afetar funcionamento)

#### Aba Profissionais
- 📋 Lista de profissionais
- ✏️ Editar nome, especialidade, contato
- 🗑️ Excluir profissional (com validações)

#### Aba Serviços
- 📋 Lista de serviços
- ✏️ Editar nome, valor, duração
- 🔗 Vincular/desvincular profissionais
- ➕ Adicionar novos serviços
- 🗑️ Excluir serviço (soft delete)

### 6. Exclusão Segura (Soft Delete)

#### Serviços
- ✅ Soft delete: altera `status` para 'inativo'
- ✅ Mantém histórico para relatórios
- ✅ Não aparece mais nas listagens ativas

#### Profissionais
- ✅ Soft delete: altera `status` para 'inativo'
- ⚠️ Validação: não permite excluir se houver serviços ativos vinculados
- ⚠️ Validação: não permite excluir se houver agendamentos históricos
- ✅ Preserva integridade referencial

### 7. Integrações

#### WhatsApp (Evolution API)
- 📱 Comunicação automatizada com clientes
- 🤖 IA para processamento de mensagens
- 🔑 Identificação de empresa por `instancia_id`

#### Google Calendar
- 📅 Sincronização de agendamentos
- 🔄 Atualização automática
- 🔗 Link para evento no calendário

---

## 🔄 Fluxos de Trabalho

### Fluxo de Login

```
1. Usuário acessa /login
2. Insere email e senha
3. Frontend envia POST /api/auth/login
4. Backend valida credenciais
5. Backend gera token JWT
6. Backend retorna: { token, user: { id, nome, email, empresa_id, nivel_acesso_id } }
7. Frontend armazena token e user no localStorage
8. Frontend redireciona para /dashboard
```

### Fluxo de Cadastro de Nova Empresa

```
1. Super Admin acessa /empresas
2. Clica em "Nova Empresa"
3. Preenche formulário (nome, email admin, etc.)
4. Frontend envia POST /api/empresas
5. Backend inicia transação
6. Backend cria registro em 'empresa'
7. Backend cria registro em 'endereco'
8. Backend cria usuário admin em 'login'
9. Backend gera senha aleatória
10. Backend faz commit da transação
11. Backend retorna empresa e senha gerada
12. Frontend exibe senha para o admin copiar
```

### Fluxo do Wizard de Configuração

```
1. Novo admin faz login pela primeira vez
2. Sistema detecta wizard não completado
3. Redireciona para /wizard
4. Admin passa pelas 7 etapas:
   - Etapa 1: Configurações básicas
   - Etapa 2: Horários de funcionamento
   - Etapa 3: Cadastro de profissionais
   - Etapa 4: Cadastro de serviços
   - Etapa 5: Vínculos profissional-serviço
   - Etapa 6: Instância WhatsApp
   - Etapa 7: Revisão
5. Ao finalizar, envia POST /api/wizard/completar
6. Backend salva todas as configurações em transação
7. Backend marca wizard como completo
8. Frontend redireciona para /dashboard
```

### Fluxo de Agendamento via WhatsApp

```
1. Cliente envia mensagem WhatsApp
2. Evolution API recebe mensagem
3. Evolution API envia para o backend
4. Backend identifica empresa por instancia_id
5. Backend busca contexto da sessão
6. Backend envia para IA processar
7. IA interpreta intenção (agendar, cancelar, etc.)
8. Backend valida disponibilidade
9. Backend cria agendamento
10. Backend cria evento no Google Calendar
11. Backend gera protocolo único
12. Backend envia confirmação via WhatsApp
```

---

## 🔌 API Backend

### Estrutura Base

**Base URL**: `http://localhost:3001/api`

**Headers Padrão**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token_jwt>"
}
```

### Endpoints de Autenticação

#### POST /api/auth/login
Realiza login do usuário.

**Request**:
```json
{
  "email": "admin@empresa.com",
  "senha": "senha123"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nome": "Administrador",
    "email": "admin@empresa.com",
    "empresa_id": "uuid",
    "nivel_acesso_id": 1
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Email ou senha inválidos"
}
```

#### GET /api/auth/me
Retorna dados do usuário autenticado.

**Headers**: `Authorization: Bearer <token>`

**Response Success (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "nome": "Administrador",
    "email": "admin@empresa.com",
    "empresa_id": "uuid",
    "nivel_acesso_id": 1
  }
}
```

### Endpoints de Dashboard

#### GET /api/dashboard/stats
Retorna estatísticas do dashboard.

**Query Params**: Nenhum (usa empresa_id do token JWT)

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "agendamentosHoje": 5,
    "clientesAtivos": 23,
    "servicosRealizados": 25,
    "receitaMes": 1455.00
  }
}
```

#### GET /api/dashboard/proximos-agendamentos
Retorna próximos agendamentos.

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "agend_id": "uuid",
      "agend_data": "2025-10-26",
      "agend_hora": "09:00:00",
      "cliente_nome": "Pamela Moraes",
      "servicos_nome": "Pedicure",
      "status_agend_nome": "Confirmado",
      "empresa_nome": "Espaço Pamela Moraes"
    }
  ]
}
```

#### GET /api/dashboard/profissionais-hoje
Retorna profissionais com agendamentos hoje.

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "profissional_id": "uuid",
      "profissional_nome": "Julia Fane",
      "profissional_especialidade": "Cabeleireira e maquiadora",
      "total_agendamentos": 1,
      "empresa_nome": "Espaço Pamela Moraes"
    }
  ]
}
```

#### GET /api/dashboard/grafico-agendamentos
Retorna dados para o gráfico de agendamentos do mês.

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "data": "2025-10-01",
      "dia": 1,
      "agendamentos": 1,
      "cancelamentos": 1
    },
    {
      "data": "2025-10-02",
      "dia": 2,
      "agendamentos": 1,
      "cancelamentos": 2
    }
  ]
}
```

#### GET /api/dashboard/estatisticas-por-empresa
Retorna estatísticas agregadas por empresa (Super Admin apenas).

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "empresa_nome": "Espaço Pamela Moraes",
      "agendamentos_hoje": 1,
      "clientes_ativos": 23,
      "servicos_realizados": 25,
      "receita_mes": 1455.00
    }
  ]
}
```

### Endpoints de Empresas

#### GET /api/empresas
Lista empresas (filtrado por permissão).

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "empresa_id": "uuid",
      "empresa_nome": "Espaço Pamela Moraes",
      "empresa_contato": "35999999999",
      "cep": "35573356",
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "Formiga",
      "uf": "MG"
    }
  ]
}
```

#### POST /api/empresas
Cria nova empresa (Super Admin apenas).

**Request**:
```json
{
  "empresa_nome": "Nova Empresa",
  "empresa_contato": "35999999999",
  "cep": "35573356",
  "logradouro": "Rua Exemplo",
  "numero": "123",
  "bairro": "Centro",
  "cidade": "Formiga",
  "uf": "MG",
  "admin_nome": "Admin Nome",
  "admin_email": "admin@novaempresa.com"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Empresa criada com sucesso",
  "data": {
    "empresa_id": "uuid",
    "senha_admin": "SenhaGerada123"
  }
}
```

### Endpoints do Wizard

#### GET /api/wizard/status
Verifica se o wizard foi completado.

**Response Success (200)**:
```json
{
  "success": true,
  "completed": false
}
```

#### GET /api/wizard/empresa
Retorna dados completos da empresa para o wizard.

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "empresa": {
      "empresa_id": "uuid",
      "empresa_nome": "Espaço Pamela Moraes",
      "antecedencia_minima": 60,
      "intervalo_agendamentos": 15
    },
    "horarios": [
      {
        "dia_semana": 1,
        "hora_inicio": "08:00:00",
        "hora_fim": "12:00:00"
      }
    ],
    "profissionais": [
      {
        "profissional_id": "uuid",
        "profissional_nome": "Julia Fane",
        "especialidade": "Cabeleireira"
      }
    ],
    "servicos": [
      {
        "servicos_id": "uuid",
        "servicos_nome": "Corte de Cabelo",
        "servicos_valor": 50.00,
        "servicos_duracao_minutos": 60,
        "profissionais_ids": ["uuid1", "uuid2"]
      }
    ],
    "instancia": {
      "instancia_id": "uuid-evolution",
      "instancia_nome": "WhatsApp Principal"
    }
  }
}
```

#### POST /api/wizard/completar
Salva todas as configurações do wizard.

**Request**:
```json
{
  "configuracoes": {
    "antecedencia_minima": 60,
    "intervalo_agendamentos": 15
  },
  "horarios": [
    {
      "dia_semana": 1,
      "hora_inicio": "08:00",
      "hora_fim": "18:00"
    }
  ],
  "profissionais": [
    {
      "nome": "Julia Fane",
      "especialidade": "Cabeleireira",
      "contato": "35999999999"
    }
  ],
  "servicos": [
    {
      "nome": "Corte de Cabelo",
      "valor": 50.00,
      "duracao_minutos": 60
    }
  ],
  "vinculos": [
    {
      "profissional_index": 0,
      "servico_index": 0
    }
  ],
  "instancia": {
    "instancia_id": "uuid-evolution",
    "instancia_nome": "WhatsApp Principal"
  }
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Configuração inicial concluída com sucesso"
}
```

#### PUT /api/wizard/empresa
Atualiza dados da empresa.

**Request**:
```json
{
  "empresa_nome": "Novo Nome",
  "empresa_contato": "35999999999",
  "cep": "35573356",
  "observacoes": "Observações",
  "empresa_contato_agente": "35988888888"
}
```

#### PUT /api/wizard/horarios
Atualiza horários de funcionamento.

**Request**:
```json
{
  "horarios": [
    {
      "dia_semana": 1,
      "hora_inicio": "08:00",
      "hora_fim": "12:00"
    },
    {
      "dia_semana": 1,
      "hora_inicio": "14:00",
      "hora_fim": "18:00"
    }
  ]
}
```

#### PUT /api/wizard/servicos/:servicoId
Atualiza um serviço.

**Request**:
```json
{
  "servicos_valor": 60.00,
  "servicos_duracao_minutos": 90,
  "profissionais_ids": ["uuid1", "uuid2"]
}
```

#### POST /api/wizard/servicos
Cria novo serviço.

**Request**:
```json
{
  "servicos_nome": "Novo Serviço",
  "servicos_valor": 100.00,
  "servicos_duracao_minutos": 120,
  "profissionais_ids": ["uuid1"]
}
```

#### DELETE /api/wizard/servicos/:servicoId
Exclui (soft delete) um serviço.

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Serviço excluído com sucesso"
}
```

#### PUT /api/wizard/profissionais/:profissionalId
Atualiza um profissional.

**Request**:
```json
{
  "profissional_nome": "Novo Nome",
  "especialidade": "Nova Especialidade",
  "profissional_contato": "35999999999"
}
```

#### DELETE /api/wizard/profissionais/:profissionalId
Exclui (soft delete) um profissional.

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Profissional excluído com sucesso"
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Não é possível excluir este profissional pois existem serviços ativos vinculados a ele"
}
```

---

## 🎨 Frontend

### Estrutura de Componentes

#### Componentes de Layout

**MainLayout.jsx**
- Container principal da aplicação
- Inclui Sidebar e Header
- Renderiza conteúdo das páginas

**Sidebar.jsx**
- Menu lateral de navegação
- Logo da empresa no topo
- Links para todas as páginas
- Destaque visual para página ativa

**Header.jsx**
- Barra superior
- Saudação ao usuário
- Notificações
- Botão de logout

**AuthLayout.jsx**
- Layout para páginas de autenticação
- Centraliza conteúdo
- Fundo gradiente

#### Componentes UI

**Button.jsx**
```jsx
<Button 
  variant="primary|secondary|ghost|danger" 
  size="sm|md|lg"
  loading={boolean}
  onClick={function}
>
  Texto do Botão
</Button>
```

**Input.jsx**
```jsx
<Input
  label="Label"
  type="text|email|password|number"
  value={value}
  onChange={handleChange}
  placeholder="Placeholder"
  required={boolean}
  disabled={boolean}
/>
```

**Card.jsx**
```jsx
<Card>
  <CardHeader>
    <h3>Título</h3>
  </CardHeader>
  <CardBody>
    Conteúdo
  </CardBody>
</Card>
```

**Logo.jsx**
```jsx
<Logo 
  size="sm|md|lg|xl" 
  variant="full|icon" 
/>
```

### Páginas Principais

#### Dashboard.jsx
- Métricas em cards
- Gráfico de linhas (agendamentos vs cancelamentos)
- Lista de próximos agendamentos
- Lista de profissionais hoje
- Estatísticas por empresa (Super Admin)

#### Login.jsx
- Logo centralizado
- Formulário de login
- Validação de campos
- Feedback de erros

#### Configuracoes/index.jsx
- Abas: Empresa, Agendamentos, WhatsApp, Profissionais, Serviços
- Edição inline
- Validações
- Modais para adicionar novos itens

#### Empresas/index.jsx
- Lista de empresas
- Modal para nova empresa
- Exibição de senha gerada

#### Wizard/index.jsx
- 7 etapas de configuração
- Navegação entre etapas
- Validação por etapa
- Resumo final

### Roteamento

```jsx
// router.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/agendamentos" element={<Agendamentos />} />
    <Route path="/clientes" element={<Clientes />} />
    <Route path="/profissionais" element={<Profissionais />} />
    <Route path="/servicos" element={<Servicos />} />
    <Route path="/empresas" element={<Empresas />} />
    <Route path="/configuracoes" element={<Configuracoes />} />
    <Route path="/wizard" element={<Wizard />} />
  </Route>
</Routes>
```

### Context API

#### AuthContext
Gerencia estado de autenticação global.

```jsx
const { user, login, logout, loading } = useAuth()

// user: { id, nome, email, empresa_id, nivel_acesso_id }
// login(email, senha): Promise<{ success, message }>
// logout(): void
// loading: boolean
```

### Services

#### api.js
Cliente Axios configurado com:
- Base URL
- Interceptors para adicionar token JWT
- Tratamento de erros 401 (logout automático)

```javascript
import api from './api'

// Exemplo de uso
const response = await api.get('/endpoint')
const data = await api.post('/endpoint', body)
```

#### auth.service.js
```javascript
import authService from './auth.service'

await authService.login(email, senha)
await authService.me()
authService.logout()
```

#### dashboard.service.js
```javascript
import dashboardService from './dashboard.service'

await dashboardService.getStats()
await dashboardService.getProximosAgendamentos()
await dashboardService.getProfissionaisHoje()
await dashboardService.getGraficoAgendamentos()
await dashboardService.getEstatisticasPorEmpresa()
```

#### empresas.service.js
```javascript
import empresasService from './empresas.service'

await empresasService.listar()
await empresasService.criar(data)
```

#### wizard.service.js
```javascript
import wizardService from './wizard.service'

await wizardService.checkStatus()
await wizardService.getEmpresaCompleta()
await wizardService.completar(data)
await wizardService.updateEmpresa(data)
await wizardService.updateHorarios(horarios)
await wizardService.updateServico(servicoId, data)
await wizardService.createServico(data)
await wizardService.deleteServico(servicoId)
await wizardService.updateProfissional(profissionalId, data)
await wizardService.deleteProfissional(profissionalId)
```

### Estilização

#### TailwindCSS
Classes utilitárias para estilização rápida.

**Cores Principais**:
- `primary`: Verde (#10b981)
- `danger`: Vermelho (#ef4444)
- `success`: Verde (#10b981)
- `warning`: Amarelo (#f59e0b)

**Exemplo**:
```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">
    Título
  </h2>
  <p className="text-gray-600">
    Conteúdo
  </p>
</div>
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

Para documentação completa do banco de dados, consulte: `DOCUMENTACAO_BANCO_DADOS.md`

#### empresa
Armazena dados das empresas.

**Colunas principais**:
- `empresa_id` (PK)
- `empresa_nome`
- `empresa_contato`
- `cep`
- `observacoes`
- `empresa_contato_agente`

#### login
Usuários do sistema.

**Colunas principais**:
- `login_id` (PK)
- `email`
- `senha` (hash bcrypt)
- `nome`
- `empresa_id` (FK)
- `nivel_acesso_id` (FK)

#### agendamento
Agendamentos realizados.

**Colunas principais**:
- `agend_id` (PK)
- `empresa_id` (FK)
- `cliente_id` (FK)
- `profissional_id` (FK)
- `agend_data`
- `agend_hora`
- `agend_valor`
- `status_agend_id` (FK)
- `periodo` (tstzrange - calculado)

#### clientes
Clientes das empresas.

**Colunas principais**:
- `cliente_id` (PK)
- `empresa_id` (FK)
- `cliente_nome`
- `cliente_fone`

#### profissional
Profissionais das empresas.

**Colunas principais**:
- `profissional_id` (PK)
- `empresa_id` (FK)
- `profissional_nome`
- `especialidade`
- `profissional_contato`
- `status` ('ativo'/'inativo')

#### servicos
Serviços oferecidos (global, sem empresa_id).

**Colunas principais**:
- `servicos_id` (PK)
- `servicos_nome`
- `servicos_valor`
- `servicos_duracao` (INTERVAL)
- `status` ('ativo'/'inativo')

#### profissional_servico
Vínculo entre profissionais e serviços.

**Colunas principais**:
- `profissional_id` (FK)
- `servicos_id` (FK)

#### horario_f
Horários de funcionamento (cabeçalho).

**Colunas principais**:
- `horario_f_id` (PK)

#### horario_det
Detalhes dos horários.

**Colunas principais**:
- `horario_det_id` (PK)
- `horario_f_id` (FK)
- `dia_semana` (0-6)
- `hora_inicio`
- `hora_fim`

#### profissional_horario
Vínculo entre profissionais e horários.

**Colunas principais**:
- `profissional_id` (FK)
- `horario_f_id` (FK)

#### instancia
Instâncias WhatsApp (Evolution API).

**Colunas principais**:
- `instancia_id` (PK - UUID da Evolution)
- `empresa_id` (FK)
- `instancia_nome`

### Relacionamentos Importantes

```
empresa (1) ─────── (N) login
empresa (1) ─────── (N) clientes
empresa (1) ─────── (N) profissional
empresa (1) ─────── (N) agendamento
empresa (1) ─────── (1) instancia

profissional (N) ─────── (N) servicos
  (via profissional_servico)

profissional (N) ─────── (N) horario_f
  (via profissional_horario)

agendamento (N) ─────── (1) clientes
agendamento (N) ─────── (1) profissional
agendamento (N) ─────── (1) status_agend
```

---

## 🔐 Autenticação e Segurança

### JWT (JSON Web Tokens)

#### Geração do Token
```javascript
const token = jwt.sign(
  {
    id: user.login_id,
    email: user.email,
    empresa_id: user.empresa_id,
    nivel_acesso_id: user.nivel_acesso_id
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
)
```

#### Verificação do Token
```javascript
// Middleware: auth.middleware.js
const token = req.headers.authorization?.split(' ')[1]
const decoded = jwt.verify(token, process.env.JWT_SECRET)
req.user = decoded
```

### Hash de Senhas

```javascript
// Ao criar usuário
const hashedPassword = await bcrypt.hash(senha, 10)

// Ao fazer login
const isValid = await bcrypt.compare(senhaDigitada, senhaHashBanco)
```

### Multi-Tenant Security

#### Middleware de Isolamento
```javascript
// multiTenant.middleware.js
export function multiTenantFilter(req, res, next) {
  const empresaId = req.user.empresa_id
  const nivelAcessoId = req.user.nivel_acesso_id
  
  // Super Admin vê tudo
  if (nivelAcessoId === SUPER_ADMIN_ID) {
    req.canAccessAllCompanies = true
    return next()
  }
  
  // Usuários normais veem apenas sua empresa
  req.empresaFilter = empresaId
  next()
}
```

#### Queries Filtradas
```javascript
// Exemplo de query com filtro multi-tenant
const query = isSuperAdmin
  ? 'SELECT * FROM agendamento'
  : 'SELECT * FROM agendamento WHERE empresa_id = $1'

const params = isSuperAdmin ? [] : [empresaId]
const result = await pool.query(query, params)
```

### Proteção de Rotas

#### Frontend
```jsx
// ProtectedRoute component
function ProtectedRoute() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Carregando...</div>
  
  if (!user) return <Navigate to="/login" />
  
  return <Outlet />
}
```

#### Backend
```javascript
// Todas as rotas protegidas usam o middleware
router.use(authenticateToken)
```

### Variáveis de Ambiente

```env
# .env (Backend)
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=agendamento
DATABASE_USER=postgres
DATABASE_PASSWORD=senha
JWT_SECRET=chave_secreta_muito_segura
NODE_ENV=development
```

---

## 🏢 Multi-Tenancy

### Conceito

Multi-tenancy permite que múltiplas empresas (tenants) usem a mesma aplicação, com dados completamente isolados entre si.

### Implementação

#### 1. Isolamento por empresa_id

Todas as tabelas principais têm a coluna `empresa_id`:
- `agendamento`
- `clientes`
- `profissional`
- `login`

#### 2. Identificação da Empresa

**No Login**:
```javascript
// O token JWT inclui empresa_id
const token = jwt.sign({ 
  id, 
  email, 
  empresa_id, 
  nivel_acesso_id 
}, JWT_SECRET)
```

**Nas Requisições**:
```javascript
// Middleware extrai empresa_id do token
req.user.empresa_id
```

#### 3. Queries Filtradas

**Exemplo - Listar Agendamentos**:
```javascript
// Usuário normal
SELECT * FROM agendamento 
WHERE empresa_id = $1

// Super Admin
SELECT * FROM agendamento
```

#### 4. Instância WhatsApp

A identificação da empresa em mensagens WhatsApp é feita por `instancia_id`:

```javascript
// Mensagem chega com instancia_id
const instancia_id = message.instance_id

// Backend busca empresa
SELECT empresa_id FROM instancia 
WHERE instancia_id = $1
```

### Níveis de Acesso

#### Super Admin (nivel_acesso_id = 1)
- ✅ Acesso a todas as empresas
- ✅ Criar novas empresas
- ✅ Ver dashboard consolidado
- ✅ Ver estatísticas por empresa

#### Admin Empresa (nivel_acesso_id = 2)
- ✅ Acesso total à sua empresa
- ✅ Gerenciar configurações
- ✅ Gerenciar profissionais e serviços
- ❌ Não vê outras empresas

#### Usuário Normal (nivel_acesso_id >= 3)
- ✅ Acesso limitado à sua empresa
- ❌ Não pode alterar configurações
- ❌ Não vê outras empresas

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js**: v20.x ou superior
- **PostgreSQL**: v12 ou superior
- **NVM**: Node Version Manager (recomendado)
- **Git**: Para controle de versão

### Passo 1: Clonar o Repositório

```bash
cd /home/alex/Software/script/agendamento
```

### Passo 2: Configurar Node.js

```bash
# Instalar NVM (se não tiver)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Carregar NVM
source ~/.bashrc

# Instalar Node.js v20
nvm install 20
nvm use 20

# Verificar versão
node --version  # deve mostrar v20.x.x
```

### Passo 3: Configurar Backend

```bash
cd api

# Instalar dependências
npm install

# Criar arquivo .env
cat > .env << EOF
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=agendamento
DATABASE_USER=postgres
DATABASE_PASSWORD=SUA_SENHA
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF

# Iniciar servidor
npm run dev
```

### Passo 4: Configurar Frontend

```bash
cd ../site

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Passo 5: Configurar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE agendamento;

# Sair do psql
\q

# Restaurar estrutura
psql -U postgres -d agendamento -f estrutura_banco.sql

# (Opcional) Restaurar backup
psql -U postgres -d agendamento -f backup_25_10_25
```

### Passo 6: Acessar Aplicação

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Login**: Use as credenciais do banco de dados

### Portas Utilizadas

| Serviço | Porta |
|---------|-------|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3001 |
| PostgreSQL | 5432 |

---

## 👨‍💻 Guia de Desenvolvimento

### Estrutura de Commits

```bash
# Formato recomendado
git commit -m "tipo: descrição curta"

# Tipos:
# feat: Nova funcionalidade
# fix: Correção de bug
# docs: Documentação
# style: Formatação (não afeta código)
# refactor: Refatoração
# test: Testes
# chore: Tarefas de manutenção
```

**Exemplos**:
```bash
git commit -m "feat: adicionar gráfico de linhas no dashboard"
git commit -m "fix: corrigir filtro multi-tenant em agendamentos"
git commit -m "docs: atualizar documentação da API"
```

### Boas Práticas

#### Backend

1. **Sempre usar transações para operações múltiplas**:
```javascript
const client = await pool.connect()
try {
  await client.query('BEGIN')
  // operações
  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
}
```

2. **Validar entrada de dados**:
```javascript
if (!email || !senha) {
  return res.status(400).json({
    success: false,
    message: 'Email e senha são obrigatórios'
  })
}
```

3. **Usar prepared statements (proteção SQL injection)**:
```javascript
// BOM
const result = await pool.query(
  'SELECT * FROM login WHERE email = $1',
  [email]
)

// RUIM (vulnerável a SQL injection)
const result = await pool.query(
  `SELECT * FROM login WHERE email = '${email}'`
)
```

4. **Tratar erros adequadamente**:
```javascript
try {
  // código
} catch (error) {
  console.error('Erro detalhado:', error)
  res.status(500).json({
    success: false,
    message: 'Mensagem amigável para o usuário',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  })
}
```

#### Frontend

1. **Usar hooks corretamente**:
```javascript
// useEffect para carregar dados
useEffect(() => {
  async function carregarDados() {
    const data = await service.getData()
    setData(data)
  }
  carregarDados()
}, []) // dependências corretas
```

2. **Validar formulários**:
```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  
  if (!email || !senha) {
    setError('Preencha todos os campos')
    return
  }
  
  // continuar
}
```

3. **Feedback visual**:
```javascript
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await service.action()
    // sucesso
  } catch (error) {
    // erro
  } finally {
    setLoading(false)
  }
}
```

4. **Componentização**:
```javascript
// Dividir componentes grandes em menores
// Reutilizar componentes comuns (Button, Input, Card)
// Manter componentes focados em uma responsabilidade
```

### Adicionando Nova Funcionalidade

#### Exemplo: Adicionar página de Relatórios

**1. Backend - Model**:
```javascript
// api/src/models/relatorios.model.js
export async function getRelatorioMensal(empresaId, mes, ano) {
  const query = `
    SELECT 
      COUNT(*) as total_agendamentos,
      SUM(agend_valor) as receita_total
    FROM agendamento
    WHERE empresa_id = $1
    AND EXTRACT(MONTH FROM agend_data) = $2
    AND EXTRACT(YEAR FROM agend_data) = $3
  `
  const result = await pool.query(query, [empresaId, mes, ano])
  return result.rows[0]
}
```

**2. Backend - Controller**:
```javascript
// api/src/controllers/relatorios.controller.js
export async function getRelatorioMensal(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const { mes, ano } = req.query
    
    const data = await relatoriosModel.getRelatorioMensal(
      empresaId, 
      mes, 
      ano
    )
    
    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    })
  }
}
```

**3. Backend - Route**:
```javascript
// api/src/routes/relatorios.routes.js
import express from 'express'
import * as controller from '../controllers/relatorios.controller.js'

const router = express.Router()

router.get('/mensal', controller.getRelatorioMensal)

export default router
```

**4. Backend - Registrar rota**:
```javascript
// api/src/app.js
import relatoriosRoutes from './routes/relatorios.routes.js'

app.use('/api/relatorios', authenticateToken, relatoriosRoutes)
```

**5. Frontend - Service**:
```javascript
// site/src/services/relatorios.service.js
import api from './api'

const relatoriosService = {
  getRelatorioMensal: async (mes, ano) => {
    const response = await api.get('/relatorios/mensal', {
      params: { mes, ano }
    })
    return response.data.data
  }
}

export default relatoriosService
```

**6. Frontend - Página**:
```jsx
// site/src/pages/Relatorios/index.jsx
import { useState, useEffect } from 'react'
import relatoriosService from '../../services/relatorios.service'
import Card, { CardHeader, CardBody } from '../../components/ui/Card'

export default function Relatorios() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function carregarDados() {
      try {
        const mes = new Date().getMonth() + 1
        const ano = new Date().getFullYear()
        const data = await relatoriosService.getRelatorioMensal(mes, ano)
        setDados(data)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarDados()
  }, [])
  
  if (loading) return <div>Carregando...</div>
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
      <Card>
        <CardHeader>
          <h3>Relatório Mensal</h3>
        </CardHeader>
        <CardBody>
          <p>Total de Agendamentos: {dados?.total_agendamentos}</p>
          <p>Receita Total: R$ {dados?.receita_total}</p>
        </CardBody>
      </Card>
    </div>
  )
}
```

**7. Frontend - Adicionar rota**:
```jsx
// site/src/router.jsx
import Relatorios from './pages/Relatorios'

<Route path="/relatorios" element={<Relatorios />} />
```

**8. Frontend - Adicionar ao menu**:
```jsx
// site/src/components/layout/Sidebar.jsx
import { FileText } from 'lucide-react'

const menuItems = [
  // ... outros itens
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
]
```

---

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro: "Cannot find module"

**Causa**: Dependências não instaladas ou versão errada do Node.js

**Solução**:
```bash
# Verificar versão do Node
node --version  # deve ser v20.x

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

#### 2. Erro: "EADDRINUSE: address already in use"

**Causa**: Porta já está sendo usada

**Solução**:
```bash
# Encontrar processo usando a porta
lsof -i :3001  # ou :5173

# Matar processo
kill -9 <PID>

# Ou mudar a porta no .env (backend) ou vite.config.js (frontend)
```

#### 3. Erro: "Connection refused" ao conectar no banco

**Causa**: PostgreSQL não está rodando ou credenciais incorretas

**Solução**:
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Verificar credenciais no .env
cat api/.env
```

#### 4. Erro: "JWT malformed" ou "Invalid token"

**Causa**: Token JWT inválido ou expirado

**Solução**:
```bash
# Frontend: Limpar localStorage
localStorage.clear()

# Fazer login novamente
```

#### 5. Erro: "Cannot read property of undefined"

**Causa**: Dados não carregados ou estrutura incorreta

**Solução**:
```javascript
// Usar optional chaining
const valor = dados?.propriedade?.subpropriedade

// Verificar se dados existem antes de usar
if (dados && dados.propriedade) {
  // usar dados
}
```

#### 6. Dashboard não mostra dados

**Causa**: Filtro multi-tenant ou dados não existem

**Solução**:
```bash
# Verificar no backend se a query está correta
console.log('empresa_id:', req.user.empresa_id)
console.log('nivel_acesso_id:', req.user.nivel_acesso_id)

# Verificar se há dados no banco
psql -U postgres -d agendamento
SELECT COUNT(*) FROM agendamento WHERE empresa_id = 'uuid';
```

#### 7. Gráfico não aparece

**Causa**: Dados vazios ou erro no cálculo

**Solução**:
```javascript
// Verificar se graficoData tem dados
console.log('graficoData:', graficoData)

// Adicionar fallback
{graficoData.length === 0 ? (
  <div>Nenhum dado disponível</div>
) : (
  // renderizar gráfico
)}
```

#### 8. Erro ao excluir profissional

**Causa**: Validações de integridade

**Solução**:
- Verificar se há serviços ativos vinculados
- Verificar se há agendamentos históricos
- Desvincular serviços antes de excluir
- Usar soft delete (status = 'inativo')

### Logs e Debugging

#### Backend
```javascript
// Adicionar logs detalhados
console.log('📊 Dados recebidos:', req.body)
console.log('👤 Usuário:', req.user)
console.log('✅ Resultado:', result)
console.error('❌ Erro:', error.message, error.stack)
```

#### Frontend
```javascript
// React DevTools
// Instalar extensão no navegador

// Console logs
console.log('Estado atual:', state)
console.log('Props:', props)

// Debugger
debugger // pausa execução
```

#### Banco de Dados
```sql
-- Verificar dados
SELECT * FROM empresa WHERE empresa_id = 'uuid';

-- Verificar logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## 📝 Notas Finais

### Próximos Passos Sugeridos

1. **Testes Automatizados**
   - Testes unitários (Jest)
   - Testes de integração
   - Testes E2E (Cypress)

2. **Deploy**
   - Configurar CI/CD
   - Deploy em servidor (AWS, DigitalOcean, etc.)
   - Configurar domínio e SSL

3. **Melhorias de Performance**
   - Cache (Redis)
   - Otimização de queries
   - Lazy loading de componentes

4. **Funcionalidades Adicionais**
   - Notificações push
   - Exportação de relatórios (PDF, Excel)
   - Integração com pagamentos
   - App mobile (React Native)

### Recursos Úteis

- **React**: https://react.dev
- **Express.js**: https://expressjs.com
- **PostgreSQL**: https://www.postgresql.org/docs
- **TailwindCSS**: https://tailwindcss.com
- **JWT**: https://jwt.io

### Contato e Suporte

Para dúvidas ou suporte, consulte:
- Documentação do banco: `DOCUMENTACAO_BANCO_DADOS.md`
- Documentação de exclusão: `EXCLUSAO_SEGURA.md`
- Código fonte: Comentários inline

---

**Versão**: 1.0  
**Data**: 26 de Outubro de 2025  
**Desenvolvido para**: AIResolve - Sistema de Agendamento  

---









