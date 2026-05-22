import pool from './src/config/database.js';

async function verificarEmpresas() {
  try {
    console.log('\n📊 VERIFICANDO DADOS DAS EMPRESAS\n');
    console.log('='.repeat(80));
    
    // Buscar IDs das empresas
    const empresas = await pool.query(`
      SELECT empresa_id, empresa_nome 
      FROM empresa 
      WHERE empresa_nome IN ('teste empresa', 'Espaço Pamela Moraes')
      ORDER BY empresa_nome
    `);
    
    if (empresas.rows.length === 0) {
      console.log('❌ Empresas não encontradas');
      process.exit(1);
    }
    
    console.log('\n🏢 EMPRESAS ENCONTRADAS:');
    empresas.rows.forEach(e => {
      console.log(`  - ${e.empresa_nome} (ID: ${e.empresa_id})`);
    });
    
    for (const empresa of empresas.rows) {
      console.log('\n' + '='.repeat(80));
      console.log(`\n🏢 EMPRESA: ${empresa.empresa_nome.toUpperCase()}`);
      console.log('='.repeat(80));
      
      // 1. Dados da Empresa
      const dadosEmpresa = await pool.query(`
        SELECT * FROM empresa WHERE empresa_id = $1
      `, [empresa.empresa_id]);
      console.log('\n1️⃣  DADOS DA EMPRESA:');
      console.log(JSON.stringify(dadosEmpresa.rows[0], null, 2));
      
      // 2. Configurações (empresa_cfg)
      const config = await pool.query(`
        SELECT ec.* 
        FROM empresa_cfg ec
        JOIN empresa e ON e.empresa_cfg_id = ec.empresa_cfg_id
        WHERE e.empresa_id = $1
      `, [empresa.empresa_id]);
      console.log('\n2️⃣  CONFIGURAÇÕES (empresa_cfg):');
      if (config.rows.length > 0) {
        console.log(JSON.stringify(config.rows[0], null, 2));
      } else {
        console.log('  ❌ Nenhuma configuração encontrada');
      }
      
      // 3. Instância WhatsApp
      const instancia = await pool.query(`
        SELECT * FROM instancia WHERE empresa_id = $1
      `, [empresa.empresa_id]);
      console.log('\n3️⃣  INSTÂNCIA WHATSAPP:');
      if (instancia.rows.length > 0) {
        console.log(JSON.stringify(instancia.rows[0], null, 2));
      } else {
        console.log('  ❌ Nenhuma instância encontrada');
      }
      
      // 4. Profissionais
      const profissionais = await pool.query(`
        SELECT p.*, e.logradouro, e.numero, e.bairro, e.cidade, e.uf
        FROM profissional p
        LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
        WHERE p.empresa_id = $1
      `, [empresa.empresa_id]);
      console.log(`\n4️⃣  PROFISSIONAIS: ${profissionais.rows.length}`);
      profissionais.rows.forEach((p, i) => {
        console.log(`\n  Profissional ${i+1}:`);
        console.log(JSON.stringify(p, null, 2));
      });
      
      // 5. Horários de Funcionamento
      const horarios = await pool.query(`
        SELECT hf.*, hd.*
        FROM profissional_horario ph
        JOIN profissional p ON ph.profissional_id = p.profissional_id
        JOIN horario_f hf ON ph.horario_f_id = hf.horario_f_id
        LEFT JOIN horario_det hd ON hf.horario_f_id = hd.horario_f_id
        WHERE p.empresa_id = $1
        ORDER BY hd.horario_def
      `, [empresa.empresa_id]);
      console.log(`\n5️⃣  HORÁRIOS DE FUNCIONAMENTO: ${horarios.rows.length} registros`);
      if (horarios.rows.length > 0) {
        console.log(JSON.stringify(horarios.rows, null, 2));
      } else {
        console.log('  ❌ Nenhum horário vinculado aos profissionais');
      }
      
      // 6. Serviços vinculados aos profissionais
      const servicos = await pool.query(`
        SELECT 
          s.servicos_id,
          s.servicos_nome,
          s.servicos_valor,
          s.servicos_duracao,
          ps.valor_personalizado,
          ps.duracao_personalizada,
          ps.observacoes,
          p.profissional_nome
        FROM profissional_servico ps
        JOIN profissional p ON ps.profissional_id = p.profissional_id
        JOIN servicos s ON ps.servicos_id = s.servicos_id
        WHERE p.empresa_id = $1
      `, [empresa.empresa_id]);
      console.log(`\n6️⃣  SERVIÇOS VINCULADOS: ${servicos.rows.length}`);
      if (servicos.rows.length > 0) {
        console.log(JSON.stringify(servicos.rows, null, 2));
      } else {
        console.log('  ❌ Nenhum serviço vinculado');
      }
      
      // 7. Usuários (login)
      const usuarios = await pool.query(`
        SELECT login_id, nivel_acesso_id, login, email, nome, created
        FROM login
        WHERE empresa_id = $1
      `, [empresa.empresa_id]);
      console.log(`\n7️⃣  USUÁRIOS: ${usuarios.rows.length}`);
      if (usuarios.rows.length > 0) {
        console.log(JSON.stringify(usuarios.rows, null, 2));
      } else {
        console.log('  ❌ Nenhum usuário encontrado');
      }
      
      // 8. Contrato
      const contrato = await pool.query(`
        SELECT * FROM contrato WHERE empresa_id = $1
      `, [empresa.empresa_id]);
      console.log(`\n8️⃣  CONTRATO: ${contrato.rows.length}`);
      if (contrato.rows.length > 0) {
        console.log(JSON.stringify(contrato.rows[0], null, 2));
      } else {
        console.log('  ❌ Nenhum contrato encontrado');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

verificarEmpresas();

