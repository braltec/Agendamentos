# Arquitetura de Reagendamento Conversacional com Contexto Persistido

## Resumo do Problema

Quando o cliente lista seus agendamentos e responde de forma indireta ("esse mesmo", "muda ele pra amanhã"), o fluxo não tem `protocolo` e `eventId` para concluir o reagendamento.

## Solução Proposta: Máquina de Estados com Contexto Persistido

A solução se baseia em **3 pilares**:

1. **Estado de conversação** (`conversation_state`) na tabela `contexto_sessao`
2. **Dados do agendamento em foco** (`selected_*`) persistidos na sessão
3. **Lógica no LLM + workflow** para interpretar mensagens baseado no estado atual

---

## 1. Alterações na Tabela `contexto_sessao`

```sql
-- Adicionar colunas para máquina de estados e agendamento selecionado
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS conversation_state VARCHAR(50) DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS selected_protocolo VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_event_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_service_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_professional VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_start TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_duration_min INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_agendamentos JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS state_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_contexto_sessao_state 
ON public.contexto_sessao(conversation_state, state_expires_at);
```

### Estados de Conversação (`conversation_state`)

| Estado | Descrição | Próximo estado esperado |
|--------|-----------|------------------------|
| `idle` | Conversa normal, sem fluxo ativo | Qualquer |
| `awaiting_appointment_selection` | Sistema listou agendamentos, aguarda escolha | `awaiting_new_datetime` |
| `awaiting_new_datetime` | Agendamento selecionado, aguarda nova data/hora | `idle` (após sucesso) |
| `awaiting_confirmation` | Nova data verificada, aguarda confirmação | `idle` |

---

## 2. Fluxo de Estados no Reagendamento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DE REAGENDAMENTO                             │
└─────────────────────────────────────────────────────────────────────────────┘

[Cliente: "Quero reagendar"]
         │
         ▼
┌─────────────────────────────────────┐
│ LLM: intent=reschedule              │
│      action=list_events             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Workflow: Lista agendamentos        │
│ Salva: conversation_state =         │
│        'awaiting_appointment_selection'│
│ Salva: pending_agendamentos = [...]  │
│ Salva: state_expires_at = now + 10min│
└─────────────────────────────────────┘
         │
         ▼
