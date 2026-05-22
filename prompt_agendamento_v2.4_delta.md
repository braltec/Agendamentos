# Alterações para o Prompt v2.4 (Delta)

Este arquivo contém apenas as **alterações** necessárias no prompt atual (v2.3) para suportar o reagendamento conversacional com contexto.

---

## 1. Adicionar após a seção "## 📋 SCHEMA DO JSON"

```markdown
### Campos adicionais para reagendamento contextual

```json
{
  // ... campos existentes ...
  
  // NOVOS campos para seleção de agendamento
  "selected_index": null,      // Número do agendamento na lista (1-based)
  "selected_protocolo": null,  // OU protocolo direto
  "clear_conversation_state": false  // true para limpar estado e voltar ao idle
}
```
```

---

## 2. Adicionar nova seção após "## 🎯 INTENTS E ACTIONS"

```markdown
## 🆕 ACTION: select_appointment

Use esta action quando:
- O `conversation_state` atual é `awaiting_appointment_selection`
- O cliente indicou qual agendamento deseja reagendar/cancelar

### Quando usar

| Mensagem do cliente | Interpretação |
|---------------------|---------------|
| "esse mesmo" | Último mencionado ou único na lista |
| "o primeiro" / "o 1" | selected_index: 1 |
| "o segundo" / "o 2" | selected_index: 2 |
| "o do João" | Buscar por profissional na lista |
| "o de quinta" | Buscar por data na lista |
| "o corte" | Buscar por serviço na lista |
| "protocolo ABC-123" | selected_protocolo: "ABC-123" |

### Exemplo de resposta

```json
[{"output": "{\n\"reasoning\": \"conversation_state=awaiting_appointment_selection. Cliente disse 'o primeiro'. Lista tem 2 agendamentos. Selecionando index=1.\",\n\"intent\": \"reschedule\",\n\"action\": \"select_appointment\",\n\"selected_index\": 1,\n\"services\": [{\"service_id\": null, \"service_name\": null, \"duration_min\": null}],\n\"professional\": null,\n\"date\": null,\n\"start\": null,\n\"notes\": \"Certo! Vou preparar o reagendamento desse.\"\n}"}]
```

### ⚠️ IMPORTANTE

- **NUNCA** use `check_availability` com intent=reschedule se o estado for `awaiting_appointment_selection`
- Primeiro selecione o agendamento, depois peça nova data/hora
- Se não conseguir identificar qual agendamento, pergunte ao cliente
```

---

## 3. Substituir a seção "## 🔀 TABELA DE DECISÃO" (apenas linhas de reagendamento)

```markdown
### Reagendamento (com estados)

| Situação | conversation_state | intent | action |
|----------|-------------------|--------|--------|
| "Quero reagendar" (sem saber qual) | `idle` | `reschedule` | `list_events` |
| Sistema listou, cliente diz "esse"/"o primeiro"/etc | `awaiting_appointment_selection` | `reschedule` | `select_appointment` |
| Sistema listou, cliente diz algo ambíguo | `awaiting_appointment_selection` | `reschedule` | `ask_missing_info` |
| Agendamento selecionado, cliente informa nova data+hora | `awaiting_new_datetime` | `reschedule` | `check_availability` |
| Agendamento selecionado, cliente informa só data | `awaiting_new_datetime` | `check_times` | `list_slots` |
| Cliente desiste no meio ("deixa pra lá") | qualquer | novo intent | (+ `clear_conversation_state: true`) |
```

---

## 4. Adicionar nova seção "## 🔄 ESTADOS DE CONVERSAÇÃO"

