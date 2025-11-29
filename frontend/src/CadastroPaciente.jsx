import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CadastroPaciente.css'; // Vamos criar esse CSS no próximo passo

// ⚠️ URL da API (Render)
const API_URL = 'https://teste-casa-caminho.onrender.com/api/pacientes';

const CadastroPaciente = () => {
  const navigate = useNavigate(); // Para voltar pra Home depois de salvar
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    cidade: '',
    condicao: '',
    diagnostico: '',
    telefone: '',
    observacoes: ''
  });

  // Função para atualizar os campos ao digitar
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para enviar os dados (Salvar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Paciente cadastrado com sucesso!');
        navigate('/lista-espera'); // Redireciona para a lista para ver o resultado
      } else {
        alert('Erro ao cadastrar paciente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-box">
        <h2>Cadastrar Paciente</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Nome Completo</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>

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

          <div className="form-row">
            <div className="form-group">
              <label>Cidade</label>
              <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Condição Social</label>
              <select name="condicao" value={formData.condicao} onChange={handleChange}>
                <option value="">Selecione...</option>
                <option value="Baixa Renda">Baixa Renda</option>
                <option value="Vulnerabilidade">Vulnerabilidade</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Diagnóstico</label>
            <input type="text" name="diagnostico" value={formData.diagnostico} onChange={handleChange} />
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
    </div>
  );
};

export default CadastroPaciente;