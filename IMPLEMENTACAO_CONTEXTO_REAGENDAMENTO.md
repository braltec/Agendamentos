# Implementação do Contexto de Reagendamento

Guia passo a passo para implementar o contexto conversacional de reagendamento.

---

## PASSO 1: Executar SQL no Banco de Dados

Execute este SQL no seu PostgreSQL (pgAdmin, DBeaver, etc.):

```sql
-- Adicionar colunas na tabela contexto_sessao
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS conversation_state VARCHAR(50) DEFAULT 'idle';

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_protocolo VARCHAR(50) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_event_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_service_name VARCHAR(100) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_professional VARCHAR(100) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_duration_min INTEGER DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS pending_agendamentos JSONB DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS state_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 🆕 Coluna para guardar último resultado (ex: 'no_appointments', 'has_appointments')
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS last_result VARCHAR(50) DEFAULT NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_contexto_sessao_conversation_state 
ON public.contexto_sessao(conversation_state);
```

---

## PASSO 2: Adicionar Seção de Estado no Prompt (Tabela ai_prompt_templates)

Edite o seu prompt na tabela `ai_prompt_templates` e adicione esta seção no final do `template_text`, antes do CHECKLIST ou FALLBACK.

**O que adicionar no template:**

```markdown
---

## 🔄 REAGENDAMENTO COM CONTEXTO DE SESSÃO

{{ESTADO_REAGENDAMENTO}}

### Regras para estado "AGUARDANDO SELEÇÃO"

Se o campo acima mostrar "AGUARDANDO SELEÇÃO DE AGENDAMENTO" com uma lista de agendamentos:
- O cliente pode indicar qual quer de várias formas: "esse mesmo", "o primeiro", "o do João", "o de quinta", etc.
- Você DEVE incluir o campo `"selected_index"` no JSON com o número do agendamento (1, 2, 3...)
- Use `action: "ask_missing_info"` para perguntar a nova data, ou `action: "check_availability"` se ele já informou data+hora

Exemplo quando cliente diz "esse mesmo" ou "o primeiro":
```json
{"intent": "reschedule", "action": "ask_missing_info", "selected_index": 1, "notes": "Certo! Para qual data e horário você quer mudar?"}
```

Exemplo quando cliente diz "muda o primeiro pra amanhã às 15h":
```json
{"intent": "reschedule", "action": "check_availability", "selected_index": 1, "date": "YYYY-MM-DD", "start": "15:00", "notes": "Verificando disponibilidade..."}
```

### Regras para estado "AGUARDANDO NOVA DATA/HORA"

Se o campo acima mostrar "AGUARDANDO NOVA DATA/HORA":
- O agendamento já foi selecionado
- Aguarde o cliente informar a nova data e/ou horário
- Se informar só data → use `action: "list_slots"`
- Se informar data + hora exata → use `action: "check_availability"` com `intent: "reschedule"`
- Você NÃO precisa incluir protocolo/eventId - o sistema já tem esses dados

### Regras para estado "NENHUM AGENDAMENTO ENCONTRADO"

Se o campo acima mostrar "NENHUM AGENDAMENTO ENCONTRADO":
- O cliente tentou reagendar/cancelar mas NÃO possui agendamentos
- Se ele disser "sim", "quero", "pode", "ok" → ele quer AGENDAR NOVO
- Use `intent: "schedule"` e `action: "ask_missing_info"` para iniciar novo agendamento
- NÃO use `intent: "reschedule"` novamente!

Exemplo após "Não há eventos, deseja agendar?":
Cliente: "sim"
```json
{"intent": "schedule", "action": "ask_missing_info", "notes": "Certo! Qual serviço você gostaria de agendar?"}
```

---
```

**Via SQL:**

