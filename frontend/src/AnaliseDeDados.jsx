import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AnaliseDados.css';
import logoImg from './assets/logo.png'; // Usando nosso padrão

// URL da API (Render)
const API_BASE_URL = 'https://teste-casa-caminho.onrender.com/api/analise';

const AnaliseDados = () => {
  // Estado para as datas do filtro (inicia com o mês atual como exemplo)
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({ inicio: primeiroDia, fim: ultimoDia });
  const [dados, setDados] = useState(null); // Para guardar os dados da API
  const [loading, setLoading] = useState(true);

  // Função que busca os dados no Back-end
  const buscarDados = async () => {
    setLoading(true);
    try {
      // Monta a URL com os filtros: /api/analise?inicio=...&fim=...
      const url = `${API_BASE_URL}?inicio=${filtros.inicio}&fim=${filtros.fim}`;
      const response = await fetch(url);
      const data = await response.json();
      setDados(data);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar análise:", error);
      setLoading(false);
    }
  };

  // Busca os dados assim que a tela abre
  useEffect(() => {
    buscarDados();
  }, []);

  // Função do botão "Filtrar"
  const handleFiltrar = (e) => {
    e.preventDefault();
    buscarDados();
  };

  const handleChangeFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <div className="analise-layout">
      
      {/* --- CABEÇALHO PADRÃO --- */}
      <header className="page-header-blue">
          <Link to="/" className="header-logo-link">
              <img src={logoImg} alt="Voltar" className="header-logo-img" />
          </Link>
          <div className="header-content-center">
              <h2>Análise de Dados</h2>
          </div>
      </header>

      <main className="analise-container">
        
        {/* --- ÁREA DE FILTROS --- */}
        <section className="filtros-card">
            <h3 className="section-title">Filtrar por Período</h3>
            <form onSubmit={handleFiltrar} className="filtros-form">
                <div className="filtro-group">
                    <label>Data de Início:</label>
                    <input type="date" name="inicio" value={filtros.inicio} onChange={handleChangeFiltro} required />
                </div>
                <div className="filtro-group">
                    <label>Data de Término:</label>
                    <input type="date" name="fim" value={filtros.fim} onChange={handleChangeFiltro} required />
                </div>
                <button type="submit" className="btn-filtrar">Filtrar Resultados</button>
            </form>
        </section>

        {/* --- CARDS DE MÉTRICAS (Resumo) --- */}
        {loading ? <p className="loading-text">Carregando dados...</p> : dados && (
            <section className="metricas-grid">
                <div className="card-metrica azul">
                    <h3>Solicitações Recebidas</h3>
                    <p className="metrica-valor">{dados.metricas.recebidas}</p>
                </div>
                <div className="card-metrica verde">
                    <h3>Acolhimentos</h3>
                    <p className="metrica-valor">{dados.metricas.acolhimentos}</p>
                </div>
                <div className="card-metrica roxo">
                    <h3>Altas Realizadas</h3>
                    <p className="metrica-valor">{dados.metricas.altas}</p>
                </div>
                <div className="card-metrica laranja">
                    <h3>Taxa de Ocupação Atual</h3>
                    <p className="metrica-valor">{dados.metricas.ocupacao}%</p>
                </div>
            </section>
        )}

        {/* --- TABELA DETALHADA --- */}
        {!loading && dados && (
            <section className="detalhes-card">
                <h3 className="section-title">Detalhamento do Período (Últimos 5 registros)</h3>
                <div className="tabela-responsive">
                    <table className="tabela-analise">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Data Solicitação</th>
                                <th>Status Atual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.tabelaDetalhada.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.nome}</td>
                                    <td>{new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                                    <td><span className={`status-tag ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                                </tr>
                            ))}
                            {dados.tabelaDetalhada.length === 0 && (
                                <tr><td colSpan="3" style={{textAlign: 'center'}}>Nenhum registro neste período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        )}

      </main>
    </div>
  );
};

export default AnaliseDados;