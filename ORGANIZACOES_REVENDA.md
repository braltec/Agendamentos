# 🏢 Sistema de Organizações de Revenda - Documentação Completa

## 📖 Visão Geral

Sistema hierárquico que permite que revendas operem com múltiplos vendedores, onde:
- **Super Admin**: Gerencia todas as organizações
- **Gestor de Revenda**: Gerencia sua organização e vendedores, vê todas as empresas da organização
- **Vendedor de Revenda**: Cadastra empresas clientes, vê apenas as suas próprias empresas

---

## 🏗️ Estrutura do Banco de Dados

### Nova Tabela: `organizacao_revenda`

```sql
CREATE TABLE organizacao_revenda (
    org_revenda_id UUID PRIMARY KEY,
    org_nome VARCHAR(100) NOT NULL,                -- Nome fantasia
    org_razao_social VARCHAR(150),                 -- Razão social
    org_cnpj VARCHAR(20),                          -- CNPJ
    org_contato VARCHAR(50),                       -- Telefone
    org_email VARCHAR(100),                        -- Email
    org_endereco TEXT,                             -- Endereço completo
    org_status VARCHAR(20) DEFAULT 'ativa',        -- ativa/inativa/suspensa
    org_observacoes TEXT,                          -- Observações
    org_criado_em TIMESTAMP DEFAULT NOW(),
    org_atualizado_em TIMESTAMP DEFAULT NOW()
);
```

### Alterações na Tabela `login`

```sql
ALTER TABLE login ADD COLUMN org_revenda_id UUID;
ALTER TABLE login ADD COLUMN is_gestor_revenda BOOLEAN DEFAULT FALSE;
```

**Campos:**
- `org_revenda_id`: ID da organização à qual o usuário pertence
- `is_gestor_revenda`: 
  - `TRUE` = Gestor (pode criar vendedores, vê todas as empresas da org)
  - `FALSE` = Vendedor (vê apenas suas próprias empresas)

---

## 🔐 Hierarquia de Permissões

```
┌─────────────────────────────────────────────┐
│          SUPER ADMIN                        │
│  - Cria organizações                        │
│  - Vê todas as empresas                     │
│  - Gerencia tudo                            │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼──────────┐ ┌──────▼────────────┐
│  ORGANIZAÇÃO A    │ │  ORGANIZAÇÃO B    │
│  "Revenda Premium"│ │  "Vendas Sul"     │
└──────────┬────────┘ └────────┬──────────┘
           │                   │
    ┌──────┴──────┐      ┌────┴────┐
    │             │      │         │
┌───▼────┐  ┌────▼───┐  │         │
│ GESTOR │  │ GESTOR │  │  GESTOR │
│ João   │  │ Maria  │  │ Carlos  │
│        │  │        │  │         │
│ Vê 15  │  │ Vê 15  │  │ Vê 8    │
│empresas│  │empresas│  │empresas │
└───┬────┘  └────┬───┘  └────┬────┘
    │            │            │
┌───▼──────┬─────▼───┐   ┌───▼───┐
│Vendedor 1│Vendedor2│   │Vend. 1│
│Pedro     │Ana      │   │Julia  │
│Vê 5 empr.│Vê 7 empr│   │Vê 3emp│
└──────────┴─────────┘   └───────┘
```

---

## 📡 API Endpoints

### 1. Gerenciamento de Organizações (Super Admin)