[Sistema: "Encontrei 2 agendamentos:
 1. Corte com João - 20/04 às 14h (ABC-123)
 2. Barba com Pedro - 22/04 às 10h (DEF-456)
 Qual deseja reagendar?"]
         │
         ▼
[Cliente: "esse mesmo" / "o primeiro" / "o do João"]
         │
         ▼
┌─────────────────────────────────────┐
│ Workflow: Verifica conversation_state│
│ Se = 'awaiting_appointment_selection'│
│ → Injeta pending_agendamentos no    │
│   prompt do LLM                     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ LLM: Interpreta qual agendamento    │
│      baseado nos pending_agendamentos│
│ Retorna:                            │
│   intent=reschedule                 │
│   action=select_appointment         │ ← NOVA ACTION
│   selected_index=1 (ou protocolo)   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Workflow:                           │
│ Salva: selected_protocolo = ABC-123 │
│ Salva: selected_event_id = xxx      │
│ Salva: selected_* (demais dados)    │
│ Salva: conversation_state =         │
│        'awaiting_new_datetime'      │
└─────────────────────────────────────┘
         │
         ▼
[Sistema: "OK! Para qual data e horário
 deseja mudar o Corte com João?"]
         │
         ▼
[Cliente: "amanhã às 15h"]
         │
         ▼
┌─────────────────────────────────────┐
│ Workflow: Verifica conversation_state│
│ Se = 'awaiting_new_datetime'        │
│ → Injeta selected_* no payload      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ LLM: intent=reschedule              │
│      action=check_availability      │
│      date=2026-04-24                │
│      start=15:00                    │
│      (protocolo/eventId vêm do ctx) │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Workflow: check_availability_reschedule│
│ Usa: protocolo + eventId da sessão  │
│ Se DISPONÍVEL → update GCal + DB    │
│ Limpa: conversation_state = 'idle'  │
│ Limpa: selected_* = NULL            │
└─────────────────────────────────────┘
```

---

## 3. Implementação no Workflow n8n

### 3.1 Nó: `carregar_estado_sessao` (antes do LLM)

```javascript
// Carregar estado da sessão antes de chamar o LLM
const sessionId = $json.sessionId;

// Query executada no nó Postgres anterior
const sessao = $('buscar_snapshot').first().json;

const conversationState = sessao?.conversation_state || 'idle';
const stateExpiresAt = sessao?.state_expires_at;
const now = new Date();

// Verifica se o estado expirou (10 minutos de inatividade)
let estadoAtivo = conversationState;
if (stateExpiresAt && new Date(stateExpiresAt) < now) {
  estadoAtivo = 'idle'; // Estado expirou, volta ao idle
}

return [{
  json: {
    ...$json,
    conversation_state: estadoAtivo,
    selected_protocolo: sessao?.selected_protocolo || null,
    selected_event_id: sessao?.selected_event_id || null,
    selected_service_name: sessao?.selected_service_name || null,
    selected_professional: sessao?.selected_professional || null,
    selected_date: sessao?.selected_date || null,
    selected_start: sessao?.selected_start || null,
    selected_duration_min: sessao?.selected_duration_min || null,
    pending_agendamentos: sessao?.pending_agendamentos || null,
  }
}];
```

### 3.2 Nó: `injeta_contexto_no_prompt` (modifica systemMessage do LLM)

Adicionar ao prompt do LLM a informação do estado atual:

```javascript
// Dentro do template do systemMessage
const conversationState = $json.conversation_state || 'idle';
const pendingAgendamentos = $json.pending_agendamentos;
const selectedProtocolo = $json.selected_protocolo;

let contextoEstado = '';

if (conversationState === 'awaiting_appointment_selection' && pendingAgendamentos) {
  contextoEstado = `
### 🔄 ESTADO ATUAL: AGUARDANDO SELEÇÃO DE AGENDAMENTO

O sistema listou os seguintes agendamentos para o cliente escolher qual reagendar:

${JSON.stringify(pendingAgendamentos, null, 2)}

IMPORTANTE:
- Se o cliente indicar qual agendamento quer (por número, nome do serviço, profissional, data ou qualquer referência), use action="select_appointment" com o campo "selected_index" (1-based) ou "selected_protocolo".
- Frases como "esse mesmo", "o primeiro", "o do João", "o de quinta" indicam seleção.
- Se não conseguir identificar qual, peça para o cliente especificar.
`;
}

if (conversationState === 'awaiting_new_datetime' && selectedProtocolo) {
  contextoEstado = `
### 🔄 ESTADO ATUAL: AGUARDANDO NOVA DATA/HORA

O cliente já selecionou o agendamento que deseja reagendar:
- Protocolo: ${selectedProtocolo}
- Serviço: ${$json.selected_service_name}
- Profissional: ${$json.selected_professional}

IMPORTANTE:
- Aguarde o cliente informar a nova data e/ou hora.
- Quando tiver data + hora, use action="check_availability" com intent="reschedule".
- Você NÃO precisa incluir protocolo/eventId no JSON - o workflow recuperará da sessão.
`;
}

return contextoEstado;
```

### 3.3 Nó: `processa_selecao_agendamento` (após Switch, ramo select_appointment)

```javascript
// Novo ramo no Switch para action = "select_appointment"
const item = $json;
const pendingAgendamentos = item.pending_agendamentos || [];

// O LLM pode retornar selected_index (1-based) ou selected_protocolo
let agendamentoSelecionado = null;

if (item.selected_protocolo) {
  agendamentoSelecionado = pendingAgendamentos.find(
    a => a.protocolo === item.selected_protocolo
  );
} else if (item.selected_index) {
  const idx = Number(item.selected_index) - 1;
  agendamentoSelecionado = pendingAgendamentos[idx];
}

if (!agendamentoSelecionado) {
  return [{
    json: {
      ...item,
      success: false,
      encaminharCliente: true,
      resposta_usuario: 'Não consegui identificar qual agendamento você quer reagendar. Pode me dizer o número ou o protocolo?'
    }
  }];
}

// Retorna dados para salvar na sessão
return [{
  json: {
    ...item,
    selected_protocolo: agendamentoSelecionado.protocolo,
    selected_event_id: agendamentoSelecionado.eventId,
    selected_service_name: agendamentoSelecionado.serviceName,
    selected_professional: agendamentoSelecionado.professional,
    selected_date: agendamentoSelecionado.date,
    selected_start: agendamentoSelecionado.start,
    selected_duration_min: agendamentoSelecionado.duration_min,
    new_conversation_state: 'awaiting_new_datetime',
    success: true,
    encaminharCliente: true,
    resposta_usuario: `Certo! Vamos reagendar o ${agendamentoSelecionado.serviceName} com ${agendamentoSelecionado.professional}. Para qual data e horário você gostaria de mudar?`
  }
}];
```

### 3.4 Nó: `salva_estado_sessao` (UPSERT atualizado)

```sql
INSERT INTO contexto_sessao (
  session_id,
  empresa_id,
  ultimo_intent,
  ultimo_action,
  ultimo_service_id,
  ultimo_service_name,
  ultimo_profissional,
  ultimo_date,
  ultimo_start,
  status,
  conversation_state,
  selected_protocolo,
  selected_event_id,
  selected_service_name,
  selected_professional,
  selected_date,
  selected_start,
  selected_duration_min,
  pending_agendamentos,
  state_expires_at,
  updated_at
)
VALUES (
  '{{$json.sessionId}}',
  '{{$json.empresa_id}}',
  '{{$json.intent}}',
  '{{$json.action}}',
  {{ $json.service_id ? `'${$json.service_id}'` : 'NULL' }},
  {{ $json.service_name ? `'${$json.service_name}'` : 'NULL' }},
  {{ $json.professional ? `'${$json.professional}'` : 'NULL' }},
  {{ $json.date ? `'${$json.date}'::date` : 'NULL' }},
  {{ $json.start ? `'${$json.start}'` : 'NULL' }},
  '{{ $json.status || "aguardando" }}',
  '{{ $json.new_conversation_state || $json.conversation_state || "idle" }}',
  {{ $json.selected_protocolo ? `'${$json.selected_protocolo}'` : 'NULL' }},
  {{ $json.selected_event_id ? `'${$json.selected_event_id}'` : 'NULL' }},
  {{ $json.selected_service_name ? `'${$json.selected_service_name}'` : 'NULL' }},
  {{ $json.selected_professional ? `'${$json.selected_professional}'` : 'NULL' }},
  {{ $json.selected_date ? `'${$json.selected_date}'::date` : 'NULL' }},
  {{ $json.selected_start ? `'${$json.selected_start}'::time` : 'NULL' }},
  {{ $json.selected_duration_min ? $json.selected_duration_min : 'NULL' }},
  {{ $json.pending_agendamentos ? `'${JSON.stringify($json.pending_agendamentos)}'::jsonb` : 'NULL' }},
  {{ $json.new_conversation_state ? `now() + interval '10 minutes'` : 'NULL' }},
  now()
)

ON CONFLICT (session_id) DO UPDATE SET
  empresa_id = EXCLUDED.empresa_id,
  ultimo_intent = EXCLUDED.ultimo_intent,
  ultimo_action = EXCLUDED.ultimo_action,
  ultimo_service_id = COALESCE(EXCLUDED.ultimo_service_id, contexto_sessao.ultimo_service_id),
  ultimo_service_name = COALESCE(EXCLUDED.ultimo_service_name, contexto_sessao.ultimo_service_name),
  ultimo_profissional = COALESCE(EXCLUDED.ultimo_profissional, contexto_sessao.ultimo_profissional),
  ultimo_date = COALESCE(EXCLUDED.ultimo_date, contexto_sessao.ultimo_date),
  ultimo_start = COALESCE(EXCLUDED.ultimo_start, contexto_sessao.ultimo_start),
  status = EXCLUDED.status,
  conversation_state = COALESCE(EXCLUDED.conversation_state, contexto_sessao.conversation_state),
  selected_protocolo = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_protocolo, contexto_sessao.selected_protocolo)
  END,
  selected_event_id = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_event_id, contexto_sessao.selected_event_id)
  END,
  selected_service_name = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_service_name, contexto_sessao.selected_service_name)
  END,
  selected_professional = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_professional, contexto_sessao.selected_professional)
  END,
  selected_date = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_date, contexto_sessao.selected_date)
  END,
  selected_start = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_start, contexto_sessao.selected_start)
  END,
  selected_duration_min = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.selected_duration_min, contexto_sessao.selected_duration_min)
  END,
  pending_agendamentos = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.pending_agendamentos, contexto_sessao.pending_agendamentos)
  END,
  state_expires_at = CASE 
    WHEN EXCLUDED.conversation_state = 'idle' THEN NULL
    ELSE COALESCE(EXCLUDED.state_expires_at, contexto_sessao.state_expires_at)
  END,
  updated_at = now();
