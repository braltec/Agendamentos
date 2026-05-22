#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║              🧪 EXECUTANDO TESTES DO WIZARD                      ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fazer login e pegar token
echo -e "${YELLOW}🔐 Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@teste.com", "password": "admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Erro ao fazer login!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
echo ""

# Função para fazer requisições
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$data" ]; then
    curl -s -X $method "http://localhost:5000/api/wizard/$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json"
  else
    curl -s -X $method "http://localhost:5000/api/wizard/$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data"
  fi
}

# Teste 1: Status
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 TESTE 1: Verificar Status do Wizard${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

STATUS=$(api_call GET status)
echo "$STATUS"
echo ""

# Teste 2: Configurações
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⚙️  TESTE 2: Salvar Configurações${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CONFIG_DATA='{
  "anteced_minutos": 60,
  "interv_minutos": 15,
  "buffer_pre_minutos": 5,
  "buffer_pos_minutos": 5
}'

CONFIG_RESULT=$(api_call POST configuracoes "$CONFIG_DATA")
echo "$CONFIG_RESULT"
echo ""

# Teste 3: Horários
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🕐 TESTE 3: Salvar Horários${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

HORARIO_DATA='{
  "horarios": [
    {"dia_semana": 1, "dia_nome": "Segunda-feira", "hora_inicio": "08:00", "hora_fim": "18:00", "ativo": true},
    {"dia_semana": 2, "dia_nome": "Terça-feira", "hora_inicio": "08:00", "hora_fim": "18:00", "ativo": true},
    {"dia_semana": 3, "dia_nome": "Quarta-feira", "hora_inicio": "08:00", "hora_fim": "18:00", "ativo": true},
    {"dia_semana": 4, "dia_nome": "Quinta-feira", "hora_inicio": "08:00", "hora_fim": "18:00", "ativo": true},
    {"dia_semana": 5, "dia_nome": "Sexta-feira", "hora_inicio": "08:00", "hora_fim": "17:00", "ativo": true}
  ]
}'

HORARIO_RESULT=$(api_call POST horarios "$HORARIO_DATA")
echo "$HORARIO_RESULT"

# Extrair horario_f_id
HORARIO_F_ID=$(echo "$HORARIO_RESULT" | grep -o '"horario_f_id":"[^"]*"' | sed 's/"horario_f_id":"\(.*\)"/\1/')
echo -e "${GREEN}🆔 horario_f_id: $HORARIO_F_ID${NC}"
echo ""

# Teste 4: Criar Profissional
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}👤 TESTE 4: Criar Profissional${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROF_DATA='{
  "nome": "Dr. João Silva",
  "contato": "(11) 98765-4321",
  "especialidade": "Dermatologia"
}'

PROF_RESULT=$(api_call POST profissionais "$PROF_DATA")
echo "$PROF_RESULT"

# Extrair profissional_id
PROF_ID=$(echo "$PROF_RESULT" | grep -o '"profissional_id":"[^"]*"' | sed 's/"profissional_id":"\(.*\)"/\1/')
echo -e "${GREEN}🆔 profissional_id: $PROF_ID${NC}"
echo ""

# Teste 5: Vincular Horário ao Profissional
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 TESTE 5: Vincular Horário ao Profissional${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

VINCULO_HORARIO_DATA="{
  \"profissional_id\": \"$PROF_ID\",
  \"horario_f_id\": \"$HORARIO_F_ID\"
}"

VINCULO_HORARIO_RESULT=$(api_call POST vincular-horario "$VINCULO_HORARIO_DATA")
echo "$VINCULO_HORARIO_RESULT"
echo ""

# Teste 6: Criar Serviço
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}💼 TESTE 6: Criar Serviço${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SERVICO_DATA='{
  "nome": "Consulta Dermatológica",
  "duracao_minutos": 30,
  "valor": 150.00,
  "descricao": "Consulta completa com dermatologista"
}'

SERVICO_RESULT=$(api_call POST servicos "$SERVICO_DATA")
echo "$SERVICO_RESULT"

# Extrair servicos_id
SERVICO_ID=$(echo "$SERVICO_RESULT" | grep -o '"servicos_id":"[^"]*"' | sed 's/"servicos_id":"\(.*\)"/\1/')
echo -e "${GREEN}🆔 servicos_id: $SERVICO_ID${NC}"
echo ""

# Teste 7: Vincular Serviço ao Profissional
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 TESTE 7: Vincular Serviço ao Profissional${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

VINCULO_SERVICO_DATA="{
  \"profissional_id\": \"$PROF_ID\",
  \"servico_id\": \"$SERVICO_ID\",
  \"personalizacao\": {
    \"valor_personalizado\": 180.00,
    \"duracao_personalizada\": 45
  }
}"

VINCULO_SERVICO_RESULT=$(api_call POST vincular-servico "$VINCULO_SERVICO_DATA")
echo "$VINCULO_SERVICO_RESULT"
echo ""

# Teste 8: Atualizar Instância WhatsApp
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📱 TESTE 8: Atualizar Instância WhatsApp${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

INSTANCIA_DATA='{
  "nome": "WhatsApp Clínica",
  "observacao": "Instância principal para atendimento"
}'

INSTANCIA_RESULT=$(api_call POST instancia "$INSTANCIA_DATA")
echo "$INSTANCIA_RESULT"
echo ""

# Teste 9: Concluir Wizard
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✅ TESTE 9: Concluir Wizard${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COMPLETE_RESULT=$(api_call POST complete)
echo "$COMPLETE_RESULT"
echo ""

# Status Final
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Status Final do Wizard${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

STATUS_FINAL=$(api_call GET status)
echo "$STATUS_FINAL"
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                  ║${NC}"
echo -e "${GREEN}║              ✅ TODOS OS TESTES CONCLUÍDOS!                      ║${NC}"
echo -e "${GREEN}║                                                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""








