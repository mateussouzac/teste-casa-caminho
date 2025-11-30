import React, { useState, useEffect } from 'react';
import Header from './components/Header'; // Usando seu cabeçalho padrão
import './GestaoPermanencia.css';

// URL da API (Render)
const API_URL = 'https://teste-casa-caminho.onrender.com/api/permanencias';

const GestaoPermanencia = () => {
  const [lista, setLista] = useState([]);
  const [formData, setFormData] = useState({
    nome_paciente: '',
    telefone_contato: '',
    nome_acompanhante: '',
    data_entrada: '',
    duracao_dias: '',
    motivo: ''
  });

  // Carregar dados ao abrir a tela
  useEffect(() => {
    fetchLista();
  }, []);

  const fetchLista = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setLista(data);
    } catch (error) { console.error("Erro ao buscar:", error); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Permanência cadastrada!");
        setFormData({ nome_paciente: '', telefone_contato: '', nome_acompanhante: '', data_entrada: '', duracao_dias: '', motivo: '' });
        fetchLista();
      }
    } catch (error) { alert("Erro ao salvar"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchLista();
    }
  };

  return (
    <div className="page-layout">
      <Header title="Gestão de Permanências" />
      
      <div className="permanencia-container">
        <div className="page-intro">
            <h2>Gestão de Permanências</h2>
            <p>Sistema de controle e acompanhamento de permanências de pacientes</p>
        </div>

        {/* --- FORMULÁRIO --- */}
        <div className="form-card">
            <div className="form-header-blue">
                <h3>Nova Permanência</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-form">
                <div className="row-2">
                    <div className="group">
                        <label>Paciente *</label>
                        <input name="nome_paciente" value={formData.nome_paciente} onChange={handleChange} placeholder="Nome do paciente" required />
                    </div>
                    <div className="group">
                        <label>Telefone para Contato *</label>
                        <input name="telefone_contato" value={formData.telefone_contato} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    </div>
                </div>

                <div className="row-2">
                    <div className="group">
                        <label>Acompanhante</label>
                        <input name="nome_acompanhante" value={formData.nome_acompanhante} onChange={handleChange} placeholder="Nome do acompanhante" />
                    </div>
                    <div className="group">
                        <label>Data de Entrada *</label>
                        <input type="date" name="data_entrada" value={formData.data_entrada} onChange={handleChange} required />
                    </div>
                </div>

                <div className="group half-width">
                    <label>Duração (dias)</label>
                    <input type="number" name="duracao_dias" value={formData.duracao_dias} onChange={handleChange} placeholder="Número de dias" />
                </div>

                <div className="group">
                    <label>Motivo *</label>
                    <textarea name="motivo" value={formData.motivo} onChange={handleChange} placeholder="Descreva o motivo da permanência" rows="3" required></textarea>
                </div>

                <button type="submit" className="btn-submit-blue">Cadastrar</button>
            </form>
        </div>

        {/* --- LISTA --- */}
        <h3 className="list-title">Permanências Cadastradas ({lista.length})</h3>
        
        <div className="list-container">
            {lista.map(item => (
                <div key={item.id} className="item-card">
                    <div className="card-header">
                        <h4 className="patient-name">👤 {item.nome_paciente}</h4>
                        <div className="card-actions">
                            <button className="btn-edit">✏️ Editar</button>
                            <button className="btn-delete" onClick={() => handleDelete(item.id)}>🗑️ Excluir</button>
                        </div>
                    </div>
                    
                    <div className="card-body-grid">
                        <div>
                            <small>📞 Telefone</small>
                            <p>{item.telefone_contato}</p>
                        </div>
                        <div>
                            <small>👥 Acompanhante</small>
                            <p>{item.nome_acompanhante || '-'}</p>
                        </div>
                        <div>
                            <small>📅 Data de Entrada</small>
                            <p>{new Date(item.data_entrada).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                            <small>⏱️ Duração</small>
                            <p>{item.duracao_dias} dias</p>
                        </div>
                    </div>
                    <div className="card-footer">
                        <small>📄 Motivo</small>
                        <p>{item.motivo}</p>
                    </div>
                </div>
            ))}
        </div>

      </div>
      <footer className="page-footer">
          © 2025 Instituto Casa do Caminho - Acolhimento e cuidado com amor
      </footer>
    </div>
  );
};

export default GestaoPermanencia;