import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Saya merasa stres akhir-akhir ini',
  'Bantu saya latihan pernapasan',
  'Saya sulit tidur nyenyak',
];

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Halo! Saya AI MindEase. Ada yang ingin kamu ceritakan hari ini? Jangan ragu untuk berbagi.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // State untuk menyimpan 21 fitur secara diam-diam
  const [currentState, setCurrentState] = useState({
    age: null, gender: null, academic_year: null, study_hours_per_day: null,
    exam_pressure: null, academic_performance: null, stress_level: null,
    anxiety_score: null, depression_score: null, sleep_hours: null,
    physical_activity: null, social_support: null, screen_time: null,
    internet_usage: null, financial_stress: null, family_expectation: null,
    sleep_category: null, screen_time_category: null, stress_category: null,
    mental_risk_score: null, support_category: null
  });

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, override = null) => {
    if (e) e.preventDefault();
    const text = override ?? input;
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, currentState })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now()+1, sender: 'ai',
        text: data.reply || "Maaf, saya gagal memproses pesanmu.",
        isCrisis: data.is_crisis,
        hotlines: data.hotlines || []
      }]);

      if (data.extractedFeatures && Object.keys(data.extractedFeatures).length > 0) {
        setCurrentState(prev => {
          const newState = { ...prev, ...data.extractedFeatures };
          console.log("Extracted Features Update:", newState);
          
          // Cek apakah ke-21 fitur sudah terisi (tidak ada null)
          const missing = Object.keys(newState).filter(k => newState[k] === null);
          
          if (missing.length === 0) {
            console.log("Semua data terkumpul! Meminta prediksi dari Keras...");
            forcePredict(newState);
          }
          
          return newState;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now()+1, sender: 'ai',
        text: "Terjadi kesalahan saat menghubungi server AI."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const forcePredict = (stateToPredict = currentState) => {
    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'user', text: "Saya ingin melihat hasil analisisnya sekarang."
    }]);

    fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: stateToPredict })
    })
    .then(r => r.json())
    .then(prediction => {
      // Simpan sebagai tipe 'result' khusus, bukan teks biasa
      setMessages(msgs => [...msgs, {
        id: Date.now() + 2,
        sender: 'ai',
        type: 'result',
        riskLevel: prediction.risk_level,
        burnoutScore: prediction.burnout_score,
        recommendation: prediction.genai_recommendation
      }]);
    })
    .catch(err => {
      console.error("Gagal prediksi:", err);
      setMessages(msgs => [...msgs, {
        id: Date.now() + 2, sender: 'ai',
        text: "Maaf, server AI Prediksi (FastAPI) sedang tidak aktif atau terjadi kesalahan."
      }]);
    })
    .finally(() => setIsLoading(false));
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col animate-fade-in pb-4">

      {/* Header */}
      <div className="glass-card p-4 flex items-center gap-3"
           style={{ borderBottomLeftRadius:0, borderBottomRightRadius:0, borderBottom:'none' }}>
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-sm opacity-70"
               style={{ background:'linear-gradient(135deg,#16a0a0,#0e6363)' }} />
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center"
               style={{ background:'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow:'0 4px 16px rgba(22,160,160,0.4)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2"
               style={{ borderColor:'var(--bg-base)' }} />
        </div>
        <div>
          <h2 className="font-bold text-sm" style={{ color:'var(--t-primary)' }}>MindEase AI Companion</h2>
          <p className="text-xs text-emerald-500 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online — Selalu ada untukmu
          </p>
        </div>
        <div className="ml-auto"><Sparkles className="w-5 h-5 text-brand-400 opacity-60" /></div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4"
           style={{ background:'var(--bg-subtle)' }}>
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 justify-center pt-2 animate-slide-up">
            {SUGGESTIONS.map((s,i) => (
              <button key={i} onClick={() => handleSend(null, s)}
                className="px-4 py-2 text-xs rounded-full font-medium transition-all duration-200"
                style={{ background:'rgba(22,160,160,0.12)', border:'1px solid rgba(22,160,160,0.25)', color:'var(--t-brand)' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender==='user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {/* Kartu Hasil Analisis Khusus */}
            {msg.type === 'result' ? (
              <div className="w-full max-w-[92%] rounded-2xl overflow-hidden animate-slide-up"
                   style={{ border:'1px solid rgba(22,160,160,0.3)', boxShadow:'0 8px 32px rgba(22,160,160,0.15)' }}>
                {/* Header Kartu */}
                <div className="p-4" style={{ background:'linear-gradient(135deg,#16a0a0,#0e6363)' }}>
                  <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Hasil Analisis MindEase AI</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-white text-xs opacity-70">Tingkat Risiko</p>
                      <p className="text-white text-2xl font-bold">{msg.riskLevel}</p>
                    </div>
                    <div className="w-px h-10 bg-white opacity-30" />
                    <div>
                      <p className="text-white text-xs opacity-70">Skor Burnout</p>
                      <p className="text-white text-2xl font-bold">{msg.burnoutScore}<span className="text-sm opacity-70">/10</span></p>
                    </div>
                    <div className="ml-auto text-4xl">
                      {msg.riskLevel === 'High' ? '🔴' : msg.riskLevel === 'Medium' ? '🟡' : '🟢'}
                    </div>
                  </div>
                </div>
                {/* Pesan Rekomendasi */}
                <div className="p-4" style={{ background:'var(--bg-surface)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color:'var(--t-brand)' }}>💙 Pesan untukmu</p>
                  <p className="text-sm leading-relaxed" style={{ color:'var(--t-primary)' }}>{msg.recommendation}</p>
                </div>
              </div>
            ) : (
            <div className={`flex gap-3 max-w-[90%] sm:max-w-[82%] ${msg.sender==='user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 self-end"
                   style={msg.sender==='ai'
                     ? { background:'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow:'0 2px 10px rgba(22,160,160,0.35)' }
                     : { background:'var(--bg-input)', border:'1px solid var(--border)' }}>
                {msg.sender==='user'
                  ? <User className="w-4 h-4" style={{ color:'var(--t-secondary)' }} />
                  : <Bot className="w-4 h-4 text-white" />}
              </div>
              
              {/* Pesan Biasa atau Krisis */}
              <div className="flex flex-col gap-2 max-w-full">
                <div className="p-4 rounded-2xl text-sm leading-relaxed"
                     style={msg.sender==='user' ? {
                       background:'linear-gradient(135deg,#16a0a0,#0e6363)',
                       color:'#fff', borderRadius:'1rem 0.25rem 1rem 1rem',
                       boxShadow:'0 4px 20px rgba(22,160,160,0.25)',
                     } : {
                       background: 'var(--bg-surface)',
                       border: '1px solid var(--border)',
                       color: 'var(--t-primary)',
                       borderRadius:'0.25rem 1rem 1rem 1rem',
                       boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
                     }}>
                  {msg.text}
                </div>
                
                {/* Kartu Hotline Darurat (Khusus Krisis) */}
                {msg.isCrisis && msg.hotlines && msg.hotlines.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1 animate-slide-up w-full">
                    {msg.hotlines.map((h, i) => (
                      <a key={i} href={`tel:${h.number}`} 
                         className="flex items-center justify-between p-3 rounded-xl hover:opacity-80 transition-opacity cursor-pointer"
                         style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--t-primary)' }}>{h.name}</p>
                          <p className="text-xs" style={{ color: 'var(--t-secondary)' }}>{h.hours} {h.ext ? `• ${h.ext}` : ''}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-2"
                             style={{ background: 'rgba(22,160,160,0.1)', color: 'var(--t-brand)' }}>
                          📞 {h.display || h.number}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-slide-up">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                   style={{ background:'linear-gradient(135deg,#16a0a0,#0e6363)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 flex items-center gap-1.5"
                   style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'0.25rem 1rem 1rem 1rem' }}>
                <span className="typing-dot w-2 h-2 rounded-full inline-block bg-brand-400" />
                <span className="typing-dot w-2 h-2 rounded-full inline-block bg-brand-400" />
                <span className="typing-dot w-2 h-2 rounded-full inline-block bg-brand-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="glass-card p-4" style={{ borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:'none' }}>
        
        {/* Tombol Force Predict */}
        {messages.length > 2 && (
          <div className="flex justify-end mb-3">
             <button onClick={() => forcePredict(currentState)} disabled={isLoading}
                className="text-xs px-4 py-1.5 rounded-full font-medium transition-colors"
                style={{ background: 'var(--bg-brand)', color: '#fff', boxShadow: '0 2px 8px rgba(22,160,160,0.3)' }}>
                🪄 Selesaikan & Analisis Sekarang
             </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-3 items-center">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ketik pesanmu di sini..." className="input-field flex-1 py-3 text-sm" disabled={isLoading} />
          <button type="submit" disabled={isLoading || !input.trim()}
            className="btn-primary w-11 h-11 rounded-xl flex items-center justify-center p-0 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
