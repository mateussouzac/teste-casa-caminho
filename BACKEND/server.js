const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'sql-casacaminho',
    port: process.env.MYSQLPORT || 3306,
    ssl: {
        rejectUnauthorized: false // Permite conexão segura com o TiDB
    }
};

// --- ROTAS DA API ---

//(READ)
app.get('/api/lista-espera', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Este SQL busca dados de 3 tabelas diferentes!
        const [rows] = await connection.execute(`
            SELECT 
                l.id_lista as id,
                p.nome,
                s.data_solicitacao,
                'Único' as tipo_quarto, -- (Exemplo fixo, ou puxaríamos da tabela de quartos se tivesse vínculo direto)
                p.telefone,
                l.status_espera as status
            FROM lista_espera l
            JOIN solicitacao s ON l.id_solicitacao = s.id_solicitacao
            JOIN paciente p ON s.id_paciente = p.id_paciente
            WHERE l.status_espera != 'Aprovado' -- Só mostra quem não foi aprovado ainda
            ORDER BY s.data_solicitacao ASC
        `);
        
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error("Erro no banco:", error.message);
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});

//(UPDATE)
app.put('/api/lista-espera/:id/aprovar', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Verifica o status atual
        const [rows] = await connection.execute('SELECT status_espera FROM lista_espera WHERE id_lista = ?', [id]);
        
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Paciente não encontrado na lista.' });
        }

        // Regra de negócio: Em espera -> Aguardando -> Aprovado
        let nextStatus = 'Aprovado';
        if (rows[0].status_espera === 'Em espera') {
            nextStatus = 'Aguardando Confirmação';
        }
        
        // Atualiza no banco
        await connection.execute('UPDATE lista_espera SET status_espera = ? WHERE id_lista = ?', [nextStatus, id]);
        await connection.end();
        
        res.json({ message: 'Status atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// (DELETE)
app.delete('/api/lista-espera/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM lista_espera WHERE id_lista = ?', [id]);
        await connection.end();
        res.json({ message: 'Removido com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor ta on na porta ${PORT}`);
});