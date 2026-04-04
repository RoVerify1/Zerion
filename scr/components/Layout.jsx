import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { Moon, Sun, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [dark, setDark] = useState(document.body.classList.contains('dark-mode'));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', dark);
  }, [dark]);

  return (
    <>
      <nav className="flex flex-between container" style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎮 RoVerify
        </Link>
        <div className="flex gap-1">
          <LanguageToggle />
          <button className="btn btn-outline btn-small" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <div className="flex gap-1">
              <Link to="/dashboard" className="btn btn-outline btn-small">{t('nav.dashboard')}</Link>
              <button onClick={logout} className="btn btn-outline btn-small">{t('nav.logout')}</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-small">{t('nav.login')}</Link>
          )}
        </div>
      </nav>
      <main style={{ minHeight: '80vh' }}>{children}</main>
      <footer className="text-center text-muted" style={{ padding: '2rem 0', borderTop: '1px solid var(--border)' }}>
        © {new Date().getFullYear()} RoVerify. All rights reserved.
      </footer>
    </>
  );
}
