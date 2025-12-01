// frontend/src/GestaoPermanencia.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GestaoPermanencia.css';
import logoImg from './assets/logo.png';

// Base API (prod / render)
const BASE = 'https://teste-casa-caminho.onrender.com';

const GestaoPermanencia = () => {
  const [lista, setLista] = useState([]); // solicitações cadastradas (mantive)
  const [pacientes, setPacientes] = useState([]);
  const [quartosLivres, setQuartosLivres] = useState([]);
  const [alocacoesAtivas, setAlocacoesAtivas] = useState([]); // opcional, caso queira mostrar alocados
  const [formData, setFormData] = useState({
    id_paciente: '',
    telefone_contato: '',
    nome_acompanhante: '',
    data_entrada: '',
    duracao_dias: '',
    motivo: '',
    id_quarto: '' // novo campo
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  async function carregarDadosIniciais() {
    try {
      // solicitações (mantém seu comportamento atual)
      const [resPermanencias, resPacientes, resQuartos] = await Promise.all([
        fetch(`${BASE}/api/permanencias`).then(r => r.json()),
        fetch(`${BASE}/api/pacientes`).then(r => r.json()),
        fetch(`${BASE}/api/quartos-livres`).then(r => r.json())
      ]);
      setLista(resPermanencias || []);
      setPacientes(resPacientes || []);
      setQuartosLivres(resQuartos || []);
      // também buscar alocações caso o backend tenha (opcional)
      const alocRes = await fetch(`${BASE}/api/alocacoes`).then(r => r.json()).catch(()=>[]);
      setAlocacoesAtivas((alocRes||[]).filter(a=>a.status === 'ATIVO'));
    } catch (err) {
      console.error("Erro carregar dados:", err);
      setMsg("Erro ao carregar dados. Veja o console.");
    }
  }

  // quando selecionar paciente, preenche telefone automaticamente
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

  // função principal: cria permanência (ou entra na lista de espera)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    // validações simples
    if (!formData.id_paciente) { setMsg('Selecione um paciente'); return; }
    if (!formData.data_entrada) { setMsg('Informe a data de entrada'); return; }

    try {
      // 1) Verifica se há quarto selecionado / ou há quartos livres (se usuário não selecionou)
      let quartoEscolhido = formData.id_quarto || (quartosLivres[0] && quartosLivres[0].id);

      if (quartoEscolhido) {
        // Se existe quarto: cria permanência e ocupa quarto
        const payload = {
          nome_paciente: pacientes.find(p=>p.id_paciente === Number(formData.id_paciente))?.nome || '',
          telefone_contato: formData.telefone_contato,
          nome_acompanhante: formData.nome_acompanhante,
          data_entrada: formData.data_entrada,
          duracao_dias: formData.duracao_dias,
          motivo: formData.motivo
        };

        const res = await fetch(`${BASE}/api/permanencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const data = await res.json().catch(()=>({}));
          throw new Error(data.error || data.erro || 'Erro ao criar permanência');
        }

        // marca quarto como ocupado informando o id do paciente (usa rota nova PUT /api/quartos/:id/ocupar)
        await fetch(`${BASE}/api/quartos/${quartoEscolhido}/ocupar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_paciente: formData.id_paciente })
        });

        alert('Permanência cadastrada e quarto ocupado com sucesso!');
        // limpar e recarregar
        setFormData({ id_paciente: '', telefone_contato: '', nome_acompanhante: '', data_entrada: '', duracao_dias: '', motivo: '', id_quarto: '' });
        carregarDadosIniciais();
        return;
      } else {
        // Sem quarto disponível -> registrar na lista de espera
        // A rota POST /api/lista-espera que vamos adicionar aceita: { id_paciente, data_entrada, status_espera }
        const res = await fetch(`${BASE}/api/lista-espera`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_paciente: formData.id_paciente,
            data_entrada: formData.data_entrada,
            status_espera: 'Em espera'
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(()=>({}));
          throw new Error(data.error || data.erro || 'Erro ao inserir na lista de espera');
        }

        alert('Sem quartos livres. Paciente enviado para a Lista de Espera.');
        setFormData({ id_paciente: '', telefone_contato: '', nome_acompanhante: '', data_entrada: '', duracao_dias: '', motivo: '', id_quarto: '' });
        carregarDadosIniciais();
        return;
      }

    } catch (err) {
      console.error("Erro ao processar:", err);
      alert(err.message || 'Erro no envio');
    }
  };

  // excluir solicitação (mesmo comportamento anterior)
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    await fetch(`${BASE}/api/permanencias/${id}`, { method: 'DELETE' }).catch(()=>{});
    carregarDadosIniciais();
  };

  // Função para dar alta em um alocado (usa rota /api/alocacoes/:id/alta se disponível)
  // Aqui, como optou por manter permanencia como storage (1-A), vamos apenas liberar quarto via /api/quartos/:id/ocupar?status=Livre ou criar rota para liberar
  const darAltaEAtualizarQuarto = async (idQuarto) => {
    if (!window.confirm('Confirmar alta e liberar quarto?')) return;
    try {
      // chamamos rota que libera quarto
      await fetch(`${BASE}/api/quartos/${idQuarto}/liberar`, { method: 'PUT' });
      alert('Alta registrada e quarto liberado.');
      carregarDadosIniciais();
    } catch (err) {
      console.error(err);
      alert('Erro ao dar alta');
    }
  };

  return (
    <div className="page-layout">
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
            <p>Fazer nova Solicitação </p>
            {msg && <p style={{color:'red'}}>{msg}</p>}
        </div>

        {/* --- FORMULÁRIO Atualizado --- */}
        <div className="form-card">
            <div className="form-header-blue">
                <h3>Nova solicitação / Alocação</h3>
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
                    <label>Quarto (opcional — se deixar vazio será usado o primeiro quarto livre)</label>
                    <select name="id_quarto" value={formData.id_quarto} onChange={handleChange}>
                      <option value="">— usar primeiro quarto livre —</option>
                      {quartosLivres.map(q => (
                        <option key={q.id_quarto || q.id} value={q.id_quarto || q.id}>
                          { (q.numero || q.number) } — { (q.tipo_quarto || q.type) } — { (q.status_ocupacao || q.status) }
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="group">
                    <label>Motivo *</label>
                    <textarea name="motivo" value={formData.motivo} onChange={handleChange} placeholder="Descreva o motivo da permanência" rows="3" required></textarea>
                </div>

                <button type="submit" className="btn-submit-blue">Cadastrar / Alocar</button>
            </form>
        </div>

        {/* --- LISTA (mantida como está) --- */}
        <h3 className="list-title">Solicitações Cadastradas ({lista.length})</h3>
        
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
