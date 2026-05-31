import bcrypt from 'bcrypt'

const password = process.env.PASSWORD_TO_HASH || process.argv[2]

async function generateHash() {
  try {
    if (!password) {
      throw new Error('Informe a senha via PASSWORD_TO_HASH ou primeiro argumento')
    }

    if (password.length < 12) {
      throw new Error('A senha deve ter pelo menos 12 caracteres')
    }

    const hash = await bcrypt.hash(password, 10)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Gerador de hash de senha')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Hash bcrypt: ${hash}`)
    console.log('A senha informada não foi exibida.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('Erro ao gerar hash:', error.message)
    process.exitCode = 1
  }
}

generateHash()