#### `GET /api/organizacoes`
Lista todas as organizações.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "org_revenda_id": "uuid",
      "org_nome": "Revenda Premium Ltda",
      "org_razao_social": "Revenda Premium LTDA",
      "org_cnpj": "12.345.678/0001-90",
      "org_status": "ativa",
      "total_usuarios": 5,
      "total_gestores": 2,
      "total_vendedores": 3,
      "total_empresas": 15
    }
  ]
}
```

#### `POST /api/organizacoes`
Cria nova organização.

**Body:**
```json
{
  "org_nome": "Revenda Sul",
  "org_razao_social": "Revenda Sul LTDA",
  "org_cnpj": "98.765.432/0001-10",
  "org_contato": "(11) 98765-4321",
  "org_email": "contato@revendasul.com.br",
  "org_endereco": "Rua Example, 123",
  "org_status": "ativa"
}
```

#### `PUT /api/organizacoes/:id`
Atualiza organização.

#### `PATCH /api/organizacoes/:id/status`
Altera status (ativa/inativa/suspensa).

---

### 2. Gerenciamento de Usuários da Organização

#### `GET /api/organizacoes/:id/usuarios`
Lista gestores e vendedores da organização.

**Permissões:** Super Admin, Gestor ou Vendedor da própria organização

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "login_id": "uuid",
      "nome": "João Silva",
      "login": "joao.silva",
      "email": "joao@example.com",
      "is_gestor_revenda": true,
      "total_empresas_cadastradas": 5,
      "created": "2025-01-15T10:00:00Z"
    },
    {
      "login_id": "uuid",
      "nome": "Maria Santos",
      "login": "maria.santos",
      "email": "maria@example.com",
      "is_gestor_revenda": false,
      "total_empresas_cadastradas": 7,
      "created": "2025-01-20T14:30:00Z"
    }
  ]
}
```

#### `POST /api/organizacoes/:id/vendedores`
Cria novo vendedor na organização.

**Permissões:** Super Admin ou Gestor da organização

**Body:**
```json
{
  "nome": "Pedro Costa",
  "login": "pedro.costa",
  "email": "pedro@example.com",
  "senha": "senha123",
  "is_gestor_revenda": false
}
```

#### `PUT /api/organizacoes/:id/vendedores/:vendedorId`
Atualiza dados do vendedor.

**Permissões:** Super Admin ou Gestor da organização

#### `DELETE /api/organizacoes/:id/vendedores/:vendedorId`
Remove vendedor (apenas se não tiver empresas cadastradas).

**Permissões:** Super Admin ou Gestor da organização

---

### 3. Visualização de Empresas

#### `GET /api/organizacoes/:id/empresas`
Lista todas as empresas da organização.

