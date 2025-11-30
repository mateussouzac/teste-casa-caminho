import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import ListaDeEspera from './ListaDeEspera';
import CadastroPaciente from './CadastroPaciente';
import GestaoPermanencia from './GestaoPermanencia';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista-espera" element={<ListaDeEspera />} />
        <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
        <Route path="/permanencia" element={<GestaoPermanencia />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;