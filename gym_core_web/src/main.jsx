import React, { Children } from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter,Routes,Route,Navigate } from "react-router-dom";
import App from "./App";
import LoginPlataforma from "./loginPlataforma";
import PanelPlataforma from "./panelPlataforma";
import "./index.css";
import { TerminosCondiciones, PoliticaPrivacidad, PoliticaCookies } from "./PaginasLegales";


function RutaPlataforma({children}) {
  return sessionStorage.getItem('token_plataforma')
  ? children
  :<Navigate to="/plataforma/login" replace/>;
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App/>}/>
        <Route path="/plataforma/login" element={<LoginPlataforma/>}/>
        <Route path="/plataforma" element={<RutaPlataforma><PanelPlataforma/></RutaPlataforma>} />
        <Route path="/terminos" element={<TerminosCondiciones/>}/>
        <Route path="/privacidad" element={<PoliticaPrivacidad/>}/>
        <Route path="/cookies" element={<PoliticaCookies/>}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)