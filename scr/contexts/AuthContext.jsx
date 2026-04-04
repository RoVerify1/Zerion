import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Check URL for OAuth redirect token
    const urlParams = new URLSearchParams(window.location.search);
    const redirectToken = urlParams.get('token');
    
    if (redirectToken) {
      localStorage.setItem('token', redirectToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (localStorage.getItem('token')) fetchUser();
    else setLoading(false);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        logout();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      setUser(data.data.user);
    }
    return data;
  };

  const register = async (username, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      setUser(data.data.user);
    }
    return data;
  };

  const sendOTP = async (email) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  };

  const verifyOTP = async (email, code) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      setUser(data.data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, authMode, setAuthMode, login, register, sendOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
