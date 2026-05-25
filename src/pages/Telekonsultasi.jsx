import { useState, useEffect } from 'react';
import { Clock, Star, Video, Search, BadgeCheck, Filter, User } from 'lucide-react';

export default function Telekonsultasi() {
  const [searchTerm, setSearchTerm] = useState('');

  const [doctors, setDoctors] = useState([]);
  useEffect(() => {
    fetch('http://localhost:5000/api/public/doctors')
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(e => console.error(e));
  }, []);

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.spec.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Stars = ({ r }) => Array.from({length:5},(_,i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i<Math.round(r)?'text-amber-400 fill-amber-400':'text-slate-500'}`}/>
  ));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Telekonsultasi</h1>
          <p className="text-sm mt-1" style={{ color:'var(--t-secondary)' }}>Temukan ahli yang tepat — konsultasi dari mana saja.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--t-muted)' }}/>
            <input type="text" placeholder="Cari psikiater / psikolog..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2.5 text-sm"/>
          </div>
          <button className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl shrink-0">
            <Filter className="w-4 h-4"/>Filter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label:'Dokter Tersedia', value:`${doctors.filter(d=>d.available).length} dari ${doctors.length}`, color:'text-emerald-400' },
          { label:'Rata-rata Rating', value:'4.9 ★',  color:'text-amber-400'  },
          { label:'Konsultasi Selesai', value:'2,400+', color:'text-brand-400' },
        ].map((s,i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--t-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((doc,idx) => (
          <div key={doc.id} className="glass-card overflow-hidden flex flex-col animate-slide-up"
               style={{ animationDelay:`${idx*0.08}s` }}>
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                       style={{ background: 'var(--bg-subtle)', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', border:'2px solid var(--border)' }}>
                    <User className="w-8 h-8" style={{ color: 'var(--t-muted)' }} />
                  </div>
                  {doc.available && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2"
                         style={{ borderColor:'var(--bg-base)' }}/>
                  )}
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  doc.available
                    ? 'text-emerald-400'
                    : ''
                }`} style={doc.available
                  ? { background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)' }
                  : { background:'var(--bg-subtle)', border:'1px solid var(--border)', color:'var(--t-muted)' }}>
                  <div className={`w-1.5 h-1.5 rounded-full ${doc.available?'bg-emerald-400':'bg-slate-500'}`}/>
                  {doc.available ? 'Tersedia' : 'Penuh'}
                </div>
              </div>
              <div className="mb-3">
                <h3 className="font-bold leading-snug flex items-center gap-1.5" style={{ color:'var(--t-primary)' }}>
                  {doc.name}<BadgeCheck className="w-4 h-4 text-brand-400 shrink-0"/>
                </h3>
                <p className="font-medium text-xs mt-0.5" style={{ color:'var(--t-brand)' }}>{doc.spec}</p>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5"><Stars r={doc.rating}/></div>
                <span className="text-xs font-semibold text-amber-400">{doc.rating}</span>
                <span className="text-xs" style={{ color:'var(--t-muted)' }}>({doc.reviews} ulasan)</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color:'var(--t-muted)' }}>
                <Clock className="w-3.5 h-3.5"/>Pengalaman {doc.exp}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background:'rgba(22,160,160,0.1)', color:'var(--t-brand)', border:'1px solid rgba(22,160,160,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4" style={{ borderTop:'1px solid var(--border)' }}>
              <button disabled={!doc.available}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${doc.available?'btn-primary':''}`}
                style={!doc.available ? { background:'var(--bg-subtle)', color:'var(--t-muted)', border:'1px solid var(--border)', cursor:'not-allowed' } : {}}>
                <Video className="w-4 h-4"/>
                {doc.available ? 'Buat Janji Temu' : 'Jadwal Penuh'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