```

### 3.5 Nó: `enriquece_dados_reschedule` (antes do prepara_rescheduler)

```javascript
// Se estamos no fluxo de reschedule mas não temos protocolo/eventId no payload,
// recuperamos da sessão
const item = $json;
const sessao = $('buscar_snapshot').first().json;

// Prioridade: payload > sessão
const protocolo = item.protocolo || sessao?.selected_protocolo;
const eventId = item.eventId || sessao?.selected_event_id;
const serviceName = item.service_name || sessao?.selected_service_name;
const professional = item.professional || sessao?.selected_professional;
const duracaoMin = item.duracaoMin || item.duration_min || sessao?.selected_duration_min;

// Validação crítica
if (!protocolo || !eventId) {
  return [{
    json: {
      ...item,
      success: false,
      encaminharCliente: true,
      resposta_usuario: 'Não consegui identificar qual agendamento você quer reagendar. Pode me informar o protocolo ou listar seus agendamentos primeiro?',
      missing_fields: {
        protocolo: !protocolo,
        eventId: !eventId
      }
    }
  }];
}

return [{
  json: {
    ...item,
    protocolo,
    eventId,
    service_name: serviceName,
    professional,
    duracaoMin,
    // Marcar para limpar estado após conclusão
    clear_state_after: true
  }
}];
```

### 3.6 Nó: `atualiza_estado_apos_list_events` (após listar agendamentos)

```javascript
// Após list_events, salvar os agendamentos listados e mudar estado
const agendamentos = $json.agendamentos || [];