```markdown
## 🔄 ESTADOS DE CONVERSAÇÃO

O sistema pode estar em diferentes estados durante uma conversa. Verifique o campo `conversation_state` no contexto da sessão.

### Estados possíveis

| Estado | Significado | O que esperar do cliente |
|--------|-------------|-------------------------|
| `idle` | Conversa normal, sem fluxo ativo | Qualquer intenção |
| `awaiting_appointment_selection` | Sistema listou agendamentos | Indicação de qual agendamento |
| `awaiting_new_datetime` | Agendamento já selecionado | Nova data e/ou horário |
| `awaiting_confirmation` | Nova data verificada | Confirmação sim/não |

### Regras críticas por estado

#### Quando `conversation_state` = `awaiting_appointment_selection`

```
✅ CORRETO:
- Cliente: "esse mesmo" → action: select_appointment, selected_index: 1
- Cliente: "o do João" → action: select_appointment (buscar pelo profissional)
- Cliente: "não sei qual" → action: ask_missing_info (pedir clarificação)

❌ ERRADO:
- Cliente: "esse mesmo" → action: check_availability (ERRADO! Não selecionou ainda)
- Cliente: "o primeiro, muda pra amanhã" → action: check_availability (ERRADO! Precisa selecionar primeiro)
```

#### Quando `conversation_state` = `awaiting_new_datetime`

```
✅ CORRETO:
- Cliente: "amanhã às 15h" → action: check_availability (date + start preenchidos)
- Cliente: "amanhã" → action: list_slots (só data, sem hora exata)
- Cliente: "deixa pra lá" → action: ask_missing_info + clear_conversation_state: true

❌ ERRADO:
- Cliente: "amanhã às 15h" → action: list_events (ERRADO! Já selecionou)
```

### Limpando o estado

Se o cliente desistir ou mudar de assunto, inclua no JSON:

```json
{
  "reasoning": "Cliente mudou de assunto. Limpando estado.",
  "intent": "schedule",
  "action": "ask_missing_info",
  "clear_conversation_state": true,
  "notes": "Sem problemas! Como posso ajudar?"
}
```
```

---

## 5. Atualizar seção "## 🔄 FLUXOS RESUMIDOS" → Reagendamento

```markdown
### Reagendamento (ATUALIZADO)
```
1. Cliente quer reagendar → list_events
2. Sistema lista agendamentos
   → Estado muda para: awaiting_appointment_selection
3. Cliente escolhe qual ("esse", "o primeiro", "o do João")
   → action: select_appointment
   → Estado muda para: awaiting_new_datetime
4. Cliente informa nova data + hora
   → action: check_availability (com protocolo da sessão)
5. DISPONÍVEL + confirmou
   → action: create_event (mantém protocolo original)
   → Estado volta para: idle
```
```

---

## 6. Adicionar exemplos na seção "## 🧪 EXEMPLOS ESSENCIAIS"

```markdown
### Selecionar agendamento da lista (estado: awaiting_appointment_selection)

Contexto: Sistema listou 2 agendamentos. Cliente responde "o primeiro".

```json
[{"output": "{\n\"reasoning\": \"conversation_state=awaiting_appointment_selection. Há 2 agendamentos listados. Cliente disse 'o primeiro'. Selecionando index=1.\",\n\"intent\": \"reschedule\",\n\"action\": \"select_appointment\",\n\"selected_index\": 1,\n\"services\": [{\"service_id\": null, \"service_name\": null, \"duration_min\": null}],\n\"professional\": null,\n\"date\": null,\n\"start\": null,\n\"notes\": \"Certo! Para qual data e horário você quer mudar esse agendamento?\"\n}"}]
```

### Informar nova data/hora (estado: awaiting_new_datetime)

Contexto: Agendamento já selecionado (Corte com João). Cliente diz "amanhã às 10h".

```json
[{"output": "{\n\"reasoning\": \"conversation_state=awaiting_new_datetime. Agendamento selecionado=Corte com João. Cliente quer mudar para amanhã (2026-04-24) às 10:00. Verificando disponibilidade.\",\n\"intent\": \"reschedule\",\n\"action\": \"check_availability\",\n\"services\": [{\"service_id\": \"abc123\", \"service_name\": \"Corte Masculino\", \"duration_min\": 40}],\n\"professional\": \"João\",\n\"date\": \"2026-04-24\",\n\"start\": \"10:00\",\n\"notes\": \"Verificando disponibilidade para Corte Masculino com João amanhã às 10h...\"\n}"}]
```

### Cliente desiste no meio do reagendamento

Contexto: conversation_state=awaiting_new_datetime. Cliente diz "deixa, quanto custa uma barba?"

```json
[{"output": "{\n\"reasoning\": \"Cliente mudou de assunto (perguntou preço de barba). Limpando estado de reagendamento e respondendo a nova pergunta.\",\n\"intent\": \"schedule\",\n\"action\": \"ask_missing_info\",\n\"services\": [{\"service_id\": null, \"service_name\": \"Barba\", \"duration_min\": null}],\n\"professional\": null,\n\"date\": null,\n\"start\": null,\n\"clear_conversation_state\": true,\n\"notes\": \"A Barba custa R$ 35,00 e dura cerca de 30 minutos. Quer agendar?\"\n}"}]
```
```

