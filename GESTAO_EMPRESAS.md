# 🏢 Sistema de Gestão de Empresas

## 📋 Visão Geral

Sistema completo para cadastro e gerenciamento de empresas clientes. Permite criar novas empresas de forma rápida e automatizada, eliminando a necessidade de inserção manual no banco de dados.

## ✨ Funcionalidades

### 1. **Listagem de Empresas**
- Visualização de todas as empresas cadastradas
- Estatísticas em tempo real:
  - Total de empresas
  - Empresas ativas/inativas
  - Total de agendamentos
- Filtro por nome ou contato
- Informações detalhadas de cada empresa

### 2. **Cadastro de Nova Empresa**
Processo em 3 etapas intuitivas:

#### **Etapa 1: Dados da Empresa**
- Nome da empresa
- Contato (WhatsApp)
- Observações

#### **Etapa 2: Endereço**
- CEP (com busca automática via ViaCEP)
- Logradouro, número, complemento
- Bairro, cidade, UF

#### **Etapa 3: Usuário Administrador**
- Nome do administrador
- Email de acesso
- Senha
- Opções adicionais:
  - ✅ Criar instância WhatsApp automaticamente
  - ✅ Criar contrato inicial
  - 💰 Configurar valor e plano do contrato

### 3. **Gerenciamento**
- Ativar/Desativar empresas
- Visualizar estatísticas por empresa:
  - Total de usuários
  - Total de profissionais
  - Total de agendamentos

## 🔄 Processo Automatizado

Ao criar uma nova empresa, o sistema automaticamente:

1. ✅ **Cria o endereço** na tabela `endereco`
2. ✅ **Cria a configuração** na tabela `empresa_cfg` com valores padrão:
   - Antecedência: 30 minutos
   - Intervalo: 15 minutos
   - Buffer pré/pós: 5 minutos
   - Timezone: America/Sao_Paulo
3. ✅ **Cria a empresa** na tabela `empresa`
4. ✅ **Cria o usuário admin** na tabela `login`
5. ✅ **Cria a instância WhatsApp** (opcional)
6. ✅ **Cria o contrato** (opcional)

**Tudo em uma única transação!** Se algo falhar, nada é criado (rollback automático).

## 🎯 Credenciais de Acesso

Após criar a empresa, o sistema exibe:
- 📧 Email de acesso
- 🔑 Senha gerada

⚠️ **IMPORTANTE**: A senha é exibida apenas uma vez! Anote-a.

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT obrigatória
- ✅ Transações atômicas (tudo ou nada)
- ✅ Validações de dados

## 📊 Estrutura de Dados Criada

```
empresa
├── endereco_id → endereco
├── empresa_cfg_id → empresa_cfg
└── empresa_id

login (usuário admin)
├── empresa_id → empresa
└── nivel_acesso_id → nivel_acesso

instancia (WhatsApp)
└── empresa_id → empresa

contrato (opcional)
└── empresa_id → empresa
```

## 🚀 Como Usar

### 1. Acessar o Sistema
- Faça login com suas credenciais
- Acesse o menu **"Empresas"** (ícone 🏢)

### 2. Criar Nova Empresa
1. Clique em **"+ Nova Empresa"**
2. Preencha os dados em 3 etapas
3. Revise e confirme
4. **Anote as credenciais geradas!**

### 3. Gerenciar Empresas
- Visualize todas as empresas na lista
- Use o filtro para buscar empresas específicas
- Ative/Desative empresas conforme necessário

## 🎨 Interface