```sql
-- Ajuste 'prompt_agendamento' e a versão conforme seu caso
UPDATE ai_prompt_templates
SET template_text = template_text || '

---

## 🔄 REAGENDAMENTO COM CONTEXTO DE SESSÃO

{{ESTADO_REAGENDAMENTO}}

### Regras para estado "AGUARDANDO SELEÇÃO"

Se o campo acima mostrar "AGUARDANDO SELEÇÃO DE AGENDAMENTO" com uma lista de agendamentos:
- O cliente pode indicar qual quer de várias formas: "esse mesmo", "o primeiro", "o do João", "o de quinta", etc.
- Você DEVE incluir o campo "selected_index" no JSON com o número do agendamento (1, 2, 3...)
- Use action: "ask_missing_info" para perguntar a nova data, ou action: "check_availability" se ele já informou data+hora

Exemplo quando cliente diz "esse mesmo" ou "o primeiro":
{"intent": "reschedule", "action": "ask_missing_info", "selected_index": 1, "notes": "Certo! Para qual data e horário você quer mudar?"}

Exemplo quando cliente diz "muda o primeiro pra amanhã às 15h":
{"intent": "reschedule", "action": "check_availability", "selected_index": 1, "date": "YYYY-MM-DD", "start": "15:00", "notes": "Verificando disponibilidade..."}

### Regras para estado "AGUARDANDO NOVA DATA/HORA"

Se o campo acima mostrar "AGUARDANDO NOVA DATA/HORA":
- O agendamento já foi selecionado
- Aguarde o cliente informar a nova data e/ou horário
- Se informar só data → use action: "list_slots"
- Se informar data + hora exata → use action: "check_availability" com intent: "reschedule"
- Você NÃO precisa incluir protocolo/eventId - o sistema já tem esses dados

### Regras para estado "NENHUM AGENDAMENTO ENCONTRADO"

Se o campo acima mostrar "NENHUM AGENDAMENTO ENCONTRADO":
- O cliente tentou reagendar/cancelar mas NÃO possui agendamentos
- Se ele disser "sim", "quero", "pode", "ok" → ele quer AGENDAR NOVO
- Use intent: "schedule" e action: "ask_missing_info" para iniciar novo agendamento
- NÃO use intent: "reschedule" novamente!

Exemplo após "Não há eventos, deseja agendar?":
Cliente: "sim"
{"intent": "schedule", "action": "ask_missing_info", "notes": "Certo! Qual serviço você gostaria de agendar?"}

---

'
WHERE key = 'prompt_agendamento' 
  AND version = 'sua_versao_aqui';
```

---

## PASSO 3: Modificar Nó `monta_placeholders` no n8n

1. Abra o workflow **Agendamento - Main** no n8n
2. Encontre o nó **`monta_placeholders`** (Code node)
3. **Apague todo o código** e cole este:

```javascript
// ⚙️ Run Once for All Items

/** Helpers **/
const uniqBy = (arr, keyFn) => {
  const seen = new Set();
  return arr.filter(x => {
    const k = keyFn(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const safeParse = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
};

/** 1) PUXA DADOS DO MERGE2 (PROMPT + CONTEXTO COMPLETO) **/
const mergeItems = $('Merge2').all().map(i => i.json);

let promptCtxItem =
  mergeItems.find(i => i.template_text && i.context) ||
  mergeItems.find(i => i.context) ||
  {};

let ctx = promptCtxItem.context || {};
let template_text = promptCtxItem.template_text || "";

// Busca item da sessão - pode ter conversation_state, last_result, etc.
const sessionItem = mergeItems.find(i => i.session_id || i.conversation_state || i.last_result) || 
                    mergeItems.find(i => i.empresa_id) || 
                    {};
const ultimoItem  = mergeItems.find(i => i.ultimo_intent || i.ultimo_action) || {};

// 🆕 Debug: log para verificar se os dados estão chegando
// console.log('sessionItem:', JSON.stringify(sessionItem));
// console.log('conversation_state:', sessionItem.conversation_state);
// console.log('last_result:', sessionItem.last_result);

const sessionId = sessionItem.session_id ?? null;
const empresaId = sessionItem.empresa_id ?? null;

const ultimo = {
  intent:        ultimoItem.ultimo_intent || null,
  action:        ultimoItem.ultimo_action || null,
  service_name:  ultimoItem.ultimo_service_name || null,
  date:          ultimoItem.ultimo_date || null,
  start:         ultimoItem.ultimo_start || null,
};

/** 2) PUXA ESTRUTURA DO REDIS (EVENTOS PARA CANCELAMENTO/REAGENDAMENTO) **/
const redisItems = $('Redis').all().map(i => i.json);

let eventos = [];
for (const it of redisItems) {
  const raw = it?.cancel ?? it?.value;
  eventos.push(...safeParse(raw));
}
eventos = uniqBy(eventos, e => e.eventId || e.protocolo || `${e.servico}|${e.data}|${e.hora}`);

// 🆕 FILTRAR EVENTOS PASSADOS - só manter agendamentos futuros
const agora = new Date();
const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;

eventos = eventos.filter(e => {
  // Tenta pegar a data do evento
  let dataEvento = e.data || e.date || e.agend_data;
  
  // Se a data estiver no formato DD/MM/YYYY, converter para YYYY-MM-DD
  if (dataEvento && dataEvento.includes('/')) {
    const partes = dataEvento.split('/');
    if (partes.length === 3) {
      dataEvento = `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
  }
  
  // Se não tiver data, manter o evento (não filtrar)
  if (!dataEvento) return true;
  
  // Comparar: manter apenas se data >= hoje
  return dataEvento >= hojeStr;
});