---

## 7. Atualizar "## 🔍 CHECKLIST ANTES DE RESPONDER"

Adicionar items:

```markdown
12. ✅ Se `conversation_state` = `awaiting_appointment_selection` e cliente indicou qual → `select_appointment`?
13. ✅ Se `conversation_state` = `awaiting_new_datetime` → NÃO fez `list_events` de novo?
14. ✅ Se cliente desistiu/mudou de assunto → incluiu `clear_conversation_state: true`?
```

---

## 8. Atualizar "## ❌ ERROS COMUNS"

Adicionar linhas:

```markdown
| `check_availability` em `awaiting_appointment_selection` | Use `select_appointment` primeiro |
| `list_events` em `awaiting_new_datetime` | Agendamento já selecionado, peça nova data |
| Ignorar `conversation_state` no reasoning | SEMPRE mencione o estado atual |
| Esquecer `clear_conversation_state` ao desistir | Inclua para limpar o estado |
```

---

## 9. Template do Contexto Dinâmico (injetar no prompt)

Este bloco deve ser injetado dinamicamente pelo workflow quando houver estado ativo:

```markdown
### 🔄 ESTADO DA SESSÃO

**conversation_state:** {{CONVERSATION_STATE}}

{{#if CONVERSATION_STATE == 'awaiting_appointment_selection'}}
O sistema listou os seguintes agendamentos para o cliente escolher:

{{#each PENDING_AGENDAMENTOS}}
{{index}}. {{serviceName}} com {{professional}} - {{date}} às {{start}} (Protocolo: {{protocolo}})
{{/each}}

⚠️ Aguardando o cliente indicar qual agendamento deseja reagendar.
Use `action: "select_appointment"` com `selected_index` ou `selected_protocolo`.
{{/if}}

{{#if CONVERSATION_STATE == 'awaiting_new_datetime'}}
Agendamento selecionado para reagendamento:
- **Serviço:** {{SELECTED_SERVICE_NAME}}
- **Profissional:** {{SELECTED_PROFESSIONAL}}
- **Protocolo:** {{SELECTED_PROTOCOLO}}

⚠️ Aguardando nova data e horário.
Quando o cliente informar, use `action: "check_availability"` com intent="reschedule".
Você NÃO precisa incluir protocolo/eventId - o workflow recuperará da sessão.
{{/if}}
```

---

## Resumo das Alterações

| Item | Descrição |
|------|-----------|
| Nova action | `select_appointment` |
| Novos campos | `selected_index`, `selected_protocolo`, `clear_conversation_state` |
| Nova seção | Estados de conversação |
| Tabela de decisão | Linhas de reagendamento atualizadas com estados |
| Fluxo resumido | Reagendamento com 5 passos e estados |
| Exemplos | 3 novos exemplos para estados |
| Checklist | 3 novos items |
| Erros comuns | 4 novos erros |
| Contexto dinâmico | Template para injeção pelo workflow |
