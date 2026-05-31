# 🏢 Perfil Revenda - Documentação

## 📋 Visão Geral

O perfil **Revenda** foi criado para permitir que parceiros/vendedores possam cadastrar empresas no sistema e gerenciar apenas as empresas que eles cadastraram.

---

## 🎯 Características do Perfil Revenda

### ✅ O que um usuário Revenda PODE fazer:

- **Cadastrar novas empresas** - Acesso completo ao wizard de cadastro
- **Ver empresas que cadastrou** - Lista apenas suas empresas
- **Editar empresas que cadastrou** - Modificar dados, serviços, profissionais
- **Gerenciar dados das suas empresas** - Configurações, horários, etc.

### ❌ O que um usuário Revenda NÃO pode fazer:

- Ver empresas cadastradas por outros usuários
- Ver todas as empresas do sistema (privilégio do Super Admin)
- Acessar empresas que não cadastrou
- Alterar seu próprio nível de acesso

---

## 🔑 Credenciais de Teste

```
📧 Email: revenda@exemplo.invalid
🔑 Senha: EXEMPLO_SENHA_FORTE
```

---

## 🏗️ Estrutura no Banco de Dados

### Tabela `nivel_acesso`

Novo nível adicionado:

```sql
nivel_acesso_id: 550e8400-e29b-41d4-a716-446655440020
nivel_acesso_: revenda
```

### Tabela `empresa`

Novos campos:

```sql
criado_por UUID           -- ID do usuário que cadastrou (login_id)
data_cadastro TIMESTAMPTZ  -- Data do cadastro
```

---

## 🔄 Fluxo de Funcionamento

### 1. Cadastro de Empresa

```
Usuário Revenda faz login
       ↓
Acessa "Nova Empresa"
       ↓
Preenche wizard completo
       ↓
Sistema registra:
  - empresa.criado_por = login_id do revenda
  - empresa.data_cadastro = NOW()
       ↓
Empresa cadastrada e vinculada ao revenda
```

### 2. Listagem de Empresas

```
Usuário faz request GET /api/empresas
       ↓
Backend verifica nivel_acesso_id
       ↓
├─ Super Admin → Lista TODAS empresas
├─ Revenda → Lista apenas WHERE criado_por = login_id
└─ Admin Empresa → Lista apenas sua empresa
       ↓
Retorna lista filtrada
```

### 3. Edição de Empresa

```
Usuário Revenda tenta editar empresa
       ↓
Backend verifica:
  - É Super Admin? → Permitido
  - É Revenda E empresa.criado_por = login_id? → Permitido
  - Caso contrário → Negado (403)
```

---

## 🧪 Como Testar

### Teste 1: Login como Revenda

1. Acesse http://localhost:3000
2. Faça login com:
   - Email: `revenda@exemplo.invalid`
   - Senha: `EXEMPLO_SENHA_FORTE`
3. Você deve ver o painel normalmente

### Teste 2: Listar Empresas (Vazio Inicialmente)

1. No menu, clique em "Empresas"
2. **Resultado esperado**: Lista vazia (revenda ainda não cadastrou nenhuma empresa)

### Teste 3: Cadastrar Nova Empresa

1. Clique em "Nova Empresa"
2. Preencha todos os dados do wizard
3. Complete todas as etapas
4. **Resultado esperado**: Empresa criada com sucesso

### Teste 4: Ver Empresas Cadastradas

1. Volte para "Empresas"
2. **Resultado esperado**: Você vê APENAS a empresa que acabou de cadastrar

### Teste 5: Comparar com Super Admin

1. Faça logout
2. Faça login como Super Admin:
   - Email: `admin@exemplo.invalid`
   - Senha: `EXEMPLO_SENHA_FORTE`
3. Acesse "Empresas"
4. **Resultado esperado**: Você vê TODAS as empresas do sistema

---

## 🔐 Níveis de Acesso - Resumo

| Nível | ID | Descrição |
|-------|---|-----------|
| **Super Admin** | `550e8400-e29b-41d4-a716-446655440012` | Vê e gerencia TUDO |
| **Revenda** | `550e8400-e29b-41d4-a716-446655440020` | Vê apenas empresas que cadastrou |
| **Admin Empresa** | Outros | Vê apenas sua própria empresa |

---

## 📝 Arquivos Modificados

### Backend (API)

1. **`api/migrations/add-perfil-revenda.sql`** (novo)
   - Adiciona campos `criado_por` e `data_cadastro` em `empresa`
   - Cria nível de acesso "revenda"

2. **`api/src/models/empresa.model.js`** (modificado)
   - Método `create()` aceita `criado_por`
   - Novo método `findByCreator()` para listar empresas do revenda

