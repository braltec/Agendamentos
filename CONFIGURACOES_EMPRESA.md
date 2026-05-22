# 🎛️ Página de Configurações da Empresa

## 📋 Visão Geral

Página completa para gerenciar todas as configurações da empresa após a conclusão do wizard inicial. Permite editar dados sem precisar refazer todo o processo de cadastro.

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ Aba: Empresa
- **Status**: Em desenvolvimento
- Dados cadastrais da empresa
- Endereço
- Contatos

### 2️⃣ Aba: Agendamentos
- ✅ **Antecedência Mínima**: Tempo mínimo para realizar agendamento
- ✅ **Intervalo entre Agendamentos**: Tempo de pausa entre atendimentos
- ✅ Salvamento em tempo real
- ✅ Feedback de sucesso/erro

### 3️⃣ Aba: WhatsApp (PRINCIPAL)
- ✅ **UUID da Instância Evolution**: Campo para cadastrar o ID único
- ✅ **Validação de UUID**: Formato correto (36 caracteres)
- ✅ **Nome/Apelido**: Identificação amigável (máx. 30 caracteres)
- ✅ **Observações**: Campo de texto livre
- ✅ Instruções de uso
- ✅ Contador de caracteres
- ✅ Botão de salvar dedicado

### 4️⃣ Aba: Profissionais
- ✅ Lista de profissionais cadastrados
- ✅ Visualização de:
  - Nome
  - Especialidade
  - Contato
  - Status (ativo/inativo)

### 5️⃣ Aba: Serviços
- ✅ Lista de serviços cadastrados
- ✅ Visualização de:
  - Nome do serviço
  - Valor
  - Duração

---

## 🔧 Como Usar

### Acessar a Página
1. Faça login no sistema
2. Clique em **"Configurações"** no menu lateral
3. Navegue pelas abas conforme necessário

### Cadastrar Instância WhatsApp (Urgente!)
1. Acesse a aba **"WhatsApp"**
2. Cole o UUID da sua instância Evolution API
3. Defina um nome amigável (ex: "WhatsApp Principal")
4. Adicione observações (opcional)
5. Clique em **"Salvar Instância WhatsApp"**

### Ajustar Configurações de Agendamento
1. Acesse a aba **"Agendamentos"**
2. Defina a antecedência mínima (em minutos)
3. Defina o intervalo entre agendamentos (em minutos)
4. Clique em **"Salvar Configurações"**

---

## 🎨 Interface

### Recursos de UX
- ✅ **Tabs organizadas**: Navegação intuitiva
- ✅ **Loading states**: Indicadores visuais durante carregamento
- ✅ **Mensagens de feedback**: Sucesso (verde) e erro (vermelho)
- ✅ **Validação em tempo real**: UUID e limites de caracteres
- ✅ **Contadores**: Mostra caracteres restantes
- ✅ **Design responsivo**: Funciona em desktop e mobile
- ✅ **Ícones**: Lucide React para melhor visualização

### Cores e Estados
- **Sucesso**: Verde (#10B981)
- **Erro**: Vermelho (#EF4444)
- **Primário**: Azul (#3B82F6)
- **Neutro**: Cinza (#6B7280)

---

## 🔌 Integração com Backend

### Endpoints Utilizados

#### 1. Verificar Status (GET)
```javascript
GET /api/wizard/status
```
Retorna todas as configurações atuais da empresa.

#### 2. Salvar Configurações (POST)
```javascript
POST /api/wizard/configuracoes
Body: {
  antecedencia_minutos: number,
  intervalo_minutos: number
}
```

#### 3. Atualizar Instância WhatsApp (POST)
```javascript
POST /api/wizard/instancia
Body: {
  instancia_id: string (UUID),
  nome: string (max 30),
  observacao: string
}
```

---

## 📊 Validações

### UUID da Instância
- **Formato**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Exemplo válido**: `7d0f44c0-d72d-43b2-906e-a7097e5dd9ba`
- **Validação**: Regex pattern para UUID v4

### Nome da Instância
- **Mínimo**: 1 caractere
- **Máximo**: 30 caracteres
- **Obrigatório**: Sim

### Configurações de Agendamento
- **Antecedência**: Número inteiro ≥ 0
- **Intervalo**: Número inteiro ≥ 0

---

## 🚨 Problema Resolvido

### Antes
- ❌ Instância WhatsApp não foi cadastrada no wizard
- ❌ Empresa não pode receber mensagens
- ❌ Sistema não identifica a empresa

### Depois
- ✅ Página dedicada para cadastrar instância
- ✅ Validação de UUID em tempo real
- ✅ Feedback imediato de sucesso/erro
- ✅ Possibilidade de editar a qualquer momento

---

## 🎯 Próximos Passos

### Melhorias Futuras
1. **Aba Empresa**: Implementar edição de dados cadastrais
2. **Edição de Profissionais**: Permitir editar dados dos profissionais
3. **Edição de Serviços**: Permitir editar valores e durações
4. **Gestão de Horários**: Interface para editar horários de funcionamento
5. **Upload de Logo**: Adicionar logo da empresa
6. **Tema/Cores**: Personalização visual

---

## 📝 Notas Técnicas

### Arquivos Criados/Modificados
- `site/src/pages/Configuracoes/index.jsx` - Página principal (ATUALIZADA)
- `site/src/components/layout/Sidebar.jsx` - Menu lateral (já existia)

### Dependências
- React Router DOM (navegação)
- Lucide React (ícones)
- Axios (requisições HTTP)
- TailwindCSS (estilização)

### Estado da Aplicação
- Carregamento automático ao montar componente
- Atualização após salvamento bem-sucedido
- Mensagens temporárias (5 segundos)

---

## 🎉 Conclusão

A página de Configurações resolve o problema crítico da instância WhatsApp faltante e oferece uma interface completa para gerenciar todas as configurações da empresa de forma intuitiva e eficiente.

**Status**: ✅ Pronto para uso
**Prioridade**: 🔴 Alta (resolver instância WhatsApp)








