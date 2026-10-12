import { useEffect, useState } from "react";
import * as authApi from "../api/auth.js";
import { clearToken, getToken, setToken } from "../api/client.js";
import { AuthContext } from "./AuthContext.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // if a token was saved earlier, find out who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    let ignore = false;
    authApi
      .getMe()
      .then((data) => {
        if (!ignore) setUser(data.user);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    // a late answer must not log someone back in after they logged out
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, []);

  function saveLogin(data) {
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    saveLogin(await authApi.login(email, password));
  }

  async function register(body) {
    saveLogin(await authApi.register(body));
  }

  async function demoLogin(role) {
    saveLogin(await authApi.demoLogin(role));
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = { user, loading, login, register, demoLogin, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
