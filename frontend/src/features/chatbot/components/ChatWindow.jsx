import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, Loader2, BotMessageSquare, AlertTriangle } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../../../contexts/AuthContext';

export const ChatWindow = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const isInitialized = useRef(false);
  
  const chatMutation = useChat();

  useEffect(() => {
    if (user && !isInitialized.current) {
      const welcome = `Halo ${user.name}! Saya UntirtaBot. Ada yang bisa saya bantu terkait ${
        user.role === 'DOSEN' 
          ? 'jadwal mengajar, materi kuliah, atau penilaian mahasiswa?' 
          : user.role === 'ADMIN'
          ? 'statistik sistem atau manajemen data LMS?'
          : 'jadwal, materi, atau informasi akademik lainnya?'
      }`;
      
      // Defer state update to avoid synchronous cascading render warning
      const timer = setTimeout(() => {
        setMessages([{ role: 'bot', content: welcome }]);
        isInitialized.current = true;
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickActions = useMemo(() => {
    if (!user) return [];
    
    switch (user.role) {
      case 'DOSEN':
        return [
          { label: '📅 Jadwal Mengajar', text: 'Tampilkan jadwal mengajar saya' },
          { label: '👥 Daftar Mahasiswa', text: 'Tampilkan daftar mahasiswa di kelas saya' },
          { label: '📝 Koreksi Tugas', text: 'Tugas mahasiswa yang perlu dinilai' },
          { label: '👥 Bimbingan', text: 'Daftar mahasiswa bimbingan saya' },
          { label: '📚 Materi', text: 'Daftar materi yang saya upload' },
        ];
      case 'ADMIN':
        return [
          { label: '📊 Statistik', text: 'Tampilkan statistik penggunaan LMS' },
          { label: '⚙️ Status Sistem', text: 'Bagaimana status sistem saat ini?' },
          { label: '👥 User Baru', text: 'Tampilkan pendaftaran user baru' },
        ];
      default: // MAHASISWA
        return [
          { label: '📊 Nilai Saya', text: 'Tampilkan nilai akademik saya' },
          { label: '📅 Jadwal', text: 'Tampilkan jadwal kuliah saya' },
          { label: '📝 Tugas', text: 'Tugas yang belum dikumpul' },
          { label: '👨‍🏫 Dospem', text: 'Siapa dospem saya?' },
          { label: '📚 Materi', text: 'Daftar materi kuliah' },
        ];
    }
  }, [user]);

  const sendMessage = (text) => {
    if (!text.trim() || chatMutation.isPending) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    chatMutation.mutate(text, {
      onSuccess: (res) => {
        setMessages(prev => [...prev, { role: 'bot', content: res.data.reply }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'bot', content: 'Maaf, saya sedang mengalami gangguan sistem. Silakan coba lagi.' }]);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 w-80 md:w-96 h-[500px] bg-background border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <BotMessageSquare size={20} />
          <h3 className="font-semibold">UntirtaBot</h3>
        </div>
        <button onClick={onClose} className="hover:bg-primary-foreground/10 p-1 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-2 text-[10px] text-yellow-600 font-medium text-center flex items-center justify-center gap-2">
        <AlertTriangle size={12} className="shrink-0" />
        <span>Sistem menggunakan API Gratis. Gangguan mungkin terjadi jika kuota harian habis.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}
        {chatMutation.isPending && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
            <Loader2 size={16} className="animate-spin" />
            <span>UntirtaBot sedang mengetik...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-background scrollbar-hide shrink-0 border-t border-border">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(action.text)}
            disabled={chatMutation.isPending}
            className="whitespace-nowrap px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full text-[11px] transition-colors border border-border disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-background border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pertanyaan Anda..."
            className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
            disabled={chatMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
          >
            <Send size={18} className={chatMutation.isPending ? "opacity-0" : ""} />
            {chatMutation.isPending && <Loader2 size={18} className="animate-spin absolute" />}
          </button>
        </form>
      </div>
    </div>
  );
};
