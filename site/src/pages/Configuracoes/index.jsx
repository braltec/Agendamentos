import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Settings, Building2, Clock, Users, Briefcase, MessageCircle, Save, AlertCircle, Edit2, X, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import wizardService from '../../services/wizard.service'
import { empresasService } from '../../services/empresas.service'
import { useAuth } from '../../contexts/AuthContext'

export default function Configuracoes() {
  const { empresaId: empresaIdFromUrl } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('empresa')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Super Admin states
  const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
  const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID
  const isRevenda = user?.nivel_acesso_id === REVENDA_ID
  const isAdmin = isSuperAdmin || isRevenda
  
  const [empresas, setEmpresas] = useState([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState(empresaIdFromUrl || null)
  
  // Estados para cada seção
  const [empresaData, setEmpresaData] = useState(null)
  const [empresaDataOriginal, setEmpresaDataOriginal] = useState(null)
  const [editandoEmpresa, setEditandoEmpresa] = useState(false)
  const [configuracoes, setConfiguracoes] = useState({
    antecedencia_minutos: 15,
    intervalo_minutos: 0
  })
  const [instancia, setInstancia] = useState({
    instancia_id: '',
    nome: '',
    observacao: ''
  })
  const [instanciaOriginal, setInstanciaOriginal] = useState(null)
  const [editandoWhatsApp, setEditandoWhatsApp] = useState(false)
  const [profissionais, setProfissionais] = useState([])
  const [profissionaisOriginais, setProfissionaisOriginais] = useState([])
  const [editandoProfissional, setEditandoProfissional] = useState(null)
  const [servicos, setServicos] = useState([])
  const [servicosOriginais, setServicosOriginais] = useState([])
  const [editandoServico, setEditandoServico] = useState(null)
  const [modalNovoServico, setModalNovoServico] = useState(false)
  const [novoServico, setNovoServico] = useState({
    servicos_nome: '',
    servicos_valor: '',
    servicos_valor_formatado: '',
    servicos_duracao_minutos: '',
    profissionais_ids: []
  })
  const [horarios, setHorarios] = useState([])
  const [horariosOriginais, setHorariosOriginais] = useState([])
  const [editandoHorarios, setEditandoHorarios] = useState(false)
  
  // Estados para prompts
  const [prompts, setPrompts] = useState([])
  const [versoes, setVersoes] = useState([])
  const [promptSelecionado, setPromptSelecionado] = useState('')
  const [versaoSelecionada, setVersaoSelecionada] = useState('')
  const [editandoPrompt, setEditandoPrompt] = useState(false)
  
  // Estados para usuários
  const [usuarios, setUsuarios] = useState([])
  const [niveisAcesso, setNiveisAcesso] = useState([])
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false)
  const [modalAlterarSenha, setModalAlterarSenha] = useState(null)
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    login: '',
    email: '',
    senha: '',
    nivel_acesso_id: ''
  })
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  useEffect(() => {
    const init = async () => {
      await carregarEmpresas()
      await carregarPrompts()
      
      // Se tem empresaId na URL (Super Admin ou Revenda acessando empresa específica)
      if (empresaIdFromUrl) {
        console.log('🔗 Carregando dados da empresa pela URL:', empresaIdFromUrl)
        carregarDados(empresaIdFromUrl, true)
      }
      // Se não é Super Admin nem Revenda, carregar dados da própria empresa
      else if (!isSuperAdmin && !isRevenda) {
        console.log('👤 Carregando dados da empresa do usuário')
        carregarDados()
      }
    }
    init()
  }, [empresaIdFromUrl])

  useEffect(() => {
    if (empresaSelecionada && !empresaIdFromUrl) {
      console.log('🔄 Empresa selecionada mudou, carregando dados:', empresaSelecionada)
      carregarDados(empresaSelecionada, true)
    }
  }, [empresaSelecionada])

  useEffect(() => {
    if (promptSelecionado) {
      carregarVersoes(promptSelecionado)
    }
  }, [promptSelecionado])

  const carregarEmpresas = async () => {
    try {
      // Carregar lista de empresas (para Super Admin e Revenda)
      if (isSuperAdmin || isRevenda) {
        console.log('📋 Buscando lista de empresas...')
        const response = await empresasService.listar()
        console.log('📋 Response completa:', response)
        console.log('📋 response.data:', response.data)
        
        // O backend retorna { success: true, data: [...] }
        const listaEmpresas = response.data || []
        console.log('📋 Lista de empresas:', listaEmpresas)
        console.log('📋 Tamanho do array:', listaEmpresas.length)
        
        setEmpresas(listaEmpresas)
        
        // Auto-selecionar primeira empresa se não estiver acessando por URL
        if (!empresaIdFromUrl && listaEmpresas.length > 0 && !empresaSelecionada) {
          console.log('🎯 Auto-selecionando primeira empresa:', listaEmpresas[0])
          setEmpresaSelecionada(listaEmpresas[0].empresa_id)
        }
        
        console.log('✅ Estados setados com sucesso!')
      }
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error)
    }
  }

  const carregarPrompts = async () => {
    try {
      const response = await wizardService.getAllPrompts()
      setPrompts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar prompts:', error)
    }
  }

  const carregarVersoes = async (promptKey) => {
    try {
      const response = await wizardService.getPromptVersions(promptKey)
      setVersoes(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar versões:', error)
    }
  }

  const salvarPrompt = async () => {
    if (!promptSelecionado || !versaoSelecionada) {
      showMessage('Selecione um prompt e uma versão', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        promptKey: promptSelecionado,
        promptVersion: versaoSelecionada
      }

      // Se for Super Admin, adicionar empresa_id
      if (isSuperAdmin && empresaSelecionada) {
        payload.empresa_id = empresaSelecionada
      }

      await wizardService.updateEmpresaPrompt(payload)
      showMessage('Prompt atualizado com sucesso!')
      setEditandoPrompt(false)
      await carregarDados(isSuperAdmin && empresaSelecionada ? empresaSelecionada : undefined, isSuperAdmin)
    } catch (error) {
      console.error('Erro ao salvar prompt:', error)
      showMessage('Erro ao atualizar prompt', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Funções de gerenciamento de usuários
  const abrirModalNovoUsuario = () => {
    setNovoUsuario({
      nome: '',
      login: '',
      email: '',
      senha: '',
      nivel_acesso_id: ''
    })
    setModalNovoUsuario(true)
  }

  const criarUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.login || !novoUsuario.email || !novoUsuario.senha || !novoUsuario.nivel_acesso_id) {
      showMessage('Preencha todos os campos', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = { ...novoUsuario }
      
      // Se for Super Admin, adicionar empresa_id
      if (isSuperAdmin && empresaSelecionada) {
        payload.empresa_id = empresaSelecionada
      }

      await wizardService.createUsuario(payload)
      showMessage('Usuário criado com sucesso!')
      setModalNovoUsuario(false)
      await carregarDados(isSuperAdmin && empresaSelecionada ? empresaSelecionada : undefined, isSuperAdmin)
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      showMessage(error.response?.data?.message || 'Erro ao criar usuário', 'error')
    } finally {
      setSaving(false)
    }
  }

  const salvarUsuario = async (usuario) => {
    setSaving(true)
    try {
      await wizardService.updateUsuario(usuario.login_id, usuario)
      showMessage('Usuário atualizado com sucesso!')
      setEditandoUsuario(null)
      await carregarDados(isSuperAdmin && empresaSelecionada ? empresaSelecionada : undefined, isSuperAdmin)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      showMessage('Erro ao atualizar usuário', 'error')
    } finally {
      setSaving(false)
    }
  }

  const abrirModalAlterarSenha = (usuario) => {
    setModalAlterarSenha(usuario)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  const alterarSenha = async () => {
    if (!novaSenha || !confirmarSenha) {
      showMessage('Preencha todos os campos', 'error')
      return
    }

    if (novaSenha !== confirmarSenha) {
      showMessage('As senhas não coincidem', 'error')
      return
    }

    if (novaSenha.length < 6) {
      showMessage('A senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    setSaving(true)
    try {
      await wizardService.updateSenhaUsuario(modalAlterarSenha.login_id, novaSenha)
      showMessage('Senha alterada com sucesso!')
      setModalAlterarSenha(null)
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      showMessage('Erro ao alterar senha', 'error')
    } finally {
      setSaving(false)
    }
  }

  const excluirUsuario = async (usuario) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?`)) {
      return
    }

    setSaving(true)
    try {
      await wizardService.deleteUsuario(usuario.login_id)
      showMessage('Usuário excluído com sucesso!')
      await carregarDados(isSuperAdmin && empresaSelecionada ? empresaSelecionada : undefined, isSuperAdmin)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      showMessage(error.response?.data?.message || 'Erro ao excluir usuário', 'error')
    } finally {
      setSaving(false)
    }
  }

  const carregarDados = async (empresaId = null, forceEmpresaId = false) => {
    setLoading(true)
    try {
      console.log('📦 carregarDados:', {
        empresaId,
        forceEmpresaId,
        isSuperAdmin
      })
      
      // Se empresaId foi fornecido explicitamente (Super Admin selecionou empresa)
      const response = forceEmpresaId && empresaId
        ? await wizardService.getDadosCompletosPorEmpresa(empresaId)
        : await wizardService.getDadosCompletos()
      
      console.log('📦 Dados recebidos:', response)
      const data = response.data
      
      // Dados da empresa
      if (data.empresa) {
        setEmpresaData(data.empresa)
        setEmpresaDataOriginal(data.empresa)
      }
      
      // Configurações de agendamento
      setConfiguracoes({
        antecedencia_minutos: data.configuracoes?.empresa_cfg_anteced_minutos || 15,
        intervalo_minutos: data.configuracoes?.empresa_cfg_interv_minutos || 0
      })
      
      // Prompt e versão
      if (data.configuracoes) {
        setPromptSelecionado(data.configuracoes.prompt_key || 'prompt_agendamento')
        setVersaoSelecionada(data.configuracoes.prompt_version || '2025-08-26-01')
      }
      
      // Instância WhatsApp
      if (data.instancia) {
        const instanciaData = {
          instancia_id: data.instancia.instancia_id || '',
          nome: data.instancia.instancia_nome || '',
          observacao: data.instancia.instancia_observacao || ''
        }
        setInstancia(instanciaData)
        setInstanciaOriginal(instanciaData)
      }
      
      setProfissionais(data.profissionais || [])
      setProfissionaisOriginais(data.profissionais || [])
      setServicos(data.servicos || [])
      setServicosOriginais(data.servicos || [])
      
      // Adicionar número de período aos horários
      const horariosComPeriodo = (data.horarios || []).map((h, index, arr) => {
        const horariosDoMesmoDia = arr.filter(x => x.horario_def === h.horario_def)
        const indexNoDia = horariosDoMesmoDia.findIndex(x => x.horario_det_id === h.horario_det_id)
        return { ...h, periodo: indexNoDia + 1 }
      })
      
      setHorarios(horariosComPeriodo)
      setHorariosOriginais(horariosComPeriodo)
      
      // Carregar usuários e níveis de acesso
      const empresaIdParaUsuarios = forceEmpresaId && empresaId ? empresaId : data.empresa?.empresa_id
      if (empresaIdParaUsuarios) {
        const [usuariosRes, niveisRes] = await Promise.all([
          wizardService.getUsuarios(empresaIdParaUsuarios),
          wizardService.getNiveisAcesso()
        ])
        setUsuarios(usuariosRes.data || [])
        setNiveisAcesso(niveisRes.data || [])
      }
      
      console.log('✅ Dados carregados com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      showMessage('Erro ao carregar configurações', 'error')
    } finally {
      setLoading(false)
      console.log('🏁 Loading finalizado')
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  // Formatar duração de HH:MM:SS para formato legível
  // Formatar valor como moeda brasileira
  const formatarValorMoeda = (valor) => {
    if (!valor) return ''
    
    // Remove tudo que não é número
    const numero = valor.toString().replace(/\D/g, '')
    
    // Converte para número e divide por 100 (centavos)
    const valorNumerico = parseFloat(numero) / 100
    
    // Formata como moeda
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Converter valor formatado para número
  const desformatarValor = (valorFormatado) => {
    if (!valorFormatado) return 0
    const valorString = valorFormatado.replace(/\./g, '').replace(',', '.')
    return parseFloat(valorString) || 0
  }

  const formatarDuracao = (duracao) => {
    if (!duracao) return 'Não definida'
    
    // Se já estiver em formato de texto simples, retornar
    if (!duracao.includes(':')) return duracao
    
    const partes = duracao.split(':')
    const horas = parseInt(partes[0])
    const minutos = parseInt(partes[1])
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`
    } else if (horas > 0) {
      return `${horas}h`
    } else if (minutos > 0) {
      return `${minutos}min`
    }
    
    return duracao
  }

  const salvarConfiguracoes = async () => {
    setSaving(true)
    try {
      // Converter os nomes dos campos para o formato esperado pelo backend
      const configParaEnviar = {
        anteced_minutos: parseInt(configuracoes.antecedencia_minutos) || 15,
        interv_minutos: parseInt(configuracoes.intervalo_minutos) || 0,
        buffer_pre_minutos: 0, // Valores padrão para campos não usados no frontend
        buffer_pos_minutos: 0
      }
      
      // Se for Super Admin, adicionar empresa_id
      if (isSuperAdmin && empresaSelecionada) {
        configParaEnviar.empresa_id = empresaSelecionada
      }
      
      console.log('📤 Enviando configurações:', configParaEnviar)
      
      await wizardService.saveConfiguracoes(configParaEnviar)
      showMessage('Configurações salvas com sucesso!')
      await carregarDados(empresaSelecionada, true)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showMessage('Erro ao salvar configurações', 'error')
    } finally {
      setSaving(false)
    }
  }

  const excluirProfissional = async (profissionalId, profissionalNome) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o profissional "${profissionalNome}"?\n\n` +
      'ATENÇÃO: Só é possível excluir se:\n' +
      '• Não houver serviços ativos vinculados\n' +
      '• Não houver agendamentos históricos\n\n' +
      'Esta ação não pode ser desfeita.'
    )
    
    if (!confirmar) return

    setSaving(true)
    try {
      await wizardService.deleteProfissional(profissionalId)
      showMessage('Profissional excluído com sucesso!')
      
      // Recarregar dados da empresa
      if (empresaIdFromUrl) {
        await carregarDados(empresaIdFromUrl, true)
      } else if (isSuperAdmin && empresaSelecionada) {
        await carregarDados(empresaSelecionada, true)
      } else {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      showMessage(error.response?.data?.message || 'Erro ao excluir profissional', 'error')
    } finally {
      setSaving(false)
    }
  }

  const salvarEmpresa = async () => {
    // Validar CEP antes de salvar
    if (empresaData.cep) {
      const cepLimpo = empresaData.cep.replace(/\D/g, '')
      if (cepLimpo.length !== 8) {
        showMessage('CEP inválido! Deve conter exatamente 8 dígitos.', 'error')
        return
      }
      // Atualizar com CEP limpo (sem hífen)
      empresaData.cep = cepLimpo
    }

    setSaving(true)
    try {
      await wizardService.updateEmpresa(empresaData)
      showMessage('Dados da empresa salvos com sucesso!')
      setEditandoEmpresa(false)
      
      // Recarregar dados da empresa
      if (empresaIdFromUrl) {
        // Se tem empresaId na URL (Super Admin ou Revenda acessando empresa específica)
        await carregarDados(empresaIdFromUrl, true)
      } else if (isSuperAdmin && empresaSelecionada) {
        // Super Admin sem URL, mas com empresa selecionada no dropdown
        await carregarDados(empresaSelecionada, true)
      } else {
        // Usuário comum vendo sua própria empresa
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showMessage('Erro ao salvar dados da empresa', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelarEdicaoEmpresa = () => {
    setEmpresaData({...empresaDataOriginal})
    setEditandoEmpresa(false)
  }

  const iniciarEdicaoServico = (servico) => {
    setEditandoServico(servico.servicos_id)
  }

  const cancelarEdicaoServico = () => {
    setServicos([...servicosOriginais])
    setEditandoServico(null)
  }

  const atualizarServico = (servicoId, campo, valor) => {
    setServicos(servicos.map(s => 
      s.servicos_id === servicoId 
        ? { ...s, [campo]: valor }
        : s
    ))
  }

  const toggleProfissionalEdicao = (servicoId, profissionalId) => {
    setServicos(servicos.map(s => {
      if (s.servicos_id === servicoId) {
        const ids = [...(s.profissionais_ids || [])]
        const index = ids.indexOf(profissionalId)
        
        if (index > -1) {
          ids.splice(index, 1)
        } else {
          ids.push(profissionalId)
        }
        
        return { ...s, profissionais_ids: ids }
      }
      return s
    }))
  }

  const salvarServico = async (servicoId) => {
    const servico = servicos.find(s => s.servicos_id === servicoId)
    
    // Validar profissionais
    if (!servico.profissionais_ids || servico.profissionais_ids.length === 0) {
      showMessage('Selecione pelo menos um profissional', 'error')
      return
    }

    setSaving(true)
    try {
      await wizardService.updateServico(servicoId, servico)
      showMessage('Serviço atualizado com sucesso!')
      setEditandoServico(null)
      
      // Recarregar dados da empresa
      if (empresaIdFromUrl) {
        await carregarDados(empresaIdFromUrl, true)
      } else if (isSuperAdmin && empresaSelecionada) {
        await carregarDados(empresaSelecionada, true)
      } else {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showMessage('Erro ao atualizar serviço', 'error')
    } finally {
      setSaving(false)
    }
  }

  const excluirServico = async (servicoId, servicoNome) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o serviço "${servicoNome}"?\n\n` +
      'Esta ação não pode ser desfeita.'
    )
    
    if (!confirmar) return

    setSaving(true)
    try {
      await wizardService.deleteServico(servicoId)
      showMessage('Serviço excluído com sucesso!')
      
      // Recarregar dados da empresa
      if (empresaIdFromUrl) {
        await carregarDados(empresaIdFromUrl, true)
      } else if (isSuperAdmin && empresaSelecionada) {
        await carregarDados(empresaSelecionada, true)
      } else {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      showMessage(error.response?.data?.message || 'Erro ao excluir serviço', 'error')
    } finally {
      setSaving(false)
    }
  }

  const abrirModalNovoServico = () => {
    setNovoServico({
      servicos_nome: '',
      servicos_valor: '',
      servicos_valor_formatado: '',
      servicos_duracao_minutos: '',
      profissionais_ids: []
    })
    setModalNovoServico(true)
  }

  const fecharModalNovoServico = () => {
    setModalNovoServico(false)
    setNovoServico({
      servicos_nome: '',
      servicos_valor: '',
      servicos_valor_formatado: '',
      servicos_duracao_minutos: '',
      profissionais_ids: []
    })
  }

  const toggleProfissionalServico = (profissionalId) => {
    setNovoServico(prev => {
      const ids = [...prev.profissionais_ids]
      const index = ids.indexOf(profissionalId)
      
      if (index > -1) {
        // Remove se já estiver selecionado
        ids.splice(index, 1)
      } else {
        // Adiciona se não estiver selecionado
        ids.push(profissionalId)
      }
      
      return { ...prev, profissionais_ids: ids }
    })
  }

  const criarNovoServico = async () => {
    // Validação
    if (!novoServico.servicos_nome || !novoServico.servicos_valor || !novoServico.servicos_duracao_minutos) {
      showMessage('Preencha todos os campos obrigatórios', 'error')
      return
    }

    if (novoServico.profissionais_ids.length === 0) {
      showMessage('Selecione pelo menos um profissional', 'error')
      return
    }

    setSaving(true)
    try {
      // Criar o serviço
      const response = await wizardService.createServico(novoServico)
      const servicoId = response.data.servicos_id
      
      // Vincular o serviço aos profissionais selecionados
      for (const profissionalId of novoServico.profissionais_ids) {
        await wizardService.vincularServico(profissionalId, servicoId)
      }
      
      showMessage('Serviço criado e vinculado com sucesso!')
      fecharModalNovoServico()
      
      // Recarregar dados da empresa
      if (empresaIdFromUrl) {
        await carregarDados(empresaIdFromUrl, true)
      } else if (isSuperAdmin && empresaSelecionada) {
        await carregarDados(empresaSelecionada, true)
      } else {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      showMessage('Erro ao criar serviço', 'error')
    } finally {
      setSaving(false)
    }
  }

  const iniciarEdicaoProfissional = (profissional) => {
    setEditandoProfissional(profissional.profissional_id)
  }

  const cancelarEdicaoProfissional = () => {
    setProfissionais([...profissionaisOriginais])
    setEditandoProfissional(null)
  }

  const atualizarProfissional = (profissionalId, campo, valor) => {
    setProfissionais(profissionais.map(p => 
      p.profissional_id === profissionalId 
        ? { ...p, [campo]: valor }
        : p
    ))
  }

  const salvarProfissional = async (profissionalId) => {
    setSaving(true)
    try {
      const profissional = profissionais.find(p => p.profissional_id === profissionalId)
      await wizardService.updateProfissional(profissionalId, profissional)
      showMessage('Profissional atualizado com sucesso!')
      setEditandoProfissional(null)
      
      // Recarregar dados da empresa
      if (empresaIdFromUrl) {
        await carregarDados(empresaIdFromUrl, true)
      } else if (isSuperAdmin && empresaSelecionada) {
        await carregarDados(empresaSelecionada, true)
      } else {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showMessage('Erro ao atualizar profissional', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleDiaHorario = (diaIndex) => {
    const horariosExistentes = horarios.filter(h => h.horario_def === diaIndex)
    
    if (horariosExistentes.length > 0) {
      // Remover todos os horários deste dia
      setHorarios(horarios.filter(h => h.horario_def !== diaIndex))
    } else {
      // Adicionar horário padrão
      setHorarios([...horarios, {
        horario_def: diaIndex,
        horario_det_inicio: '08:00:00',
        horario_det_fim: '18:00:00',
        isNew: true,
        periodo: 1
      }])
    }
  }

  const adicionarPeriodo = (diaIndex) => {
    const horariosExistentes = horarios.filter(h => h.horario_def === diaIndex)
    const proximoPeriodo = horariosExistentes.length + 1
    
    setHorarios([...horarios, {
      horario_def: diaIndex,
      horario_det_inicio: '13:00:00',
      horario_det_fim: '18:00:00',
      isNew: true,
      periodo: proximoPeriodo
    }])
  }

  const removerPeriodo = (diaIndex, periodo) => {
    const horariosAtualizados = horarios.filter(h => 
      !(h.horario_def === diaIndex && h.periodo === periodo)
    )
    // Reordenar períodos
    const horariosReordenados = horariosAtualizados.map(h => {
      if (h.horario_def === diaIndex && h.periodo > periodo) {
        return { ...h, periodo: h.periodo - 1 }
      }
      return h
    })
    setHorarios(horariosReordenados)
  }

  const atualizarHorario = (diaIndex, periodo, campo, valor) => {
    setHorarios(horarios.map(h => 
      h.horario_def === diaIndex && h.periodo === periodo
        ? { ...h, [campo]: valor }
        : h
    ))
  }

  const salvarHorarios = async () => {
    setSaving(true)
    try {
      const payload = { horarios }
      
      // Se for Super Admin, adicionar empresa_id
      if (isSuperAdmin && empresaSelecionada) {
        payload.empresa_id = empresaSelecionada
      }
      
      console.log('📤 Enviando horários:', payload)
      
      await wizardService.updateHorarios(payload.horarios, payload.empresa_id)
      showMessage('Horários atualizados com sucesso!')
      setEditandoHorarios(false)
      await carregarDados(empresaSelecionada, true)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showMessage('Erro ao atualizar horários', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelarEdicaoHorarios = () => {
    setHorarios([...horariosOriginais])
    setEditandoHorarios(false)
  }

  // Converter UUID da Evolution para formato padrão
  const converterUUIDEvolution = (uuid) => {
    // Remove espaços e converte para minúsculas
    let uuidLimpo = uuid.replace(/\s/g, '').toLowerCase()
    
    // Remove todos os hífens existentes
    uuidLimpo = uuidLimpo.replace(/-/g, '')
    
    // Verifica se tem 32 caracteres hexadecimais
    if (!/^[0-9a-f]{32}$/i.test(uuidLimpo)) {
      return null
    }
    
    // Formata no padrão UUID: 8-4-4-4-12
    return `${uuidLimpo.slice(0, 8)}-${uuidLimpo.slice(8, 12)}-${uuidLimpo.slice(12, 16)}-${uuidLimpo.slice(16, 20)}-${uuidLimpo.slice(20, 32)}`
  }

  const iniciarEdicaoWhatsApp = () => {
    const confirmar = window.confirm(
      '⚠️ ATENÇÃO!\n\n' +
      'Alterar as configurações do WhatsApp pode fazer com que o agente pare de funcionar.\n\n' +
      'Estas configurações são críticas para a comunicação com os clientes.\n\n' +
      'Tem certeza que deseja continuar?'
    )
    
    if (confirmar) {
      setEditandoWhatsApp(true)
    }
  }

  const cancelarEdicaoWhatsApp = () => {
    setInstancia({ ...instanciaOriginal })
    setEditandoWhatsApp(false)
  }

  const salvarInstancia = async () => {
    setSaving(true)
    try {
      // Converter UUID da Evolution para formato padrão
      const uuidConvertido = converterUUIDEvolution(instancia.instancia_id)
      
      if (!uuidConvertido) {
        showMessage('UUID da instância inválido. Cole o UUID diretamente da Evolution API.', 'error')
        setSaving(false)
        return
      }
      
      if (!instancia.nome) {
        showMessage('Por favor, insira um nome para a instância.', 'error')
        setSaving(false)
        return
      }
      
      // Usar o UUID convertido
      const dadosParaSalvar = {
        ...instancia,
        instancia_id: uuidConvertido
      }
      
      // Se for Super Admin, adicionar empresa_id
      if (isSuperAdmin && empresaSelecionada) {
        dadosParaSalvar.empresa_id = empresaSelecionada
      }
      
      console.log('📤 Enviando instância:', dadosParaSalvar)
      
      const response = await wizardService.updateInstancia(dadosParaSalvar)
      console.log('✅ Resposta do servidor:', response)
      
      showMessage('✅ Instância WhatsApp salva com sucesso!')
      console.log('📢 Mensagem exibida')
      
      setEditandoWhatsApp(false)
      console.log('🔒 Modo de edição desativado')
      
      await carregarDados(empresaSelecionada, true)
      console.log('🔄 Dados recarregados')
    } catch (error) {
      console.error('❌ Erro ao salvar:', error)
      showMessage('Erro ao salvar instância WhatsApp', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'configuracoes', label: 'Agendamentos', icon: Clock },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'profissionais', label: 'Profissionais', icon: Users },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    { id: 'usuarios', label: 'Usuários', icon: Users },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-heading">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {empresaIdFromUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/empresas')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="page-title">Configurações</h1>
            <p className="page-subtitle break-words">
              {empresaIdFromUrl 
                ? `Gerenciando configurações da empresa: ${empresaData?.empresa_nome || '...'}`
                : 'Gerencie as configurações da sua empresa'
              }
            </p>
          </div>
        </div>
        <Settings className="hidden h-8 w-8 shrink-0 text-gray-400 sm:block" />
      </div>

      {/* Seletor de Empresa (Super Admin) - só mostra se NÃO tem empresaId na URL */}
      {!empresaIdFromUrl && isSuperAdmin && empresas.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div className="min-w-0 flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Selecione a empresa para editar:
              </label>
              <select
                value={empresaSelecionada || ''}
                onChange={(e) => setEmpresaSelecionada(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-blue-300 bg-white px-4 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:text-sm"
              >
                {empresas.map((emp) => (
                  <option key={emp.empresa_id} value={emp.empresa_id}>
                    {emp.empresa_nome} {emp.empresa_cnpj ? `- CNPJ: ${emp.empresa_cnpj}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex min-h-11 shrink-0 items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="mt-6">
        {/* Tab: Configurações de Agendamento */}
        {activeTab === 'configuracoes' && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-6">Configurações de Agendamento</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antecedência Mínima (minutos)
                </label>
                <Input
                  type="number"
                  value={configuracoes.antecedencia_minutos}
                  onChange={(e) => setConfiguracoes({
                    ...configuracoes,
                    antecedencia_minutos: parseInt(e.target.value)
                  })}
                  min="0"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Tempo mínimo de antecedência para realizar um agendamento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo entre Agendamentos (minutos)
                </label>
                <Input
                  type="number"
                  value={configuracoes.intervalo_minutos}
                  onChange={(e) => setConfiguracoes({
                    ...configuracoes,
                    intervalo_minutos: parseInt(e.target.value)
                  })}
                  min="0"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Tempo de intervalo entre um agendamento e outro
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={salvarConfiguracoes}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>

              {/* Seção de Prompt AI */}
              {isSuperAdmin && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold">Configurações de Prompt AI</h3>
                    {!editandoPrompt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditandoPrompt(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditandoPrompt(false)
                            // Recarregar dados originais
                            carregarDados(empresaSelecionada, true)
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={salvarPrompt}
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt
                      </label>
                      <select
                        value={promptSelecionado}
                        onChange={(e) => setPromptSelecionado(e.target.value)}
                        disabled={!editandoPrompt}
                        className={`min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${
                          !editandoPrompt ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="">Selecione um prompt</option>
                        {prompts.map((prompt) => (
                          <option key={prompt.prompt_key} value={prompt.prompt_key}>
                            {prompt.prompt_key}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Selecione o prompt que será usado pelo agente de IA
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Versão
                      </label>
                      <select
                        value={versaoSelecionada}
                        onChange={(e) => setVersaoSelecionada(e.target.value)}
                        disabled={!editandoPrompt || !promptSelecionado}
                        className={`min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${
                          !editandoPrompt || !promptSelecionado ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="">Selecione uma versão</option>
                        {versoes.map((versao) => (
                          <option key={versao.prompt_version} value={versao.prompt_version}>
                            {versao.prompt_version}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Selecione a versão do prompt. Alterações podem afetar o comportamento do agente.
                      </p>
                    </div>

                    {!editandoPrompt && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex">
                          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-blue-800">
                              <strong>Prompt atual:</strong> {promptSelecionado || 'Não configurado'}
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                              <strong>Versão:</strong> {versaoSelecionada || 'Não configurada'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Horários de Funcionamento */}
            <div className="mt-8 pt-8 border-t">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Horários de Funcionamento</h3>
                {!editandoHorarios ? (
                  <Button 
                    onClick={() => setEditandoHorarios(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button 
                      onClick={cancelarEdicaoHorarios}
                      variant="outline"
                      size="sm"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={salvarHorarios}
                      size="sm"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {editandoHorarios && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Dica:</strong> Clique no switch para ativar/desativar um dia. Quando ativo, defina os horários de abertura e fechamento.
                    </p>
                  </div>
                )}

                <div className="grid gap-3">
                  {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((diaNome, diaIndex) => {
                    const horariosDia = horarios.filter(h => h.horario_def === diaIndex).sort((a, b) => a.periodo - b.periodo)
                    const isAberto = horariosDia.length > 0
                    
                    return (
                      <div key={diaIndex} className="border rounded-lg p-4 bg-white">
                        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">{diaNome}</span>
                          </div>
                          
                          {editandoHorarios && (
                            <button
                              onClick={() => toggleDiaHorario(diaIndex)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isAberto ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isAberto ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        
                        {isAberto ? (
                          <div className="space-y-2 mt-3">
                            {horariosDia.map((horario) => (
                              <div key={horario.periodo} className="ml-0 flex flex-col gap-2 sm:ml-8 sm:flex-row sm:items-center">
                                {editandoHorarios ? (
                                  <>
                                    <span className="text-xs text-gray-500 sm:w-16">Período {horario.periodo}:</span>
                                    <Input
                                      type="time"
                                      value={horario.horario_det_inicio?.substring(0, 5) || '08:00'}
                                      onChange={(e) => atualizarHorario(diaIndex, horario.periodo, 'horario_det_inicio', e.target.value + ':00')}
                                      className="w-full sm:w-28"
                                    />
                                    <span className="text-sm text-gray-600">às</span>
                                    <Input
                                      type="time"
                                      value={horario.horario_det_fim?.substring(0, 5) || '18:00'}
                                      onChange={(e) => atualizarHorario(diaIndex, horario.periodo, 'horario_det_fim', e.target.value + ':00')}
                                      className="w-full sm:w-28"
                                    />
                                    {horariosDia.length > 1 && (
                                      <button
                                        onClick={() => removerPeriodo(diaIndex, horario.periodo)}
                                        className="icon-action text-red-600 hover:bg-red-50 hover:text-red-800"
                                        title="Remover período"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {horariosDia.length > 1 && (
                                      <span className="text-xs text-gray-500 sm:w-16">Período {horario.periodo}:</span>
                                    )}
                                    <span className="text-sm text-gray-600">
                                      {horario.horario_det_inicio?.substring(0, 5)} às {horario.horario_det_fim?.substring(0, 5)}
                                    </span>
                                  </>
                                )}
                              </div>
                            ))}
                            
                            {editandoHorarios && (
                              <button
                                onClick={() => adicionarPeriodo(diaIndex)}
                                className="ml-0 flex min-h-10 items-center gap-1 text-sm text-blue-600 hover:text-blue-800 sm:ml-8"
                              >
                                + Adicionar período (ex: horário de almoço)
                              </button>
                            )}
                            
                            {!editandoHorarios && (
                              <span className="ml-0 inline-block rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 sm:ml-8">
                                Aberto
                              </span>
                            )}
                          </div>
                        ) : (
                          !editandoHorarios && (
                            <span className="ml-0 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 sm:ml-8">
                              Fechado
                            </span>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab: WhatsApp */}
        {activeTab === 'whatsapp' && (
          <Card className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Configuração WhatsApp</h2>
              {!editandoWhatsApp ? (
                <Button 
                  onClick={iniciarEdicaoWhatsApp}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button 
                    onClick={cancelarEdicaoWhatsApp}
                    variant="outline"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={salvarInstancia}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-6 max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>✅ Cole diretamente da Evolution API!</strong> O sistema converte automaticamente o UUID 
                  para o formato correto. Você pode colar no formato que aparece na Evolution (com ou sem hífens).
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  Este ID é crucial para o sistema identificar sua empresa ao receber mensagens.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UUID da Instância Evolution *
                </label>
                <Input
                  type="text"
                  value={instancia.instancia_id}
                  onChange={(e) => setInstancia({
                    ...instancia,
                    instancia_id: e.target.value
                  })}
                  placeholder="Cole o UUID da Evolution API aqui"
                  maxLength={50}
                  disabled={!editandoWhatsApp}
                  className={!editandoWhatsApp ? 'bg-gray-50' : ''}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Cole o UUID diretamente da Evolution. Exemplos aceitos: "C94634A40C8A-4AFC-933E-EB24D8B185FA" ou "c94634a4-0c8a-4afc-933e-eb24d8b185fa"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome/Apelido da Instância * (máx. 30 caracteres)
                </label>
                <Input
                  type="text"
                  value={instancia.nome}
                  onChange={(e) => setInstancia({
                    ...instancia,
                    nome: e.target.value
                  })}
                  placeholder="WhatsApp Principal"
                  maxLength={30}
                  disabled={!editandoWhatsApp}
                  className={!editandoWhatsApp ? 'bg-gray-50' : ''}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Um nome amigável para identificar esta instância ({instancia.nome.length}/30)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={instancia.observacao}
                  onChange={(e) => setInstancia({
                    ...instancia,
                    observacao: e.target.value
                  })}
                  placeholder="Adicione observações sobre esta instância..."
                  rows="4"
                  className={`min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${!editandoWhatsApp ? 'bg-gray-50' : ''}`}
                  disabled={!editandoWhatsApp}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Tab: Profissionais */}
        {activeTab === 'profissionais' && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-6">Profissionais</h2>
            
            {profissionais.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum profissional cadastrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Os profissionais são cadastrados durante o wizard de configuração inicial
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Informação:</strong> Exibindo {profissionais.length} profissional(is) cadastrado(s) na empresa. Clique em "Editar" para alterar os dados.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {profissionais.map((prof) => {
                    const estaEditando = editandoProfissional === prof.profissional_id
                    
                    return (
                      <div key={prof.profissional_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            {!estaEditando && (
                              <h3 className="font-semibold text-lg">{prof.profissional_nome}</h3>
                            )}
                          </div>
                          {!estaEditando ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => iniciarEdicaoProfissional(prof)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar profissional"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => excluirProfissional(prof.profissional_id, prof.profissional_nome)}
                                className="text-red-600 hover:text-red-800"
                                disabled={saving}
                                title="Excluir profissional"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => cancelarEdicaoProfissional()}
                                className="text-gray-600 hover:text-gray-800"
                                disabled={saving}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => salvarProfissional(prof.profissional_id)}
                                className="text-green-600 hover:text-green-800"
                                disabled={saving}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Nome *</label>
                            {estaEditando ? (
                              <Input
                                type="text"
                                value={prof.profissional_nome || ''}
                                onChange={(e) => atualizarProfissional(prof.profissional_id, 'profissional_nome', e.target.value)}
                                className="w-full"
                              />
                            ) : (
                              <p className="text-sm">{prof.profissional_nome}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Especialidade</label>
                            {estaEditando ? (
                              <Input
                                type="text"
                                value={prof.profissional_especialidade || ''}
                                onChange={(e) => atualizarProfissional(prof.profissional_id, 'profissional_especialidade', e.target.value)}
                                className="w-full"
                                placeholder="Ex: Manicure, Cabeleireiro..."
                              />
                            ) : (
                              <p className="text-sm">{prof.profissional_especialidade || '-'}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Contato</label>
                            {estaEditando ? (
                              <Input
                                type="text"
                                value={prof.profissional_contato || ''}
                                onChange={(e) => atualizarProfissional(prof.profissional_id, 'profissional_contato', e.target.value)}
                                className="w-full"
                                placeholder="(00) 00000-0000"
                              />
                            ) : (
                              <p className="text-sm">{prof.profissional_contato || '-'}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">ID do Google Calendar</label>
                            {estaEditando ? (
                              <Input
                                type="text"
                                value={prof.gcalendar_id || ''}
                                onChange={(e) => atualizarProfissional(prof.profissional_id, 'gcalendar_id', e.target.value)}
                                className="w-full"
                                placeholder="exemplo@group.calendar.google.com"
                              />
                            ) : (
                              <p className="text-sm text-gray-600 break-all">{prof.gcalendar_id || '-'}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              ID do calendário do Google para sincronizar agendamentos deste profissional
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Tab: Serviços */}
        {activeTab === 'servicos' && (
          <Card className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Serviços</h2>
              <Button 
                onClick={abrirModalNovoServico}
                className="flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Novo Serviço
              </Button>
            </div>
            
            {servicos.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum serviço cadastrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Os serviços são cadastrados durante o wizard de configuração inicial
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Informação:</strong> Exibindo {servicos.length} serviço(s) vinculado(s) aos profissionais da empresa. Clique em "Editar" para alterar valores e durações.
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {servicos.map((servico) => {
                    const estaEditando = editandoServico === servico.servicos_id
                    
                    return (
                      <div key={servico.servicos_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                          {!estaEditando ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => iniciarEdicaoServico(servico)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar serviço"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => excluirServico(servico.servicos_id, servico.servicos_nome)}
                                className="text-red-600 hover:text-red-800"
                                disabled={saving}
                                title="Excluir serviço"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => cancelarEdicaoServico()}
                                className="text-gray-600 hover:text-gray-800"
                                disabled={saving}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => salvarServico(servico.servicos_id)}
                                className="text-green-600 hover:text-green-800"
                                disabled={saving}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Nome do Serviço */}
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">Nome do Serviço</label>
                          {estaEditando ? (
                            <Input
                              type="text"
                              value={servico.servicos_nome}
                              onChange={(e) => {
                                const novosServicos = servicos.map(s =>
                                  s.servicos_id === servico.servicos_id
                                    ? { ...s, servicos_nome: e.target.value }
                                    : s
                                )
                                setServicos(novosServicos)
                              }}
                              placeholder="Nome do serviço"
                              className="font-semibold text-lg"
                            />
                          ) : (
                            <h3 className="font-semibold text-lg">{servico.servicos_nome}</h3>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Valor (R$)</label>
                            {estaEditando ? (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <Input
                                  type="text"
                                  value={servico.servicos_valor_formatado || formatarValorMoeda(servico.servicos_valor)}
                                  onChange={(e) => {
                                    const valorFormatado = formatarValorMoeda(e.target.value)
                                    const valorNumerico = desformatarValor(valorFormatado)
                                    atualizarServico(servico.servicos_id, 'servicos_valor', valorNumerico)
                                    atualizarServico(servico.servicos_id, 'servicos_valor_formatado', valorFormatado)
                                  }}
                                  className="w-full pl-10"
                                  placeholder="0,00"
                                />
                              </div>
                            ) : (
                              <span className="font-semibold text-green-600">
                                R$ {servico.servicos_valor ? parseFloat(servico.servicos_valor).toFixed(2).replace('.', ',') : '0,00'}
                              </span>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Duração (minutos)</label>
                            {estaEditando ? (
                              <Input
                                type="number"
                                value={Math.round(servico.servicos_duracao_minutos) || ''}
                                onChange={(e) => atualizarServico(servico.servicos_id, 'servicos_duracao_minutos', e.target.value)}
                                className="w-full"
                                placeholder="Ex: 60"
                                min="1"
                                step="1"
                              />
                            ) : (
                              <span className="font-medium">
                                {formatarDuracao(servico.servicos_duracao)}
                              </span>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Profissionais *
                            </label>
                            {estaEditando ? (
                              <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                                {profissionais.length === 0 ? (
                                  <p className="text-xs text-gray-500">Nenhum profissional cadastrado</p>
                                ) : (
                                  profissionais.map(prof => (
                                    <label 
                                      key={prof.profissional_id}
                                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={(servico.profissionais_ids || []).includes(prof.profissional_id)}
                                        onChange={() => toggleProfissionalEdicao(servico.servicos_id, prof.profissional_id)}
                                        className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                                      />
                                      <span className="text-gray-700">
                                        {prof.profissional_nome}
                                      </span>
                                    </label>
                                  ))
                                )}
                                {(servico.profissionais_ids || []).length > 0 && (
                                  <p className="text-xs text-green-600 mt-1 pt-1 border-t">
                                    ✓ {servico.profissionais_ids.length} selecionado(s)
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs">
                                {(servico.profissionais_ids || []).length === 0 ? (
                                  <span className="text-red-600">⚠️ Nenhum profissional vinculado</span>
                                ) : (
                                  <div className="space-y-1">
                                    {servico.profissionais_ids.map(profId => {
                                      const prof = profissionais.find(p => p.profissional_id === profId)
                                      return prof ? (
                                        <div key={profId} className="text-gray-700">
                                          • {prof.profissional_nome}
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Tab: Empresa */}
        {activeTab === 'empresa' && (
          <Card className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Dados da Empresa</h2>
              {!editandoEmpresa ? (
                <Button 
                  onClick={() => setEditandoEmpresa(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button 
                    onClick={cancelarEdicaoEmpresa}
                    variant="outline"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={salvarEmpresa}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            {!empresaData ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Carregando dados da empresa...</p>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl">
                {/* Informações Básicas */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.empresa_nome || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          empresa_nome: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone da Empresa *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.empresa_contato || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          empresa_contato: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    {isAdmin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone do Agente
                        </label>
                        <Input
                          type="text"
                          value={empresaData.empresa_contato_agente || ''}
                          onChange={(e) => setEmpresaData({
                            ...empresaData,
                            empresa_contato_agente: e.target.value
                          })}
                          disabled={!editandoEmpresa}
                          className={!editandoEmpresa ? 'bg-gray-50' : ''}
                          placeholder="(00) 00000-0000"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Número do responsável/agente da empresa
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logradouro *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.logradouro || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          logradouro: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.numero || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          numero: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <Input
                        type="text"
                        value={empresaData.complemento || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          complemento: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.bairro || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          bairro: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.cidade || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          cidade: e.target.value
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.uf || ''}
                        onChange={(e) => setEmpresaData({
                          ...empresaData,
                          uf: e.target.value.toUpperCase()
                        })}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP *
                      </label>
                      <Input
                        type="text"
                        value={empresaData.cep || ''}
                        onChange={(e) => {
                          let valor = e.target.value.replace(/\D/g, '')
                          if (valor.length > 8) valor = valor.slice(0, 8)
                          setEmpresaData({
                            ...empresaData,
                            cep: valor
                          })
                        }}
                        disabled={!editandoEmpresa}
                        className={!editandoEmpresa ? 'bg-gray-50' : ''}
                        placeholder="00000000"
                        maxLength={8}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Digite apenas números (8 dígitos)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Observações</h3>
                  <textarea
                    value={empresaData.observacoes || ''}
                    onChange={(e) => setEmpresaData({
                      ...empresaData,
                      observacoes: e.target.value
                    })}
                    disabled={!editandoEmpresa}
                    rows="4"
                    className={`min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${
                      !editandoEmpresa ? 'bg-gray-50' : ''
                    }`}
                    placeholder="Adicione observações sobre a empresa..."
                  />
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Tab: Usuários */}
      {activeTab === 'usuarios' && (
        <Card className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Usuários</h2>
            <Button 
              onClick={abrirModalNovoUsuario}
              className="w-full sm:w-auto"
            >
              <Users className="w-4 h-4" />
              Novo Usuário
            </Button>
          </div>

          {usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum usuário cadastrado</p>
              <Button onClick={abrirModalNovoUsuario} className="w-full sm:w-auto">
                Adicionar Primeiro Usuário
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {usuarios.map((usuario) => {
                const estaEditando = editandoUsuario === usuario.login_id
                
                return (
                  <Card key={usuario.login_id} className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Nome</label>
                          {estaEditando ? (
                            <Input
                              type="text"
                              value={usuario.nome}
                              onChange={(e) => {
                                const novosUsuarios = usuarios.map(u =>
                                  u.login_id === usuario.login_id
                                    ? { ...u, nome: e.target.value }
                                    : u
                                )
                                setUsuarios(novosUsuarios)
                              }}
                            />
                          ) : (
                            <p className="font-medium">{usuario.nome}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Login</label>
                          {estaEditando ? (
                            <Input
                              type="text"
                              value={usuario.login}
                              onChange={(e) => {
                                const novosUsuarios = usuarios.map(u =>
                                  u.login_id === usuario.login_id
                                    ? { ...u, login: e.target.value }
                                    : u
                                )
                                setUsuarios(novosUsuarios)
                              }}
                            />
                          ) : (
                            <p className="font-medium">{usuario.login}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Email</label>
                          {estaEditando ? (
                            <Input
                              type="email"
                              value={usuario.email}
                              onChange={(e) => {
                                const novosUsuarios = usuarios.map(u =>
                                  u.login_id === usuario.login_id
                                    ? { ...u, email: e.target.value }
                                    : u
                                )
                                setUsuarios(novosUsuarios)
                              }}
                            />
                          ) : (
                            <p className="font-medium">{usuario.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Nível de Acesso</label>
                          {estaEditando ? (
                            <select
                              value={usuario.nivel_acesso_id}
                              onChange={(e) => {
                                const novosUsuarios = usuarios.map(u =>
                                  u.login_id === usuario.login_id
                                    ? { ...u, nivel_acesso_id: e.target.value }
                                    : u
                                )
                                setUsuarios(novosUsuarios)
                              }}
                              className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            >
                              {niveisAcesso.map(nivel => (
                                <option key={nivel.nivel_acesso_id} value={nivel.nivel_acesso_id}>
                                  {nivel.nivel_acesso_}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-medium">{usuario.nivel_acesso_nome || 'N/A'}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row flex-wrap gap-2 lg:ml-4 lg:flex-col xl:flex-row">
                        {estaEditando ? (
                          <>
                            <Button
                              onClick={() => {
                                setEditandoUsuario(null)
                                // Recarregar para desfazer mudanças
                                carregarDados(isSuperAdmin && empresaSelecionada ? empresaSelecionada : undefined, isSuperAdmin)
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => salvarUsuario(usuario)}
                              size="sm"
                              disabled={saving}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => setEditandoUsuario(usuario.login_id)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => abrirModalAlterarSenha(usuario)}
                              variant="outline"
                              size="sm"
                              title="Alterar Senha"
                            >
                              🔑
                            </Button>
                            <Button
                              onClick={() => excluirUsuario(usuario)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal: Novo Usuário */}
      {modalNovoUsuario && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold sm:text-xl">Novo Usuário</h3>
              <button 
                type="button"
                onClick={() => setModalNovoUsuario(false)}
                className="icon-action text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <Input
                  type="text"
                  value={novoUsuario.nome}
                  onChange={(e) => setNovoUsuario({
                    ...novoUsuario,
                    nome: e.target.value
                  })}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login *
                </label>
                <Input
                  type="text"
                  value={novoUsuario.login}
                  onChange={(e) => setNovoUsuario({
                    ...novoUsuario,
                    login: e.target.value
                  })}
                  placeholder="Nome de usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={novoUsuario.email}
                  onChange={(e) => setNovoUsuario({
                    ...novoUsuario,
                    email: e.target.value
                  })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <Input
                  type="password"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({
                    ...novoUsuario,
                    senha: e.target.value
                  })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nível de Acesso *
                </label>
                <select
                  value={novoUsuario.nivel_acesso_id}
                  onChange={(e) => setNovoUsuario({
                    ...novoUsuario,
                    nivel_acesso_id: e.target.value
                  })}
                  className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Selecione...</option>
                  {niveisAcesso.map(nivel => (
                    <option key={nivel.nivel_acesso_id} value={nivel.nivel_acesso_id}>
                      {nivel.nivel_acesso_}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                onClick={() => setModalNovoUsuario(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={criarUsuario}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Alterar Senha */}
      {modalAlterarSenha && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold sm:text-xl">Alterar Senha</h3>
              <button 
                type="button"
                onClick={() => setModalAlterarSenha(null)}
                className="icon-action text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Alterando senha do usuário: <strong>{modalAlterarSenha.nome}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha *
                </label>
                <Input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha *
                </label>
                <Input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                onClick={() => setModalAlterarSenha(null)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={alterarSenha}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Serviço */}
      {modalNovoServico && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold sm:text-xl">Novo Serviço</h3>
              <button 
                type="button"
                onClick={fecharModalNovoServico}
                className="icon-action text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Serviço *
                </label>
                <Input
                  type="text"
                  value={novoServico.servicos_nome}
                  onChange={(e) => setNovoServico({
                    ...novoServico,
                    servicos_nome: e.target.value
                  })}
                  placeholder="Ex: Corte de Cabelo"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <Input
                    type="text"
                    value={novoServico.servicos_valor_formatado || ''}
                    onChange={(e) => {
                      const valorFormatado = formatarValorMoeda(e.target.value)
                      const valorNumerico = desformatarValor(valorFormatado)
                      setNovoServico({
                        ...novoServico,
                        servicos_valor: valorNumerico,
                        servicos_valor_formatado: valorFormatado
                      })
                    }}
                    placeholder="0,00"
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (minutos) *
                </label>
                <Input
                  type="number"
                  value={novoServico.servicos_duracao_minutos}
                  onChange={(e) => setNovoServico({
                    ...novoServico,
                    servicos_duracao_minutos: e.target.value
                  })}
                  placeholder="60"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissionais que oferecem este serviço *
                </label>
                {profissionais.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Nenhum profissional cadastrado. Cadastre profissionais primeiro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {profissionais.map(prof => (
                      <label 
                        key={prof.profissional_id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={novoServico.profissionais_ids.includes(prof.profissional_id)}
                          onChange={() => toggleProfissionalServico(prof.profissional_id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {prof.profissional_nome}
                          {prof.profissional_especialidade && (
                            <span className="text-gray-500 ml-1">
                              ({prof.profissional_especialidade})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {novoServico.profissionais_ids.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ✓ {novoServico.profissionais_ids.length} profissional(is) selecionado(s)
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                onClick={fecharModalNovoServico}
                variant="outline"
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={criarNovoServico}
                className="flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Serviço'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
