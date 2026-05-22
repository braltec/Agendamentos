#!/bin/bash

echo "🚀 Iniciando Sistema de Agendamento..."
echo ""

# Verificar se backend já está rodando
if lsof -i :5000 >/dev/null 2>&1; then
    echo "✅ Backend já está rodando na porta 5000"
else
    echo "🔄 Iniciando backend..."
    cd /home/alex/Software/script/agendamento/api
    npm run dev > /tmp/backend.log 2>&1 &
    sleep 3
    if lsof -i :5000 >/dev/null 2>&1; then
        echo "✅ Backend iniciado com sucesso!"
    else
        echo "❌ Erro ao iniciar backend. Verifique /tmp/backend.log"
        exit 1
    fi
fi

echo ""
echo "🔄 Iniciando frontend..."
cd /home/alex/Software/script/agendamento/site

# Matar processo anterior se existir
pkill -f "vite" 2>/dev/null

# Iniciar frontend
npm run dev