3. **`api/src/controllers/empresas.controller.js`** (modificado)
   - `listarEmpresas()` filtra por nível de acesso
   - `criarEmpresa()` registra quem criou

4. **`api/create-revenda-user.js`** (novo)
   - Script para criar usuário de teste

### Futuras Modificações (Frontend)

*Ainda não implementadas, mas necessárias:*

1. **Adicionar indicador visual** do nível de acesso no header
2. **Ocultar menu "Vendedores"** para usuários não-admin
3. **Dashboard diferenciado** para Revenda (métricas das suas empresas)

---

## 🚀 Próximos Passos (Sugestões)

### Fase 1: Melhorias Básicas ✅ (Implementado)
- [x] Adicionar campo `criado_por` no banco
- [x] Criar nível "Revenda"
- [x] Filtrar empresas por criador
- [x] Registrar criador ao cadastrar empresa

### Fase 2: Interface (A Fazer)
- [ ] Adicionar badge "Revenda" no header
- [ ] Dashboard personalizado para Revenda
- [ ] Contador de "Minhas Empresas"
- [ ] Filtro avançado na lista de empresas

### Fase 3: Permissões Avançadas (A Fazer)
- [ ] Verificar permissão ao editar empresa
- [ ] Impedir revenda de ver empresas de outros
- [ ] Log de auditoria (quem fez o quê)

### Fase 4: Recursos Extras (Futuro)
- [ ] Comissões por empresa cadastrada
- [ ] Relatório de vendas do revenda
- [ ] Meta de cadastros por mês
- [ ] Notificação quando empresa ficar ativa

---

## 🐛 Troubleshooting

### Usuário Revenda vê todas as empresas

**Problema**: Filtro não está funcionando

**Solução**: Verificar se `req.user.login_id` está sendo passado corretamente no token JWT

```bash
# Ver logs do backend
cd api && npm run dev
# Fazer login e verificar logs
```

### Campo `criado_por` está NULL

**Problema**: Empresas antigas não têm criador

**Solução**: Isso é normal. Apenas empresas novas terão `criado_por` preenchido. Empresas com `criado_por = NULL` são visíveis apenas para Super Admin.

### Erro ao criar empresa como Revenda

**Problema**: `req.user.login_id` não existe

**Solução**: Verificar se o middleware de autenticação está populando `req.user.login_id`:

```javascript
// Em auth.middleware.js, deve ter:
req.user = {
  login_id: decoded.id,  // ← Importante!
  empresa_id: decoded.empresa_id,
  nivel_acesso_id: decoded.nivel_acesso_id
}
```

---

## 📞 Comandos Úteis

### Criar novo usuário Revenda

```bash
cd api
node create-revenda-user.js
```

### Verificar empresas e criadores

```sql
SELECT 
  e.empresa_nome,
  l.nome as criador_nome,
  l.email as criador_email,
  na.nivel_acesso_ as criador_nivel,
  e.data_cadastro
FROM empresa e
LEFT JOIN login l ON e.criado_por = l.login_id
LEFT JOIN nivel_acesso na ON l.nivel_acesso_id = na.nivel_acesso_id
ORDER BY e.data_cadastro DESC;
```

### Ver todos os níveis de acesso

```sql
SELECT * FROM nivel_acesso ORDER BY nivel_acesso_;
```

---

## 🎓 Conceitos Importantes

### Multi-tenancy com Níveis

```
┌─────────────────────────────────────────┐
│         BANCO DE DADOS ÚNICO            │
├─────────────────────────────────────────┤
│                                         │
│  Super Admin                            │
│  └─ Vê TUDO                            │
│                                         │
│  Revenda A                              │
│  └─ Empresa 1 (criou)                  │
│  └─ Empresa 2 (criou)                  │
│                                         │
│  Revenda B                              │
│  └─ Empresa 3 (criou)                  │
│  └─ Empresa 4 (criou)                  │
│                                         │
│  Admin Empresa 1                        │
│  └─ Apenas Empresa 1                   │
│                                         │
└─────────────────────────────────────────┘
```

### Isolamento por Criador

- Diferente do isolamento por `empresa_id` (usado para clientes/profissionais)
- `criado_por` permite rastreabilidade e controle de acesso
- Vendas/comissões podem ser calculadas a partir deste vínculo

---

## ✅ Status da Implementação

- ✅ Migração do banco executada
- ✅ Backend modificado
- ✅ Usuário de teste criado
- ✅ Filtros implementados
- ⚠️  Frontend precisa adaptações visuais
- ⚠️  Permissões de edição ainda não validadas

---

**Data de criação**: 09/11/2025
**Versão**: 1.0
**Autor**: Sistema de Agendamento



