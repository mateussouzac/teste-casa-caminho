import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import logoImg from './assets/logo.png';
import './CadastroQuarto.css'; // O CSS que você mandou

// URL da API (Render)
const API_URL = 'https://teste-casa-caminho.onrender.com/api/rooms';

export default function CadastroQuarto() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Estado do formulário
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    number: "", // Adicionado campo de número
    type: "Único", 
    status: "Livre" 
  });

  const isEditing = editingId !== null;

  // Carregar quartos ao abrir
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setRooms(data);
    } catch (e) {
      setErr("Erro ao carregar quartos");
    } finally {
      setLoading(false);
    }
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    
    if (!form.number) {
        setErr("O número do quarto é obrigatório.");
        return;
    }

    try {
      const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      // --- AQUI ESTÁ A MUDANÇA ---
      const data = await res.json(); // Lemos a resposta do servidor

      if (!res.ok) {
        // Se deu erro, lançamos o erro real que veio do servidor
        throw new Error(data.error || "Erro desconhecido no servidor");
      }

      // Se chegou aqui, deu sucesso
      await refresh();
      cancelEdit();
      alert(isEditing ? "Quarto atualizado!" : "Quarto cadastrado com sucesso!");
      
    } catch (e) {
      console.error(e);
      // Agora o setErr vai mostrar o motivo real do problema na tela
      setErr(e.message);
    }
  }

  function startEdit(room) {
    setEditingId(room.id);
    setForm({
      number: room.number,
      type: room.type,
      status: room.status,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ number: "", type: "Único", status: "Livre" });
    setErr("");
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja excluir este quarto?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setErr("Erro ao excluir.");
    }
  }

  return (
    <div className="min-h-screen pb-8">
      
      {/* CABEÇALHO PADRÃO (Azul) */}
      <header className="lista-header">
        <Link to="/" className="header-logo-link">
            <img src={logoImg} alt="Home" className="header-logo-img" />
        </Link>
        <div className="header-content">
          <h2>Cadastro de Quartos</h2>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Mensagem de Erro */}
        {err && (
          <div className="section-card p-4 mb-4 border-red-500" style={{borderLeft: '4px solid red'}}>
            <strong className="text-red-600">Erro: </strong>
            <span className="text-sm">{err}</span>
          </div>
        )}

        {/* --- FORMULÁRIO --- */}
        <section className="section-card p-4 md:p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Editar Quarto" : "Novo Quarto"}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Campo Número (Novo) */}
            <div className="md:col-span-3">
              <label className="text-sm text-gray-500 mb-1 block font-medium">Número</label>
              <input 
                name="number" 
                value={form.number} 
                onChange={onFormChange} 
                placeholder="Ex: A1" 
                required 
              />
            </div>

            {/* Campo Tipo */}
            <div className="md:col-span-4">
              <label className="text-sm text-gray-500 mb-1 block font-medium">Tipo</label>
              <select name="type" value={form.type} onChange={onFormChange}>
                <option value="Único">Único</option>
                <option value="Duplo">Duplo</option>
                <option value="Coletivo">Coletivo</option>
              </select>
            </div>

            {/* Campo Status */}
            <div className="md:col-span-3">
              <label className="text-sm text-gray-500 mb-1 block font-medium">Status</label>
              <select name="status" value={form.status} onChange={onFormChange}>
                <option value="Livre">Livre</option>
                <option value="Ocupado">Ocupado</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </div>

            {/* Botões de Ação */}
            <div className="md:col-span-12 flex items-end gap-3 mt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 font-medium"
              >
                {isEditing ? "Salvar Alterações" : "Cadastrar"}
              </button>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* --- LISTA DE QUARTOS --- */}
        <section className="section-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quartos Cadastrados</h2>
            {loading && <span className="text-sm text-gray-500">Carregando...</span>}
          </div>

          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="px-3 py-2">Número</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {rooms.length === 0 && !loading && (
                  <tr className="bg-white">
                    <td className="px-3 py-2 text-center" colSpan={4}>Nenhum quarto cadastrado.</td>
                  </tr>
                )}

                {rooms.map((r) => (
                  <tr key={r.id} className="bg-white">
                    <td className="px-3 py-2 font-medium">{r.number}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">
                        <span style={{
                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                            backgroundColor: r.status === 'Livre' ? '#d1e7dd' : r.status === 'Ocupado' ? '#cfe2ff' : '#fff3cd',
                            color: r.status === 'Livre' ? '#0f5132' : r.status === 'Ocupado' ? '#084298' : '#664d03'
                        }}>
                            {r.status}
                        </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                          onClick={() => startEdit(r)}
                        >
                          Editar
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
                          onClick={() => handleDelete(r.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}