// Formatar para persistência
const pendingAgendamentos = agendamentos.map((a, idx) => ({
  index: idx + 1,
  protocolo: a.agend_protocolo,
  eventId: a.agend_id_calendar,
  serviceName: a.servico_nome || a.service_name,
  professional: a.profissional_nome || a.professional,
  date: a.agend_data,
  start: a.agend_inicio,
  duration_min: a.duracao_min
}));

return [{
  json: {
    ...$json,
    pending_agendamentos: pendingAgendamentos,
    new_conversation_state: agendamentos.length > 0 
      ? 'awaiting_appointment_selection' 
      : 'idle'
  }
}];
```

---

## 4. Alterações no Prompt do LLM (v2.4)

Adicionar nova action e regras para o estado:

```markdown
## 🎯 INTENTS E ACTIONS (ATUALIZADO)

| Action | Quando usar |
|--------|-------------|
| `ask_missing_info` | Faltam dados OU perguntas informativas |
| `list_slots` | Listar horários (precisa: serviço + data) |
| `check_availability` | Verificar horário específico |
| `create_event` | Criar agendamento |
| `cancel_event` | Cancelar agendamento |
| `list_events` | Listar agendamentos do cliente |
| `select_appointment` | **NOVO** - Selecionar agendamento da lista |

### 🆕 ACTION: select_appointment

Use quando:
- O `conversation_state` é `awaiting_appointment_selection`
- O cliente indica qual agendamento quer (por número, referência, etc.)

Campos obrigatórios:
- `selected_index`: número do agendamento (1-based) OU
- `selected_protocolo`: protocolo do agendamento

