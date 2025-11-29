import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CadastroPaciente.css';
import logoImg from './assets/logo.png';

// URL da API (Render)
const API_URL = 'https://teste-casa-caminho.onrender.com/api/pacientes';

const CadastroPaciente = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    cidade: '',
    // condicao: '',  <-- REMOVIDO
    diagnostico: '',
    telefone: '',
    observacoes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Paciente cadastrado com sucesso!');
        navigate('/lista-espera');
      } else {
        alert('Erro ao cadastrar paciente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="cadastro-layout-full">
      {/* --- CABEÇALHO --- */}
      <header className="cadastro-header">
          <div className="header-left">
              <Link to="/">
                  <img src={logoImg} alt="Voltar para Home" className="logo-img-header" />
              </Link>
          </div>
          <h1 className="header-title">Cadastrar Paciente</h1>
          <div className="header-right"></div>
      </header>

      <main className="cadastro-content-wrapper">
        <div className="cadastro-box">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>

            {/* Linha 1: Data e Telefone */}
            <div className="form-row">
              <div className="form-group">
                <label>Data de Nascimento</label>
                <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} required placeholder="(XX) XXXXX-XXXX" />
              </div>
            </div>

            {/* Linha 2: Cidade e Diagnóstico (Juntos agora) */}
            <div className="form-row">
              <div className="form-group">
                <label>Cidade</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Diagnóstico</label>
                <input type="text" name="diagnostico" value={formData.diagnostico} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange}></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-salvar">SALVAR SOLICITAÇÃO</button>
              <button type="button" className="btn-cancelar" onClick={() => navigate('/')}>CANCELAR</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CadastroPaciente;