# 📚 Documentação do Banco de Dados - Sistema de Agendamento

> **Sistema Multi-tenant de Agendamento de Serviços com Integração WhatsApp e Google Calendar**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Modelo de Dados](#modelo-de-dados)
4. [Fluxo de Agendamento](#fluxo-de-agendamento)
5. [Regras de Negócio](#regras-de-negócio)
6. [Guia de Desenvolvimento](#guia-de-desenvolvimento)

---

## 🎯 Visão Geral

### O que é este Sistema?

Este é um **sistema de agendamento multi-tenant** desenvolvido para salões de beleza, clínicas de estética e profissionais autônomos. O sistema permite que múltiplas empresas gerenciem seus agendamentos de forma independente e isolada.

### Principais Funcionalidades

- ✅ **Agendamento via WhatsApp**: Clientes podem agendar serviços conversando pelo WhatsApp
- ✅ **Integração Google Calendar**: Sincronização automática com calendários do Google
- ✅ **IA para Processamento de Linguagem**: Entende mensagens em linguagem natural
- ✅ **Multi-tenant**: Múltiplas empresas no mesmo banco, com isolamento total
- ✅ **Sistema de Cobrança**: Controle de contratos e billing
- ✅ **Gestão de Horários**: Controle de disponibilidade de profissionais

### Tecnologia

- **Banco de Dados**: PostgreSQL 16.9
- **Tipos de Dados Especiais**: UUID, CITEXT, TSTZRANGE, INTERVAL
- **Recursos Avançados**: Campos calculados, triggers, funções PL/pgSQL

---

## 🏗️ Arquitetura do Sistema

### Conceito Multi-tenant

O sistema utiliza o modelo **multi-tenant com isolamento por empresa**. Isso significa:

- Todas as empresas compartilham o mesmo banco de dados
- Cada empresa tem seus dados isolados através do campo `empresa_id`
- Uma empresa **nunca** acessa dados de outra empresa
- Cada empresa pode ter suas próprias configurações

```
┌─────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Empresa A   │  │  Empresa B   │  │  Empresa C   │ │
│  │              │  │              │  │              │ │
│  │ - Clientes   │  │ - Clientes   │  │ - Clientes   │ │
│  │ - Profission.│  │ - Profission.│  │ - Profission.│ │
│  │ - Agendament.│  │ - Agendament.│  │ - Agendament.│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Identificação via Instância WhatsApp

**Como o sistema identifica qual empresa está sendo acessada?**

Quando uma mensagem chega via WhatsApp, o sistema usa a tabela `instancia` para identificar a empresa:

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUXO DE IDENTIFICAÇÃO                     │
└─────────────────────────────────────────────────────────────┘

Cliente envia mensagem → WhatsApp número +55 37 99949-6932
                              ↓
                    Webhook identifica instancia_id
                              ↓
              SELECT empresa_id FROM instancia 
              WHERE instancia_id = 'xxx'
                              ↓
                    Empresa identificada!
                              ↓
              Todas as operações usam esse empresa_id
```

**Exemplo Prático**:
- **Empresa**: Espaço Pamela Moraes
- **Número WhatsApp**: 37999496932
- **Instância ID**: (UUID único)
- **Empresa ID**: 9ce11fb2-4440-4586-8ec5-fef4e22321e1

Quando um cliente envia mensagem para o número 37999496932, o sistema:
1. Identifica qual instância recebeu a mensagem
2. Busca o `empresa_id` dessa instância
3. Todas as consultas filtram por esse `empresa_id`

### Camadas do Sistema

1. **Camada de Empresa**: Configurações e dados da empresa
2. **Camada de Profissionais**: Profissionais, serviços e horários
3. **Camada de Clientes**: Cadastro de clientes
4. **Camada de Agendamento**: Agendamentos e seus serviços
5. **Camada de Integração**: WhatsApp, Google Calendar e IA
6. **Camada de Controle**: Autenticação, billing e auditoria

---

## 📊 Modelo de Dados

### Visão Geral das Tabelas

O banco possui **20 tabelas** organizadas em grupos funcionais:

| Grupo | Tabelas | Propósito |
|-------|---------|-----------|
| **Empresa** | `empresa`, `empresa_cfg`, `endereco` | Dados e configurações da empresa |
| **Profissionais** | `profissional`, `servicos`, `profissional_servico` | Profissionais e serviços oferecidos |
| **Horários** | `horario_f`, `horario_det`, `profissional_horario` | Gestão de horários de trabalho |
| **Clientes** | `clientes` | Cadastro de clientes |
| **Agendamentos** | `agendamento`, `agendamento_servico`, `status_agend` | Gestão de agendamentos |
| **Integração** | `gcalendar`, `contexto_sessao`, `ai_prompt_templates` | Integrações externas e IA |
| **Controle** | `login`, `nivel_acesso`, `instancia` | Autenticação e controle |
| **Billing** | `contrato` | Sistema de cobrança |

---

## 📦 Detalhamento das Tabelas

### 🏢 Grupo: Empresa

#### `empresa` - Cadastro de Empresas

**Descrição**: Tabela raiz do sistema. Cada empresa representa um tenant independente.

```sql
CREATE TABLE empresa (
    empresa_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    endereco_id uuid NOT NULL,
    empresa_cfg_id uuid NOT NULL,
    cep varchar(8) NOT NULL,
    empresa_nome varchar(100) NOT NULL,
    empresa_contato varchar(50) NOT NULL,
    empresa_dt_criacao timestamptz DEFAULT now(),
    empresa_dt_atualizacao timestamptz DEFAULT now(),
    status varchar(20) DEFAULT 'ativa',
    endereco text,
    observacoes text,
    empresa_contato_agente varchar(20) DEFAULT ''
);
```

**Campos Importantes**:
- `empresa_id`: Chave primária, usada em todo o sistema para isolamento
- `status`: Controla se a empresa está ativa ou inativa
- `empresa_contato`: Telefone de contato (geralmente WhatsApp)
- `empresa_contato_agente`: Número do agente/bot de WhatsApp

**Exemplo de Dados Reais**:
```
Espaço Pamela Moraes
- Telefone: 37999496932
- Endereço: Travessa 4, 15 - Tibo pereira, Formiga/MG
- Status: ativa
```

---

#### `empresa_cfg` - Configurações da Empresa

**Descrição**: Configurações específicas de cada empresa para controle de agendamentos.

```sql
CREATE TABLE empresa_cfg (
    empresa_cfg_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_cfg_anteced_minutos integer NOT NULL,
    empresa_cfg_interv_minutos integer NOT NULL,
    empresa_cfg_buffer_pre_minutos integer NOT NULL,
    empresa_cfg_buffer_pos_minutos integer NOT NULL,
    empresa_cfg_timezone text DEFAULT 'America/Sao_Paulo',
    billing_enabled boolean DEFAULT false,
    empresa_cfg_billing_grace_days integer DEFAULT 3,
    empresa_cfg_nome varchar(100) DEFAULT 'Configuração Padrão',
    prompt_key text DEFAULT 'prompt_agendamento',
    prompt_version text DEFAULT '2025-08-26-01'
);
```

**Configurações Explicadas**:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `empresa_cfg_anteced_minutos` | Tempo mínimo de antecedência para agendar | 30 minutos |
| `empresa_cfg_interv_minutos` | Intervalo mínimo entre agendamentos | 15 minutos |
| `empresa_cfg_buffer_pre_minutos` | Tempo de preparação antes do atendimento | 5 minutos |
| `empresa_cfg_buffer_pos_minutos` | Tempo de limpeza após o atendimento | 5 minutos |
| `empresa_cfg_timezone` | Fuso horário da empresa | America/Sao_Paulo |
| `billing_enabled` | Se o sistema de cobrança está ativo | true/false |
| `prompt_key` | Chave do template de IA a usar | prompt_julia_fane |
| `prompt_version` | Versão do template de IA | 2025-10-08-02 |

**Exemplo Prático**:
```
Configuração Julia Fane:
- Antecedência: 30 minutos
- Intervalo: 15 minutos
- Buffer pré: 0 minutos
- Buffer pós: 0 minutos
- Prompt personalizado: prompt_julia_fane v2025-10-08-02
```

---

#### `endereco` - Endereços

**Descrição**: Armazena endereços de empresas e profissionais.

```sql
CREATE TABLE endereco (
    endereco_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cep varchar(8) NOT NULL,
    logradouro varchar(200) NOT NULL,
    numero varchar(20),
    complemento varchar(100),
    bairro varchar(100) NOT NULL,
    cidade varchar(100) NOT NULL,
    uf varchar(2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

**Observações**:
- CEP sem hífen (apenas números)
- UF com 2 caracteres
- Timestamps automáticos de criação e atualização

---

### 👥 Grupo: Profissionais e Serviços

#### `profissional` - Cadastro de Profissionais

**Descrição**: Profissionais que prestam serviços nas empresas.

```sql
CREATE TABLE profissional (
    profissional_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id uuid NOT NULL,
    endereco_id uuid NOT NULL,
    cep varchar(8) NOT NULL,
    profissional_nome varchar(50) NOT NULL,
    profissional_contato varchar(20) NOT NULL,
    profissional_dt_criacao timestamptz DEFAULT now(),
    profissional_dt_atualizacao timestamptz DEFAULT now(),
    status varchar(20) DEFAULT 'ativo',
    especialidade varchar(100),
    email varchar(100),
    observacoes text
);
```

**Características**:
- Cada profissional pertence a uma empresa (`empresa_id`)
- Pode ter especialidade definida
- Status controla se está ativo ou inativo
- Possui endereço próprio

---

#### `servicos` - Catálogo de Serviços

**Descrição**: Serviços oferecidos pelas empresas.

```sql
CREATE TABLE servicos (
    servicos_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servicos_nome varchar(255) NOT NULL,
    servicos_duracao interval NOT NULL,
    servicos_valor numeric(10,2) NOT NULL,
    servicos_descricao varchar(255) NOT NULL,
    status varchar(20) DEFAULT 'ativo'
);
```

**Exemplos de Serviços Reais**:

| Serviço | Duração | Valor | Descrição |
|---------|---------|-------|-----------|
| Limpeza de pele | 1h30 | R$ 150,00 | Limpeza de pele |
| Design na pinça | 20min | R$ 40,00 | Design na pinça |
| Escova | 30min | R$ 60,00 | Escova modeladora |
| Baby Liss | 1h | R$ 70,00 | Cachos com babyliss |
| Alongamento gel | 4h | R$ 150,00 | Alongamento em gel |

**Observações**:
- Duração usa tipo `interval` do PostgreSQL
- Valores em formato decimal (10,2)
- Serviços podem ser ativados/desativados

---

#### `profissional_servico` - Serviços por Profissional

**Descrição**: Define quais serviços cada profissional pode realizar, com possibilidade de personalização.

```sql
CREATE TABLE profissional_servico (
    servicos_id uuid NOT NULL,
    profissional_id uuid NOT NULL,
    valor_personalizado numeric(10,2),
    duracao_personalizada interval,
    observacoes varchar(255) NOT NULL,
    PRIMARY KEY (servicos_id, profissional_id)
);
```

**Como Funciona**:
1. Um serviço tem valor e duração padrão na tabela `servicos`
2. Se o profissional cobrar diferente, usa `valor_personalizado`
3. Se o profissional demorar mais/menos, usa `duracao_personalizada`
4. Se não houver personalização, usa os valores padrão

**Exemplo**:
```
Serviço: Limpeza de pele (padrão R$ 150,00 - 1h30)
- Profissional A: R$ 150,00 - 1h30 (usa padrão)
- Profissional B: R$ 180,00 - 2h (personalizado)
```

---

### ⏰ Grupo: Horários

#### `horario_f` - Turnos de Trabalho

**Descrição**: Define turnos de trabalho (manhã, tarde, noite, etc.).

```sql
CREATE TABLE horario_f (
    horario_f_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_f_turno varchar(100) NOT NULL
);
```

**Exemplos**:
- Manhã (8h às 12h)
- Tarde (13h às 18h)
- Noite (18h às 22h)

---

#### `horario_det` - Detalhamento dos Horários

**Descrição**: Define os horários específicos dentro de cada turno.

```sql
CREATE TABLE horario_det (
    horario_det_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_f_id uuid NOT NULL,
    horario_def smallint NOT NULL,
    horario_def_nome varchar(20) NOT NULL,
    horario_det_inicio time(0) NOT NULL,
    horario_det_fim time(0) NOT NULL,
    UNIQUE (horario_f_id, horario_def, horario_det_inicio, horario_det_fim)
);
```

**Exemplo de Estrutura**:
```
Turno: Manhã
  - Segunda-feira: 08:00 - 12:00
  - Terça-feira: 08:00 - 12:00
  - Quarta-feira: 08:00 - 12:00
```

---

#### `profissional_horario` - Horários do Profissional

**Descrição**: Relaciona profissionais com seus turnos de trabalho.

```sql
CREATE TABLE profissional_horario (
    profissional_id uuid NOT NULL,
    horario_f_id uuid NOT NULL,
    PRIMARY KEY (profissional_id, horario_f_id)
);
```

**Como Funciona**:
- Um profissional pode ter múltiplos turnos
- Exemplo: Profissional trabalha manhã e tarde

---

### 👤 Grupo: Clientes

#### `clientes` - Cadastro de Clientes

**Descrição**: Clientes que agendam serviços nas empresas.

```sql
CREATE TABLE clientes (
    clientes_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clientes_nome varchar(50) NOT NULL,
    clientes_telefone varchar(50) NOT NULL,
    clientes_dt_criacao timestamptz DEFAULT now(),
    empresa_id uuid
);
```

**Características**:
- Isolamento por empresa
- Telefone pode ser identificador do WhatsApp (ex: `553799846648@s.whatsapp.net`)
- Cadastro automático no primeiro agendamento

**Exemplo de Dados Reais**:
```
Nome: Alex Lima
Telefone: 553791426388@s.whatsapp.net
Empresa: Deisa Evelyn Estética
```

---

### 📅 Grupo: Agendamentos

#### `agendamento` - Agendamentos

**Descrição**: Tabela principal que armazena todos os agendamentos do sistema.

```sql
CREATE TABLE agendamento (
    agend_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status_agend_id uuid NOT NULL,
    agend_id_calendar text NOT NULL,
    profissional_id uuid NOT NULL,
    clientes_id uuid NOT NULL,
    empresa_id uuid NOT NULL,
    agend_data date NOT NULL,
    agend_origem varchar(20) NOT NULL,
    agend_created_at timestamptz DEFAULT now(),
    agend_inicio timestamptz NOT NULL,
    agend_fim timestamptz NOT NULL,
    agend_valor numeric(8,2) NOT NULL,
    periodo tstzrange GENERATED ALWAYS AS (tstzrange(agend_inicio, agend_fim, '[)')) STORED,
    agend_protocolo varchar(50) UNIQUE
);
```

**Campos Importantes**:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `agend_id` | ID único do agendamento | uuid |
| `agend_id_calendar` | ID do evento no Google Calendar | kv4ar3u8dd64o6kqaq42n47jhs |
| `agend_origem` | Origem do agendamento | whatsapp, web, app |
| `agend_data` | Data do agendamento | 2025-10-11 |
| `agend_inicio` | Data/hora de início | 2025-10-11 16:00:00+00 |
| `agend_fim` | Data/hora de término | 2025-10-11 16:40:00+00 |
| `agend_valor` | Valor total do agendamento | R$ 30,00 |
| `periodo` | **Campo calculado** para consultas | [2025-10-11 16:00, 2025-10-11 16:40) |
| `agend_protocolo` | Protocolo único para o cliente | THD-8360 |

**Campo Especial: `periodo`**

Este é um campo **calculado automaticamente** usando o tipo `tstzrange` do PostgreSQL:
- Facilita consultas de conflito de horários
- Permite verificar se um horário está ocupado
- Usa notação matemática: `[` inclui, `)` exclui

**Exemplo de Consulta de Conflito**:
```sql
-- Verifica se há conflito de horário
SELECT * FROM agendamento 
WHERE profissional_id = 'xxx' 
  AND periodo && tstzrange('2025-10-11 16:00', '2025-10-11 17:00');
```

---

#### `agendamento_servico` - Serviços do Agendamento

**Descrição**: Relaciona agendamentos com os serviços solicitados. Um agendamento pode ter múltiplos serviços.

```sql
CREATE TABLE agendamento_servico (
    agend_id uuid NOT NULL,
    servicos_id uuid NOT NULL,
    ordem smallint DEFAULT 1,
    valor_aplicado numeric(10,2) NOT NULL,
    duracao_aplicada interval NOT NULL,
    observacao text,
    profissional_id uuid NOT NULL,
    PRIMARY KEY (agend_id, servicos_id, ordem)
);
```

**Como Funciona**:
1. Um agendamento pode ter vários serviços
2. Cada serviço tem uma ordem de execução
3. Valores e durações são "congelados" no momento do agendamento
4. Permite observações específicas por serviço

**Exemplo**:
```
Agendamento #123:
  1. Limpeza de pele - R$ 150,00 - 1h30
  2. Design na pinça - R$ 40,00 - 20min
  Total: R$ 190,00 - 1h50
```

---

#### `status_agend` - Status dos Agendamentos

**Descrição**: Define os possíveis status de um agendamento.

```sql
CREATE TABLE status_agend (
    status_agend_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status_agend_nome varchar(30) NOT NULL
);
```

**Status Identificados no Sistema**:
- ✅ **Agendado**: Agendamento criado
- ✅ **Confirmado**: Cliente confirmou presença
- ✅ **Avisado**: Cliente foi avisado/lembrado
- ✅ **Concluído**: Atendimento realizado
- ❌ **Cancelado**: Agendamento cancelado

---

### 🔗 Grupo: Integração

#### `gcalendar` - Integração Google Calendar

**Descrição**: Armazena informações de integração com Google Calendar.

```sql
CREATE TABLE gcalendar (
    profissional_id uuid NOT NULL,
    gcalendar_id text PRIMARY KEY,
    gcalendar_email citext,
    UNIQUE (gcalendar_id)
);
```

**Como Funciona**:
- Cada profissional pode ter um calendário do Google vinculado
- `gcalendar_id`: ID do calendário no Google
- `gcalendar_email`: Email associado ao calendário
- Tipo `citext`: Case-insensitive text (email não diferencia maiúsculas)

---

#### `contexto_sessao` - Contexto de Conversas

**Descrição**: Mantém o contexto das conversas do WhatsApp para processamento de IA.

```sql
CREATE TABLE contexto_sessao (
    session_id text PRIMARY KEY,
    empresa_id uuid NOT NULL,
    ultimo_intent text,
    ultimo_action text,
    ultimo_service_id uuid,
    ultimo_service_name text,
    ultimo_profissional text,
    ultimo_date date,
    ultimo_start text,
    status text,
    updated_at timestamp DEFAULT now()
);
```

**Como Funciona**:
1. Cada sessão do WhatsApp tem um ID único
2. Sistema armazena o último contexto da conversa
3. IA usa esse contexto para entender a continuação da conversa
4. Exemplo: Se cliente disse "quero agendar limpeza de pele", próxima mensagem já sabe o serviço

**Campos de Contexto**:
- `ultimo_intent`: Última intenção (schedule, cancel, reschedule)
- `ultimo_action`: Última ação (ask_missing_info, create_event)
- `ultimo_service_id`: ID do último serviço mencionado
- `ultimo_profissional`: Último profissional mencionado
- `ultimo_date`: Última data mencionada

---

#### `ai_prompt_templates` - Templates de IA

**Descrição**: Armazena templates de prompts para o sistema de IA processar linguagem natural.

```sql
CREATE TABLE ai_prompt_templates (
    key text NOT NULL,
    version text NOT NULL,
    template_text text NOT NULL,
    PRIMARY KEY (key, version)
);
```

**Templates Identificados**:
- `prompt_agendamento` (v2025-08-26-01, v2025-08-26-02)
- `prompt_julia_fane` (v2025-10-08-01, v2025-10-08-02)

**Observações**:
- Permite versionamento de prompts
- Cada empresa pode usar um prompt diferente
- Templates são longos (contêm instruções completas para a IA)

---

### 🔐 Grupo: Autenticação e Controle

#### `login` - Usuários do Sistema

**Descrição**: Sistema de autenticação para acesso ao sistema.

```sql
CREATE TABLE login (
    login_id uuid PRIMARY KEY,
    nivel_acesso_id uuid NOT NULL,
    empresa_id uuid NOT NULL,
    login citext NOT NULL,
    email citext NOT NULL,
    senha text NOT NULL,
    created timestamptz DEFAULT now(),
    nome varchar(120) NOT NULL
);
```

**Características**:
- Isolamento por empresa
- Login e email case-insensitive (citext)
- Senha deve ser armazenada criptografada (hash)
- Níveis de acesso configuráveis

---

#### `nivel_acesso` - Níveis de Permissão

**Descrição**: Define níveis de acesso ao sistema.

```sql
CREATE TABLE nivel_acesso (
    nivel_acesso_id uuid PRIMARY KEY,
    nivel_acesso_ varchar(20) NOT NULL
);
```

**Possíveis Níveis**:
- Administrador
- Gerente
- Profissional
- Recepcionista

---

#### `instancia` - Instâncias WhatsApp

**Descrição**: Instâncias de WhatsApp para multi-tenancy. **Esta é a chave para identificação da empresa no fluxo de mensagens**.

```sql
CREATE TABLE instancia (
    instancia_id uuid PRIMARY KEY,
    empresa_id uuid NOT NULL,
    instancia_nome varchar(30) NOT NULL,
    instancia_observacao varchar(255) NOT NULL,
    instancia_dt_criacao timestamptz DEFAULT now(),
    instancia_dt_atualizacao timestamptz DEFAULT now()
);
```

**Como Funciona**:
- Cada empresa pode ter uma ou mais instâncias de WhatsApp
- Permite múltiplos números de atendimento por empresa
- **IMPORTANTE**: Quando uma mensagem chega via WhatsApp, o sistema identifica a empresa através do `instancia_id`
- O `instancia_id` é vinculado ao número/bot de WhatsApp que recebeu a mensagem
- A partir do `instancia_id`, o sistema busca o `empresa_id` correspondente

**Fluxo de Identificação**:
```
Mensagem WhatsApp recebida no número +55 37 99949-6932
    ↓
Sistema identifica instancia_id (ID da instância vinculada a este número)
    ↓
Consulta: SELECT empresa_id FROM instancia WHERE instancia_id = 'xxx'
    ↓
Retorna: empresa_id = '9ce11fb2-4440-4586-8ec5-fef4e22321e1'
    ↓
Empresa identificada: "Espaço Pamela Moraes"
    ↓
Todas as operações são feitas no contexto dessa empresa
```

**Exemplo Real do Banco**:
```
Instância: uuid-da-instancia-pamela
Empresa: Espaço Pamela Moraes (9ce11fb2-4440-4586-8ec5-fef4e22321e1)
Número WhatsApp: 37999496932
Agente: 3798704311
```

---

### 💰 Grupo: Billing

#### `contrato` - Contratos de Cobrança

**Descrição**: Contratos de cobrança com as empresas.

```sql
CREATE TABLE contrato (
    contrato_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id uuid NOT NULL,
    contrato_status varchar(20) NOT NULL,
    contrato_valor numeric(8,2) NOT NULL,
    contrato_nome text NOT NULL,
    created_at timestamptz NOT NULL,
    contrato_periodicidade varchar(20) DEFAULT 'Mensal',
    contrato_vigencia_inicio date,
    contrato_proxima_cobranca date
);
```

**Exemplo de Contrato**:
```
Plano: Básico
Valor: R$ 59,90
Periodicidade: Mensal
Status: Ativo
Próxima cobrança: 2025-09-23
```

---

## 🔄 Fluxo de Agendamento

### Passo a Passo de um Agendamento via WhatsApp

```
1. Cliente envia mensagem para o WhatsApp
   ↓
2. Sistema identifica a instância que recebeu a mensagem (instancia_id)
   ↓
3. Sistema busca a empresa através da tabela 'instancia' (empresa_id)
   ↓
4. Sistema consulta 'contexto_sessao' para entender continuação da conversa
   ↓
5. IA processa a mensagem usando o template configurado (prompt_key/prompt_version)
   ↓
6. Sistema valida disponibilidade do profissional (consulta horários e agendamentos)
   ↓
7. Sistema cria registro em 'agendamento' (com todos os dados do agendamento)
   ↓
8. Sistema cria registros em 'agendamento_servico' (serviços solicitados)
   ↓
9. Sistema cria evento no Google Calendar (integração gcalendar)
   ↓
10. Sistema gera protocolo único (agend_protocolo)
   ↓
11. Sistema atualiza 'contexto_sessao' (para próximas interações)
   ↓
12. Sistema envia confirmação ao cliente via WhatsApp
```

**Detalhamento Técnico**:

**Passo 2-3**: Identificação da Empresa
```sql
-- Quando mensagem chega, sistema faz:
SELECT i.empresa_id, e.empresa_nome, e.empresa_cfg_id
FROM instancia i
JOIN empresa e ON e.empresa_id = i.empresa_id
WHERE i.instancia_id = '<id_da_instancia_que_recebeu>';
```

**Passo 4**: Buscar Contexto da Sessão
```sql
-- Busca contexto anterior da conversa
SELECT * FROM contexto_sessao
WHERE session_id = '<telefone_do_cliente>'
  AND empresa_id = '<empresa_id>';
```

**Passo 5**: Buscar Configuração de IA
```sql
-- Busca template de prompt configurado para a empresa
SELECT apt.template_text
FROM empresa e
JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
JOIN ai_prompt_templates apt ON apt.key = ec.prompt_key 
                             AND apt.version = ec.prompt_version
WHERE e.empresa_id = '<empresa_id>';
```

**Passo 6**: Validar Disponibilidade
```sql
-- Verifica se profissional está disponível no horário
SELECT COUNT(*) FROM agendamento
WHERE profissional_id = '<profissional_id>'
  AND status_agend_id NOT IN (
    SELECT status_agend_id FROM status_agend 
    WHERE status_agend_nome = 'Cancelado'
  )
  AND periodo && tstzrange(
    '<data_hora_inicio>'::timestamptz, 
    '<data_hora_fim>'::timestamptz
  );
-- Se COUNT = 0, horário está disponível
```

### Exemplo Prático

**Conversa**:
```
Cliente: "Oi, quero agendar limpeza de pele"
Bot: "Ótimo! Para qual dia você gostaria?"
Cliente: "Amanhã às 14h"
Bot: "Perfeito! Confirmando agendamento para dia 11/10 às 14h00 
      com a profissional Pamela Moraes. Limpeza de pele - R$ 150,00.
      Protocolo: AGD-1757374532047-8338"
```

**Dados Criados**:
```sql
-- Tabela: agendamento
agend_id: c335d819-e0aa-48f1-a116-a94be23c74b5
status: Agendado
profissional: Pamela Moraes
cliente: Alex Lima
data: 2025-10-11
inicio: 2025-10-11 14:00:00
fim: 2025-10-11 15:30:00
valor: 150.00
protocolo: AGD-1757374532047-8338

-- Tabela: agendamento_servico
servico: Limpeza de pele
valor_aplicado: 150.00
duracao_aplicada: 01:30:00
```

---

## 📐 Relacionamentos e Integridade

### Diagrama de Relacionamentos Principais

```
instancia (Ponto de entrada via WhatsApp)
  ↓
  └── empresa_id (Identifica a empresa)
        ↓
empresa (Entidade raiz multi-tenant)
  ├── empresa_cfg (1:1) → Configurações
  │   └── ai_prompt_templates (N:1) → Templates de IA
  ├── endereco (N:1) → Endereço da empresa
  ├── instancia (1:N) → Instâncias WhatsApp
  ├── clientes (1:N) → Clientes da empresa
  ├── profissional (1:N) → Profissionais
  │   ├── endereco (N:1)
  │   ├── profissional_horario (N:N) ← horario_f
  │   │   └── horario_det (1:N)
  │   ├── profissional_servico (N:N) ← servicos
  │   └── gcalendar (1:1) → Integração Google Calendar
  ├── agendamento (1:N) → Agendamentos
  │   ├── clientes (N:1)
  │   ├── profissional (N:1)
  │   ├── status_agend (N:1)
  │   └── agendamento_servico (1:N)
  │       ├── servicos (N:1)
  │       └── profissional_servico (N:1)
  ├── contexto_sessao (1:N) → Contexto das conversas
  ├── contrato (1:N) → Contratos de cobrança
  └── login (1:N) → Usuários do sistema
      └── nivel_acesso (N:1)
```

**Fluxo de Dados no Agendamento**:
```
1. Mensagem WhatsApp → instancia → empresa
2. empresa → empresa_cfg → ai_prompt_templates
3. empresa → contexto_sessao (busca contexto)
4. empresa → profissional → profissional_servico
5. empresa → agendamento (cria)
6. agendamento → agendamento_servico (cria)
7. profissional → gcalendar (sincroniza)
```

### Regras de Integridade

1. **Cascata em Deleção**:
   - Deletar empresa → deleta clientes
   - Deletar profissional → deleta horários e serviços vinculados
   - Deletar agendamento → deleta serviços do agendamento

2. **Restrições**:
   - Não pode deletar serviço se houver agendamento
   - Não pode deletar status se houver agendamento usando

---

## ⚙️ Funções e Triggers

### Funções do Banco

#### 1. `ags_set_prof()`
**Propósito**: Define automaticamente o profissional em `agendamento_servico`.

```sql
CREATE FUNCTION ags_set_prof() RETURNS trigger AS $$
BEGIN
  IF NEW.profissional_id IS NULL THEN
    SELECT a.profissional_id INTO NEW.profissional_id
    FROM agendamento a
    WHERE a.agend_id = NEW.agend_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Como Funciona**: Se não informar o profissional ao criar um serviço do agendamento, busca automaticamente do agendamento principal.

---

#### 2. `is_empresa_adimplente(uuid)`
**Propósito**: Verifica se empresa está em dia com pagamentos.

```sql
CREATE FUNCTION is_empresa_adimplente(p_empresa uuid) RETURNS boolean AS $$
  SELECT true; -- stub temporário
$$ LANGUAGE sql STABLE;
```

**Uso**: Pode ser usado para bloquear agendamentos de empresas inadimplentes.

---

#### 3. `set_updated_at()` e `update_updated_at_column()`
**Propósito**: Atualiza automaticamente timestamps de modificação.

**Como Funciona**: Triggers que atualizam campos `*_dt_atualizacao` ou `updated_at` automaticamente.

---

## 📊 Índices para Performance

### Índices Críticos

| Índice | Tabela | Campos | Propósito |
|--------|--------|--------|-----------|
| `ix_agendamento_empresa` | agendamento | empresa_id | Buscar agendamentos por empresa |
| `ix_agendamento_cliente` | agendamento | clientes_id | Buscar agendamentos por cliente |
| `ix_agendamento_status` | agendamento | status_agend_id | Filtrar por status |
| `prof_idx_empresa` | profissional | empresa_id | Buscar profissionais por empresa |
| `ps_idx_prof` | profissional_servico | profissional_id | Buscar serviços do profissional |

### Consultas Otimizadas

**Buscar agendamentos de uma empresa**:
```sql
SELECT * FROM agendamento 
WHERE empresa_id = 'xxx' 
ORDER BY agend_data DESC;
-- Usa: ix_agendamento_empresa
```

**Verificar disponibilidade de profissional**:
```sql
SELECT * FROM agendamento 
WHERE profissional_id = 'xxx' 
  AND periodo && tstzrange('2025-10-11 14:00', '2025-10-11 15:30');
-- Usa: campo calculado periodo
```

---

## 🎯 Regras de Negócio

### 1. Isolamento Multi-tenant

**Regra**: Todas as consultas devem filtrar por `empresa_id`.

**Implementação**:
```sql
-- ✅ CORRETO
SELECT * FROM clientes WHERE empresa_id = 'xxx';

-- ❌ ERRADO (acessa dados de todas as empresas)
SELECT * FROM clientes;
```

---

### 2. Validação de Horários

**Regras**:
1. Verificar antecedência mínima (`empresa_cfg_anteced_minutos`)
2. Verificar intervalo entre agendamentos (`empresa_cfg_interv_minutos`)
3. Considerar buffers pré e pós atendimento
4. Verificar conflito de horários do profissional

**Exemplo de Validação**:
```sql
-- Verificar se horário está disponível
SELECT COUNT(*) FROM agendamento
WHERE profissional_id = 'xxx'
  AND status_agend_id NOT IN (SELECT status_agend_id FROM status_agend WHERE status_agend_nome = 'Cancelado')
  AND periodo && tstzrange('2025-10-11 14:00', '2025-10-11 15:30');
-- Se COUNT = 0, horário está livre
```

---

### 3. Cálculo de Valor Total

**Regra**: Valor do agendamento = soma dos valores dos serviços.

**Implementação**:
```sql
-- Calcular valor total
SELECT SUM(valor_aplicado) FROM agendamento_servico
WHERE agend_id = 'xxx';
```

---

### 4. Cálculo de Duração Total

**Regra**: Duração = soma das durações dos serviços + intervalos + buffers.

**Exemplo**:
```
Serviço 1: 1h30
Serviço 2: 20min
Intervalo: 15min
Buffer pré: 5min
Buffer pós: 5min
Total: 2h15min
```

---

### 5. Protocolo Único

**Regra**: Cada agendamento deve ter protocolo único para o cliente.

**Formato Identificado**:
- `THD-8360`
- `AGD-1757374532047-8338`

**Geração**: Pode usar timestamp + random ou sequencial.

---

### 6. Status do Agendamento

**Fluxo de Status**:
```
Agendado → Confirmado → Avisado → Concluído
    ↓
Cancelado (pode cancelar em qualquer etapa)
```

---

## 🛠️ Guia de Desenvolvimento

### Arquitetura Recomendada

```
┌─────────────────────────────────────────┐
│         Frontend (Web/Mobile)           │
│  - Interface de agendamento             │
│  - Gestão de profissionais              │
│  - Relatórios                           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            API REST                     │
│  - Autenticação JWT                     │
│  - Validação de permissões              │
│  - Lógica de negócio                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Camada de Serviços              │
│  - Serviço de Agendamento               │
│  - Serviço de WhatsApp                  │
│  - Serviço de Google Calendar           │
│  - Serviço de IA                        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         PostgreSQL 16.9                 │
└─────────────────────────────────────────┘
```

---

### Endpoints Sugeridos

#### Empresas
- `GET /api/empresas` - Listar empresas
- `GET /api/empresas/:id` - Detalhes da empresa
- `POST /api/empresas` - Criar empresa
- `PUT /api/empresas/:id` - Atualizar empresa
- `DELETE /api/empresas/:id` - Deletar empresa

#### Profissionais
- `GET /api/empresas/:empresaId/profissionais` - Listar profissionais
- `GET /api/profissionais/:id` - Detalhes do profissional
- `POST /api/profissionais` - Criar profissional
- `PUT /api/profissionais/:id` - Atualizar profissional
- `GET /api/profissionais/:id/horarios` - Horários do profissional
- `GET /api/profissionais/:id/servicos` - Serviços do profissional

#### Agendamentos
- `GET /api/empresas/:empresaId/agendamentos` - Listar agendamentos
- `GET /api/agendamentos/:id` - Detalhes do agendamento
- `POST /api/agendamentos` - Criar agendamento
- `PUT /api/agendamentos/:id` - Atualizar agendamento
- `DELETE /api/agendamentos/:id` - Cancelar agendamento
- `GET /api/agendamentos/:id/protocolo/:protocolo` - Buscar por protocolo
- `POST /api/agendamentos/disponibilidade` - Verificar disponibilidade

#### Clientes
- `GET /api/empresas/:empresaId/clientes` - Listar clientes
- `GET /api/clientes/:id` - Detalhes do cliente
- `GET /api/clientes/:id/agendamentos` - Agendamentos do cliente

#### Serviços
- `GET /api/servicos` - Listar serviços
- `GET /api/servicos/:id` - Detalhes do serviço
- `POST /api/servicos` - Criar serviço
- `PUT /api/servicos/:id` - Atualizar serviço

---

### Segurança

#### 1. Autenticação JWT

**Estrutura do Token**:
```json
{
  "user_id": "uuid",
  "empresa_id": "uuid",
  "nivel_acesso": "administrador",
  "exp": 1234567890
}
```

**Middleware**:
```javascript
// Exemplo em Node.js
function verificarEmpresa(req, res, next) {
  const empresaToken = req.user.empresa_id;
  const empresaRequisicao = req.params.empresaId;
  
  if (empresaToken !== empresaRequisicao) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  next();
}
```

---

#### 2. Validação de Permissões

**Níveis de Acesso**:
- **Administrador**: Acesso total à sua empresa
- **Gerente**: Gestão de profissionais e agendamentos
- **Profissional**: Visualizar seus próprios agendamentos
- **Recepcionista**: Criar e gerenciar agendamentos

---

#### 3. Sanitização de Dados

**Sempre validar**:
- UUIDs válidos
- Datas no formato correto
- Valores numéricos positivos
- Telefones no formato esperado
- CEPs válidos

---

### Performance

#### 1. Paginação

**Sempre paginar listagens**:
```sql
SELECT * FROM agendamento 
WHERE empresa_id = 'xxx'
ORDER BY agend_data DESC
LIMIT 20 OFFSET 0;
```

---

#### 2. Cache

**Cachear**:
- Configurações da empresa
- Lista de serviços
- Lista de profissionais
- Templates de IA

**TTL Sugerido**: 5-15 minutos

---

#### 3. Consultas Otimizadas

**Use índices existentes**:
```sql
-- ✅ BOM (usa índice)
WHERE empresa_id = 'xxx' AND status_agend_id = 'yyy'

-- ❌ RUIM (não usa índice)
WHERE UPPER(empresa_nome) = 'XXX'
```

---

### Integração WhatsApp

#### Fluxo de Mensagem

1. **Webhook recebe mensagem** do WhatsApp
2. **Identifica instância** que recebeu a mensagem (`instancia_id`)
3. **Busca empresa** através da tabela `instancia` (`empresa_id`)
4. **Busca ou cria cliente** na tabela `clientes`
5. **Busca contexto da sessão** em `contexto_sessao`
6. **Busca configurações** da empresa em `empresa_cfg`
7. **Envia para IA processar** usando o template configurado
8. **Executa ação** (criar agendamento, buscar horários, etc.)
9. **Atualiza contexto** em `contexto_sessao`
10. **Envia resposta** via WhatsApp

#### Estrutura de Dados do Webhook

Quando uma mensagem chega, o webhook recebe algo como:

```json
{
  "instanceId": "uuid-da-instancia",
  "from": "553799846648@s.whatsapp.net",
  "message": "Quero agendar limpeza de pele",
  "timestamp": 1234567890
}
```

#### Processamento

```sql
-- 1. Identificar empresa pela instância
SELECT e.*, ec.*, i.instancia_nome
FROM instancia i
JOIN empresa e ON e.empresa_id = i.empresa_id
JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
WHERE i.instancia_id = '<instanceId>';

-- 2. Buscar ou criar cliente
INSERT INTO clientes (clientes_nome, clientes_telefone, empresa_id)
VALUES ('Nome do Cliente', '553799846648@s.whatsapp.net', '<empresa_id>')
ON CONFLICT DO NOTHING;

-- 3. Buscar/criar contexto da sessão
INSERT INTO contexto_sessao (session_id, empresa_id, status)
VALUES ('553799846648@s.whatsapp.net', '<empresa_id>', 'aguardando')
ON CONFLICT (session_id) DO UPDATE SET updated_at = now();
```

---

### Integração Google Calendar

#### Sincronização

**Ao criar agendamento**:
1. Criar evento no Google Calendar
2. Salvar `gcalendar_id` no agendamento
3. Adicionar link do evento na confirmação

**Ao atualizar agendamento**:
1. Atualizar evento no Google Calendar
2. Notificar cliente

**Ao cancelar agendamento**:
1. Deletar evento do Google Calendar
2. Atualizar status para "Cancelado"

---

### Processamento de IA

#### Templates de Prompt

**Estrutura**:
- Instruções de formato de saída
- Contexto da empresa
- Serviços disponíveis
- Profissionais disponíveis
- Horários disponíveis
- Exemplos de conversação

**Versionamento**:
- Manter histórico de versões
- Permitir rollback
- Testar novas versões em ambiente de staging

---

## 📈 Monitoramento e Logs

### Métricas Importantes

1. **Agendamentos**:
   - Total de agendamentos por dia/semana/mês
   - Taxa de cancelamento
   - Taxa de confirmação
   - Tempo médio de resposta

2. **Profissionais**:
   - Taxa de ocupação
   - Serviços mais realizados
   - Avaliações (se implementado)

3. **Sistema**:
   - Tempo de resposta da API
   - Erros de integração
   - Uso de cache

---

### Logs Recomendados

**Registrar**:
- Criação/atualização/cancelamento de agendamentos
- Tentativas de acesso não autorizado
- Erros de integração (WhatsApp, Google Calendar)
- Falhas de processamento de IA

---

## 🚀 Próximos Passos

### Fase 1: Setup Inicial
1. ✅ Escolher stack tecnológico (Node.js, Python, Java, etc.)
2. ✅ Configurar ambiente de desenvolvimento
3. ✅ Criar estrutura do projeto
4. ✅ Configurar conexão com banco de dados

### Fase 2: API Base
1. ✅ Implementar autenticação JWT
2. ✅ Criar endpoints de empresas
3. ✅ Criar endpoints de profissionais
4. ✅ Criar endpoints de serviços
5. ✅ Criar endpoints de clientes

### Fase 3: Agendamentos
1. ✅ Implementar lógica de validação de horários
2. ✅ Criar endpoints de agendamentos
3. ✅ Implementar cálculo de valores e durações
4. ✅ Implementar geração de protocolos

### Fase 4: Integrações
1. ✅ Integração WhatsApp
2. ✅ Integração Google Calendar
3. ✅ Integração IA para processamento de linguagem

### Fase 5: Frontend
1. ✅ Dashboard administrativo
2. ✅ Gestão de profissionais
3. ✅ Gestão de agendamentos
4. ✅ Relatórios

### Fase 6: Testes e Deploy
1. ✅ Testes unitários
2. ✅ Testes de integração
3. ✅ Testes de carga
4. ✅ Deploy em produção

---

## 📚 Glossário

| Termo | Descrição |
|-------|-----------|
| **Multi-tenant** | Arquitetura onde múltiplos clientes (empresas) compartilham a mesma infraestrutura |
| **UUID** | Identificador único universal (128 bits) |
| **CITEXT** | Tipo de texto case-insensitive do PostgreSQL |
| **TSTZRANGE** | Tipo de intervalo de timestamp com timezone |
| **INTERVAL** | Tipo de duração de tempo do PostgreSQL |
| **Trigger** | Função executada automaticamente em eventos do banco |
| **Webhook** | Callback HTTP para notificações em tempo real |
| **JWT** | JSON Web Token para autenticação |

---

## 🎯 Resumo: Pontos-Chave para Desenvolvimento

### 1. Identificação da Empresa
```
✅ SEMPRE use instancia_id para identificar a empresa
✅ Mensagem WhatsApp → instancia_id → empresa_id
✅ Todas as queries devem filtrar por empresa_id
```

### 2. Fluxo de Agendamento
```
Webhook → Instância → Empresa → Contexto → IA → Validação → Criação → Google Calendar
```

### 3. Tabelas Críticas
- **instancia**: Ponto de entrada (identifica empresa)
- **empresa**: Entidade raiz (multi-tenant)
- **empresa_cfg**: Configurações (antecedência, intervalos, prompts)
- **agendamento**: Agendamentos (com campo calculado periodo)
- **contexto_sessao**: Contexto das conversas (IA)

### 4. Validações Obrigatórias
- ✅ Verificar antecedência mínima
- ✅ Verificar disponibilidade do profissional (tstzrange)
- ✅ Verificar horário de trabalho do profissional
- ✅ Aplicar buffers pré e pós atendimento
- ✅ Validar isolamento por empresa_id

### 5. Integrações
- **WhatsApp**: Webhook → instancia_id → processamento
- **Google Calendar**: Sincronização bidirecional
- **IA**: Templates versionados por empresa

---

## 📞 Suporte

Para dúvidas sobre a estrutura do banco de dados ou desenvolvimento da aplicação, consulte:
- Arquivo de estrutura: `estrutura_banco.sql`
- Backup de dados: `backup_25_10_25`
- Esta documentação: `DOCUMENTACAO_BANCO_DADOS.md`

---

## 🔑 Conceito Mais Importante

**A tabela `instancia` é a chave para todo o sistema multi-tenant via WhatsApp!**

```
┌─────────────────────────────────────────────────────────┐
│  Mensagem WhatsApp → instancia_id → empresa_id          │
│                                                         │
│  SEM instancia_id = Não sabe qual empresa é            │
│  COM instancia_id = Sistema funciona perfeitamente     │
└─────────────────────────────────────────────────────────┘
```

---

**Documentação gerada em**: 2025-01-27  
**Versão do banco**: PostgreSQL 16.9  
**Backup analisado**: 2025-10-25  
**Última atualização**: 2025-01-27