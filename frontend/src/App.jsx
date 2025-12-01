import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importando as páginas
import Home from './Home';
import ListaDeEspera from './ListaDeEspera';
import CadastroPaciente from './CadastroPaciente';
import GestaoPermanencia from './GestaoPermanencia';
import AnaliseDados from './AnaliseDados';
import Login from './Login';
import CadastroQuarto from './CadastroQuarto';

// --- COMPONENTE DE PROTEÇÃO (O SEGURANÇA) ---
const RotaProtegida = ({ children }) => {
  // Verifica se tem um usuário salvo no navegador
  const usuarioLogado = localStorage.getItem('user');
  
  // Se NÃO tiver usuário, manda pro Login
  if (!usuarioLogado) {
    return <Navigate to="/login" />;
  }

  // Se tiver, mostra a página que foi pedida (Home, Lista, etc.)
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROTA PÚBLICA (Qualquer um acessa) --- */}
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PRIVADAS (Só logado acessa) --- */}
        <Route path="/" element={
          <RotaProtegida>
            <Home />
          </RotaProtegida>
        } />

        <Route path="/lista-espera" element={
          <RotaProtegida>
            <ListaDeEspera />
          </RotaProtegida>
        } />

        <Route path="/cadastro-paciente" element={
          <RotaProtegida>
            <CadastroPaciente />
          </RotaProtegida>
        } />

        <Route path="/permanencia" element={
          <RotaProtegida>
            <GestaoPermanencia />
          </RotaProtegida>
        } />

        <Route path="/analise" element={
          <RotaProtegida>
            <AnaliseDados />
          </RotaProtegida>
        } />
        <Route path="/cadastro-quarto" element={
          <RotaProtegida>
            <CadastroQuarto />
          </RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;