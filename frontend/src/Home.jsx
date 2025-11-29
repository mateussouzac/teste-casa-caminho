import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Mude para o link do Render se estiver testando online
const API_URL = 'http://localhost:3001/api/dashboard'; 

function Home() {
  const [data, setData] = useState({
    quartos: [],
    proximasChegadas: [],
    stats: { ocupacao: 0, leitosLivres: 0, pendentes: 0, hospedes: 0 }
  });

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(dados => setData(dados))
      .catch(err => console.error("Erro ao carregar dashboard:", err));
  }, []);

  return (
    <div className="dashboard-container">
      {/* Cabeçalho Oficial */}
      <header className="dashboard-header">
        <div className="logo-area">
            {/* Se tiver a imagem da logo, coloque aqui */}
            <h2>Casa do Caminho</h2>
        </div>
        <div className="search-area">
          <input type="text" placeholder="Pesquisar..." />
          <span className="search-icon">🔍</span>
        </div>
        <div className="user-area">
          <span>Olá, Raquel</span>
          <div className="user-avatar">👤</div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Coluna 1: Ações e Gráfico */}
        <div className="col-actions">
            <section className="card actions-card">
                <h3>Ações Rápidas</h3>
                <div className="buttons-stack">
                    <Link to="/cadastro" className="btn-menu disabled">Nova Solicitação</Link>
                    <Link to="/alta" className="btn-menu disabled">Registrar Saída</Link>
                    <Link to="/lista-espera" className="btn-menu active">Ver Lista de Espera</Link>
                </div>
            </section>

            <section className="card analysis-card">
                <h3>Análise de Dados</h3>
                <div className="chart-placeholder">
                    <div className="pie-chart"></div>
                </div>
                <Link to="/analise" className="link-blue">Ver Análise Completa</Link>
            </section>
        </div>

        {/* Coluna 2: Mapa de Quartos (DADOS REAIS) */}
        <div className="col-map">
            <section className="card">
                <h3>Mapa de Ocupação</h3>
                <div className="room-list">
                    {data.quartos.map(quarto => (
                        <div key={quarto.id_quarto} className={`room-item ${quarto.status_ocupacao.toLowerCase()}`}>
                            <span>{quarto.tipo_quarto}</span>
                            <span className="status-label">{quarto.status_ocupacao}</span>
                        </div>
                    ))}
                    {data.quartos.length === 0 && <p>Nenhum quarto cadastrado.</p>}
                </div>
            </section>
        </div>

        {/* Coluna 3: Status e Chegadas (DADOS REAIS) */}
        <div className="col-status">
            <section className="card status-grid-card">
                <h3>Status Geral</h3>
                <div className="status-grid">
                    <div className="stat-box">
                        <h4>Ocupação</h4>
                        <strong>{data.stats.ocupacao}%</strong>
                    </div>
                    <div className="stat-box">
                        <h4>Leitos Livres</h4>
                        <strong>{data.stats.leitosLivres}</strong>
                    </div>
                    <div className="stat-box">
                        <h4>Pendentes</h4>
                        <strong>{data.stats.pendentes}</strong>
                    </div>
                    <div className="stat-box">
                        <h4>Hóspedes</h4>
                        <strong>{data.stats.hospedes}</strong>
                    </div>
                </div>
            </section>

            <section className="card upcoming-card">
                <h3>Próximas Chegadas</h3>
                <ul className="arrival-list">
                    {data.proximasChegadas.map((chegada, index) => (
                        <li key={index}>
                            <span className="dot"></span>
                            <div>
                                <strong>{chegada.nome}</strong>
                                <small>Chegada: {new Date(chegada.data_entrada).toLocaleDateString('pt-BR')}</small>
                            </div>
                        </li>
                    ))}
                    {data.proximasChegadas.length === 0 && <li style={{color:'#999'}}>Sem chegadas previstas.</li>}
                </ul>
            </section>
        </div>
      </main>
    </div>
  );
}

export default Home;