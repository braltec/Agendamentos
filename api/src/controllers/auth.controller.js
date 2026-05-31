import bcrypt from 'bcrypt'
import { generateToken } from '../config/jwt.js'
import pool from '../config/database.js'
import { logger } from '../utils/logger.js'
import { assertAuthenticatedUserAccess, sendAuthAccessError } from '../utils/authAccess.js'

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' })
    }

    // Buscar usuário no banco
    const result = await pool.query(
      `SELECT 
        l.login_id, 
        l.email, 
        l.senha, 
        l.nome,
        l.empresa_id,
        l.nivel_acesso_id,
        l.org_revenda_id,
        l.is_gestor_revenda,
        COALESCE(to_jsonb(l)->>'tema_preferido', 'light') AS tema_preferido,
        e.empresa_nome
      FROM login l
      LEFT JOIN empresa e ON e.empresa_id = l.empresa_id
      WHERE l.email = $1`,
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos' })
    }

    const user = result.rows[0]

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.senha)

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email ou senha inválidos' })
    }

    await assertAuthenticatedUserAccess(user)

    // Gerar token
    const token = generateToken({
      user_id: user.login_id,
      login_id: user.login_id,
      empresa_id: user.empresa_id,
      nivel_acesso_id: user.nivel_acesso_id,
      org_revenda_id: user.org_revenda_id,
      is_gestor_revenda: user.is_gestor_revenda || false,
    })

    // Retornar dados do usuário (sem a senha)
    const userData = {
      id: user.login_id,
      login_id: user.login_id,
      user_id: user.login_id,
      nome: user.nome,
      email: user.email,
      empresa_id: user.empresa_id,
      empresa_nome: user.empresa_nome,
      nivel_acesso_id: user.nivel_acesso_id,
      org_revenda_id: user.org_revenda_id,
      is_gestor_revenda: user.is_gestor_revenda || false,
      tema_preferido: user.tema_preferido || 'light',
    }

    res.json({
      success: true,
      token,
      user: userData,
    })
  } catch (error) {
    if (sendAuthAccessError(res, error)) return

    logger.error('Erro no login', { error })
    res.status(500).json({ message: 'Erro ao fazer login' })
  }
}

export async function me(req, res) {
  try {
    const userId = req.user.login_id || req.user.user_id

    const result = await pool.query(
      `SELECT 
        l.login_id, 
        l.email, 
        l.nome,
        l.empresa_id,
        l.nivel_acesso_id,
        l.org_revenda_id,
        l.is_gestor_revenda,
        COALESCE(to_jsonb(l)->>'tema_preferido', 'light') AS tema_preferido,
        e.empresa_nome
      FROM login l
      LEFT JOIN empresa e ON e.empresa_id = l.empresa_id
      WHERE l.login_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    const user = result.rows[0]

    res.json({
      success: true,
      user: {
        id: user.login_id,
        login_id: user.login_id,
        user_id: user.login_id,
        nome: user.nome,
        email: user.email,
        empresa_id: user.empresa_id,
        empresa_nome: user.empresa_nome,
        nivel_acesso_id: user.nivel_acesso_id,
        org_revenda_id: user.org_revenda_id,
        is_gestor_revenda: user.is_gestor_revenda || false,
        tema_preferido: user.tema_preferido || 'light',
      },
    })
  } catch (error) {
    logger.error('Erro ao buscar usuário autenticado', { error, userId: req.user?.login_id || req.user?.user_id })
    res.status(500).json({ message: 'Erro ao buscar dados do usuário' })
  }
}

export async function updateThemePreference(req, res) {
  try {
    const userId = req.user.login_id || req.user.user_id
    const { tema_preferido: temaPreferido } = req.body
    const temasPermitidos = new Set(['light', 'dark', 'system'])

    if (!temasPermitidos.has(temaPreferido)) {
      return res.status(400).json({
        success: false,
        message: 'Tema inválido. Use light, dark ou system.',
      })
    }

    const result = await pool.query(
      `UPDATE public.login
       SET tema_preferido = $1
       WHERE login_id = $2
       RETURNING tema_preferido`,
      [temaPreferido, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      })
    }

    res.json({
      success: true,
      tema_preferido: result.rows[0].tema_preferido,
    })
  } catch (error) {
    logger.error('Erro ao atualizar tema do usuário', { error, userId: req.user?.login_id || req.user?.user_id })
    res.status(500).json({ message: 'Erro ao atualizar preferência visual' })
  }
}
