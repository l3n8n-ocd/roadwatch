import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getToken, setToken } from '../api/client';
import { auth } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Restore the session from a saved token.
  useEffect(() => {
    if (!getToken()) return;
    auth
      .me()
      .then((u) => setUser(u?.user || u))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // expectedRoles: the staff sign-in checks the chosen role (#28). On a mismatch the
  // token is discarded and the caller shows the "wrong role" message.
  const login = useCallback(async (email, password, expectedRoles) => {
    const res = await auth.login(email, password);
    if (expectedRoles && !expectedRoles.includes(res.user.role)) {
      const err = new Error('wrong-role');
      err.actualRole = res.user.role;
      throw err;
    }
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (body) => {
    const res = await auth.register(body);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
