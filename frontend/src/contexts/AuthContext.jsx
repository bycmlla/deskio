import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("helpdesk_usuario"));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  async function login(email, senha) {
    const res = await api.post("/admin/login", { email, senha });
    localStorage.setItem("helpdesk_token", res.data.token);
    localStorage.setItem("helpdesk_usuario", JSON.stringify(res.data.usuario));
    setUsuario(res.data.usuario);
    return res.data;
  }

  function logout() {
    localStorage.removeItem("helpdesk_token");
    localStorage.removeItem("helpdesk_usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