const EVENTOS_LISTA = eventos.length
  ? eventos.map((e, i) =>
      `${i + 1}. ${e.servico} | ${e.profissional} | ${e.hora} | ${e.data} | Protocolo ${e.protocolo}`
    ).join('\n')
  : "";
const EVENTOS_JSON = JSON.stringify(eventos);

/** 3) CAMPOS DERIVADOS DO CONTEXTO **/
const tz = ctx?.empresa?.timezone || 'America/Sao_Paulo';
const nowTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
const TODAY = `${nowTz.getFullYear()}-${String(nowTz.getMonth()+1).padStart(2,'0')}-${String(nowTz.getDate()).padStart(2,'0')}`;
const YEAR  = String(nowTz.getFullYear());

const ANT  = (ctx?.regras?.antecedenciaMinutos ?? 30);
const SLOT = (ctx?.regras?.intervaloMinutos ?? 15);

const SERVICOS_LISTA = (ctx?.profissionais || [])
  .flatMap(p => (p.servicos || []).map(s => `- ${s.nome}`))
  .join('\n');

const PROFISSIONAIS_LISTA = (ctx?.profissionais || [])
  .map(p => `- ${p.nome}: ${(p.servicos || []).map(s => s.nome).join(', ')}`)
  .join('\n');

const CTX_JSON = JSON.stringify(ctx);

// ============================================================================
// 🆕 CONTEXTO DE ESTADO PARA REAGENDAMENTO
// Gera apenas os DADOS dinâmicos para {{ESTADO_REAGENDAMENTO}}
// As INSTRUÇÕES/REGRAS ficam no template do banco (ai_prompt_templates)
// ============================================================================

const conversationState = sessionItem.conversation_state || 'idle';
const stateExpiresAt = sessionItem.state_expires_at;
const now = new Date();

let estadoAtivo = conversationState;
if (stateExpiresAt && new Date(stateExpiresAt) < now) {
  estadoAtivo = 'idle';
}

const selectedProtocolo = sessionItem.selected_protocolo || null;
const selectedEventId = sessionItem.selected_event_id || null;
const selectedServiceName = sessionItem.selected_service_name || null;
const selectedProfessional = sessionItem.selected_professional || null;
const selectedDurationMin = sessionItem.selected_duration_min || null;
const lastResult = sessionItem.last_result || null;

let pendingAgendamentos = [];
if (sessionItem.pending_agendamentos) {
  try {
    pendingAgendamentos = typeof sessionItem.pending_agendamentos === 'string'
      ? JSON.parse(sessionItem.pending_agendamentos)
      : sessionItem.pending_agendamentos;
  } catch {}
}

// Gera apenas os DADOS dinâmicos para o placeholder {{ESTADO_REAGENDAMENTO}}
// As INSTRUÇÕES/REGRAS ficam no template do banco de dados
let ESTADO_REAGENDAMENTO = '';

if (estadoAtivo === 'awaiting_appointment_selection' && pendingAgendamentos.length > 0) {
  const lista = pendingAgendamentos.map((a, i) => 
    `${i + 1}. ${a.serviceName || a.servico} com ${a.professional || a.profissional} - ${a.date || a.data} às ${a.start || a.hora} (Protocolo: ${a.protocolo})`
  ).join('\n');
  
  ESTADO_REAGENDAMENTO = `**ESTADO ATUAL: AGUARDANDO SELEÇÃO DE AGENDAMENTO**

Agendamentos disponíveis para reagendar:

${lista}`;
}

