require('dotenv').config();
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

// INICIO MATEUS

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
// --- ROTA DA DASHBOARD (Dados Gerais) ---
app.get('/api/dashboard', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1. Buscar Quartos (Mapa de Ocupação)
        const [quartos] = await connection.execute('SELECT * FROM quarto');

        // 2. Buscar Próximas Chegadas (Baseado na Lista de Espera com status 'Aguardando Confirmação')
        const [chegadas] = await connection.execute(`
            SELECT p.nome, l.data_entrada 
            FROM lista_espera l
            JOIN solicitacao s ON l.id_solicitacao = s.id_solicitacao
            JOIN paciente p ON s.id_paciente = p.id_paciente
            WHERE l.status_espera = 'Aguardando Confirmação'
            LIMIT 4
        `);

        // 3. Contar Pendentes (Status 'Em espera')
        const [pendentes] = await connection.execute("SELECT COUNT(*) as total FROM lista_espera WHERE status_espera = 'Em espera'");

        // 4. Calcular Ocupação (Baseado nos quartos ocupados)
        const totalQuartos = quartos.length;
        const ocupados = quartos.filter(q => q.status_ocupacao === 'Ocupado').length;
        const taxaOcupacao = totalQuartos > 0 ? Math.round((ocupados / totalQuartos) * 100) : 0;

        await connection.end();

        // Envia tudo junto para o Front-end
        res.json({
            quartos: quartos,
            proximasChegadas: chegadas,
            stats: {
                ocupacao: taxaOcupacao,
                leitosLivres: totalQuartos - ocupados,
                pendentes: pendentes[0].total,
                hospedes: ocupados // Simplificação: 1 hóspede por quarto ocupado
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao carregar dashboard" });
    }
});
//FIM MATEUS





// DEIXAR NO FINAL
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor ta on na porta ${PORT}`);

});