Exemplo:
```json
{
  "reasoning": "Estado=awaiting_appointment_selection. Cliente disse 'o primeiro'. Selecionando index=1.",
  "intent": "reschedule",
  "action": "select_appointment",
  "selected_index": 1,
  "notes": "Certo! Vou preparar o reagendamento desse."
}
```

### 📋 TABELA DE DECISÃO (REAGENDAMENTO ATUALIZADO)

| Situação | conversation_state | intent | action |
|----------|-------------------|--------|--------|
| "Quero reagendar" (sem saber qual) | idle | `reschedule` | `list_events` |
| Sistema listou, cliente escolhe | awaiting_appointment_selection | `reschedule` | `select_appointment` |
| Agendamento selecionado, cliente informa nova data | awaiting_new_datetime | `reschedule` | `check_availability` |
| Cliente desiste/muda de assunto | qualquer | novo intent | `ask_missing_info` (e limpa estado) |

### ⚠️ REGRAS DE ESTADO

1. **Sempre verifique `conversation_state` no contexto**
2. **Se estado = `awaiting_appointment_selection`**:
   - Mensagens como "esse", "o primeiro", "o do João" → `select_appointment`
   - NÃO use `check_availability` sem antes selecionar
3. **Se estado = `awaiting_new_datetime`**:
   - Foque em extrair nova data/hora
   - Use `check_availability` quando tiver ambos
   - Você NÃO precisa incluir protocolo/eventId - vêm da sessão
4. **Para limpar estado** (cliente desiste):
   - Retorne `clear_conversation_state: true` no JSON
```

---

## 5. Switch Atualizado no MCP

Adicionar nova rota no Switch principal:

```javascript
// No nó Switch, adicionar condição para select_appointment
{
  "conditions": [
    // ... outras condições ...
    {
      "id": "select_appointment",
      "leftValue": "={{ $json.operation }}",
      "rightValue": "select_appointment",
      "operator": {
        "type": "string",
        "operation": "equals"
      }
    }
  ]
}
```

---

## 6. Diagrama de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO PRINCIPAL                                │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Mensagem chega  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ buscar_snapshot  │ ← Carrega contexto_sessao
                    │ (Postgres)       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ carregar_estado  │ ← Extrai conversation_state,
                    │ _sessao (Code)   │   selected_*, pending_*
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ injeta_contexto  │ ← Adiciona estado ao prompt
                    │ _no_prompt       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      LLM         │ ← Interpreta com contexto
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ normaliza_opcao  │ ← Normaliza operation
                    │ _agendamento     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────────────────────────────┐
                    │                 SWITCH                    │
                    ├──────────┬──────────┬──────────┬─────────┤
                    │list_events│select_  │reschedule│ outros  │
                    │          │appointment│         │         │
                    └────┬─────┴────┬─────┴────┬─────┴────┬────┘
                         │          │          │          │
                         ▼          ▼          ▼          ▼
              ┌──────────────┐ ┌──────────┐ ┌──────────┐
              │ busca_agend  │ │ processa │ │ enriquece│
              │ _cliente     │ │ _selecao │ │ _dados   │
              └──────┬───────┘ └────┬─────┘ │ _reschedule
                     │              │       └────┬─────┘
                     ▼              │            │
              ┌──────────────┐      │            ▼
              │ atualiza_    │      │     ┌──────────────┐
              │ estado_apos  │      │     │ prepara_     │
              │ _list_events │      │     │ rescheduler  │
              └──────┬───────┘      │     └──────┬───────┘
                     │              │            │
                     ▼              ▼            ▼
              ┌─────────────────────────────────────────────┐
              │            salva_estado_sessao              │
              │  (persiste conversation_state, selected_*)  │
              └─────────────────────────────────────────────┘
```

---

## 7. Cenários de Teste

### Cenário 1: Fluxo Completo Feliz

