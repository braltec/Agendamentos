# 🚀 Planejamento da Aplicação - Sistema de Agendamento

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estrutura de Diretórios](#estrutura-de-diretórios)
5. [Funcionalidades](#funcionalidades)
6. [Design da Interface](#design-da-interface)
7. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)

---

## 🎯 Visão Geral

### O que vamos construir?

Uma **aplicação web moderna e responsiva** para gerenciar o sistema de agendamento multi-tenant com as seguintes características:

- ✅ **Interface Moderna**: Design clean e profissional
- ✅ **Responsiva**: Funciona em desktop, tablet e mobile
- ✅ **Rápida**: SPA (Single Page Application) com carregamento instantâneo
- ✅ **Intuitiva**: Fácil de usar, sem necessidade de treinamento
- ✅ **Segura**: Autenticação JWT, controle de acesso por empresa
- ✅ **Escalável**: Arquitetura preparada para crescimento

---

## 🏗️ Arquitetura

### Modelo de Arquitetura: **Full-Stack Moderno**

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React + Vite + TailwindCSS              │  │
│  │  - Dashboard                                         │  │
│  │  - Gestão de Agendamentos                           │  │
│  │  │  - Gestão de Profissionais                          │  │
│  │  - Gestão de Clientes                               │  │
│  │  - Gestão de Serviços                               │  │
│  │  - Relatórios                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕ HTTP/REST                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Node.js + Express                    │  │
│  │  - API REST                                          │  │
│  │  - Autenticação JWT                                  │  │
│  │  - Validação de dados                                │  │
│  │  - Lógica de negócio                                 │  │
│  │  - Middleware de segurança                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕ SQL                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        BANCO DE DADOS                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   PostgreSQL 16.9                    │  │
│  │  - 20 tabelas                                        │  │
│  │  - Multi-tenant                                      │  │
│  │  - Relacionamentos complexos                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Stack Tecnológico

### Frontend (Diretório: `site/`)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.x | Framework JavaScript moderno |
| **Vite** | 5.x | Build tool ultra-rápido |
| **TailwindCSS** | 3.x | Framework CSS utility-first |
| **React Router** | 6.x | Roteamento SPA |
| **Axios** | 1.x | Cliente HTTP |
| **React Query** | 5.x | Gerenciamento de estado server |
| **date-fns** | 3.x | Manipulação de datas |
| **React Hook Form** | 7.x | Formulários performáticos |
| **Zod** | 3.x | Validação de schemas |
| **Lucide React** | Latest | Ícones modernos |
| **Recharts** | 2.x | Gráficos e relatórios |

### Backend (Diretório: `api/`)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | 20.x LTS | Runtime JavaScript |
| **Express** | 4.x | Framework web |
| **PostgreSQL** | 16.9 | Banco de dados |
| **node-postgres (pg)** | 8.x | Driver PostgreSQL |
| **jsonwebtoken** | 9.x | Autenticação JWT |
| **bcrypt** | 5.x | Hash de senhas |
| **dotenv** | 16.x | Variáveis de ambiente |
| **cors** | 2.x | CORS middleware |
| **helmet** | 7.x | Segurança HTTP |
| **express-validator** | 7.x | Validação de dados |
| **winston** | 3.x | Logging |

### DevOps & Tools

| Tecnologia | Propósito |
|------------|-----------|
| **Git** | Controle de versão |
| **ESLint** | Linting JavaScript |
| **Prettier** | Formatação de código |
| **Nodemon** | Auto-reload em desenvolvimento |

---

## 📁 Estrutura de Diretórios

```
/home/alex/Software/script/agendamento/
│
├── 📄 DOCUMENTACAO_BANCO_DADOS.md
├── 📄 PLANEJAMENTO_APLICACAO.md
├── 📄 estrutura_banco.sql
├── 📄 backup_25_10_25
├── 📄 conecta_db.conf
│
├── 📂 site/                          # FRONTEND
│   ├── 📂 public/
│   │   ├── favicon.ico
│   │   └── logo.svg
│   │
│   ├── 📂 src/
│   │   ├── 📂 assets/               # Imagens, fontes, etc
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │
│   │   ├── 📂 components/           # Componentes reutilizáveis
│   │   │   ├── 📂 ui/              # Componentes base (Button, Input, etc)
│   │   │   ├── 📂 layout/          # Layout components (Header, Sidebar, etc)
│   │   │   └── 📂 features/        # Componentes específicos
│   │   │
│   │   ├── 📂 pages/               # Páginas da aplicação
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Agendamentos/
│   │   │   ├── Profissionais/
│   │   │   ├── Clientes/
│   │   │   ├── Servicos/
│   │   │   └── Configuracoes/
│   │   │
│   │   ├── 📂 hooks/               # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useAgendamentos.js
│   │   │   └── useProfissionais.js
│   │   │
│   │   ├── 📂 services/            # Serviços de API
│   │   │   ├── api.js
│   │   │   ├── auth.service.js
│   │   │   ├── agendamentos.service.js
│   │   │   └── profissionais.service.js
│   │   │
│   │   ├── 📂 utils/               # Funções utilitárias
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── constants.js
│   │   │
│   │   ├── 📂 contexts/            # Context API
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── App.jsx                 # Componente principal
│   │   ├── main.jsx                # Entry point
│   │   └── router.jsx              # Configuração de rotas
│   │
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
│
├── 📂 api/                          # BACKEND
│   ├── 📂 src/
│   │   ├── 📂 config/              # Configurações
│   │   │   ├── database.js
│   │   │   └── jwt.js
│   │   │
│   │   ├── 📂 controllers/         # Controladores
│   │   │   ├── auth.controller.js
│   │   │   ├── agendamentos.controller.js
│   │   │   ├── profissionais.controller.js
│   │   │   ├── clientes.controller.js
│   │   │   └── servicos.controller.js
│   │   │
│   │   ├── 📂 models/              # Models (queries SQL)
│   │   │   ├── agendamento.model.js
│   │   │   ├── profissional.model.js
│   │   │   ├── cliente.model.js
│   │   │   └── servico.model.js
│   │   │
│   │   ├── 📂 routes/              # Rotas da API
│   │   │   ├── auth.routes.js
│   │   │   ├── agendamentos.routes.js
│   │   │   ├── profissionais.routes.js
│   │   │   ├── clientes.routes.js
│   │   │   └── servicos.routes.js
│   │   │
│   │   ├── 📂 middleware/          # Middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── empresa.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── error.middleware.js
│   │   │
│   │   ├── 📂 utils/               # Utilitários
│   │   │   ├── logger.js
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── app.js                  # Configuração Express
│   │   └── server.js               # Entry point
│   │
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── 📂 docs/                         # Documentação adicional
    ├── API.md
    └── DEPLOYMENT.md
```

---

## ⚡ Funcionalidades

### Módulo 1: Autenticação 🔐
- [ ] Login com email e senha
- [ ] JWT token com refresh
- [ ] Recuperação de senha
- [ ] Controle de sessão
- [ ] Logout

### Módulo 2: Dashboard 📊
- [ ] Visão geral de agendamentos do dia
- [ ] Estatísticas (total de agendamentos, receita, etc.)
- [ ] Gráficos de desempenho
- [ ] Agendamentos próximos
- [ ] Alertas e notificações

### Módulo 3: Agendamentos 📅
- [ ] **Listar agendamentos**
  - Filtros (data, status, profissional, cliente)
  - Busca por protocolo
  - Paginação
  - Ordenação
- [ ] **Criar agendamento**
  - Seleção de cliente (buscar ou criar novo)
  - Seleção de profissional
  - Seleção de serviços (múltiplos)
  - Validação de disponibilidade em tempo real
  - Cálculo automático de valor e duração
  - Geração de protocolo
- [ ] **Visualizar agendamento**
  - Detalhes completos
  - Histórico de alterações
  - Link do Google Calendar
- [ ] **Editar agendamento**
  - Alterar data/hora
  - Alterar serviços
  - Revalidar disponibilidade
- [ ] **Cancelar agendamento**
  - Motivo do cancelamento
  - Notificação ao cliente
- [ ] **Visualização em calendário**
  - Visão mensal
  - Visão semanal
  - Visão diária
  - Drag and drop para reagendar

### Módulo 4: Profissionais 👥
- [ ] **Listar profissionais**
  - Filtros (status, especialidade)
  - Busca por nome
- [ ] **Cadastrar profissional**
  - Dados pessoais
  - Endereço
  - Especialidade
  - Email e contato
- [ ] **Editar profissional**
- [ ] **Desativar/Ativar profissional**
- [ ] **Gerenciar serviços do profissional**
  - Vincular serviços
  - Definir valores personalizados
  - Definir durações personalizadas
- [ ] **Gerenciar horários**
  - Definir turnos de trabalho
  - Horários específicos por dia da semana
  - Exceções (folgas, férias)
- [ ] **Integração Google Calendar**
  - Vincular calendário
  - Sincronização automática

### Módulo 5: Clientes 👤
- [ ] **Listar clientes**
  - Filtros
  - Busca por nome ou telefone
  - Paginação
- [ ] **Cadastrar cliente**
  - Nome
  - Telefone (WhatsApp)
  - Dados adicionais
- [ ] **Editar cliente**
- [ ] **Visualizar histórico**
  - Agendamentos anteriores
  - Estatísticas (total gasto, frequência)
- [ ] **Exportar lista de clientes**

### Módulo 6: Serviços 💼
- [ ] **Listar serviços**
  - Filtros (status)
  - Busca
- [ ] **Cadastrar serviço**
  - Nome
  - Descrição
  - Duração
  - Valor
- [ ] **Editar serviço**
- [ ] **Ativar/Desativar serviço**
- [ ] **Visualizar profissionais que oferecem o serviço**

### Módulo 7: Configurações ⚙️
- [ ] **Dados da empresa**
  - Nome, contato, endereço
  - Logo
- [ ] **Configurações de agendamento**
  - Antecedência mínima
  - Intervalo entre agendamentos
  - Buffers pré e pós atendimento
  - Timezone
- [ ] **Usuários e permissões**
  - Criar usuários
  - Definir níveis de acesso
  - Gerenciar permissões
- [ ] **Integrações**
  - WhatsApp (instâncias)
  - Google Calendar
  - Configuração de IA (prompts)

### Módulo 8: Relatórios 📈
- [ ] **Relatório de agendamentos**
  - Por período
  - Por profissional
  - Por serviço
  - Por status
- [ ] **Relatório financeiro**
  - Receita por período
  - Receita por profissional
  - Receita por serviço
- [ ] **Relatório de clientes**
  - Novos clientes
  - Clientes frequentes
  - Clientes inativos
- [ ] **Exportação**
  - PDF
  - Excel
  - CSV

---

## 🎨 Design da Interface

### Paleta de Cores

```css
/* Cores Principais */
--primary: #3B82F6      /* Azul vibrante */
--primary-dark: #2563EB
--primary-light: #60A5FA

/* Cores Secundárias */
--secondary: #8B5CF6    /* Roxo */
--accent: #10B981       /* Verde */
--warning: #F59E0B      /* Amarelo */
--danger: #EF4444       /* Vermelho */

/* Neutros */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827

/* Background */
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB
--bg-dark: #111827
```

### Componentes Base

#### 1. **Sidebar (Menu Lateral)**
```
┌────────────────┐
│  [LOGO]        │
│                │
│ 📊 Dashboard   │
│ 📅 Agendamentos│
│ 👥 Profission. │
│ 👤 Clientes    │
│ 💼 Serviços    │
│ 📈 Relatórios  │
│ ⚙️  Config.     │
│                │
│ [User Avatar]  │
│ Nome Usuário   │
│ [Sair]         │
└────────────────┘
```

#### 2. **Header (Topo)**
```
┌─────────────────────────────────────────────────────────┐
│  [☰ Menu]  Título da Página          [🔍] [🔔] [👤]   │
└─────────────────────────────────────────────────────────┘
```

#### 3. **Cards de Dashboard**
```
┌──────────────────────┐  ┌──────────────────────┐
│ 📅 Agendamentos Hoje │  │ 💰 Receita do Mês    │
│                      │  │                      │
│       45             │  │    R$ 12.500,00      │
│   +12% vs ontem      │  │   +8% vs mês pass.   │
└──────────────────────┘  └──────────────────────┘
```

#### 4. **Tabela de Dados**
```
┌─────────────────────────────────────────────────────────┐
│ [+ Novo]  [🔍 Buscar...]  [Filtros ▼]  [Exportar ▼]   │
├─────────────────────────────────────────────────────────┤
│ ☑ | Protocolo | Cliente    | Data       | Status  | ⋮ │
├─────────────────────────────────────────────────────────┤
│ ☐ | THD-8360  | Alex Lima  | 11/10/2025 | ✅ Conf.| ⋮ │
│ ☐ | AGD-1234  | Maria Silva| 12/10/2025 | 📅 Agend| ⋮ │
│ ☐ | AGD-5678  | João Santos| 13/10/2025 | ⏰ Avis.| ⋮ │
└─────────────────────────────────────────────────────────┘
│                    ← 1 2 3 4 5 →                       │
└─────────────────────────────────────────────────────────┘
```

#### 5. **Formulário**
```
┌─────────────────────────────────────────────────────────┐
│  Novo Agendamento                              [✕]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Cliente *                                              │
│  [Buscar ou criar cliente...              ] [+ Novo]   │
│                                                         │
│  Profissional *                                         │
│  [Selecione um profissional...            ▼]           │
│                                                         │
│  Data e Hora *                                          │
│  [11/10/2025] [14:00]                                  │
│                                                         │
│  Serviços *                                             │
│  ☑ Limpeza de pele - R$ 150,00 - 1h30                 │
│  ☐ Design na pinça - R$ 40,00 - 20min                 │
│  [+ Adicionar serviço]                                 │
│                                                         │
│  ─────────────────────────────────────────────         │
│  Duração total: 1h30                                   │
│  Valor total: R$ 150,00                                │
│                                                         │
│  Observações                                            │
│  [                                        ]             │
│                                                         │
│                    [Cancelar]  [Agendar]               │
└─────────────────────────────────────────────────────────┘
```

#### 6. **Calendário**
```
┌─────────────────────────────────────────────────────────┐
│  ← Outubro 2025 →           [Dia] [Semana] [Mês]       │
├─────────────────────────────────────────────────────────┤
│  Dom   Seg   Ter   Qua   Qui   Sex   Sáb              │
├─────────────────────────────────────────────────────────┤
│        1     2     3     4     5     6                 │
│   7    8     9    10    11    12    13                 │
│  14   15    16    17    18    19    20                 │
│  21   22    23    24    25    26    27                 │
│  28   29    30    31                                    │
│                                                         │
│  • Dia 11: 5 agendamentos                              │
│  • Dia 12: 3 agendamentos                              │
└─────────────────────────────────────────────────────────┘
```

### Responsividade

- **Desktop** (>1024px): Layout completo com sidebar
- **Tablet** (768px-1024px): Sidebar colapsável
- **Mobile** (<768px): Menu hambúrguer, layout vertical

---

## 🗺️ Roadmap de Desenvolvimento

### **Fase 1: Setup e Estrutura** (Dias 1-2)
- [ ] Criar estrutura de diretórios
- [ ] Configurar frontend (Vite + React + Tailwind)
- [ ] Configurar backend (Node.js + Express)
- [ ] Configurar banco de dados (conexão)
- [ ] Setup de variáveis de ambiente
- [ ] Configurar Git

### **Fase 2: Backend - API Base** (Dias 3-5)
- [ ] Configurar Express e middlewares
- [ ] Criar conexão com PostgreSQL
- [ ] Implementar autenticação JWT
- [ ] Criar middleware de empresa (multi-tenant)
- [ ] Criar rotas base
- [ ] Implementar tratamento de erros

### **Fase 3: Backend - Módulos Principais** (Dias 6-10)
- [ ] CRUD de Empresas
- [ ] CRUD de Profissionais
- [ ] CRUD de Serviços
- [ ] CRUD de Clientes
- [ ] CRUD de Agendamentos
- [ ] Validação de disponibilidade
- [ ] Cálculo de valores e durações

### **Fase 4: Frontend - Estrutura Base** (Dias 11-13)
- [ ] Criar componentes base (Button, Input, Card, etc.)
- [ ] Criar layout (Header, Sidebar, Footer)
- [ ] Configurar rotas
- [ ] Implementar Context API (Auth)
- [ ] Criar serviços de API
- [ ] Implementar interceptors (token, erros)

### **Fase 5: Frontend - Autenticação** (Dia 14)
- [ ] Tela de login
- [ ] Tela de recuperação de senha
- [ ] Proteção de rotas
- [ ] Persistência de sessão

### **Fase 6: Frontend - Dashboard** (Dias 15-16)
- [ ] Cards de estatísticas
- [ ] Gráficos
- [ ] Lista de agendamentos do dia
- [ ] Alertas

### **Fase 7: Frontend - Agendamentos** (Dias 17-21)
- [ ] Listagem de agendamentos
- [ ] Formulário de criação
- [ ] Validação de disponibilidade
- [ ] Edição de agendamentos
- [ ] Cancelamento
- [ ] Visualização em calendário

### **Fase 8: Frontend - Profissionais** (Dias 22-24)
- [ ] Listagem
- [ ] Cadastro
- [ ] Edição
- [ ] Gestão de serviços
- [ ] Gestão de horários

### **Fase 9: Frontend - Clientes e Serviços** (Dias 25-27)
- [ ] CRUD de clientes
- [ ] Histórico de agendamentos
- [ ] CRUD de serviços

### **Fase 10: Frontend - Configurações** (Dias 28-29)
- [ ] Dados da empresa
- [ ] Configurações de agendamento
- [ ] Usuários e permissões

### **Fase 11: Frontend - Relatórios** (Dias 30-32)
- [ ] Relatórios de agendamentos
- [ ] Relatórios financeiros
- [ ] Exportação

### **Fase 12: Testes e Refinamentos** (Dias 33-35)
- [ ] Testes de integração
- [ ] Correção de bugs
- [ ] Otimização de performance
- [ ] Ajustes de UX/UI

### **Fase 13: Deploy** (Dia 36)
- [ ] Preparar para produção
- [ ] Documentação de deploy
- [ ] Deploy inicial

---

## 🎯 Decisões Técnicas Importantes

### Por que React?
- ✅ Ecossistema maduro e grande comunidade
- ✅ Performance excelente
- ✅ Componentização facilitada
- ✅ Hooks modernos
- ✅ Fácil manutenção

### Por que Vite?
- ✅ Build extremamente rápido
- ✅ Hot Module Replacement instantâneo
- ✅ Configuração simples
- ✅ Otimizado para produção

### Por que TailwindCSS?
- ✅ Desenvolvimento rápido
- ✅ Consistência de design
- ✅ Responsividade fácil
- ✅ Sem CSS customizado desnecessário
- ✅ Purge automático (bundle pequeno)

### Por que Node.js + Express?
- ✅ JavaScript full-stack
- ✅ Performance adequada
- ✅ Ecossistema rico
- ✅ Fácil integração com PostgreSQL
- ✅ Middlewares poderosos

### Por que PostgreSQL?
- ✅ Já está sendo usado
- ✅ Recursos avançados (tstzrange, etc.)
- ✅ Confiável e performático
- ✅ Open source

---

## 📊 Estimativa de Tempo

| Fase | Duração | Complexidade |
|------|---------|--------------|
| Setup | 2 dias | Baixa |
| Backend Base | 3 dias | Média |
| Backend Módulos | 5 dias | Alta |
| Frontend Base | 3 dias | Média |
| Frontend Auth | 1 dia | Baixa |
| Frontend Dashboard | 2 dias | Média |
| Frontend Agendamentos | 5 dias | Alta |
| Frontend Profissionais | 3 dias | Média |
| Frontend Clientes/Serviços | 3 dias | Média |
| Frontend Config | 2 dias | Baixa |
| Frontend Relatórios | 3 dias | Média |
| Testes | 3 dias | Média |
| Deploy | 1 dia | Baixa |
| **TOTAL** | **36 dias** | - |

**Estimativa realista**: 5-6 semanas trabalhando full-time

---

## ✅ Próximos Passos

Agora que temos o planejamento completo, vamos começar a implementação **passo a passo**:

### **Passo 1**: Criar estrutura de diretórios
### **Passo 2**: Configurar frontend (Vite + React + Tailwind)
### **Passo 3**: Configurar backend (Node.js + Express)
### **Passo 4**: Configurar banco de dados

---

**Pronto para começar?** 🚀

Vamos seguir passo a passo, construindo uma aplicação moderna, rápida e profissional!



















