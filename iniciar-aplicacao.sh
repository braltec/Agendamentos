#!/bin/bash

# Script para iniciar/parar o Sistema de Agendamento
# Uso: ./iniciar-aplicacao.sh [start|start-foreground|stop|status|restart]

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$PROJECT_DIR/api"
SITE_DIR="$PROJECT_DIR/site"
PID_FILE="$PROJECT_DIR/.servers.pid"
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Função para obter PID de um processo na porta
get_pid_by_port() {
    local port=$1
    lsof -ti :$port 2>/dev/null
}

# Função para instalar dependências quando estiverem ausentes/incompletas
ensure_dependencies() {
    local dir=$1
    local binary=$2
    local label=$3

    cd "$dir" || return 1

    if [ ! -d "node_modules" ] || [ ! -x "node_modules/.bin/$binary" ]; then
        echo -e "${YELLOW}📦 Instalando dependências do $label...${NC}"
        npm install
    fi
}

# Função para iniciar backend
start_backend() {
    if check_port $BACKEND_PORT; then
        echo -e "${YELLOW}⚠️  Backend já está rodando na porta $BACKEND_PORT${NC}"
        return 0
    fi

    echo -e "${BLUE}🔄 Iniciando backend...${NC}"
    if ! ensure_dependencies "$API_DIR" "nodemon" "backend"; then
        echo -e "${RED}❌ Erro ao preparar dependências do backend${NC}"
        return 1
    fi

    cd "$API_DIR"
    
    # Iniciar backend em background
    nohup npm run dev > /tmp/backend.log 2>&1 &
    local backend_pid=$!
    disown "$backend_pid" 2>/dev/null || true
    
    # Aguardar backend iniciar
    echo -e "${BLUE}⏳ Aguardando backend iniciar...${NC}"
    for i in {1..10}; do
        sleep 1
        if check_port $BACKEND_PORT; then
            echo -e "${GREEN}✅ Backend iniciado com sucesso! (PID: $backend_pid)${NC}"
            echo -e "${BLUE}   Logs: /tmp/backend.log${NC}"
            echo -e "${BLUE}   URL: http://localhost:$BACKEND_PORT${NC}"
            echo "$backend_pid" >> "$PID_FILE"
            return 0
        fi
    done
    
    echo -e "${RED}❌ Erro ao iniciar backend. Verifique /tmp/backend.log${NC}"
    return 1
}

# Função para iniciar frontend
start_frontend() {
    if check_port $FRONTEND_PORT; then
        echo -e "${YELLOW}⚠️  Frontend já está rodando na porta $FRONTEND_PORT${NC}"
        return 0
    fi

    echo -e "${BLUE}🔄 Iniciando frontend...${NC}"
    if ! ensure_dependencies "$SITE_DIR" "vite" "frontend"; then
        echo -e "${RED}❌ Erro ao preparar dependências do frontend${NC}"
        return 1
    fi

    cd "$SITE_DIR"
    
    # Iniciar frontend em background
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    local frontend_pid=$!
    disown "$frontend_pid" 2>/dev/null || true
    
    # Aguardar frontend iniciar
    echo -e "${BLUE}⏳ Aguardando frontend iniciar...${NC}"
    for i in {1..15}; do
        sleep 1
        if check_port $FRONTEND_PORT; then
            echo -e "${GREEN}✅ Frontend iniciado com sucesso! (PID: $frontend_pid)${NC}"
            echo -e "${BLUE}   Logs: /tmp/frontend.log${NC}"
            echo -e "${BLUE}   URL: http://localhost:$FRONTEND_PORT${NC}"
            echo "$frontend_pid" >> "$PID_FILE"
            return 0
        fi
    done
    
    echo -e "${RED}❌ Erro ao iniciar frontend. Verifique /tmp/frontend.log${NC}"
    return 1
}

