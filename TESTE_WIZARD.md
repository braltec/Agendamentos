# 🧪 Teste do Wizard - Guia de Validação

## 📋 Objetivo

Validar se o backend do wizard está funcionando corretamente antes de criar o frontend completo.

---

## 🔧 Preparação

### 1. Certifique-se que os servidores estão rodando:

```bash
# Terminal 1 - Backend
cd /home/alex/Software/script/agendamento/api
npm run dev

# Terminal 2 - Frontend (não precisa por enquanto)
```

### 2. Faça login e pegue o token:

**URL:** http://localhost:3000  
**Email:** admin@teste.com  
**Senha:** admin123

Após o login, abra o DevTools (F12) → Console e digite:
```javascript
localStorage.getItem('token')
```

Copie o token para usar nos testes.

---

## 🧪 Testes das APIs

### Teste 1: Verificar Status do Wizard

```bash
curl -X GET http://localhost:5000/api/wizard/status \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "completed": false
  }
}
```

---

### Teste 2: Salvar Configurações de Agendamento

```bash
curl -X POST http://localhost:5000/api/wizard/configuracoes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "anteced_minutos": 30,
    "interv_minutos": 15,
    "buffer_pre_minutos": 5,
    "buffer_pos_minutos": 5
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Configurações salvas com sucesso",
  "data": { ... }
}
```

---

### Teste 3: Salvar Horários de Funcionamento

```bash
curl -X POST http://localhost:5000/api/wizard/horarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "horarios": [
      {
        "dia_semana": 1,
        "dia_nome": "Segunda-feira",
        "hora_inicio": "08:00",
        "hora_fim": "18:00",
        "ativo": true
      },
      {
        "dia_semana": 2,
        "dia_nome": "Terça-feira",
        "hora_inicio": "08:00",
        "hora_fim": "18:00",
        "ativo": true
      },
      {
        "dia_semana": 0,
        "dia_nome": "Domingo",
        "ativo": false
      }
    ]
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Horários salvos com sucesso",
  "data": {
    "success": true,
    "horario_f_id": "uuid-do-turno"
  }
}
```

---

### Teste 4: Criar Profissional

```bash
curl -X POST http://localhost:5000/api/wizard/profissionais \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "contato": "37999887766",
    "especialidade": "Manicure"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Profissional criado com sucesso",
  "data": {
    "profissional_id": "uuid-do-profissional",
    "profissional_nome": "Maria Silva",
    ...
  }
}
```

**⚠️ IMPORTANTE:** Anote o `profissional_id` para usar no próximo teste!

---

### Teste 5: Criar Serviço

```bash
curl -X POST http://localhost:5000/api/wizard/servicos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Manicure Completa",
    "duracao_minutos": 60,
    "valor": 40.00,
    "descricao": "Manicure completa com esmaltação"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Serviço criado com sucesso",
  "data": {
    "servicos_id": "uuid-do-servico",
    "servicos_nome": "Manicure Completa",
    ...
  }
}
```

**⚠️ IMPORTANTE:** Anote o `servicos_id` para usar no próximo teste!

---

### Teste 6: Vincular Serviço ao Profissional

```bash
curl -X POST http://localhost:5000/api/wizard/vincular-servico \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "profissional_id": "UUID_DO_PROFISSIONAL",
    "servico_id": "UUID_DO_SERVICO",
    "personalizacao": {}
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Serviço vinculado com sucesso",
  "data": { ... }
}
```

---

### Teste 7: Atualizar Instância WhatsApp

```bash
curl -X POST http://localhost:5000/api/wizard/instancia \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "WhatsApp Studio Débora",
    "observacao": "Instância principal de atendimento"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Instância atualizada com sucesso",
  "data": { ... }
}
```

---

### Teste 8: Concluir Wizard

```bash
curl -X POST http://localhost:5000/api/wizard/complete \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Wizard concluído com sucesso!"
}
```

---

### Teste 9: Verificar Status Novamente

```bash
curl -X GET http://localhost:5000/api/wizard/status \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "completed": true
  }
}
```

---

## ✅ Checklist de Validação

- [ ] Teste 1: Status inicial (completed: false)
- [ ] Teste 2: Configurações salvas
- [ ] Teste 3: Horários salvos + turno "Padrão" criado
- [ ] Teste 4: Profissional criado (com endereço da empresa)
- [ ] Teste 5: Serviço criado (global)
- [ ] Teste 6: Vínculo profissional-serviço criado
- [ ] Teste 7: Instância WhatsApp atualizada
- [ ] Teste 8: Wizard marcado como concluído
- [ ] Teste 9: Status final (completed: true)

---

## 🔍 Verificação no Banco de Dados

Após os testes, verifique no banco:

```sql
-- Verificar turno criado
SELECT * FROM horario_f WHERE empresa_id = 'SEU_EMPRESA_ID';

-- Verificar horários
SELECT * FROM horario_det WHERE horario_f_id IN (
  SELECT horario_f_id FROM horario_f WHERE empresa_id = 'SEU_EMPRESA_ID'
);

-- Verificar profissionais
SELECT * FROM profissional WHERE empresa_id = 'SEU_EMPRESA_ID';

-- Verificar vínculos
SELECT ps.*, s.servicos_nome, p.profissional_nome
FROM profissional_servico ps
JOIN servicos s ON ps.servicos_id = s.servicos_id
JOIN profissional p ON ps.profissional_id = p.profissional_id
WHERE p.empresa_id = 'SEU_EMPRESA_ID';
```

---

## 🐛 Problemas Comuns

### Erro 401 - Unauthorized
- Token expirado ou inválido
- Faça login novamente e pegue um novo token

### Erro 500 - Internal Server Error
- Verifique os logs do backend
- Pode ser problema de conexão com banco de dados
- Verifique se os campos estão corretos

### Erro 400 - Bad Request
- Dados inválidos no body
- Verifique o formato JSON
- Campos obrigatórios faltando

---

## 📝 Notas

- Todos os testes devem ser executados **em sequência**
- Anote os UUIDs gerados para usar nos testes seguintes
- Se algo falhar, verifique os logs do backend
- Após validar, podemos criar o frontend completo

---

**Pronto para testar!** 🚀








