import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, ShieldPlus, ShieldMinus, Users, MessageSquare, Trash2, Loader2, RefreshCw,
  TrendingUp, BarChart2, Activity, UserPlus, Settings, Stethoscope, Edit, Plus
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MOOD_COLORS = { happy: '#10b981', neutral: '#f59e0b', sad: '#f43f5e' };
const MOOD_LABELS = { happy: 'Senang', neutral: 'Biasa', sad: 'Sedih/Lelah' };

const MoodLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm" style={{ border: '1px solid var(--border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--t-primary)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {MOOD_LABELS[p.name] || p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const chartTooltipProps = {
  contentStyle: {
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '12px',
  },
  labelStyle: { color: 'var(--t-primary)', fontWeight: 600 },
};

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const [stats, setStats]       = useState({ users: 0, posts: 0 });
  const [posts, setPosts]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [promotingUserId, setPromotingUserId] = useState(null);
  const [demotingUserId, setDemotingUserId] = useState(null);
  const [settings, setSettings] = useState({ dashboard_greeting: '', ai_prompt: '' });
  const [doctorsList, setDoctorsList] = useState([]);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, posts, settings, doctors

  const API_URL = 'http://localhost:5000/api';

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, postsRes, usersRes, analyticsRes, settingsRes, doctorsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/posts`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/analytics`, { headers }),
        fetch(`${API_URL}/admin/settings`, { headers }),
        fetch(`${API_URL}/admin/doctors`, { headers }),
      ]);
      const failures = [];
      if (statsRes.ok) setStats(await statsRes.json());
      else failures.push('statistik');
      if (postsRes.ok) setPosts(await postsRes.json());
      else failures.push('postingan');
      if (usersRes.ok) setUsers(await usersRes.json());
      else failures.push('pengguna');
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      else failures.push('analitik');
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        const obj = {};
        s.forEach(x => obj[x.setting_key] = x.setting_value);
        setSettings(obj);
      } else failures.push('settings');
      if (doctorsRes.ok) setDoctorsList(await doctorsRes.json());
      else failures.push('doctors');

      if (failures.length) {
        setFetchError(`Gagal memuat: ${failures.join(', ')}. Periksa backend atau token.`);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setFetchError('Tidak bisa menghubungi server. Pastikan API berjalan di port 5000.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && user.role === 'admin') fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const intervalId = setInterval(fetchData, 90_000);
    return () => clearInterval(intervalId);
  }, [user, fetchData]);

  const handleDeletePost = async (id) => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
      else {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Gagal menghapus postingan');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`YAKIN INGIN MENGHAPUS USER ${username}? Ini akan menghapus semua data (post & mood) miliknya!`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
      else { const e = await res.json(); alert(`Gagal: ${e.error}`); }
    } catch (e) { console.error(e); }
  };

  const handleMakeAdmin = async (id, username) => {
    if (!window.confirm(`Jadikan @${username} sebagai admin?\n\nUser tersebut bisa mengakses panel ini dan menghapus konten.`)) return;
    setPromotingUserId(id);
    try {
      const res = await fetch(`${API_URL}/admin/make-admin/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) fetchData();
      else alert(body.error || 'Gagal menjadikan admin');
    } catch (e) {
      console.error(e);
      alert('Tidak bisa menghubungi server.');
    } finally {
      setPromotingUserId(null);
    }
  };

  const handleRemoveAdmin = async (id, username) => {
    if (!window.confirm(`Cabut hak admin dari @${username}?\n\nAkun tetap ada — user tidak bisa lagi membuka panel Admin.`)) return;
    setDemotingUserId(id);
    try {
      const res = await fetch(`${API_URL}/admin/remove-admin/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        if (username === user.username) {
          logout();
        } else {
          fetchData();
        }
      } else alert(body.error || 'Gagal mencabut admin');
    } catch (e) {
      console.error(e);
      alert('Tidak bisa menghubungi server.');
    } finally {
      setDemotingUserId(null);
    }
  };


  const handleUpdateSetting = async (key, val) => {
    setIsUpdatingSetting(true);
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ setting_key: key, setting_value: val })
      });
      if (res.ok) alert('Pengaturan diperbarui!');
      else alert('Gagal memperbarui pengaturan');
    } catch (e) {
      console.error(e);
      alert('Error memperbarui pengaturan');
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  const handleAddDoctor = async () => {
    const name = prompt('Nama Dokter/Psikolog:');
    if (!name) return;
    const spec = prompt('Spesialisasi:', 'Psikolog Klinis') || 'Psikolog Klinis';
    const exp = prompt('Pengalaman (contoh: 5 Tahun):', '5 Tahun') || '5 Tahun';
    
    try {
      const res = await fetch(`${API_URL}/admin/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, spec, exp, rating: 5.0, reviews: 0, available: true, tags: 'Umum' })
      });
      if (res.ok) fetchData();
    } catch(e) {}
  };

  const handleToggleDoctor = async (doc) => {
    try {
      const res = await fetch(`${API_URL}/admin/doctors/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...doc, available: !doc.available })
      });
      if (res.ok) fetchData();
    } catch(e) {}
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Hapus dokter ini?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/doctors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
    } catch(e) {}
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" />;


  // Prepare pie data
  const pieData = analytics?.moodDistribution?.map(d => ({
    name: MOOD_LABELS[d.mood_type] || d.mood_type,
    value: parseInt(d.count, 10),
    color: MOOD_COLORS[d.mood_type] || '#888',
  })) || [];

  const normalizeDateValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && value.length === 10 && !value.includes('T')) {
      return value;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (d) => {
    const normalized = normalizeDateValue(d);
    if (!normalized) return '';
    const parts = normalized.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const todayKey = new Date().toLocaleDateString('en-CA');
  const moodTrend  = (analytics?.moodTrend  || []).map(r => ({ ...r, date: formatDate(r.date), happy: +r.happy, neutral: +r.neutral, sad: +r.sad }));
  const postsChart = (analytics?.postsPerDay || []).map(r => ({ date: formatDate(r.date), Postingan: +r.count }));
  const userChart  = (analytics?.userGrowth  || []).map(r => ({ date: formatDate(r.date), Pengguna: +r.count }));
  const todayUsers = analytics?.userGrowth?.find(r => normalizeDateValue(r.date) === todayKey)?.count ?? 0;

  const adminCount = users.filter(u => u.role === 'admin').length;
  const currentUserId = user?.id != null ? Number(user.id) : null;

  const canDeleteUser = (u) => {
    if (currentUserId != null && Number(u.id) === currentUserId) return false;
    if (u.role === 'admin' && adminCount <= 1) return false;
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-rose-500" />
            <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #f43f5e, #fb923c)' }}>Admin Panel</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t-secondary)' }}>Moderasi komunitas & analitik kesehatan mental mahasiswa.</p>
          {fetchError && (
            <p className="text-xs mt-2 text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 max-w-xl">
              {fetchError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-ghost p-2 rounded-xl" title="Refresh Data">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--t-brand)' }} />
          </button>
          {lastUpdated && (
            <span className="text-xs text-slate-300" style={{ color: 'var(--t-muted)' }}>
              Terakhir update: {new Date(lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>


      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
          { id: 'users', label: 'Pengguna', icon: <Users className="w-4 h-4" /> },
          { id: 'posts', label: 'Safe Space', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'doctors', label: 'Telekonsultasi', icon: <Stethoscope className="w-4 h-4" /> },
          { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-brand-500/10 text-brand-500' : 'hover:bg-slate-500/10 text-slate-400'}`}
            style={activeTab === t.id ? { color: 'var(--t-brand)', background: 'var(--bg-subtle)' } : {}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna',   value: stats.users,       icon: <Users className="w-6 h-6 text-emerald-500" />,  bg: 'bg-emerald-500/10' },
          { label: 'Total Postingan',  value: stats.posts,       icon: <MessageSquare className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-500/10' },
          { label: 'Data Mood Masuk',  value: analytics?.moodDistribution?.reduce((a,r) => a + parseInt(r.count, 10), 0) ?? '—', icon: <Activity className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-500/10' },
          { label: 'Daftar Hari Ini',  value: todayUsers, icon: <UserPlus className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-500/10' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--t-secondary)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Pie Chart - Mood Distribution */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-brand-400" style={{ color: 'var(--t-brand)' }} />
            <h2 className="font-bold text-sm">Distribusi Mood (seluruh data)</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : pieData.length === 0 ? (
            <p className="text-center py-10 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada data mood.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: 'var(--t-secondary)' }}>{d.name}</span>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Line Chart - Mood Trend 3 days */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--t-brand)' }} />
            <h2 className="font-bold text-sm">Tren Mood 3 Hari Terakhir</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : moodTrend.length === 0 ? (
            <p className="text-center py-10 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada data mood 3 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip content={<MoodLineTooltip />} />
                <Legend formatter={v => MOOD_LABELS[v] || v} />
                <Line type="monotone" dataKey="happy"   stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sad"     stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Bar Chart - Posts per day */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm">Aktivitas Postingan (3 Hari)</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : postsChart.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada postingan 3 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={postsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip {...chartTooltipProps} formatter={(value, name) => [value, name]} />
                <Bar dataKey="Postingan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - User Growth */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-sm">Pertumbuhan Pengguna (3 Hari)</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : userChart.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada pendaftar 3 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={userChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip {...chartTooltipProps} formatter={(value, name) => [value, name]} />
                <Bar dataKey="Pengguna" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

              </>
      )}

      {activeTab === 'users' && (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Manajemen Pengguna</h2>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
        ) : users.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Belum ada pengguna terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ color: 'var(--t-primary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--t-secondary)' }}>
                  <th className="py-3 px-2 text-sm font-semibold">ID</th>
                  <th className="py-3 px-2 text-sm font-semibold">Username</th>
                  <th className="py-3 px-2 text-sm font-semibold">Role</th>
                  <th className="py-3 px-2 text-sm font-semibold">Tgl Daftar</th>
                  <th className="py-3 px-2 text-sm font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-2 text-sm">{u.id}</td>
                    <td className="py-3 px-2 text-sm font-medium">@{u.username}</td>
                    <td className="py-3 px-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs" style={{ color: 'var(--t-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleMakeAdmin(u.id, u.username)}
                            disabled={promotingUserId === u.id || demotingUserId === u.id}
                            title="Jadikan admin"
                            className="text-emerald-500 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {promotingUserId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShieldPlus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {u.role === 'admin' && adminCount >= 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(u.id, u.username)}
                            disabled={demotingUserId === u.id || promotingUserId === u.id}
                            title="Cabut hak admin (jadikan user biasa)"
                            className="text-amber-500 hover:bg-amber-500/10 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {demotingUserId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShieldMinus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title={
                            !canDeleteUser(u)
                              ? currentUserId != null && Number(u.id) === currentUserId
                                ? 'Tidak bisa menghapus akun sendiri'
                                : 'Harus ada minimal satu admin'
                              : 'Hapus pengguna'
                          }
                          className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                          disabled={!canDeleteUser(u)}
                          style={{
                            opacity: canDeleteUser(u) ? 1 : 0.35,
                            cursor: canDeleteUser(u) ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

            )}

      {activeTab === 'posts' && (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Moderasi Safe Space</h2>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Belum ada postingan di komunitas.</p>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="p-4 rounded-xl border flex justify-between gap-4" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">ID: {post.id}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--t-primary)' }}>@{post.username}</span>
                    <span className="text-xs" style={{ color: 'var(--t-muted)' }}>{new Date(post.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--t-secondary)' }}>{post.content}</p>
                </div>
                <button onClick={() => handleDeletePost(post.id)} className="shrink-0 text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg self-start transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      )}

      {activeTab === 'doctors' && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Manajemen Telekonsultasi</h2>
            <button onClick={handleAddDoctor} className="btn-primary px-3 py-1.5 rounded-lg text-sm flex gap-2 items-center">
              <Plus className="w-4 h-4"/> Tambah
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : doctorsList.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--t-muted)' }}>Belum ada data dokter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ color: 'var(--t-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--t-secondary)' }}>
                    <th className="py-3 px-2 text-sm font-semibold">Nama</th>
                    <th className="py-3 px-2 text-sm font-semibold">Spesialisasi</th>
                    <th className="py-3 px-2 text-sm font-semibold">Status</th>
                    <th className="py-3 px-2 text-sm font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorsList.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-2 text-sm font-medium">{doc.name}</td>
                      <td className="py-3 px-2 text-sm">{doc.spec}</td>
                      <td className="py-3 px-2 text-sm">
                        <button onClick={() => handleToggleDoctor(doc)} className={`px-2 py-1 rounded text-xs font-bold ${doc.available ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                          {doc.available ? 'TERSEDIA' : 'TIDAK TERSEDIA'}
                        </button>
                      </td>
                      <td className="py-3 px-2 flex justify-center gap-2">
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">Pengaturan Dashboard</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--t-secondary)' }}>Pesan Sapaan Dashboard</label>
                <textarea 
                  className="input-field w-full p-3 text-sm rounded-xl min-h-[80px]"
                  value={settings.dashboard_greeting || ''}
                  onChange={(e) => setSettings({...settings, dashboard_greeting: e.target.value})}
                />
              </div>
              <button onClick={() => handleUpdateSetting('dashboard_greeting', settings.dashboard_greeting)} disabled={isUpdatingSetting} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
                Simpan Pesan Dashboard
              </button>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">Pengaturan AI Chat</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--t-secondary)' }}>System Prompt AI</label>
                <textarea 
                  className="input-field w-full p-3 text-sm rounded-xl min-h-[120px]"
                  value={settings.ai_prompt || ''}
                  onChange={(e) => setSettings({...settings, ai_prompt: e.target.value})}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--t-muted)' }}>Instruksi dasar yang memberitahu AI bagaimana harus bersikap.</p>
              </div>
              <button onClick={() => handleUpdateSetting('ai_prompt', settings.ai_prompt)} disabled={isUpdatingSetting} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
                Simpan AI Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
