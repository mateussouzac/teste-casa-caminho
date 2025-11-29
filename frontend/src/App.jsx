import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import ListaDeEspera from './ListaDeEspera';
import CadastroPaciente from './CadastroPaciente';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista-espera" element={<ListaDeEspera />} />
        <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;