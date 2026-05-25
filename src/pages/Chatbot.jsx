import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Saya merasa stres akhir-akhir ini',
  'Bantu saya latihan pernapasan',
  'Saya sulit tidur nyenyak',
];

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Halo Dila! Saya AI MindEase. Ada yang ingin kamu ceritakan hari ini? Jangan ragu untuk berbagi.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e, override = null) => {
    if (e) e.preventDefault();
    const text = override ?? input;
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setInput('');
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now()+1, sender: 'ai',
        text: 'Saya mengerti perasaanmu. Memang wajar merasa lelah saat beban menumpuk. Ingatlah untuk mengambil jeda sejenak ya. Apakah kamu ingin saya pandu latihan pernapasan singkat?'
      }]);
      setIsLoading(false);
    }, 1500);
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
            <div className={`flex gap-3 max-w-[90%] sm:max-w-[82%] ${msg.sender==='user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 self-end"
                   style={msg.sender==='ai'
                     ? { background:'linear-gradient(135deg,#16a0a0,#0e6363)', boxShadow:'0 2px 10px rgba(22,160,160,0.35)' }
                     : { background:'var(--bg-input)', border:'1px solid var(--border)' }}>
                {msg.sender==='user'
                  ? <User className="w-4 h-4" style={{ color:'var(--t-secondary)' }} />
                  : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className="p-4 rounded-2xl text-sm leading-relaxed"
                   style={msg.sender==='user' ? {
                     background:'linear-gradient(135deg,#16a0a0,#0e6363)',
                     color:'#fff', borderRadius:'1rem 0.25rem 1rem 1rem',
                     boxShadow:'0 4px 20px rgba(22,160,160,0.25)',
                   } : {
                     background:'var(--bg-surface)',
                     border:'1px solid var(--border)',
                     color:'var(--t-primary)',
                     borderRadius:'0.25rem 1rem 1rem 1rem',
                     boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
                   }}>
                {msg.text}
              </div>
            </div>
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
