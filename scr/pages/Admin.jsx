import { useState, useEffect } from 'react';
import { useAuth, useLang } from '../contexts/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(d => d.success && setUsers(d.data)).catch(console.error);
  }, [user]);

  if (user?.role !== 'admin') return <div className="container mt-2 text-center">Access Denied</div>;

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mt-2">
      <h2>{t('admin.title')}</h2>
      <div className="flex flex-between mt-2">
        <input placeholder={t('admin.search')} value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
        <div className="flex gap-1 text-muted">
          <span>Total: {users.length}</span>
          <span>Verified: {users.filter(u => u.isVerified).length}</span>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
        <thead><tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
          <th style={{ padding: '0.75rem' }}>Username</th>
          <th>Roblox</th><th>Role</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}>{u.username}</td>
              <td>{u.robloxUsername || '-'}</td>
              <td>{u.role}</td>
              <td>{u.isVerified ? '✅' : '❌'}</td>
              <td><button className="btn btn-outline btn-small">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
