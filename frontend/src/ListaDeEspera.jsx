import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ListaDeEspera.css';
import logoImg from './assets/logo.png'; // Reutilizando a logo que você já tem


// URL da API (Render)
const API_URL = "https://teste-casa-caminho.onrender.com/api/lista-espera";

function ListaDeEspera() {
    const [lista, setLista] = useState([]);
    const [stats, setStats] = useState({ total: 0, emEspera: 0, aguardando: 0 });
    const [loading, setLoading] = useState(true);

    const fetchLista = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setLista(data);
            setStats({
                total: data.length,
                emEspera: data.filter(item => item.status === 'Em espera').length,
                aguardando: data.filter(item => item.status === 'Aguardando Confirmação').length
            });
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            setLoading(false);
        }
    };

    useEffect(() => { fetchLista(); }, []);

    const handleAprovar = async (id) => {
        try {
            await fetch(`${API_URL}/${id}/aprovar`, { method: 'PUT' });
            fetchLista(); 
        } catch (error) { console.error(error); }
    };

    const handleRemover = async (id) => {
        if (window.confirm('Tem certeza que deseja remover esta solicitação?')) {
            try {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                fetchLista();
            } catch (error) { console.error(error); }
        }
    };

    return (
        <div className="lista-container">
            {/* --- CABEÇALHO ATUALIZADO --- */}
            <header className="lista-header">
                {/* Logo à esquerda (Clicável) */}
                <Link to="/" className="header-logo-link">
                    <img src={logoImg} alt="Voltar para Home" className="header-logo-img" />
                </Link>

                {/* Título Centralizado */}
                <div className="header-content">
                    <h2>Lista de Espera</h2>
                    <p>Gerenciamento de solicitações pendentes</p>
                </div>
            </header>

            {/* Resto da tela continua igual... */}
            <div className="cards-row">
                <div className="card-stat"><h3>{stats.total}</h3><p>Total</p></div>
                <div className="card-stat"><h3>{stats.emEspera}</h3><p>Em espera</p></div>
                <div className="card-stat"><h3>{stats.aguardando}</h3><p>Aguardando</p></div>
            </div>

            <div className="tabela-wrapper">
                {loading ? <p>Carregando...</p> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Data</th>
                                <th>Quarto</th>
                                <th>Telefone</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.nome}</td>
                                    <td>{new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                                    <td>{item.tipo_quarto}</td>
                                    <td>{item.telefone}</td>
                                    <td>
                                        <span className={`status-badge ${item.status === 'Aguardando Confirmação' ? 'warn' : 'info'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <td>
                                            <button
                                                className="btn-action btn-aprovar"
                                                onClick={() => handleAprovar(item.id)}
                                            >
                                                Aprovar
                                            </button>

                                            {item.status === "Aguardando Confirmação" && (
                                                <Link
                                                    to={`/gestao-permanencia/${item.id_paciente}`}
                                                    className="btn-action btn-alocar"
                                                >
                                                    Alocar
                                                </Link>
                                            )}

                                            <button
                                                className="btn-action btn-remover"
                                                onClick={() => handleRemover(item.id)}
                                            >
                                                Remover
                                            </button>
                                        </td>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ListaDeEspera;