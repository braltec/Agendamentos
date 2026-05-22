import bcrypt from 'bcrypt'
import { generateToken } from '../config/jwt.js'
import pool from '../config/database.js'

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
        e.empresa_nome
      FROM login l
      JOIN empresa e ON e.empresa_id = l.empresa_id
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
      nome: user.nome,
      email: user.email,
      empresa_id: user.empresa_id,
      empresa_nome: user.empresa_nome,
      nivel_acesso_id: user.nivel_acesso_id,
      org_revenda_id: user.org_revenda_id,
      is_gestor_revenda: user.is_gestor_revenda || false,
    }

    res.json({
      success: true,
      token,
      user: userData,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ message: 'Erro ao fazer login' })
  }
}

export async function me(req, res) {
  try {
    const userId = req.user.user_id

    const result = await pool.query(
      `SELECT 
        l.login_id, 
        l.email, 
        l.nome,
        l.empresa_id,
        l.nivel_acesso_id,
        l.org_revenda_id,
        l.is_gestor_revenda,
        e.empresa_nome
      FROM login l
      JOIN empresa e ON e.empresa_id = l.empresa_id
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
        nome: user.nome,
        email: user.email,
        empresa_id: user.empresa_id,
        empresa_nome: user.empresa_nome,
        nivel_acesso_id: user.nivel_acesso_id,
        org_revenda_id: user.org_revenda_id,
        is_gestor_revenda: user.is_gestor_revenda || false,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ message: 'Erro ao buscar dados do usuário' })
  }
}