# Função para parar serviços
stop_servers() {
    echo -e "${BLUE}🛑 Parando serviços...${NC}"
    
    # Parar processos pelas portas
    local backend_pid=$(get_pid_by_port $BACKEND_PORT)
    local frontend_pid=$(get_pid_by_port $FRONTEND_PORT)
    
    if [ -n "$backend_pid" ]; then
        echo -e "${YELLOW}   Parando backend (PID: $backend_pid)...${NC}"
        kill $backend_pid 2>/dev/null
        sleep 1
        # Se ainda estiver rodando, força
        if check_port $BACKEND_PORT; then
            kill -9 $backend_pid 2>/dev/null
        fi
        echo -e "${GREEN}   ✅ Backend parado${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Backend não estava rodando${NC}"
    fi
    
    if [ -n "$frontend_pid" ]; then
        echo -e "${YELLOW}   Parando frontend (PID: $frontend_pid)...${NC}"
        kill $frontend_pid 2>/dev/null
        sleep 1
        # Se ainda estiver rodando, força
        if check_port $FRONTEND_PORT; then
            kill -9 $frontend_pid 2>/dev/null
        fi
        echo -e "${GREEN}   ✅ Frontend parado${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Frontend não estava rodando${NC}"
    fi
    
    # Parar processos pelo PID file (caso existam)
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}   Parando processo (PID: $pid)...${NC}"
                kill $pid 2>/dev/null
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # Matar processos node relacionados (fallback)
    pkill -f "vite" 2>/dev/null
    pkill -f "nodemon.*server.js" 2>/dev/null
    
    echo -e "${GREEN}✅ Todos os serviços foram parados${NC}"
}

# Função para mostrar status
show_status() {
    echo -e "${BLUE}📊 Status dos Serviços:${NC}"
    echo ""
    
    if check_port $BACKEND_PORT; then
        local backend_pid=$(get_pid_by_port $BACKEND_PORT)
        echo -e "${GREEN}✅ Backend:${NC}"
        echo -e "   Porta: $BACKEND_PORT"
        echo -e "   PID: $backend_pid"
        echo -e "   URL: http://localhost:$BACKEND_PORT"
        echo -e "   Health: http://localhost:$BACKEND_PORT/health"
    else
        echo -e "${RED}❌ Backend: Não está rodando${NC}"
    fi
    
    echo ""
    
    if check_port $FRONTEND_PORT; then
        local frontend_pid=$(get_pid_by_port $FRONTEND_PORT)
        echo -e "${GREEN}✅ Frontend:${NC}"
        echo -e "   Porta: $FRONTEND_PORT"
        echo -e "   PID: $frontend_pid"
        echo -e "   URL: http://localhost:$FRONTEND_PORT"
    else
        echo -e "${RED}❌ Frontend: Não está rodando${NC}"
    fi
}

# Função para iniciar tudo
start_all() {
    echo -e "${BLUE}🚀 Iniciando Sistema de Agendamento...${NC}"
    echo ""
    
    # Verificar se já está rodando
    if check_port $BACKEND_PORT && check_port $FRONTEND_PORT; then
        echo -e "${YELLOW}⚠️  Os serviços já estão rodando!${NC}"
        show_status
        return 0
    fi
    
    # Iniciar backend
    if ! start_backend; then
        echo -e "${RED}❌ Falha ao iniciar backend. Abortando...${NC}"
        exit 1
    fi
    
    echo ""
    
    # Iniciar frontend
    if ! start_frontend; then
        echo -e "${RED}❌ Falha ao iniciar frontend. Abortando...${NC}"
        stop_servers
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Sistema iniciado com sucesso!${NC}"
    echo ""
    show_status
    echo ""
    echo -e "${BLUE}💡 Dica: Use './iniciar-aplicacao.sh stop' para parar os serviços${NC}"
    echo -e "${BLUE}💡 Dica: Use './iniciar-aplicacao.sh status' para ver o status${NC}"
}

# Função para reiniciar
restart_all() {
    echo -e "${BLUE}🔄 Reiniciando Sistema de Agendamento...${NC}"
    echo ""
    stop_servers
    sleep 2
    echo ""
    start_all
}

# Função para iniciar e manter o script vivo acompanhando logs
start_foreground() {
    start_all
    echo ""
    echo -e "${BLUE}📜 Acompanhando logs. Use Ctrl+C para sair desta visualização.${NC}"
    tail -f /tmp/backend.log /tmp/frontend.log
}

# Main
case "${1:-start}" in
    start)
        start_all
        ;;
    start-foreground)
        start_foreground
        ;;
    stop)
        stop_servers
        ;;
    status)
        show_status
        ;;
    restart)
        restart_all
        ;;
    *)
        echo -e "${RED}❌ Uso incorreto!${NC}"
        echo ""
        echo "Uso: $0 [start|start-foreground|stop|status|restart]"
        echo ""
        echo "Comandos:"
        echo "  start   - Inicia os serviços (padrão)"
        echo "  start-foreground - Inicia os serviços e mantém logs abertos"
        echo "  stop    - Para os serviços"
        echo "  status  - Mostra o status dos serviços"
        echo "  restart - Reinicia os serviços"
        exit 1
        ;;
esac
