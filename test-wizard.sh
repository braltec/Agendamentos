#!/bin/bash

# Script de teste do Wizard
# Uso: TEST_WIZARD_TOKEN=TOKEN_LOCAL ./test-wizard.sh
# Não use token de produção neste script.

TOKEN="${1:-$TEST_WIZARD_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Erro: Token não fornecido"
  echo "Uso: TEST_WIZARD_TOKEN=TOKEN_LOCAL ./test-wizard.sh"
  echo ""
  echo "Para teste local, pegue um token temporário:"
  echo "1. Faça login em http://localhost:3000"
  echo "2. Abra o DevTools (F12) → Console"
  echo "3. Digite: localStorage.getItem('token')"
  echo "4. Execute o script com TEST_WIZARD_TOKEN sem commitar/expor o valor"
  exit 1
fi

API_URL="http://localhost:5000/api/wizard"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║              🧪 TESTE DO WIZARD - BACKEND                        ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Teste 1: Status inicial
echo "📋 Teste 1: Verificar status inicial do wizard..."
curl -s -X GET "$API_URL/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 2: Configurações
echo "⚙️  Teste 2: Salvar configurações de agendamento..."
curl -s -X POST "$API_URL/configuracoes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anteced_minutos": 30,
    "interv_minutos": 15,
    "buffer_pre_minutos": 5,
    "buffer_pos_minutos": 5
  }' | jq '.'
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 3: Horários
echo "🕐 Teste 3: Salvar horários de funcionamento..."
curl -s -X POST "$API_URL/horarios" \
  -H "Authorization: Bearer $TOKEN" \
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
        "dia_semana": 3,
        "dia_nome": "Quarta-feira",
        "hora_inicio": "08:00",
        "hora_fim": "18:00",
        "ativo": true
      },
      {
        "dia_semana": 4,
        "dia_nome": "Quinta-feira",
        "hora_inicio": "08:00",
        "hora_fim": "18:00",
        "ativo": true
      },
      {
        "dia_semana": 5,
        "dia_nome": "Sexta-feira",
        "hora_inicio": "08:00",
        "hora_fim": "18:00",
        "ativo": true
      },
      {
        "dia_semana": 6,
        "dia_nome": "Sábado",
        "hora_inicio": "08:00",
        "hora_fim": "12:00",
        "ativo": true
      },
      {
        "dia_semana": 0,
        "dia_nome": "Domingo",
        "ativo": false
      }
    ]
  }' | jq '.'
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 4: Criar profissional
echo "👤 Teste 4: Criar profissional..."
PROF_RESPONSE=$(curl -s -X POST "$API_URL/profissionais" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva Teste",
    "contato": "37999887766",
    "especialidade": "Manicure e Pedicure"
  }')
echo "$PROF_RESPONSE" | jq '.'
PROF_ID=$(echo "$PROF_RESPONSE" | jq -r '.data.profissional_id')
echo ""
echo "✅ Profissional ID: $PROF_ID"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 5: Criar serviço
echo "💅 Teste 5: Criar serviço..."
SERV_RESPONSE=$(curl -s -X POST "$API_URL/servicos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Manicure Completa Teste",
    "duracao_minutos": 60,
    "valor": 40.00,
    "descricao": "Manicure completa com esmaltação"
  }')
echo "$SERV_RESPONSE" | jq '.'
SERV_ID=$(echo "$SERV_RESPONSE" | jq -r '.data.servicos_id')
echo ""
echo "✅ Serviço ID: $SERV_ID"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 6: Vincular serviço
echo "🔗 Teste 6: Vincular serviço ao profissional..."
curl -s -X POST "$API_URL/vincular-servico" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"profissional_id\": \"$PROF_ID\",
    \"servico_id\": \"$SERV_ID\",
    \"personalizacao\": {}
  }" | jq '.'
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 7: Instância WhatsApp
echo "📱 Teste 7: Atualizar instância WhatsApp..."
curl -s -X POST "$API_URL/instancia" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "WhatsApp Teste Wizard",
    "observacao": "Instância configurada via wizard de teste"
  }' | jq '.'
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 8: Concluir wizard
echo "✅ Teste 8: Concluir wizard..."
curl -s -X POST "$API_URL/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Teste 9: Status final
echo "🎉 Teste 9: Verificar status final..."
curl -s -X GET "$API_URL/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║              ✅ TESTES CONCLUÍDOS!                               ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"







