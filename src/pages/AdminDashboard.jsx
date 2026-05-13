import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Users, MessageSquare, Trash2, Loader2, RefreshCw,
  TrendingUp, BarChart2, Activity, UserPlus
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MOOD_COLORS = { happy: '#10b981', neutral: '#f59e0b', sad: '#f43f5e' };
const PIE_COLORS  = ['#10b981', '#f59e0b', '#f43f5e'];
const MOOD_LABELS = { happy: 'Senang', neutral: 'Biasa', sad: 'Sedih/Lelah' };

const CustomTooltip = ({ active, payload, label }) => {
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

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats]       = useState({ users: 0, posts: 0 });
  const [posts, setPosts]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (user && user.role === 'admin') fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, postsRes, usersRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/posts`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/analytics`, { headers }),
      ]);
      if (statsRes.ok)     setStats(await statsRes.json());
      if (postsRes.ok)     setPosts(await postsRes.json());
      if (usersRes.ok)     setUsers(await usersRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
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

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  // Prepare pie data
  const pieData = analytics?.moodDistribution?.map(d => ({
    name: MOOD_LABELS[d.mood_type] || d.mood_type,
    value: parseInt(d.count),
    color: MOOD_COLORS[d.mood_type] || '#888',
  })) || [];

  // Format dates short
  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const moodTrend  = (analytics?.moodTrend  || []).map(r => ({ ...r, date: formatDate(r.date), happy: +r.happy, neutral: +r.neutral, sad: +r.sad }));
  const postsChart = (analytics?.postsPerDay || []).map(r => ({ date: formatDate(r.date), Postingan: +r.count }));
  const userChart  = (analytics?.userGrowth  || []).map(r => ({ date: formatDate(r.date), Pengguna: +r.count }));

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
        </div>
        <button onClick={fetchData} className="btn-ghost p-2 rounded-xl" title="Refresh Data">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--t-brand)' }} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna',   value: stats.users,       icon: <Users className="w-6 h-6 text-emerald-500" />,  bg: 'bg-emerald-500/10' },
          { label: 'Total Postingan',  value: stats.posts,       icon: <MessageSquare className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-500/10' },
          { label: 'Data Mood Masuk',  value: analytics?.moodDistribution?.reduce((a,r) => a + parseInt(r.count), 0) ?? '—', icon: <Activity className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-500/10' },
          { label: 'Daftar Hari Ini',  value: analytics?.userGrowth?.find(r => r.date === formatDate(new Date().toISOString().slice(0,10)))?.Pengguna ?? 0, icon: <UserPlus className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-500/10' },
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
            <h2 className="font-bold text-sm">Distribusi Mood Keseluruhan</h2>
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

        {/* Line Chart - Mood Trend 7 days */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--t-brand)' }} />
            <h2 className="font-bold text-sm">Tren Mood 7 Hari Terakhir</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : moodTrend.length === 0 ? (
            <p className="text-center py-10 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada data mood 7 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
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
            <h2 className="font-bold text-sm">Aktivitas Postingan (7 Hari)</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : postsChart.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada postingan 7 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={postsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Postingan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - User Growth */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-sm">Pertumbuhan Pengguna (7 Hari)</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-rose-400" /></div>
          ) : userChart.length === 0 ? (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--t-muted)' }}>Belum ada pendaftar 7 hari terakhir.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={userChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--t-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Pengguna" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* User Management Table */}
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
                    <td className="py-3 px-2 text-center">
                      <button onClick={() => handleDeleteUser(u.id, u.username)}
                        className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                        disabled={u.role === 'admin'}
                        style={{ opacity: u.role === 'admin' ? 0.3 : 1, cursor: u.role === 'admin' ? 'not-allowed' : 'pointer' }}>
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

      {/* Post Moderation */}
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
    </div>
  );
}
