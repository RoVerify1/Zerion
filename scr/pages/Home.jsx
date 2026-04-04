import { useState } from 'react';
import { useAuth, useLang } from '../contexts/AuthContext';
import Hero from '../components/Hero';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const { t } = useLang();

  return (
    <>
      {!user && <Hero onLogin={() => setShowModal(true)} />}
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      {user && <div className="container text-center mt-2"><h1>{t('dashboard.welcome', { name: user.username })}</h1></div>}
    </>
  );
}
