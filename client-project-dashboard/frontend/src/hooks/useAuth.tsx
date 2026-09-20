import { createContext, useContext, useState, ReactNode } from "react";
import { api, setAccessToken } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// NOTE (kept simple on purpose): the access token and user info live only
// in memory, so a full page refresh logs the user out and they need to
// log in again. The refresh token cookie would still let /api/auth/refresh
// issue a new access token, but since there's no "/me" endpoint we don't
// try to silently restore the user here. This is called out in the README.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    connectSocket(res.data.accessToken);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      disconnectSocket();
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
