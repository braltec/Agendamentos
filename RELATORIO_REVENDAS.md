# 📊 Relatório de Revendas - Documentação

## 🎯 Objetivo

Permitir que o **Super Admin** visualize facilmente quais revendas cadastraram quais empresas no sistema, facilitando o controle e gestão de parcerias.

---

## ✨ Funcionalidades

### 1. Visualização Agrupada por Revenda

**Acesso:** Apenas para usuários com perfil **Super Admin**

**Localização:** Tela de Empresas (`/empresas`)

**O que mostra:**
- ✅ Lista de todas as revendas ativas
- ✅ Quantidade de empresas cadastradas por cada revenda
- ✅ Detalhes de cada revenda (nome, login, email)
- ✅ Empresas cadastradas por cada revenda
- ✅ Empresas sem revenda (criadas diretamente ou por outros perfis)

### 2. Estatísticas

Quando ativada a visualização por revenda, o sistema mostra:
- **Total de Revendas**: Quantas revendas existem no sistema
- **Empresas com Revenda**: Quantas empresas foram cadastradas por revendas
- **Empresas sem Revenda**: Quantas empresas não têm revenda associada
- **Total de Empresas**: Total geral de empresas no sistema

---

## 🔧 Como Usar

### Para Super Admin:

1. **Acessar a tela de Empresas**
   - Menu lateral → Empresas

2. **Ativar visualização por revenda**
   - Clique no botão **"Agrupar por Revenda"** no card azul

3. **Visualizar as informações**
   - As empresas serão agrupadas por revenda
   - Cada grupo mostra a revenda no topo e suas empresas abaixo
   - Empresas sem revenda aparecem em um grupo separado

4. **Voltar para visualização normal**
   - Clique no botão **"Mostrar Lista Normal"**

---

## 📡 Endpoints da API

### GET /api/empresas/por-revenda

**Autenticação:** Requerida (apenas Super Admin)

**Resposta de sucesso:**
```json
{
  "success": true,
  "data": {
    "revendas": [
      {
        "revenda_id": "uuid",
        "revenda_nome": "Nome da Revenda",
        "revenda_login": "login",
        "revenda_email": "email@example.com",
        "empresas": [
          {
            "empresa_id": "uuid",
            "empresa_nome": "Nome da Empresa",
            "status": "ativa",
            "total_usuarios": 5,
            "total_profissionais": 3,
            "total_agendamentos": 120,
            "data_cadastro": "2025-11-09T20:10:51.182Z"
          }
        ]
      }
    ],
    "empresas_sem_revenda": [...],
    "estatisticas": {
      "total_revendas": 2,
      "total_empresas_com_revenda": 5,
      "total_empresas_sem_revenda": 3,
      "total_empresas": 8
    }
  }
}
```

**Erros:**
- `403 Forbidden`: Usuário não é Super Admin
- `500 Internal Server Error`: Erro no servidor

---

## 🎨 Interface Visual

### Card de Revenda
- Fundo azul degradê
- Ícone de usuários (👥)
- Nome da revenda em destaque
- Login e email
- Badge com quantidade de empresas
- Lista de empresas abaixo

### Card de Empresas sem Revenda
- Fundo cinza degradê
- Mesma estrutura visual
- Agrupa empresas que não têm revenda

---

## 💻 Arquivos Modificados

### Backend
1. **`api/src/controllers/empresas.controller.js`**
   - Adicionada função `listarEmpresasPorRevenda()`
   - Valida se usuário é Super Admin
   - Agrupa empresas por revenda

2. **`api/src/routes/empresas.routes.js`**
   - Adicionada rota `GET /por-revenda`

### Frontend
1. **`site/src/services/empresas.service.js`**
   - Adicionado método `listarPorRevenda()`

2. **`site/src/pages/Empresas/index.jsx`**
   - Adicionado toggle para visualização por revenda
   - Componente `renderEmpresaCard` reutilizável
   - Estatísticas específicas para visualização por revenda
   - Layout agrupado por revenda

---

## 📝 Observações

- ✅ Apenas Super Admin vê o botão de toggle
- ✅ Revendas veem apenas suas próprias empresas (visualização normal)
- ✅ A visualização por revenda não tem filtro de busca (mostra tudo agrupado)
- ✅ Todas as ações (configurar, ativar/desativar) funcionam em ambas as visualizações
- ✅ O sistema mantém o estado da visualização até que o usuário troque manualmente

---

## 🚀 Exemplo de Uso

**Cenário:** Você é o administrador do sistema e precisa saber quantas empresas o vendedor "João Silva" cadastrou.

**Passo a passo:**
1. Faça login como Super Admin
2. Acesse a tela de Empresas
3. Clique em "Agrupar por Revenda"
4. Procure pela seção "João Silva"
5. Visualize todas as empresas cadastradas por ele
6. Confira as estatísticas no topo

---

## 🔐 Segurança

- ✅ Endpoint protegido por autenticação JWT
- ✅ Validação de nível de acesso no backend
- ✅ Apenas Super Admin pode acessar
- ✅ Frontend oculta funcionalidade para não-Super Admins

---

**Data de Implementação:** 09/11/2025  
**Versão:** 1.0.0



