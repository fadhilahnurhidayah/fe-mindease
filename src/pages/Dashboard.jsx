import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, ArrowRight, Calendar as CalendarIcon, Loader2, Sparkles, Moon, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const T = {
  primary:   { color: 'var(--t-primary)' },
  secondary: { color: 'var(--t-secondary)' },
  muted:     { color: 'var(--t-muted)' },
  brand:     { color: 'var(--t-brand)' },
};

export default function Dashboard() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSleep, setSelectedSleep] = useState(null);
  const [selectedBurden, setSelectedBurden] = useState(null);
  const { token, user } = useAuth();
  const [settings, setSettings] = useState({});
  const API_URL = 'http://localhost:5000/api';

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/public/settings`);
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchSettings(); }, []);

  const fetchMoods = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/moods`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMoodHistory(data);
        const today = new Date().toISOString().split('T')[0];
        const t = data.find(m => m.date === today);
        if (t) setSelectedMood(t.mood_type);
      }
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchMoods(); }, [token]);

  const handleSaveMood = async (id) => {
    setSelectedMood(id);
    if (!token) { alert('Login untuk menyimpan riwayat mood!'); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0], mood_type: id }),
      });
      if (res.ok) fetchMoods();
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const moodsConfig = [
    { id:'happy',   icon:<Smile className="w-10 h-10 md:w-12 md:h-12"/>, label:'Senang',       colorClass:'text-emerald-400', cardClass:'mood-happy',   circleBg:'bg-emerald-500', glow:'rgba(16,185,129,0.35)' },
    { id:'neutral', icon:<Meh   className="w-10 h-10 md:w-12 md:h-12"/>, label:'Biasa',        colorClass:'text-amber-400',   cardClass:'mood-neutral', circleBg:'bg-amber-500',   glow:'rgba(245,158,11,0.35)' },
    { id:'sad',     icon:<Frown className="w-10 h-10 md:w-12 md:h-12"/>, label:'Sedih / Lelah',colorClass:'text-rose-400',    cardClass:'mood-sad',     circleBg:'bg-rose-500',    glow:'rgba(239,68,68,0.35)'  },
  ];

  const renderCalendar = () => {
    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const fd = new Date(y, m, 1).getDay();
    const startOffset = fd === 0 ? 6 : fd - 1;
    const days = [];
    ['S','S','R','K','J','S','M'].forEach((d,i) =>
      days.push(<div key={`h${i}`} className="text-center text-xs font-semibold mb-1" style={T.muted}>{d}</div>)
    );
    for (let i=0; i<startOffset; i++) days.push(<div key={`e${i}`} className="h-8 w-8"/>);
    for (let i=1; i<=daysInMonth; i++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const md = moodHistory.find(x => x.date===ds);
      const isToday = i===today.getDate();
      let bg={}, tc='var(--t-muted)';
      if (md) {
        const conf = moodsConfig.find(x => x.id===md.mood_type);
        if (conf) {
          if (conf.id==='happy')   bg={ background:'rgba(16,185,129,0.7)' };
          if (conf.id==='neutral') bg={ background:'rgba(245,158,11,0.7)' };
          if (conf.id==='sad')     bg={ background:'rgba(239,68,68,0.7)' };
          tc='#fff';
        }
      } else if (isToday) {
        bg={ background:'rgba(22,160,160,0.2)',boxShadow:'0 0 0 2px rgba(22,160,160,0.5)' };
        tc='var(--t-brand)';
      }
      days.push(
        <div key={`d${i}`} className="flex justify-center items-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all font-medium"
               style={{ ...bg, color:tc }}>{i}</div>
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-y-1 mt-3">{days}</div>;
  };

  const h = new Date().getHours();
  const greeting = h<12 ? 'Selamat pagi' : h<17 ? 'Selamat siang' : 'Selamat malam';
  const greetEmoji = h<12 ? '☀️' : h<17 ? '🌤️' : '🌙';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-8">

      {/* Hero */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm font-medium tracking-wider uppercase" style={T.muted}>{greetEmoji} {greeting}</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          {user ? (
            <>Halo, <span className="gradient-text">{user.username}!</span></>
          ) : (
            <>Halo, <span className="gradient-text">Sobat!</span></>
          )}
        </h1>
        <p className="text-base md:text-lg max-w-md mx-auto" style={T.secondary}>
          {user ? (settings.dashboard_greeting || 'Bagaimana perasaanmu hari ini? Yuk ceritakan.') : 'Login untuk menyimpan riwayat mood dan catatanmu.'}
        </p>
      </div>

      {/* Mood Picker */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px"
             style={{ background:'linear-gradient(90deg,transparent,rgba(22,160,160,0.5),transparent)' }} />
        {isLoading && (
          <div className="absolute inset-0 rounded-2xl z-20 flex items-center justify-center"
               style={{ background:'rgba(0,0,0,0.2)', backdropFilter:'blur(4px)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        )}
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <h2 className="font-semibold" style={T.primary}>Pilih Mood Hari Ini</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
          {moodsConfig.map(mood => {
            const sel = selectedMood === mood.id;
            return (
              <button key={mood.id} onClick={() => handleSaveMood(mood.id)}
                className={`${mood.cardClass} flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 group`}
                style={sel ? { boxShadow:`0 0 0 2px ${mood.glow},0 8px 30px ${mood.glow}`, transform:'scale(1.04)' } : {}}>
                <div className={`${mood.colorClass} mb-2 md:mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  {mood.icon}
                </div>
                <span className="font-semibold text-sm leading-tight" style={T.secondary}>{mood.label}</span>
                {sel && (
                  <span className="mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background:'rgba(255,255,255,0.1)', color:'var(--t-brand)' }}>Dipilih ✓</span>
                )}
              </button>
            );
          })}
        </div>
        {selectedMood && (
          <div className="mt-6 pt-5 border-t animate-slide-up" style={{ borderColor:'var(--border)' }}>
            <p className="mb-4 text-sm leading-relaxed" style={T.secondary}>
              {selectedMood==='sad'
                ? '💙 Sepertinya kamu sedang lelah. Tidak apa-apa. Ingin bercerita dengan AI kami atau menjadwalkan konsultasi?'
                : '✨ Terima kasih sudah berbagi perasaanmu! Semoga harimu semakin menyenangkan.'}
            </p>
            {selectedMood==='sad' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/chat" className="btn-primary flex justify-center items-center gap-2 py-3 px-6 text-sm rounded-xl">
                  Curhat ke AI <ArrowRight className="w-4 h-4"/>
                </Link>
                <Link to="/konsultasi" className="btn-ghost flex justify-center items-center gap-2 py-3 px-6 text-sm rounded-xl">
                  Cari Profesional
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(99,102,241,0.15)' }}>
              <Moon className="w-4 h-4 text-indigo-400"/>
            </div>
            <h3 className="font-semibold text-sm" style={T.primary}>Berapa lama kamu tidur?</h3>
          </div>
          <div className="space-y-2">
            {['Kurang dari 5 jam','5–7 jam','Lebih dari 8 jam'].map(opt => (
              <button key={opt} onClick={() => setSelectedSleep(opt)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border font-medium"
                style={selectedSleep===opt
                  ? { background:'rgba(22,160,160,0.18)', borderColor:'rgba(22,160,160,0.4)', color:'var(--t-brand)' }
                  : { background:'var(--bg-subtle)', borderColor:'var(--border)', color:'var(--t-secondary)' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(236,72,153,0.15)' }}>
              <Target className="w-4 h-4 text-pink-400"/>
            </div>
            <h3 className="font-semibold text-sm" style={T.primary}>Fokus utama hari ini?</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Pekerjaan','Tugas Kuliah','Keluarga','Kesehatan','Keuangan','Healing'].map(opt => (
              <button key={opt} onClick={() => setSelectedBurden(opt)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border"
                style={selectedBurden===opt
                  ? { background:'rgba(236,72,153,0.2)', borderColor:'rgba(236,72,153,0.4)', color:'#f472b6' }
                  : { background:'var(--bg-subtle)', borderColor:'var(--border)', color:'var(--t-secondary)' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar + Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold flex items-center gap-2" style={T.primary}>
              <CalendarIcon className="w-4 h-4 text-brand-400"/>Kalender Mood
            </h3>
          </div>
          <p className="text-xs mb-2" style={T.muted}>
            {!token ? 'Login untuk menyimpan riwayat mood'
              : new Date().toLocaleString('id-ID',{month:'long',year:'numeric'})}
          </p>
          <div className="flex-1">{renderCalendar()}</div>
          <div className="mt-4 pt-4 flex justify-center gap-5 text-xs" style={{ borderTop:'1px solid var(--border)', color:'var(--t-muted)' }}>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>Senang</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"/>Biasa</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"/>Sedih</div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={T.primary}>
            <Sparkles className="w-4 h-4 text-amber-400"/>Aktivitas yang Disarankan
          </h3>
          <ul className="space-y-3">
            {[
              { task:'Meditasi 10 menit',    icon:'🧘', bg:'rgba(99,102,241,0.15)'  },
              { task:'Jurnal rasa syukur',   icon:'📓', bg:'rgba(245,158,11,0.15)' },
              { task:'Jalan sore 15 menit',  icon:'🚶', bg:'rgba(16,185,129,0.15)'  },
              { task:'Minum air putih',      icon:'💧', bg:'rgba(59,130,246,0.15)'  },
            ].map((item,i) => (
              <li key={i} className="flex items-center gap-3 p-2 rounded-xl transition-all cursor-default group"
                  style={{ ':hover':{ background:'var(--bg-subtle)' } }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110"
                     style={{ background:item.bg }}>{item.icon}</div>
                <span className="text-sm" style={T.secondary}>{item.task}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