else if (estadoAtivo === 'awaiting_new_datetime' && selectedProtocolo) {
  ESTADO_REAGENDAMENTO = `**ESTADO ATUAL: AGUARDANDO NOVA DATA/HORA**

Agendamento selecionado:
- Protocolo: ${selectedProtocolo}
- Serviço: ${selectedServiceName}
- Profissional: ${selectedProfessional}`;
}

else if (estadoAtivo === 'no_appointments_found' || lastResult === 'no_appointments') {
  ESTADO_REAGENDAMENTO = `**ESTADO ATUAL: NENHUM AGENDAMENTO ENCONTRADO**

O cliente tentou reagendar/cancelar mas NÃO possui agendamentos.
Se ele disser "sim", "quero", "pode" → ele quer AGENDAR NOVO.
Use intent: "schedule" e action: "ask_missing_info" para iniciar novo agendamento.
NÃO use intent: "reschedule" novamente.`;
}

else {
  ESTADO_REAGENDAMENTO = '**ESTADO ATUAL: Nenhum reagendamento em andamento**';
}

/** 4) RETORNA 1 ITEM CONSOLIDADO **/
return [{
  template_text: template_text,
  TODAY,
  YEAR,
  TZ: tz,
  ANT,
  SLOT,
  CTX_JSON,
  SERVICOS_LISTA,
  PROFISSIONAIS_LISTA,
  SESSION_ID: sessionId,
  EMPRESA_ID: empresaId,
  ULTIMO: ultimo,
  EVENTOS_JSON,
  EVENTOS_LISTA,
  // 🆕 Campos para contexto de reagendamento
  ESTADO_REAGENDAMENTO,  // Apenas dados, instruções ficam no banco
  CONVERSATION_STATE: estadoAtivo,
  SELECTED_PROTOCOLO: selectedProtocolo,
  SELECTED_EVENT_ID: selectedEventId,
  SELECTED_SERVICE_NAME: selectedServiceName,
  SELECTED_PROFESSIONAL: selectedProfessional,
  SELECTED_DURATION_MIN: selectedDurationMin,
  PENDING_AGENDAMENTOS: pendingAgendamentos,
  LAST_RESULT: lastResult,
}];
```

4. Salve o nó

---

## PASSO 4: Modificar Nó `interpolador` no n8n

1. Encontre o nó **`interpolador`** (Code node)
2. **Apague todo o código** e cole este:

```javascript
let sysMsg = $json.template_text
  .replaceAll("{{TODAY}}", $json.TODAY)
  .replaceAll("{{YEAR}}", $json.YEAR)
  .replaceAll("{{TZ}}", $json.TZ)
  .replaceAll("{{ANT}}", String($json.ANT))
  .replaceAll("{{SLOT}}", String($json.SLOT))
  .replaceAll("{{CTX_JSON}}", $json.CTX_JSON)
  .replaceAll("{{SERVICOS_LISTA}}", $json.SERVICOS_LISTA)
  .replaceAll("{{PROFISSIONAIS_LISTA}}", $json.PROFISSIONAIS_LISTA)
  // 🆕 Substitui o placeholder de estado (apenas dados, instruções estão no template)
  .replaceAll("{{ESTADO_REAGENDAMENTO}}", $json.ESTADO_REAGENDAMENTO || "");

// Adiciona eventos se existirem
if ($json.EVENTOS_LISTA && $json.EVENTOS_LISTA.trim()) {
  sysMsg += `

📌 Agendamentos do cliente recuperados do Redis:
${$json.EVENTOS_LISTA}

📦 Eventos estruturados (use sempre protocolo e eventId daqui):
${$json.EVENTOS_JSON}
`;
}

return [{
  json: {
    system_message: sysMsg,
    // 🆕 Passa dados de contexto para próximos nós
    CONVERSATION_STATE: $json.CONVERSATION_STATE,
    SELECTED_PROTOCOLO: $json.SELECTED_PROTOCOLO,
    SELECTED_EVENT_ID: $json.SELECTED_EVENT_ID,
    SELECTED_SERVICE_NAME: $json.SELECTED_SERVICE_NAME,
    SELECTED_PROFESSIONAL: $json.SELECTED_PROFESSIONAL,
    SELECTED_DURATION_MIN: $json.SELECTED_DURATION_MIN,
    PENDING_AGENDAMENTOS: $json.PENDING_AGENDAMENTOS,
  }
}];
```

3. Salve o nó

---

## PASSO 5: Modificar Nó `enriquece_dados` no n8n

1. Encontre o nó **`enriquece_dados`** (Code node)
2. **Apague todo o código** e cole este:

```javascript
// Saída do parser
let parsed = { ...$('try_parse_json').first().json };

