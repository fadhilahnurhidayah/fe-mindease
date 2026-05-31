import { API_URL } from '../config';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Loader2, Eye, EyeOff, HeartPulse, Shield } from 'lucide-react';

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, isRegistering, setIsRegistering, login } = useAuth();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setSuccessMessage('');
    try {
      if (isForgotPassword) {
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengirim email reset');
        setSuccessMessage(data.message);
        setEmail('');
        return;
      }

      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const payload  = isRegistering 
        ? { username, email, password, birth_date: birthDate, gender } 
        : { username, password };
      const res  = await fetch(`${API_URL}${endpoint}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
      if (isRegistering) {
        const lr = await fetch(`${API_URL}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) });
        const ld = await lr.json();
        if (lr.ok) { login(ld.token); closeAuthModal(); }
      } else { login(data.token); closeAuthModal(); }
      setUsername(''); setEmail(''); setPassword(''); setBirthDate(''); setGender(''); setShowPassword(false);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
         style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl overflow-hidden"
           style={{ background:'var(--bg-overlay)', border:'1px solid var(--border)', boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>

        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px"
             style={{ background:'linear-gradient(90deg,transparent,rgba(22,160,160,0.7),transparent)' }}/>
        {/* Ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
             style={{ background:'radial-gradient(ellipse,rgba(22,160,160,0.12) 0%,transparent 70%)' }}/>

        <div className="p-8 relative">
          <button onClick={closeAuthModal}
            className="absolute top-5 right-5 w-8 h-8 rounded-xl flex items-center justify-center transition-colors theme-toggle">
            <X className="w-4 h-4"/>
          </button>

          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl" style={{ background:'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow:'0 4px 16px rgba(22,160,160,0.4)' }}>
              <HeartPulse className="w-5 h-5 text-white"/>
            </div>
            <span className="font-extrabold text-lg gradient-text">MindEase</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color:'var(--t-primary)' }}>
            {isForgotPassword ? 'Reset Password' : (isRegistering ? 'Buat Akun Baru' : 'Selamat Datang Kembali')}
          </h2>
          <p className="text-sm mb-6 flex items-center gap-1.5" style={{ color:'var(--t-muted)' }}>
            <Shield className="w-3.5 h-3.5 text-brand-500"/>Identitasmu aman & tersamarkan di komunitas.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.2)', color:'#34d399' }}>
              {successMessage}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:'var(--t-muted)' }}>Email Anda</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="email@contoh.com" required/>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm rounded-xl flex justify-center items-center gap-2 mt-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                Kirim Link Reset Password
              </button>

              <div className="mt-6 pt-6 text-center text-sm" style={{ borderTop:'1px solid var(--border)', color:'var(--t-muted)' }}>
                <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
                  className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                  Kembali ke Login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label:'Username', type:'text',     val:username,  set:setUsername,  ph:'username unikmu',   show:true           },
                  { label:'Email',    type:'email',    val:email,     set:setEmail,     ph:'email@contoh.com',  show:isRegistering  },
                ].filter(f=>f.show).map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:'var(--t-muted)' }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} className="input-field" placeholder={f.ph} required/>
                  </div>
                ))}

                {isRegistering && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:'var(--t-muted)' }}>Tanggal Lahir</label>
                      <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} className="input-field cursor-pointer text-xs" required/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:'var(--t-muted)' }}>Jenis Kelamin</label>
                      <select value={gender} onChange={e=>setGender(e.target.value)} className="input-field cursor-pointer text-xs" required>
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color:'var(--t-muted)' }}>Password</label>
                    {!isRegistering && (
                      <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                        className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors">
                        Lupa Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                      className="input-field pr-10" placeholder="••••••••" required/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color:'var(--t-muted)' }}>
                      {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm rounded-xl flex justify-center items-center gap-2 mt-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                  {isRegistering ? 'Daftar & Masuk' : 'Masuk'}
                </button>
              </form>

              <div className="mt-6 pt-6 text-center text-sm" style={{ borderTop:'1px solid var(--border)', color:'var(--t-muted)' }}>
                {isRegistering ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                  className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                  {isRegistering ? 'Login di sini' : 'Daftar sekarang'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
