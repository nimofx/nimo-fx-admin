import { createContext, useContext, useEffect, useState } from "react";
import { loginApi, getProfileApi } from "../services/api.js";
import { setItem, getItem, removeItem } from "../utils/storage.js";

const AuthContext = createContext(null);

const checkIsAdmin = (user) => {
  return user?.role === "admin" || user?.roles?.includes("admin");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const res = await loginApi(email, password);

    if (!res?.token) {
      throw new Error("Login failed");
    }

    setItem("nimo_fx_admin_token", res.token);

    const profile = await getProfileApi();

    if (!checkIsAdmin(profile?.user)) {
      removeItem("nimo_fx_admin_token");
      throw new Error("Not admin account");
    }

    setUser(profile.user);
  };

  const loadUser = async () => {
    try {
      const token = getItem("nimo_fx_admin_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const profile = await getProfileApi();

      if (!checkIsAdmin(profile?.user)) {
        removeItem("nimo_fx_admin_token");
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(profile.user);
    } catch {
      removeItem("nimo_fx_admin_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeItem("nimo_fx_admin_token");
    setUser(null);
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);