// Recupera contexto
let ctx = {};
try {
  ctx = $('ajusta_layout1').first().json.context
    || $('monta_placeholders').first().json.context
    || {};

  if (!ctx.empresa && $('monta_placeholders').first().json.CTX_JSON) {
    const raw = $('monta_placeholders').first().json.CTX_JSON;
    ctx = typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
} catch (e) {
  ctx = {};
}

// Nome e telefone do cliente
let nomeCliente = null;
let sessionId = null;
let telefoneRaw = null;
try {
  const ajusta = $('ajusta_layout1').first().json;
  nomeCliente = ajusta.nome || null;
  sessionId = ajusta.sessionId || null;
  telefoneRaw = ajusta.telefone || null;
} catch (e) {}

let telefoneLimpo = telefoneRaw ? telefoneRaw.split('@')[0] : null;

let telefoneLigacao = telefoneLimpo;
if (telefoneLimpo && telefoneLimpo.startsWith("55")) {
  const ddd = telefoneLimpo.slice(2, 4);
  let resto = telefoneLimpo.slice(4);
  if (!resto.startsWith("9") && resto.length === 8) {
    resto = "9" + resto;
  }
  telefoneLigacao = "55" + ddd + resto;
}

let linkWhatsApp = telefoneLimpo ? `https://wa.me/${telefoneLimpo}` : null;
let linkLigacao = telefoneLigacao ? `tel:+${telefoneLigacao}` : null;

function normalizeHorarios(horarios) {
  const result = {};
  for (let d = 0; d <= 6; d++) {
    result[d] = horarios && horarios[d] ? horarios[d] : [];
  }
  return result;
}

function findService(svc) {
  if (!ctx.profissionais) return null;
  for (const prof of ctx.profissionais) {
    for (const s of (prof.servicos || [])) {
      if (
        (svc.service_id && s.id === svc.service_id) ||
        (svc.service_name && s.nome.toLowerCase() === svc.service_name.toLowerCase())
      ) {
        return { ...s, prof };
      }
    }
  }
  return null;
}

// ============================================================================
// 🆕 CONTEXTO DE REAGENDAMENTO - Processar seleção e enriquecer payload
// ============================================================================

let montaData = {};
try {
  montaData = $('monta_placeholders').first().json || {};
} catch (e) {}

const conversationState = montaData.CONVERSATION_STATE || 'idle';
const pendingAgendamentos = montaData.PENDING_AGENDAMENTOS || [];
const selectedProtocolo = montaData.SELECTED_PROTOCOLO || null;
const selectedEventId = montaData.SELECTED_EVENT_ID || null;
const selectedServiceName = montaData.SELECTED_SERVICE_NAME || null;
const selectedProfessional = montaData.SELECTED_PROFESSIONAL || null;
const selectedDurationMin = montaData.SELECTED_DURATION_MIN || null;

// Se LLM retornou selected_index, resolver para protocolo/eventId
if (parsed.selected_index && pendingAgendamentos.length > 0) {
  const idx = Number(parsed.selected_index) - 1;
  const agendamento = pendingAgendamentos[idx];
  
  if (agendamento) {
    parsed.protocolo = agendamento.protocolo;
    parsed.eventId = agendamento.eventId;
    parsed.service_name = parsed.service_name || agendamento.serviceName || agendamento.servico;
    parsed.professional = parsed.professional || agendamento.professional || agendamento.profissional;
    parsed.duracaoMin = parsed.duracaoMin || agendamento.duration_min || agendamento.duracao_min;
    parsed.calendarId = agendamento.calendarId || agendamento.id_calendar;
    
    parsed._save_selected = true;
    parsed._selected_protocolo = agendamento.protocolo;
    parsed._selected_event_id = agendamento.eventId;
    parsed._selected_service_name = agendamento.serviceName || agendamento.servico;
    parsed._selected_professional = agendamento.professional || agendamento.profissional;
    parsed._selected_duration_min = agendamento.duration_min || agendamento.duracao_min;
    
    if (!parsed.date || !parsed.start) {
      parsed._new_conversation_state = 'awaiting_new_datetime';
    } else {
      parsed._clear_state_after = true;
    }
  }
}

// Se intent=reschedule e não tem protocolo, recuperar da sessão
if (parsed.intent === 'reschedule' && 
    (parsed.action === 'check_availability' || parsed.action === 'create_event') &&
    !parsed.protocolo) {
  
  if (selectedProtocolo && selectedEventId) {
    parsed.protocolo = selectedProtocolo;
    parsed.eventId = selectedEventId;
    parsed.service_name = parsed.service_name || selectedServiceName;
    parsed.professional = parsed.professional || selectedProfessional;
    parsed.duracaoMin = parsed.duracaoMin || selectedDurationMin;
    parsed._clear_state_after = true;
  } else {
    parsed._missing_context = true;
    parsed.notes = 'Não encontrei qual agendamento você quer reagendar. Pode me informar o protocolo ou dizer qual da lista?';
    parsed.action = 'ask_missing_info';
  }
}

parsed._conversation_state = conversationState;
parsed._pending_agendamentos = pendingAgendamentos;

// ============================================================================
// CÓDIGO ORIGINAL CONTINUA
// ============================================================================

if ((!parsed.services || !parsed.services.length) && ctx?.ultimo_service_name) {
  parsed.services = [{
    service_id: ctx.ultimo_service_id,
    service_name: ctx.ultimo_service_name,
    duration_min: ctx.ultimo_duration_min,
    valor: ctx.ultimo_valor ?? null
  }];
}
if (!parsed.date && ctx?.ultimo_date) {
  parsed.date = ctx.ultimo_date;
}
if (!parsed.professional && ctx?.ultimo_profissional) {
  parsed.professional = ctx.ultimo_profissional;
  parsed.professional_id = ctx.ultimo_profissional_id;
}

if (Array.isArray(parsed.services) && parsed.services.length) {
  let totalDuracao = 0;
  let totalValor = 0;

  parsed.services = parsed.services.map(svc => {
    const resolved = findService(svc);
    if (resolved) {
      totalDuracao += resolved.minutos || 0;
      totalValor += resolved.valor || 0;
      return {
        service_id: resolved.id,
        service_name: resolved.nome,
        duration_min: resolved.minutos,
        valor: resolved.valor || null
      };
    } else {
      totalDuracao += Number(svc.duration_min) || 0;
      totalValor += Number(svc.valor) || 0;
      return {
        service_id: svc.service_id || null,
        service_name: svc.service_name || null,
        duration_min: svc.duration_min || null,
        valor: svc.valor || null
      };
    }
  });

  parsed.duration_min = totalDuracao > 0 ? totalDuracao : null;
  parsed.valor_total = totalValor > 0 ? totalValor : null;
}

if (parsed.professional) {
  const chosen = ctx.profissionais?.find(p =>
    p.nome.toLowerCase() === parsed.professional.toLowerCase()
  );
  parsed.professional_id = chosen?.id || null;
  parsed.calendarId = parsed.calendarId || chosen?.calendarId || null;
  parsed.horarios = normalizeHorarios(chosen?.horarios || {});
} else if (ctx.profissionais && parsed.services?.length) {
  const candidatos = ctx.profissionais.filter(p =>
    parsed.services.every(svc =>
      (p.servicos || []).some(s => s.id === svc.service_id)
    )
  );

  if (candidatos.length === 1) {
    parsed.professional = candidatos[0].nome;
    parsed.professional_id = candidatos[0].id;
    parsed.calendarId = parsed.calendarId || candidatos[0].calendarId;
    parsed.horarios = normalizeHorarios(candidatos[0].horarios || {});
  } else if (candidatos.length > 1 && parsed.action !== "ask_missing_info") {
    parsed.intent = "schedule";
    parsed.action = "ask_missing_info";
    parsed.notes = `Quem você prefere para ${parsed.services.map(s => s.service_name).join(" + ")}? ${candidatos.map(p => p.nome).join(", ")}`;
  }
}

if (parsed.action !== "ask_missing_info") {
  if (
    parsed.intent === "schedule" &&
    (!parsed.action || parsed.action === null) &&
    parsed.services?.length &&
    parsed.date &&
    parsed.start
  ) {
    parsed.action = "check_availability";
  }
}

const confirmacoes = ["sim", "pode confirmar", "pode agendar", "quero confirmar", "ok"];

if (
  parsed.intent === "schedule" &&
  parsed.action !== "ask_missing_info" &&
  parsed.action !== "create_event" &&
  parsed.notes &&
  confirmacoes.some(c => parsed.notes.toLowerCase().includes(c))
) {
  parsed.action = "create_event";
}

parsed.nome_cliente = nomeCliente;
parsed.sessionId = sessionId;
parsed.telefone = telefoneLimpo;
parsed.telefone_ligacao = telefoneLigacao;
parsed.link_whatsapp = linkWhatsApp;
parsed.link_ligacao = linkLigacao;
parsed.empresa_id = ctx?.empresa?.id || null;

parsed.antecedenciaMinutos = ctx?.regras?.antecedenciaMinutos ?? null;
parsed.intervaloMinutos = ctx?.regras?.intervaloMinutos ?? null;

const schemaFields = [
  "intent", "action", "service_id", "service_name", "professional", "professional_id",
  "date", "start", "duration_min", "notes", "valor_total",
  "nome_cliente", "sessionId", "telefone", "telefone_ligacao",
  "link_whatsapp", "link_ligacao", "empresa_id", "calendarId", "horarios",
  "antecedenciaMinutos", "intervaloMinutos", "services",
  "protocolo", "eventId", "duracaoMin"
];

for (const f of schemaFields) {
  if (!(f in parsed)) parsed[f] = null;
}

for (const k in parsed) {
  if (parsed[k] === "..." || parsed[k] === "") {
    parsed[k] = null;
  }
}

return [parsed];
```

3. Salve o nó

---

## PASSO 6: Modificar Nó `salva_contexto_sessao` no n8n

1. Encontre o nó **`salva_contexto_sessao`** (Postgres node)
2. **Apague a query SQL** e cole esta:

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
  {{ $json.date && $json.date !== "..." ? `'${$json.date}'::date` : 'NULL' }},
  {{ $json.start && $json.start !== "..." ? `'${$json.start}'` : 'NULL' }},
  '{{ $json.status || "aguardando" }}',
  {{ 
    $json._clear_state_after ? "'idle'" :
    $json._new_conversation_state ? `'${$json._new_conversation_state}'` :
    $json._conversation_state ? `'${$json._conversation_state}'` : "'idle'"
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    $json._selected_protocolo ? `'${$json._selected_protocolo}'` :
    $json._save_selected && $json.protocolo ? `'${$json.protocolo}'` : 'NULL'
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    $json._selected_event_id ? `'${$json._selected_event_id}'` :
    $json._save_selected && $json.eventId ? `'${$json.eventId}'` : 'NULL'
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    $json._selected_service_name ? `'${$json._selected_service_name}'` : 'NULL'
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    $json._selected_professional ? `'${$json._selected_professional}'` : 'NULL'
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    $json._selected_duration_min ? $json._selected_duration_min : 'NULL'
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    $json._pending_agendamentos && $json._pending_agendamentos.length > 0 
      ? `'${JSON.stringify($json._pending_agendamentos)}'::jsonb` 
      : 'NULL'
  }},
  {{ 
    $json._clear_state_after ? 'NULL' :
    ($json._new_conversation_state || $json._save_selected) 
      ? `now() + interval '10 minutes'` 
      : 'NULL'
  }},
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
  conversation_state = EXCLUDED.conversation_state,
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

3. Salve o nó

---

## PASSO 7: Modificar Nó `trabalha_saida_mcp` no n8n

1. Encontre o nó **`trabalha_saida_mcp`** (Code node)
2. Localize a linha `const data = $json;` no código existente
3. **Logo APÓS essa linha**, adicione este código:

```javascript
// ============================================================================
// 🆕 TRATAR RETORNO DE LIST_EVENTS PARA REAGENDAMENTO
// ============================================================================

const listaAgendamentos = data.agendamentos || data.eventos || [];
let intentOriginal = null;
try {
  intentOriginal = $('enriquece_dados').first().json.intent;
} catch (e) {}

if (intentOriginal === 'reschedule' || intentOriginal === 'cancel') {
  if (listaAgendamentos.length > 0) {
    // TEM agendamentos - salvar para seleção
    const pendingAgendamentos = listaAgendamentos.map((a, idx) => ({
      index: idx + 1,
      protocolo: a.protocolo || a.agend_protocolo,
      eventId: a.id_calendar || a.agend_id_calendar,
      serviceName: a.servico_nome || a.servico,
      professional: a.profissional_nome || a.profissional,
      date: a.agend_data || (a.agend_inicio ? a.agend_inicio.split('T')[0] : null),
      start: a.start_fmt || (a.agend_inicio ? a.agend_inicio.split('T')[1]?.substring(0,5) : null),
      duration_min: a.duracao_min || null,
      calendarId: a.gcalendar_id || null,
    }));
    
    data._save_pending_agendamentos = true;
    data._pending_agendamentos = pendingAgendamentos;
    data._new_conversation_state = 'awaiting_appointment_selection';
    data._last_result = 'has_appointments';
  } else {
    // NÃO TEM agendamentos - marcar para o LLM saber
    data._clear_state_after = true;
    data._new_conversation_state = 'no_appointments_found';
    data._last_result = 'no_appointments';
    data._save_last_result = true;
  }
}

// ============================================================================
// CÓDIGO ORIGINAL CONTINUA ABAIXO (não apague)
// ============================================================================
```

4. Salve o nó

**Importante:** NÃO adicione `const data = $json;` novamente - essa linha já existe no código original.

---

## PASSO 8: Criar Nó `salva_estado_apos_mcp` no n8n

1. **Crie um novo nó Postgres** após o `trabalha_saida_mcp`
2. Nome: **`salva_estado_apos_mcp`**
3. Operation: **Execute Query**
4. Cole esta query:

```sql
UPDATE contexto_sessao
SET 
  conversation_state = CASE 
    WHEN {{ $json._new_conversation_state ? 'TRUE' : 'FALSE' }} THEN '{{ $json._new_conversation_state || 'idle' }}'
    ELSE conversation_state
  END,
  pending_agendamentos = CASE 
    WHEN {{ $json._save_pending_agendamentos ? 'TRUE' : 'FALSE' }} THEN '{{ JSON.stringify($json._pending_agendamentos || []) }}'::jsonb
    WHEN {{ $json._clear_state_after ? 'TRUE' : 'FALSE' }} THEN NULL
    ELSE pending_agendamentos
  END,
  state_expires_at = CASE 
    WHEN {{ $json._new_conversation_state ? 'TRUE' : 'FALSE' }} THEN now() + interval '10 minutes'
    WHEN {{ $json._clear_state_after ? 'TRUE' : 'FALSE' }} THEN NULL
    ELSE state_expires_at
  END,
  last_result = CASE
    WHEN {{ $json._save_last_result ? 'TRUE' : 'FALSE' }} THEN '{{ $json._last_result || '' }}'
    ELSE last_result
  END,
  updated_at = now()
WHERE session_id = '{{ $json.sessionId || $('enriquece_dados').first().json.sessionId }}';
```

**Importante:** Você precisa adicionar a coluna `last_result` na tabela. Execute este SQL adicional:

```sql
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS last_result VARCHAR(50) DEFAULT NULL;
```

5. Conecte: `trabalha_saida_mcp` → `salva_estado_apos_mcp` → `envia_msg`
6. Salve

---

## CHECKLIST FINAL

- [ ] **PASSO 1:** SQL executado no banco (novas colunas na contexto_sessao)
- [ ] **PASSO 2:** Seção de reagendamento + `{{ESTADO_REAGENDAMENTO}}` adicionados no prompt (ai_prompt_templates)
- [ ] **PASSO 3:** Código do `monta_placeholders` substituído
- [ ] **PASSO 4:** Código do `interpolador` substituído
- [ ] **PASSO 5:** Código do `enriquece_dados` substituído
- [ ] **PASSO 6:** Query do `salva_contexto_sessao` substituída
- [ ] **PASSO 7:** Código adicionado no início do `trabalha_saida_mcp`
- [ ] **PASSO 8:** Nó `salva_estado_apos_mcp` criado e conectado

---

## TESTE

Após implementar, teste com:

1. **"Quero reagendar"** → Deve listar os agendamentos
2. **"Esse mesmo"** ou **"O primeiro"** → Deve perguntar nova data
3. **"Amanhã às 15h"** → Deve executar o reagendamento
