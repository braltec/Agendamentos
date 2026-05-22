import bcrypt from 'bcrypt'

const password = process.argv[2] || 'admin123'

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔐 Gerador de Hash de Senha')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📝 Senha: ${password}`)
    console.log(`🔒 Hash: ${hash}`)
    console.log('\n💡 Use este hash no campo "senha" da tabela login')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error)
  }
}

generateHash()








