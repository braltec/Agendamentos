# 🧙‍♂️ Wizard de Configuração Inicial

## 📋 Visão Geral

Wizard completo em **7 etapas** para configurar uma empresa nova no sistema. Guia o usuário admin da empresa através de todos os passos necessários para deixar o sistema operacional.

---

## 🎯 Estrutura do Wizard

### 1️⃣ Configurações de Agendamento
**Objetivo**: Definir regras básicas de agendamento

**Campos**:
- `anteced_minutos` (padrão: 30) - Tempo mínimo de antecedência para agendar
- `interv_minutos` (padrão: 15) - Intervalo mínimo entre agendamentos
- `buffer_pre_minutos` (padrão: 5) - Tempo de preparação antes do atendimento
- `buffer_pos_minutos` (padrão: 5) - Tempo de limpeza após o atendimento
- `timezone` (padrão: America/Sao_Paulo) - Fuso horário

**Tabela**: `empresa_cfg`

---

### 2️⃣ Horários de Funcionamento
**Objetivo**: Definir dias e horários de atendimento

**Estrutura**:
- Dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
- Horário de início (ex: 08:00)
- Horário de fim (ex: 18:00)
- Marcar dias inativos (fechado)

**Processo**:
1. Criar turno "Padrão" em `horario_f`
2. Inserir horários em `horario_det`

**Tabelas**: `horario_f`, `horario_det`

---

### 3️⃣ Profissionais
**Objetivo**: Cadastrar profissionais que atendem

**Campos**:
- `profissional_nome` - Nome completo
- `profissional_contato` - Telefone/WhatsApp
- `especialidade` - Especialidade (opcional)

**Observação**: 
- ✅ Usa automaticamente o endereço da empresa
- ✅ Simplifica o cadastro inicial
- ⚙️ Pode editar endereço depois se necessário

**Tabela**: `profissional`

---

### 4️⃣ Serviços
**Objetivo**: Cadastrar serviços oferecidos

**Campos**:
- `servicos_nome` - Nome do serviço
- `servicos_duracao` - Duração em minutos (convertido para interval)
- `servicos_valor` - Valor em R$
- `servicos_descricao` - Descrição do serviço

**Observação**:
- ⚠️ Serviços são **GLOBAIS** (sem `empresa_id`)
- ⚠️ Compartilhados entre todas as empresas
- ✅ Personalização por empresa via `profissional_servico`

**Tabela**: `servicos`

---

### 5️⃣ Vincular Serviços aos Profissionais ⭐ NOVA ETAPA
**Objetivo**: Definir quais profissionais fazem quais serviços

**Processo**:
1. Listar profissionais cadastrados
2. Listar serviços cadastrados
3. Permitir seleção múltipla
4. Opcional: Personalizar valor/duração por profissional

**Campos opcionais**:
- `valor_personalizado` - Valor diferente do padrão
- `duracao_personalizada` - Duração diferente do padrão
- `observacoes` - Observações sobre o vínculo

**Tabela**: `profissional_servico`

**Exemplo**:
```
Serviço: Limpeza de pele (padrão R$ 150,00 - 1h30)
├─ Profissional A: R$ 150,00 - 1h30 (usa padrão)
└─ Profissional B: R$ 180,00 - 2h (personalizado)
```

---

### 6️⃣ Instância WhatsApp
**Objetivo**: Configurar conexão WhatsApp

**Campos**:
- `instancia_nome` - Nome da instância
- `instancia_observacao` - Instruções/observações

**Observação**:
- ✅ Instância já foi criada no cadastro da empresa
- ✅ Apenas atualizar nome e instruções
- 📱 Instruções de como conectar o WhatsApp

**Tabela**: `instancia`

---

### 7️⃣ Revisão e Conclusão
**Objetivo**: Revisar tudo e finalizar

**Exibir resumo**:
- ✅ Configurações de agendamento
- ✅ Horários de funcionamento (X dias configurados)
- ✅ Profissionais cadastrados (X profissionais)
- ✅ Serviços cadastrados (X serviços)
- ✅ Vínculos criados (X vínculos)
- ✅ Instância WhatsApp configurada

**Ação final**:
- Marcar wizard como concluído
- Redirecionar para dashboard

---

## 🔄 Fluxo Completo

```
Login do Admin
    ↓
Sistema detecta primeiro acesso
    ↓
Exibe Wizard (tela cheia)
    ↓
Etapa 1: Configurações ✅
    ↓
Etapa 2: Horários ✅
    ↓
Etapa 3: Profissionais ✅
    ↓
Etapa 4: Serviços ✅
    ↓
Etapa 5: Vincular Serviços ✅
    ↓
Etapa 6: WhatsApp ✅
    ↓
Etapa 7: Revisão ✅
    ↓
Wizard Concluído!
    ↓
Dashboard (sistema operacional)
```

---

## 📊 Tabelas Envolvidas

| Tabela | Ação | Observação |
|--------|------|------------|
| `empresa_cfg` | UPDATE | Atualizar configurações |
| `horario_f` | INSERT | Criar turno "Padrão" |
| `horario_det` | INSERT | Inserir horários |
| `profissional` | INSERT | Criar profissionais |
| `servicos` | INSERT | Criar serviços (global) |
| `profissional_servico` | INSERT | Vincular serviços |
| `instancia` | UPDATE | Atualizar instância |
| `empresa` | UPDATE | Marcar wizard concluído |

---

## 🔍 Descobertas Importantes

### ⚠️ Serviços são Compartilhados
- Tabela `servicos` **NÃO tem** `empresa_id`
- Serviços são globais no sistema
- Cada empresa personaliza via `profissional_servico`

### ✅ Horários Precisam de Turno
- `horario_f`: Define o turno (ex: "Padrão", "Manhã", "Tarde")
- `horario_det`: Define horários dentro do turno
- Wizard cria turno "Padrão" automaticamente

### ✅ Profissional Usa Endereço da Empresa
- Simplifica cadastro inicial
- Usa `endereco_id` e `cep` da empresa
- Pode editar depois se profissional trabalhar em outro local

---

## 🎨 Interface (Wireframe)

```
┌─────────────────────────────────────────────────────────────┐
│  🧙‍♂️ Configuração Inicial                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Etapa 1 de 7: Configurações de Agendamento                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Antecedência mínima: [30] minutos                 │   │
│  │  Intervalo entre agendamentos: [15] minutos        │   │
│  │  Buffer pré-atendimento: [5] minutos               │   │
│  │  Buffer pós-atendimento: [5] minutos               │   │
│  │  Timezone: [America/Sao_Paulo ▼]                   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Voltar]                                    [Próximo →]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Benefícios

- ⚡ **Rápido**: Configuração completa em 5-10 minutos
- 🎯 **Guiado**: Passo a passo intuitivo
- ✅ **Completo**: Cria tudo necessário para operar
- 🔒 **Seguro**: Validações em cada etapa
- 📊 **Visual**: Barra de progresso e resumo final

---

## 💡 Próximos Passos de Implementação

1. ✅ **Backend - Model** (CONCLUÍDO)
2. 🔄 **Backend - Controller** (EM ANDAMENTO)
3. ⏭️ **Backend - Routes**
4. ⏭️ **Frontend - Componente Wizard**
5. ⏭️ **Frontend - 7 Etapas**
6. ⏭️ **Integração com Dashboard**
7. ⏭️ **Testes e Ajustes**

---

**Desenvolvido com ❤️ para facilitar a vida dos admins!**








