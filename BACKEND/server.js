require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Added for Paula's auth logic
const jwt = require('jsonwebtoken'); // Added for Paula's auth logic

const app = express();
app.use(express.json());
app.use(cors());

const axios = require("axios");

// ----- FUNÇÃO PARA ENVIAR WHATSAPP -----
async function enviarWhatsApp(telefone, mensagem) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`,
            {
                phone: telefone,
                message: mensagem
            }
        );
        console.log("WhatsApp enviado!");
        return true;

    } catch (err) {
        console.error("Erro ao enviar Whats:", err.response?.data || err);
        return false;
    }
}

// --- DATABASE CONFIGURATION (Hybrid: Local vs Cloud) ---
const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '', 
    database: process.env.MYSQLDATABASE || 'sql-casacaminho',
    port: process.env.MYSQLPORT || 3306,
    ssl: process.env.MYSQLHOST ? { rejectUnauthorized: false } : undefined
};

// --- JWT CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_casa_caminho';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// --- AUTH MIDDLEWARE ---
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acesso negado.' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido.' });
    }
}

// ==================================================================
// INICIO MATEUS (Lista de Espera, Dashboard, Quartos Livres)
// ==================================================================

// (READ) Lista de Espera
app.get('/api/lista-espera', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                l.id_lista as id, p.nome, s.data_solicitacao, 'Único' as tipo, p.telefone, l.status_espera as status
            FROM lista_espera l
            JOIN solicitacao s ON l.id_solicitacao = s.id_solicitacao
            JOIN paciente p ON s.id_paciente = p.id_paciente
            WHERE l.status_espera != 'Aprovado'
            ORDER BY s.data_solicitacao ASC
        `);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error("Erro no banco:", error.message);
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});

// (UPDATE) Aprovar solicitação
app.put('/api/lista-espera/:id/aprovar', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT status_espera FROM lista_espera WHERE id_lista = ?', [id]);
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Paciente não encontrado na lista.' });
        }
        let nextStatus = 'Aprovado';
        if (rows[0].status_espera === 'Em espera') nextStatus = 'Aguardando Confirmação';
        
        await connection.execute('UPDATE lista_espera SET status_espera = ? WHERE id_lista = ?', [nextStatus, id]);
        await connection.end();
        res.json({ message: 'Status atualizado com sucesso!' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// (DELETE) Remover solicitação
app.delete('/api/lista-espera/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM lista_espera WHERE id_lista = ?', [id]);
        await connection.end();
        res.json({ message: 'Removido com sucesso!' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Rota da Dashboard (Dados Gerais)
app.get('/api/dashboard', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [quartos] = await connection.execute('SELECT * FROM quarto');
        const [chegadas] = await connection.execute(`
            SELECT p.nome, l.data_entrada FROM lista_espera l
            JOIN solicitacao s ON l.id_solicitacao = s.id_solicitacao
            JOIN paciente p ON s.id_paciente = p.id_paciente
            WHERE l.status_espera = 'Aguardando Confirmação' LIMIT 4
        `);
        const [pendentes] = await connection.execute("SELECT COUNT(*) as total FROM lista_espera WHERE status_espera = 'Em espera'");
        const totalQuartos = quartos.length;
        const ocupados = quartos.filter(q => q.status_ocupacao === 'Ocupado').length;
        const taxaOcupacao = totalQuartos > 0 ? Math.round((ocupados / totalQuartos) * 100) : 0;
        await connection.end();
        res.json({
            quartos, proximasChegadas: chegadas,
            stats: { ocupacao: taxaOcupacao, leitosLivres: totalQuartos - ocupados, pendentes: pendentes[0].total, hospedes: ocupados }
        });
    } catch (error) { res.status(500).json({ error: "Erro ao carregar dashboard" }); }
});

// Rota para buscar apenas quartos livres (Usada no Cadastro)
app.get('/api/quartos-livres', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT * FROM quarto WHERE status_ocupacao = 'Livre' ORDER BY numero");
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==================================================================
// FIM MATEUS
// ==================================================================


// ==================================================================
// INICIO PAULA BESSA (Módulo de Pacientes)
// ==================================================================

// Listar todos os pacientes
app.get('/api/pacientes', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT * FROM paciente ORDER BY id_paciente DESC");
        await connection.end();
        res.json(rows);
    } catch (err) { res.status(500).json({ erro: "Erro ao listar pacientes" }); }
});

// Buscar um paciente
app.get('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT * FROM paciente WHERE id_paciente = ?", [id]);
        await connection.end();
        if (rows.length === 0) return res.status(404).json({ mensagem: "Paciente não encontrado" });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ erro: "Erro ao buscar paciente" }); }
});