### Tela de Listagem
```
┌─────────────────────────────────────────────┐
│  Gestão de Empresas      [+ Nova Empresa]   │
├─────────────────────────────────────────────┤
│  [Buscar por nome ou contato...]            │
├─────────────────────────────────────────────┤
│  📊 Estatísticas                            │
│  [Total] [Ativas] [Inativas] [Agendamentos] │
├─────────────────────────────────────────────┤
│  📋 Lista de Empresas                       │
│  ┌───────────────────────────────────────┐  │
│  │ Studio Débora Sousa        [Ativa]    │  │
│  │ Contato: (99) 99999-9999              │  │
│  │ Endereço: Rua X, 123...               │  │
│  │ Usuários: 1 | Profissionais: 2        │  │
│  │                      [Desativar]      │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Modal de Cadastro
```
┌─────────────────────────────────────────────┐
│  Nova Empresa                          [X]  │
├─────────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Etapa 1 de 3                               │
├─────────────────────────────────────────────┤
│  Dados da Empresa                           │
│  [Nome da Empresa]                          │
│  [Contato (WhatsApp)]                       │
│  [Observações]                              │
├─────────────────────────────────────────────┤
│  [Cancelar]                    [Próximo]    │
└─────────────────────────────────────────────┘
```

## 🔧 Configurações Padrão

Ao criar uma empresa, são aplicadas as seguintes configurações:

| Configuração | Valor Padrão |
|-------------|--------------|
| Antecedência mínima | 30 minutos |
| Intervalo entre agendamentos | 15 minutos |
| Buffer pré-atendimento | 5 minutos |
| Buffer pós-atendimento | 5 minutos |
| Timezone | America/Sao_Paulo |
| Status | Ativa |
| Plano do contrato | Básico |
| Valor mensal | R$ 59,90 |

## 📝 Validações

### Campos Obrigatórios
- ✅ Nome da empresa
- ✅ Contato (WhatsApp)
- ✅ CEP
- ✅ Logradouro, número, bairro, cidade, UF
- ✅ Nome do administrador
- ✅ Email do administrador
- ✅ Senha do administrador

### Validações Automáticas
- ✅ Email válido
- ✅ CEP válido (8 dígitos)
- ✅ UF válida (2 caracteres)
- ✅ Senha criptografada automaticamente

## 🌐 API Endpoints

### Backend (Node.js)

```javascript
// Listar todas as empresas
GET /api/empresas

// Buscar empresa por ID
GET /api/empresas/:id

// Criar nova empresa
POST /api/empresas
Body: {
  empresa_nome, empresa_contato, cep, logradouro, numero,
  bairro, cidade, uf, admin_nome, admin_email, admin_senha
}

// Atualizar empresa
PUT /api/empresas/:id
Body: { empresa_nome, empresa_contato, status, observacoes }

// Alterar status
PATCH /api/empresas/:id/status
Body: { status: 'ativa' | 'inativa' }
```

## 💡 Dicas de Uso

1. **Busca de CEP**: Digite o CEP e pressione Tab ou clique em "Buscar" para preencher automaticamente o endereço

2. **Credenciais**: Sempre anote as credenciais geradas! Elas não podem ser recuperadas depois

3. **Instância WhatsApp**: Deixe marcado para criar automaticamente a instância. Você precisará configurá-la depois

4. **Contrato**: Deixe marcado para criar o contrato inicial. Você pode ajustar os valores depois

5. **Status**: Empresas inativas não podem fazer novos agendamentos, mas mantêm os dados históricos

## 🔄 Fluxo Completo

```
Vendeu o sistema para uma empresa nova?
↓
1. Acesse "Empresas" no menu
↓
2. Clique em "+ Nova Empresa"
↓
3. Preencha os dados em 3 etapas
↓
4. Anote as credenciais geradas
↓
5. Envie as credenciais para o cliente
↓
6. Cliente faz login e configura seu sistema
↓
✅ Empresa operando!
```

## 🎉 Benefícios

- ⚡ **Rápido**: Cadastro completo em menos de 2 minutos
- 🔒 **Seguro**: Senhas criptografadas e transações atômicas
- 🎯 **Completo**: Cria tudo que a empresa precisa para operar
- 📊 **Organizado**: Visualize todas as empresas em um só lugar
- 🚀 **Profissional**: Interface moderna e intuitiva

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se todos os campos obrigatórios foram preenchidos
2. Confirme que o CEP é válido
3. Certifique-se de que o email não está duplicado no sistema
4. Verifique os logs do backend para detalhes de erros

---

**Desenvolvido com ❤️ para facilitar sua vida!**








