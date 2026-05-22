# 🚀 Como Iniciar a Aplicação

## Script de Inicialização

Use o script `iniciar-aplicacao.sh` para gerenciar os serviços:

### Comandos Disponíveis

```bash
# Iniciar os serviços (backend + frontend)
./iniciar-aplicacao.sh start

# Ou simplesmente (start é o padrão)
./iniciar-aplicacao.sh

# Parar os serviços
./iniciar-aplicacao.sh stop

# Ver status dos serviços
./iniciar-aplicacao.sh status

# Reiniciar os serviços
./iniciar-aplicacao.sh restart
```

## URLs de Acesso

Após iniciar os serviços:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Logs

Os logs dos serviços são salvos em:

- **Backend**: `/tmp/backend.log`
- **Frontend**: `/tmp/frontend.log`

Para ver os logs em tempo real:

```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

## Solução de Problemas

### Serviços não iniciam

1. Verifique se as portas 5000 e 3000 estão livres:
   ```bash
   lsof -i :5000 -i :3000
   ```

2. Se houver processos nas portas, pare-os:
   ```bash
   ./iniciar-aplicacao.sh stop
   ```

3. Verifique se as dependências estão instaladas:
   ```bash
   cd api && npm install
   cd ../site && npm install
   ```

### Verificar se os serviços estão rodando

```bash
./iniciar-aplicacao.sh status
```

## Iniciar Manualmente (Alternativa)

Se preferir iniciar manualmente:

### Backend
```bash
cd api
npm run dev
```

### Frontend (em outro terminal)
```bash
cd site
npm run dev
```