// Cadastrar Paciente (Completo: Paciente + Solicitação + Lista)
app.post('/api/pacientes', async (req, res) => {
    const { nome, telefone, data_nascimento, cidade, condicao, diagnostico, observacoes, id_quarto } = req.body;
    const obsFinal = condicao ? `${observacoes || ''} | Condição: ${condicao}` : observacoes;
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        
        // 1. Cria Paciente
        const [pacienteResult] = await connection.execute(
            `INSERT INTO paciente (nome, telefone, data_nascimento, cidade, diagnostico, observacoes) VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, telefone, data_nascimento, cidade, diagnostico, obsFinal]
        );
        const idPaciente = pacienteResult.insertId;

        // 2. Se escolheu quarto, ocupa ele
        let statusInicial = 'Em espera';
        if (id_quarto) {
            statusInicial = 'Aguardando Confirmação';
            await connection.execute(`UPDATE quarto SET id_paciente = ?, status_ocupacao = 'Ocupado' WHERE id_quarto = ?`, [idPaciente, id_quarto]);
        }

        // 3. Cria Solicitação e Lista
        const dataHoje = new Date().toISOString().split('T')[0];
        const [solicResult] = await connection.execute(
            `INSERT INTO solicitacao (id_paciente, id_usuario, data_solicitacao, status) VALUES (?, 1, ?, ?)`,
            [idPaciente, dataHoje, statusInicial]
        );
        await connection.execute(
            `INSERT INTO lista_espera (id_solicitacao, data_entrada, status_espera) VALUES (?, ?, ?)`,
            [solicResult.insertId, dataHoje, statusInicial]
        );

        await connection.commit();
        res.status(201).json({ message: 'Salvo com sucesso!' });
    } catch (err) {
        await connection.rollback();
        console.error("Erro no cadastro:", err);
        res.status(500).json({ erro: "Erro ao criar paciente e solicitação" });
    } finally { await connection.end(); }
});

// Atualizar Paciente
app.put('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, telefone, data_nascimento, cidade, condicao, diagnostico, observacoes } = req.body;
    const obsFinal = condicao ? `${observacoes || ''} | Condição: ${condicao}` : observacoes;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `UPDATE paciente SET nome=?, telefone=?, data_nascimento=?, cidade=?, diagnostico=?, observacoes=? WHERE id_paciente=?`,
            [nome, telefone, data_nascimento, cidade, diagnostico, obsFinal, id]
        );
        await connection.end();
        res.json({ message: "Paciente atualizado" });
    } catch (err) { res.status(500).json({ erro: "Erro ao atualizar paciente" }); }
});

// Excluir Paciente
app.delete('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute("DELETE FROM paciente WHERE id_paciente = ?", [id]);
        await connection.end();
        res.json({ mensagem: "Paciente excluído com sucesso" });
    } catch (err) { res.status(500).json({ erro: "Erro ao excluir paciente" }); }
});

// ==================================================================
// FIM PAULA BESSA
// ==================================================================


// ==================================================================
// INICIO VITOR (Gestão de Permanências e Análise de Dados)
// ==================================================================

// --- MÓDULO DE PERMANÊNCIAS ---

// Listar todas
app.get('/api/permanencias', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT * FROM permanencia ORDER BY id DESC");
        await connection.end();
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Excluir permanência
app.delete('/api/permanencias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute("DELETE FROM permanencia WHERE id = ?", [id]);
        await connection.end();
        res.json({ message: 'Registro excluído.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MÓDULO DE ANÁLISE DE DADOS ---

app.get('/api/analise', async (req, res) => {
    let { inicio, fim } = req.query;
    if (!inicio || !fim) { inicio = '2000-01-01'; fim = '2100-12-31'; }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [recebidas] = await connection.execute(`SELECT COUNT(*) as total FROM solicitacao WHERE data_solicitacao BETWEEN ? AND ?`, [inicio, fim]);
        const [acolhimentos] = await connection.execute(`SELECT COUNT(*) as total FROM solicitacao WHERE status IN ('Aprovado', 'Concluído') AND data_solicitacao BETWEEN ? AND ?`, [inicio, fim]);
        const [altas] = await connection.execute(`SELECT COUNT(*) as total FROM solicitacao WHERE status = 'Concluído' AND data_solicitacao BETWEEN ? AND ?`, [inicio, fim]);
        
        const [quartos] = await connection.execute("SELECT status_ocupacao FROM quarto");
        const totalQuartos = quartos.length;
        const ocupados = quartos.filter(q => q.status_ocupacao === 'Ocupado').length;
        const taxaOcupacao = totalQuartos > 0 ? Math.round((ocupados / totalQuartos) * 100) : 0;

        const [detalhes] = await connection.execute(`
            SELECT p.nome, s.data_solicitacao, s.status FROM solicitacao s
            JOIN paciente p ON s.id_paciente = p.id_paciente
            WHERE s.data_solicitacao BETWEEN ? AND ? ORDER BY s.data_solicitacao DESC LIMIT 5
        `, [inicio, fim]);

        await connection.end();
        res.json({
            metricas: { recebidas: recebidas[0].total, acolhimentos: acolhimentos[0].total, altas: altas[0].total, ocupacao: taxaOcupacao },
            tabelaDetalhada: detalhes
        });
    } catch (err) { res.status(500).json({ error: "Erro ao buscar dados de análise" }); }
});

// ==================================================================
// FIM VITOR
// ==================================================================


// ==================================================================
// INICIO GABRIEL (Autenticação / Login)
// ==================================================================

// Registrar Usuário
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, senha, papel = 'Atendente' } = req.body;
    if (!nome || !senha || !email) return res.status(400).json({ error: "Dados incompletos." });

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [exists] = await connection.execute("SELECT id_usuario FROM usuario WHERE email = ?", [email]);
        if (exists.length > 0) { await connection.end(); return res.status(400).json({ error: "Email já existe." }); }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(senha, salt);

        const [result] = await connection.execute("INSERT INTO usuario (nome, email, senha, papel) VALUES (?, ?, ?, ?)", [nome, email, hash, papel]);
        await connection.end();
        res.status(201).json({ message: "Usuário criado!", id: result.insertId });
    } catch (error) { res.status(500).json({ error: "Erro ao registrar." }); }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: "Dados incompletos." });

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT * FROM usuario WHERE email = ?", [email]);
        await connection.end();

        if (rows.length === 0) return res.status(401).json({ error: "Credenciais inválidas." });
        const user = rows[0];

        // Verifica senha (compara hash OU texto puro para usuários antigos)
        const senhaOk = await bcrypt.compare(senha, user.senha);
        let acessoPermitido = senhaOk;
        if (!senhaOk && user.senha === senha) acessoPermitido = true; // Fallback para senha '123'

        if (!acessoPermitido) return res.status(401).json({ error: "Credenciais inválidas." });

        const token = jwt.sign({ id: user.id_usuario, nome: user.nome, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        res.json({ token, user: { id: user.id_usuario, nome: user.nome, email: user.email, papel: user.papel } });
    } catch (error) { res.status(500).json({ error: "Erro no servidor." }); }
});
//MODULO DE QUARTOS - GABRIEL

// 1. LISTAR TODOS OS QUARTOS (GET)
app.get('/api/rooms', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Busca todos os quartos ordenados pelo número (A1, A2, B1...)
        const [rows] = await connection.execute("SELECT * FROM quarto ORDER BY numero");
        await connection.end();
        
        // Mapeia para o formato que o front dele espera (id, number, type, status)
        const quartosFormatados = rows.map(row => ({
            id: row.id_quarto,
            number: row.numero, // Usa a coluna 'numero' real do banco
            type: row.tipo || row.tipo, // Tenta os dois nomes por garantia
            status: row.status_ocupacao
        }));
        
        res.json(quartosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao listar quartos" });
    }
});

// 3. ATUALIZAR QUARTO (PUT) - CORRIGIDO
app.put('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { number, type, status } = req.body; 

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        let campos = [];
        let valores = [];

        if (number) { campos.push("numero = ?"); valores.push(number); }
        // CORREÇÃO AQUI: Mudamos 'tipo_quarto' para 'tipo'
        if (type) { campos.push("tipo = ?"); valores.push(type); } 
        if (status) { campos.push("status_ocupacao = ?"); valores.push(status); }

        if (campos.length === 0) return res.json({ message: "Nada a atualizar" });

        valores.push(id); 

        await connection.execute(
            `UPDATE quarto SET ${campos.join(", ")} WHERE id_quarto = ?`,
            valores
        );
        
        await connection.end();
        res.json({ message: "Quarto atualizado com sucesso" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar quarto" });
    }
});

// 4. REMOVER QUARTO (DELETE)
app.delete('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute("DELETE FROM quarto WHERE id_quarto = ?", [id]);
        await connection.end();

        if (result.affectedRows === 0) return res.status(404).json({ error: "Quarto não encontrado" });
        
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao remover quarto" });
    }
});

// ==================================================================
// FIM GABRIEL
// ==================================================================

// Criar solicitacao + inserir na lista_espera para paciente existente
app.post('/api/lista-espera', async (req, res) => {
  const { id_paciente, data_entrada, status_espera = 'Em espera' } = req.body;
  if (!id_paciente || !data_entrada) return res.status(400).json({ error: 'id_paciente e data_entrada são obrigatórios' });

  try {
    const connection = await mysql.createConnection(dbConfig);

    // 1) criar solicitacao (id_usuario fixo 1 como nos outros pontos)
    const [sol] = await connection.execute(
      `INSERT INTO solicitacao (id_paciente, id_usuario, data_solicitacao, status) VALUES (?, 1, ?, ?)`,
      [id_paciente, data_entrada, status_espera]
    );

    // 2) inserir na lista_espera
    await connection.execute(
      `INSERT INTO lista_espera (id_solicitacao, data_entrada, status_espera) VALUES (?, ?, ?)`,
      [sol.insertId, data_entrada, status_espera]
    );

    await connection.end();
    res.status(201).json({ message: 'Inserido na lista de espera' });
  } catch (err) {
    console.error('Erro criar lista de espera:', err.message);
    res.status(500).json({ error: 'Erro ao inserir na lista de espera' });
  }
});

// Ocupar quarto (seta status_ocupacao = 'Ocupado' e id_paciente para referência)
app.put('/api/quartos/:id/ocupar', async (req, res) => {
  const { id } = req.params;
  const { id_paciente } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE quarto SET status_ocupacao = ?, id_paciente = ? WHERE id_quarto = ?', ['Ocupado', id_paciente || null, id]);
    await connection.end();
    res.json({ message: 'Quarto atualizado para Ocupado' });
  } catch (err) {
    console.error('Erro ocupar quarto:', err);
    res.status(500).json({ error: 'Erro ao ocupar quarto' });
  }
});

// Liberar quarto (dar alta) - seta status_ocupacao = 'Livre' e id_paciente = NULL
app.put('/api/quartos/:id/liberar', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE quarto SET status_ocupacao = ?, id_paciente = NULL WHERE id_quarto = ?', ['Livre', id]);
    await connection.end();
    res.json({ message: 'Quarto liberado' });
  } catch (err) {
    console.error('Erro liberar quarto:', err);
    res.status(500).json({ error: 'Erro ao liberar quarto' });
  }
});



// =============================================================
//  NOVA ROTA — QUARTOS DISPONÍVEIS
// =============================================================
app.get("/api/quartos/disponiveis", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            "SELECT * FROM quarto WHERE status_ocupacao = 'Livre'"
        );
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error("Erro:", err);
        res.status(500).json({ error: "Erro ao buscar quartos disponíveis" });
    }
});


// =============================================================
//  SUBSTITUIR COMPLETAMENTE sua rota POST /api/permanencias
// =============================================================
app.post("/api/permanencias", async (req, res) => {
    const { id_paciente, data_entrada, duracao_dias, motivo } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1 — procurar quarto livre
        const [quartos] = await connection.execute(
            "SELECT * FROM quarto WHERE status_ocupacao = 'Livre' LIMIT 1"
        );

        if (quartos.length === 0) {
            // 2 — sem quarto → lista de espera
            await connection.execute(
                `INSERT INTO lista_espera (id_paciente, data_entrada, status_espera)
                 VALUES (?, ?, 'Em espera')`,
                [id_paciente, data_entrada]
            );

            await connection.end();
            return res.json({
                message: "Sem quartos disponíveis. Paciente enviado para lista de espera.",
                espera: true
            });
        }

        const quarto = quartos[0];

        // 3 — criar permanência
        const [perma] = await connection.execute(
            `INSERT INTO permanencia (nome_paciente, telefone_contato, nome_acompanhante, data_entrada, duracao_dias, motivo, status)
             SELECT nome, telefone, '', ?, ?, ?, 'Ativo'
             FROM paciente WHERE id_paciente = ?`,
            [data_entrada, duracao_dias, motivo, id_paciente]
        );

        // 4 — ocupar quarto
        await connection.execute(
            `UPDATE quarto SET status_ocupacao='Ocupado', id_paciente=?, data_entrada=? WHERE id_quarto=?`,
            [id_paciente, data_entrada, quarto.id_quarto]
        );

        // 5 — buscar dados paciente
        const [pac] = await connection.execute(
            "SELECT nome, telefone FROM paciente WHERE id_paciente=?",
            [id_paciente]
        );

        await enviarWhatsApp(
            pac[0].telefone,
            `Olá ${pac[0].nome}! 😊\nSua entrada foi confirmada!\n📅 Data: ${data_entrada}\n🛏️ Quarto: ${quarto.numero}\n\nSeja bem-vindo(a)! 💙`
        );

        await connection.end();
        res.json({
            message: "Paciente alocado e WhatsApp enviado!",
            quarto: quarto.numero
        });

    } catch (err) {
        console.error("Erro cadastrar permanência:", err);
        res.status(500).json({ error: "Erro ao criar permanência" });
    }
});


// =============================================================
//  ALOCAR PACIENTE DA LISTA DE ESPERA
// =============================================================
app.post("/api/lista-espera/:id/alocar", async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1 — buscar paciente da lista
        const [linha] = await connection.execute(
            `SELECT id_paciente FROM lista_espera WHERE id_lista=?`,
            [id]
        );

        if (linha.length === 0) return res.status(404).json({ error: "Registro não encontrado" });

        const id_paciente = linha[0].id_paciente;

        // 2 — quarto livre?
        const [quartos] = await connection.execute(
            "SELECT * FROM quarto WHERE status_ocupacao='Livre' LIMIT 1"
        );

        if (quartos.length === 0) {
            await connection.end();
            return res.json({ message: "Ainda não há quartos livres." });
        }

        const quarto = quartos[0];

        // 3 — criar permanência
        await connection.execute(
            `INSERT INTO permanencia (nome_paciente, telefone_contato, data_entrada, duracao_dias, motivo, status)
             SELECT nome, telefone, CURDATE(), 0, 'Entrada da lista de espera', 'Ativo'
             FROM paciente WHERE id_paciente=?`,
            [id_paciente]
        );

        // 4 — ocupar quarto
        await connection.execute(
            `UPDATE quarto SET status_ocupacao='Ocupado', id_paciente=?, data_entrada=CURDATE()
             WHERE id_quarto=?`,
            [id_paciente, quarto.id_quarto]
        );

        // 5 — remover da fila
        await connection.execute(
            "DELETE FROM lista_espera WHERE id_lista=?",
            [id]
        );

        // 6 — WhatsApp
        const [pac] = await connection.execute(
            "SELECT nome, telefone FROM paciente WHERE id_paciente=?",
            [id_paciente]
        );

        await enviarWhatsApp(
            pac[0].telefone,
            `Olá ${pac[0].nome}! 💙\nUm quarto acabou de ser liberado e você foi alocado!\n🛏️ Quarto: ${quarto.numero}\n📅 Entrada: HOJE`
        );

        await connection.end();

        res.json({ message: "Paciente alocado com sucesso e WhatsApp enviado!" });

    } catch (err) {
        console.error("Erro alocar da lista:", err);
        res.status(500).json({ error: "Erro ao alocar paciente" });
    }
});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor ta on na porta ${PORT}`);
});