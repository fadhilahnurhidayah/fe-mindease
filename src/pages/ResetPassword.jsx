import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = 'https://be-mindease.onrender.com/api';

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Token reset password tidak valid atau tidak ditemukan di URL.');
      return;
    }

    if (password.length < 6) {
      setError('Password harus memiliki panjang minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setError(data.error || 'Gagal meriset password.');
      }
    } catch (err) {
      setError('Terjadi kesalahan server saat menghubungi backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in pb-12 pt-8">
      <div className="flex flex-col items-center text-center gap-3 mb-4">
        <div className="p-3 rounded-2xl relative" style={{ background: 'linear-gradient(135deg, #16a0a0, #0e6363)', boxShadow: '0 8px 24px rgba(22, 160, 160, 0.25)' }}>
          <KeyRound className="w-8 h-8 text-white animate-pulse-slow" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Atur Ulang Password</h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--t-secondary)' }}>
          Masukkan password baru Anda untuk memulihkan akses akun MindEase Anda.
        </p>
      </div>

      <div className="glass-card p-6 md:p-8">
        {success ? (
          <div className="text-center space-y-6 py-4 animate-scale-in">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-emerald-400">Reset Berhasil!</h3>
              <p className="text-sm" style={{ color: 'var(--t-secondary)' }}>
                {message || 'Password baru Anda telah berhasil diperbarui di database.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              Kembali ke Beranda
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {!token && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                Peringatan: Tautan tidak valid. Pastikan Anda menyalin tautan reset secara lengkap dari email.
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Minimal 6 karakter"
                  disabled={!token || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--t-muted)' }}
                  disabled={!token || isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t-secondary)' }}>
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Ulangi password baru"
                  disabled={!token || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--t-muted)' }}
                  disabled={!token || isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!token || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                Simpan Password Baru
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
