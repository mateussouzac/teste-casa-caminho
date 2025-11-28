import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importando as páginas que você criou
import Home from './Home';
import ListaDeEspera from './ListaDeEspera';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Quando o link for apenas "/", mostra a Home */}
        <Route path="/" element={<Home />} />

        {/* Quando o link for "/lista-espera", mostra a Lista */}
        <Route path="/lista-espera" element={<ListaDeEspera />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;