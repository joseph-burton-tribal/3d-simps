import "./App.css";

import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import DefaultDemo from "./pages/DefaultDemo";
import ParseApiResponse from "./pages/ParseApiResponse";

function App() {
  return (
    <>
      <nav className="app-navigation" aria-label="Main navigation">
        <NavLink to="/default-demo">Default demo</NavLink>
        <NavLink to="/parse-api-response">Parse API response</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/default-demo" replace />} />
        <Route path="/default-demo" element={<DefaultDemo />} />
        <Route path="/parse-api-response" element={<ParseApiResponse />} />
        <Route path="*" element={<Navigate to="/default-demo" replace />} />
      </Routes>
    </>
  );
}

export default App;
