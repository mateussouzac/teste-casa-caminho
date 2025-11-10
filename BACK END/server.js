const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- dbconfig---
const dbConfig = {
    host: process.env.MYSQLHOST,      
    user: process.env.MYSQLUSER,      
    password: process.env.MYSQLPASSWORD, 
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306 
};

// READ
app.get('/api/lista-espera', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM solicitacoes_espera WHERE status != "Aprovado" ORDER BY data_solicitacao'
        );
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/lista-espera/:id/aprovar', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
    
        const [rows] = await connection.execute('SELECT status FROM solicitacoes_espera WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Solicitação não encontrada.' });
        }

        let nextStatus = 'Aprovado';
        if (rows[0].status === 'Em espera') {
            nextStatus = 'Aguardando Confirmação';
        }
        
        // Atualizar status
        await connection.execute('UPDATE solicitacoes_espera SET status = ? WHERE id = ?', [nextStatus, id]);
        await connection.end();
        res.json({ message: 'Status atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/lista-espera/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM solicitacoes_espera WHERE id = ?', [id]);
        await connection.end();
        res.json({ message: 'Solicitação removida com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/lista-espera', async (req, res) => {
    const { nome, data_solicitacao, tipo_quarto, telefone } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = 'INSERT INTO solicitacoes_espera (nome, data_solicitacao, tipo_quarto, telefone) VALUES (?, ?, ?, ?)';
        await connection.execute(sql, [nome, data_solicitacao, tipo_quarto, telefone]);
        await connection.end();
        res.status(201).json({ message: 'Solicitação criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor back-end rodando na porta ${PORT}. Acesse http://localhost:${PORT}/api/lista-espera`);
});