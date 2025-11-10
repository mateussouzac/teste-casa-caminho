import React, { useState, useEffect } from 'react';
import './ListaDeEspera.css';

const API_URL = 'http://localhost:3001/api/lista-espera';

function ListaDeEspera() {
    // Estado para guardar a lista de solicitações
    const [lista, setLista] = useState([]);
    const [stats, setStats] = useState({ total: 0, emEspera: 0, aguardando: 0 });

    //  Função para buscar os dados do back-end
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
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };
    useEffect(() => {
        fetchLista();
    }, []);

    //  Funções para os botões de Ação (CRUD)
    const handleAprovar = async (id, statusAtual) => {
        try {
            await fetch(`${API_URL}/${id}/aprovar`, { method: 'PUT' });
            fetchLista(); 
        } catch (error) {
            console.error('Erro ao aprovar:', error);
        }
    };

    const handleRemover = async (id) => {
        if (window.confirm('Tem certeza que deseja remover esta solicitação?')) {
            try {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                fetchLista();
            } catch (error) {
                console.error('Erro ao remover:', error);
            }
        }
    };
    return (
        <div className="lista-espera-container">
            <header>
                <h2>Lista de espera</h2>
                <p>Gerenciamento de solicitações pendentes</p>
            </header>

            <div className="cards-status">
                <div className="card">
                    <h3>{stats.total}</h3>
                    <p>Total na lista</p>
                </div>
                <div className="card">
                    <h3>{stats.emEspera}</h3>
                    <p>Em espera</p>
                </div>
                <div className="card">
                    <h3>{stats.aguardando}</h3>
                    <p>Aguardando confirmação</p>
                </div>
            </div>

            <div className="filtros-container">
                {/* Filtros (Adicionar depois)*/}
                <select>
                    <option value="">Todos os tipos</option>
                </select>
                <select>
                    <option value="">Filtrar por data</option>
                </select>
            </div>

            <div className="tabela-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Data solicitação</th>
                            <th>Tipo de quarto</th>
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
                                <td>{item.status}</td>
                                <td>
                                    <button
                                        className="btn-aprovar"
                                        onClick={() => handleAprovar(item.id, item.status)}>
                                        {item.status === 'Em espera' ? 'Aprovar' : 'Confirmar'}
                                    </button>
                                    <button
                                        className="btn-remover"
                                        onClick={() => handleRemover(item.id)}>
                                        Remover
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ListaDeEspera;