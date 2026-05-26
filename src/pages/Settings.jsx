import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Mail, Lock, Loader2, Save, Calendar, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Settings() {
  const { token, user, logout } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', birth_date: '', gender: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFormData({ 
          username: data.username, 
          email: data.email || '', 
          password: '',
          birth_date: data.birth_date || '',
          gender: data.gender || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMessage('Profil berhasil diperbarui. Silakan login kembali dalam 2 detik...');
        setTimeout(() => logout(), 2000);
      } else {
        const err = await res.json();
        setMessage(`Gagal: ${err.error}`);
      }
    } catch (err) {
      setMessage('Terjadi kesalahan server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <Navigate to="/" />;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-12 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-brand-400" />
        <h1 className="text-3xl font-extrabold tracking-tight">Pengaturan Akun</h1>
      </div>

      <div className="glass-card p-6 md:p-8">
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
              </div>
              <input type="text" required
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                className="input-field pl-10" placeholder="Username Anda" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
              </div>
              <input type="email" required
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="input-field pl-10" placeholder="email@contoh.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
              Tanggal Lahir
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
              </div>
              <input type="date" required
                value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})}
                className="input-field pl-10 cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
              Jenis Kelamin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
              </div>
              <select required
                value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                className="input-field pl-10 cursor-pointer">
                <option value="">-- Pilih Jenis Kelamin --</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
              Password Baru (Opsional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
              </div>
              <input type="password"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="input-field pl-10" placeholder="Kosongkan jika tidak ingin mengubah" />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm font-medium ${message.includes('Gagal') ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {message}
            </div>
          )}

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