```
1. Cliente: "Quero reagendar"
   → LLM: intent=reschedule, action=list_events
   → Sistema: Lista agendamentos
   → Estado: awaiting_appointment_selection
   
2. Cliente: "o primeiro"
   → LLM: intent=reschedule, action=select_appointment, selected_index=1
   → Sistema: Salva selected_protocolo, selected_event_id
   → Estado: awaiting_new_datetime
   
3. Cliente: "pra amanhã às 15h"
   → LLM: intent=reschedule, action=check_availability, date=..., start=15:00
   → Sistema: Recupera protocolo/eventId da sessão
   → Executa: check_availability_reschedule
   → Se disponível: Update GCal + DB
   → Estado: idle (limpa selected_*)
```

### Cenário 2: Cliente Responde Direto com Referência

```
1. Cliente: "Quero mudar o horário do corte que marquei"
   → LLM: intent=reschedule, action=list_events
   → Sistema: Lista (1 agendamento de corte)
   → Estado: awaiting_appointment_selection

2. Cliente: "esse mesmo, muda pra quinta às 10h"
   → LLM: intent=reschedule, action=select_appointment, selected_index=1
   → Sistema: Salva selected_* + novo date/start na mesma mensagem
   
   OU (se LLM conseguir interpretar tudo de uma vez):
   → LLM pode fazer select_appointment E na próxima mensagem check_availability
```

### Cenário 3: Cliente Desiste no Meio

```
1. Cliente: "Quero reagendar"
   → Estado: awaiting_appointment_selection
   
2. Cliente: "Deixa pra lá, quanto custa uma barba?"
   → LLM: intent=schedule, action=ask_missing_info
   → clear_conversation_state: true
   → Estado: idle (limpa pending_*)
```

### Cenário 4: Estado Expira

```
1. Cliente: "Quero reagendar" às 10:00
   → Estado: awaiting_appointment_selection
   → state_expires_at: 10:10
   
2. Cliente responde às 10:25
   → Workflow detecta expiração
   → Estado volta para idle
   → LLM recomeça do zero
```

---

## 8. Checklist de Implementação

### Banco de Dados
- [ ] Executar ALTER TABLE para adicionar colunas
- [ ] Criar índice para performance

### Workflow Main
- [ ] Atualizar query de buscar_snapshot para trazer novas colunas
- [ ] Criar nó carregar_estado_sessao
- [ ] Atualizar injeção de contexto no prompt
- [ ] Atualizar nó salva_contexto_sessao com novas colunas

### Workflow MCP
- [ ] Adicionar rota select_appointment no Switch
- [ ] Criar nó processa_selecao_agendamento
- [ ] Criar nó atualiza_estado_apos_list_events
- [ ] Criar nó enriquece_dados_reschedule
- [ ] Atualizar nó de resposta do list_events para formatar pending_agendamentos

### Prompt LLM
- [ ] Adicionar action select_appointment
- [ ] Adicionar seção de estados de conversação
- [ ] Atualizar tabela de decisão
- [ ] Adicionar exemplos de uso

### Testes
- [ ] Testar fluxo completo feliz
- [ ] Testar referências indiretas ("esse mesmo", "o primeiro")
- [ ] Testar desistência no meio
- [ ] Testar expiração de estado
- [ ] Testar cliente com múltiplos agendamentos

---

## 9. Considerações Finais

### Vantagens desta Arquitetura

1. **Robustez**: Não depende de frases fixas
2. **Contexto persistido**: Sobrevive a desconexões
3. **Expiração automática**: Evita estados "travados"
4. **Extensível**: Mesma lógica pode ser usada para cancelamento
5. **Auditável**: Estado fica no banco, fácil debugar

### Pontos de Atenção

1. **Performance**: A query de buscar_snapshot já existe, apenas adicionar colunas
2. **Migração**: ALTER TABLE com DEFAULT não bloqueia em PostgreSQL moderno
3. **Timeout**: 10 minutos é um bom padrão, ajustar conforme necessidade
4. **Limpeza**: Estados antigos podem ser limpos com job agendado

### Próximos Passos

1. Implementar alterações no banco
2. Atualizar workflow Main
3. Atualizar workflow MCP
4. Atualizar prompt v2.4
5. Testar cenários
6. Deploy gradual (flag feature se necessário)
