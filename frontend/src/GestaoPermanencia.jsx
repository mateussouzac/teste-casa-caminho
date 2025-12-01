import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GestaoPermanencia.css';
import logoImg from './assets/logo.png';

// URL Base da API (Render)
const BASE = 'https://teste-casa-caminho.onrender.com';

const GestaoPermanencia = () => {
  // Estados para armazenar dados do banco
  const [lista, setLista] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [quartosLivres, setQuartosLivres] = useState([]);
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    id_paciente: '',
    telefone_contato: '',
    nome_acompanhante: '',
    data_entrada: '',
    duracao_dias: '',
    motivo: '',
    id_quarto: '' // Campo opcional
  });
  
  const [msg, setMsg] = useState('');

  // Carregar dados ao abrir a tela
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  async function carregarDadosIniciais() {
    try {
      // Busca tudo ao mesmo tempo para ser rápido
      const [resPermanencias, resPacientes, resQuartos] = await Promise.all([
        fetch(`${BASE}/api/permanencias`).then(r => r.json()),
        fetch(`${BASE}/api/pacientes`).then(r => r.json()),
        fetch(`${BASE}/api/quartos-livres`).then(r => r.json())
      ]);

      setLista(resPermanencias || []);
      setPacientes(resPacientes || []);
      setQuartosLivres(resQuartos || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setMsg("Erro de conexão com o servidor.");
    }
  }

  // Atualiza formulário e preenche telefone automaticamente ao escolher paciente
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'id_paciente') {
      const paciente = pacientes.find(p => String(p.id_paciente) === String(value));
      if (paciente) {
        setFormData(prev => ({ ...prev, telefone_contato: paciente.telefone || '' }));
      } else {
        setFormData(prev => ({ ...prev, telefone_contato: '' }));
      }
    }
  }

  // --- FUNÇÃO PRINCIPAL: SALVAR ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    if (!formData.id_paciente) { alert('Selecione um paciente'); return; }
    if (!formData.data_entrada) { alert('Informe a data de entrada'); return; }

    try {
      // 1. TENTA ALOCAR UM QUARTO
      // Se o usuário escolheu um quarto, usa ele. 
      // Se não escolheu, mas tem quartos livres na lista, pega o primeiro.
      let quartoParaAlocar = formData.id_quarto;
      
      if (!quartoParaAlocar && quartosLivres.length > 0) {
         // Pega o ID do primeiro quarto livre (tratando variação de nome id ou id_quarto)
         quartoParaAlocar = quartosLivres[0].id_quarto || quartosLivres[0].id;
      }

      // --- CENÁRIO A: TEM QUARTO DISPONÍVEL -> CRIA PERMANÊNCIA ---
      if (quartoParaAlocar) {
        const pacienteSelecionado = pacientes.find(p => String(p.id_paciente) === String(formData.id_paciente));

        const payload = {
          nome_paciente: pacienteSelecionado ? pacienteSelecionado.nome : 'Paciente',
          telefone_contato: formData.telefone_contato,
          nome_acompanhante: formData.nome_acompanhante,
          data_entrada: formData.data_entrada,
          duracao_dias: formData.duracao_dias,
          motivo: formData.motivo
        };

        // 1. Cria registro na tabela permanencia
        const resPerm = await fetch(`${BASE}/api/permanencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!resPerm.ok) throw new Error('Erro ao criar permanência');

        // 2. Atualiza o status do quarto para 'Ocupado'
        await fetch(`${BASE}/api/quartos/${quartoParaAlocar}/ocupar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_paciente: formData.id_paciente })
        });

        alert(`✅ Sucesso! Paciente alocado no quarto.`);
      
      } else {
        // --- CENÁRIO B: NÃO TEM QUARTO (OU ESTÃO TODOS OCUPADOS) -> VAI PARA FILA ---
        
        const resLista = await fetch(`${BASE}/api/lista-espera`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_paciente: formData.id_paciente,
            data_entrada: formData.data_entrada,
            status_espera: 'Em espera'
          })
        });

        if (!resLista.ok) throw new Error('Erro ao inserir na lista de espera');

        alert('⚠️ Sem quartos livres no momento. Paciente enviado para a LISTA DE ESPERA.');
      }

      // Limpeza e Atualização
      setFormData({
        id_paciente: '', telefone_contato: '', nome_acompanhante: '',
        data_entrada: '', duracao_dias: '', motivo: '', id_quarto: ''
      });
      carregarDadosIniciais();

    } catch (err) {
      console.error("Erro:", err);
      alert("Ocorreu um erro ao processar a solicitação.");
    }
  };

  // Excluir Permanência
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    await fetch(`${BASE}/api/permanencias/${id}`, { method: 'DELETE' }).catch(()=>{});
    carregarDadosIniciais();
  };

  return (
    <div className="page-layout">
      
      {/* --- CABEÇALHO PADRÃO --- */}
      <header className="page-header">
          <Link to="/" className="header-logo-link">
              <img src={logoImg} alt="Voltar para Home" className="header-logo-img" />
          </Link>
          
          <div className="header-content">
              <h2>Nova Solicitação / Gestão</h2>
          </div>
      </header>

      <div className="permanencia-container">
        <div className="page-intro">
            <p>Fazer nova Solicitação — O sistema tentará alocar um quarto automaticamente. Se não houver vaga, irá para a Lista de Espera.</p>
        </div>

        {/* --- FORMULÁRIO --- */}
        <div className="form-card">
            <div className="form-header-blue">
                <h3>Nova Solicitação</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-form">
                <div className="row-2">
                    <div className="group">
                        <label>Paciente *</label>
                        <select name="id_paciente" value={formData.id_paciente} onChange={handleChange} required>
                          <option value="">— selecione um paciente —</option>
                          {pacientes.map(p => (
                            <option key={p.id_paciente} value={p.id_paciente}>
                              {p.nome} {p.telefone ? `— ${p.telefone}` : ''}
                            </option>
                          ))}
                        </select>
                    </div>

                    <div className="group">
                        <label>Telefone para Contato</label>
                        <input name="telefone_contato" value={formData.telefone_contato} onChange={handleChange} placeholder="(00) 00000-0000" />
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

                <div className="row-2">
                  <div className="group half-width">
                      <label>Duração (dias)</label>
                      <input type="number" name="duracao_dias" value={formData.duracao_dias} onChange={handleChange} placeholder="Número de dias" />
                  </div>

                  <div className="group half-width">
                    <label>Quarto Preferencial (Opcional)</label>
                    <select name="id_quarto" value={formData.id_quarto} onChange={handleChange}>
                      <option value="">— Qualquer quarto livre —</option>
                      {quartosLivres.map(q => (
                        <option key={q.id_quarto || q.id} value={q.id_quarto || q.id}>
                          { (q.numero || q.number) } — { (q.tipo_quarto || q.type) }
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="group">
                    <label>Motivo *</label>
                    <textarea name="motivo" value={formData.motivo} onChange={handleChange} placeholder="Descreva o motivo da permanência" rows="3" required></textarea>
                </div>

                <button type="submit" className="btn-submit-blue">Confirmar Solicitação</button>
            </form>
        </div>

        {/* --- LISTA DE PERMANÊNCIAS ATIVAS --- */}
        <h3 className="list-title">Permanências Ativas ({lista.length})</h3>
        
        <div className="list-container">
            {lista.map(item => (
                <div key={item.id} className="item-card">
                    <div className="card-header">
                        <h4 className="patient-name">👤 {item.nome_paciente}</h4>
                        <div className="card-actions">
                            <button className="btn-delete" onClick={() => handleDelete(item.id)}>Encerrar/Excluir</button>
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
                            <small>📅 Entrada</small>
                            <p>{new Date(item.data_entrada).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                            <small>⏱️ Previsão</small>
                            <p>{item.duracao_dias} dias</p>
                        </div>
                    </div>
                    <div className="card-footer">
                        <small>📄 Motivo: {item.motivo}</small>
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