**Permissões:** Super Admin, Gestor ou Vendedor da própria organização

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "empresa_id": "uuid",
      "empresa_nome": "Salão Beauty",
      "status": "ativa",
      "criado_por": "uuid",
      "criador_nome": "Pedro Costa",
      "criador_login": "pedro.costa",
      "criador_is_gestor": false,
      "total_usuarios": 3,
      "total_profissionais": 2,
      "total_agendamentos": 45,
      "data_cadastro": "2025-02-10T09:00:00Z"
    }
  ]
}
```

---

## 🔄 Lógica de Listagem de Empresas

### `GET /api/empresas`

**Comportamento atualizado:**

1. **Super Admin:**
   - Vê TODAS as empresas do sistema

2. **Gestor de Revenda:**
   - Vê TODAS as empresas da sua organização
   - Inclui empresas cadastradas por ele e por todos os vendedores da organização

3. **Vendedor de Revenda:**
   - Vê APENAS as empresas que ele próprio cadastrou

4. **Admin de Empresa:**
   - Vê apenas sua própria empresa

---

## 🎯 Casos de Uso

### Caso 1: Criar Organização e Gestor

**1. Super Admin cria organização:**
```bash
POST /api/organizacoes
{
  "org_nome": "Revenda Premium",
  "org_cnpj": "12.345.678/0001-90"
}
```

**2. Super Admin cria gestor:**
```bash
POST /api/organizacoes/{org_id}/vendedores
{
  "nome": "João Silva",
  "login": "joao.silva",
  "email": "joao@revenda.com",
  "senha": "senha123",
  "is_gestor_revenda": true
}
```

---

### Caso 2: Gestor Cadastra Vendedores

**João (Gestor) faz login e cria vendedor:**
```bash
POST /api/organizacoes/{sua_org_id}/vendedores
{
  "nome": "Maria Santos",
  "login": "maria.santos",
  "email": "maria@revenda.com",
  "senha": "senha123",
  "is_gestor_revenda": false
}
```

---

### Caso 3: Vendedor Cadastra Empresa

**Maria (Vendedora) cadastra empresa cliente:**
```bash
POST /api/empresas
{
  "empresa_nome": "Salão Beauty",
  "cep": "12345-678",
  ...
}
```

**O que acontece:**
- Empresa fica vinculada a Maria (`criado_por = maria_id`)
- Maria pode ver/editar apenas esta empresa
- João (gestor) pode ver/editar todas as empresas (incluindo esta)
- Super Admin pode ver/editar tudo

---

### Caso 4: Gestor Visualiza Todas as Empresas

**João (Gestor) acessa:**
```bash
GET /api/empresas
```

**Retorna:**
- ✅ 5 empresas cadastradas por ele
- ✅ 7 empresas cadastradas por Maria
- ✅ 3 empresas cadastradas por Pedro
- **Total: 15 empresas**

---

### Caso 5: Vendedor Visualiza Suas Empresas

**Maria (Vendedora) acessa:**
```bash
GET /api/empresas
```

**Retorna:**
- ✅ 7 empresas cadastradas por ela
- ❌ NÃO vê empresas de João ou Pedro

---

## 📊 Relatórios e Visualizações

### Super Admin: Visualização por Organização

```bash
GET /api/empresas/por-revenda
```

**Retorna empresas agrupadas por organização:**
```json
{
  "revendas": [
    {
      "revenda_id": "uuid",
      "revenda_nome": "Revenda Premium",
      "revenda_login": "joao.silva",
      "empresas": [...]
    }
  ],
  "empresas_sem_revenda": [...],
  "estatisticas": {
    "total_revendas": 3,
    "total_empresas_com_revenda": 45,
    "total_empresas_sem_revenda": 8,
    "total_empresas": 53
  }
}
```

---

## 🚀 Próximos Passos para Implementação Frontend

### 1. Tela de Organizações (Super Admin)
- **Localização:** `/organizacoes`
- **Funcionalidades:**
  - Listar organizações
  - Criar/editar organização
  - Ativar/desativar organização
  - Ver detalhes (usuários, empresas)

### 2. Tela de Vendedores (Gestor Revenda)
- **Localização:** `/vendedores` ou `/minha-organizacao`
- **Funcionalidades:**
  - Listar vendedores da organização
  - Criar novo vendedor
  - Editar vendedor
  - Ver performance (quantas empresas cada um cadastrou)

### 3. Ajustes na Tela de Empresas
- **Gestor vê:**
  - Coluna adicional: "Cadastrado por"
  - Filtro por vendedor
- **Vendedor vê:**
  - Apenas suas empresas (como antes)

---

## ✅ Checklist de Implementação

### Backend ✅ (Completo!)
- [x] Migration do banco de dados
- [x] Model `organizacao_revenda`
- [x] Controller de organizações
- [x] Rotas de organizações
- [x] Atualização da lógica de empresas
- [x] Endpoints de vendedores

### Frontend 🚧 (Próximos passos)
- [ ] Service de organizações
- [ ] Tela de listagem de organizações
- [ ] Modal de criação de organização
- [ ] Tela de gestão de vendedores
- [ ] Modal de criação de vendedor
- [ ] Ajustar tela de empresas (mostrar criador)
- [ ] Ajustar relatório de revendas

---

## 📝 Observações Importantes

1. **Migração de Dados Existentes:**
   - Usuários "revenda" existentes continuam funcionando
   - Para adicionar à organização: atualizar `org_revenda_id` e `is_gestor_revenda`

2. **Segurança:**
   - Gestor só pode criar/editar vendedores da sua organização
   - Vendedor só vê suas próprias empresas
   - Todas as ações são validadas no backend

3. **Escalabilidade:**
   - Sistema suporta milhares de organizações
   - Índices otimizados para performance
   - Queries eficientes

---

**Data de Implementação:** 09/11/2025  
**Versão:** 2.0.0  
**Status:** Backend completo ✅ | Frontend pendente 🚧



