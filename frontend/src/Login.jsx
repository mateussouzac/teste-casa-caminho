import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // O CSS do seu colega
import logoImg from './assets/logo.png'; 

// URL da API (Render)
const API_URL = 'https://teste-casa-caminho.onrender.com/api/auth/login';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('Bem-vindo(a)!');
        navigate('/'); // Vai para Home
        window.location.reload(); // Atualiza o header da Home
      } else {
        throw new Error(data.error || 'Erro ao fazer login');
      }

    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      {/* CABEÇALHO (Estilo do colega, mas com Link funcional) */}
      <header className="lista-header">
        <Link to="/" className="header-logo-link">
          <img src={logoImg} alt="Logo" className="header-logo-img" />
        </Link>

        <div className="header-content">
          <h2>Login do Sistema</h2>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (Card) */}
      <div className="container-center">
        <div className="section-card login-form">
          <h2 style={{ marginBottom: 20, textAlign: 'center', color: '#333' }}>Entre na sua conta</h2>

          {err && <div className="error-box">{err}</div>}

          <form onSubmit={handleSubmit} className="form-col">
            <div>
              <label className="small">E-mail</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="ex: admin@casacaminho.org"
              />
            </div>

            <div>
              <label className="small">Senha</label>
              <input 
                type="password" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                required 
                placeholder="Digite sua senha"
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <button type="button" className="btn-ghost" onClick={() => navigate('/')}>
                Cancelar
              </button>
            </div>
          </form>

          <div style={{ marginTop: 20, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
            Acesso restrito a funcionários autorizados.
          </div>
        </div>
      </div>
    </div>
  );
}