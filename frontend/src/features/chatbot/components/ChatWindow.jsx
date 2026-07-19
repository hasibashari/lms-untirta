import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, Loader2, BotMessageSquare, Info, RotateCcw } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useChat } from '../hooks/useChat';
import { useAuth } from '@/app/providers/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';

export const ChatWindow = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // Load messages from localStorage on initial render
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('untirtabot_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const chatMutation = useChat();

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('untirtabot_messages', JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Hapus riwayat percakapan?')) {
      setMessages([]);
      localStorage.removeItem('untirtabot_messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll to bottom if there are messages.
    // If empty (Hero State), stay at the top.
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isOpen]);

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

    chatMutation.mutate({ 
      message: text,
      history: messages.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        text: m.content
      }))
    }, {
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
      <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-primary-foreground/20 p-1.5 rounded-lg">
            <BotMessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">UntirtaBot</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-primary-foreground/70 font-medium uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={clearHistory}
                  className="hover:bg-primary-foreground/10 p-1.5 rounded-lg transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Bersihkan Riwayat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1.5 text-primary-foreground/70 cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-xs">
                Sistem menggunakan API Gratis. Gangguan mungkin terjadi jika kuota harian habis.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button onClick={onClose} className="hover:bg-primary-foreground/10 p-1.5 rounded-lg transition-colors ml-1">
            <X size={18} />
          </button>
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
        {/* Hero Section for Empty State */}
        {messages.length === 0 && (
          <div className="py-8 px-2 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-primary/10 text-primary mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary/20">
              <BotMessageSquare size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Ada yang bisa saya bantu?</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-[240px] mx-auto">
              Tanyakan apapun seputar akademik, jadwal, atau bantuan sistem.
            </p>

            {/* Quick Action Grid (Empty State) */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(action.text)}
                  disabled={chatMutation.isPending}
                  className="p-4 bg-background hover:bg-muted border border-border rounded-xl text-left transition-all duration-200 group hover:shadow-md hover:border-primary/30 active:scale-95 disabled:opacity-50"
                >
                  <span className="text-xl mb-2 block group-hover:scale-125 transition-transform origin-left">
                    {action.label.split(' ')[0]}
                  </span>
                  <span className="text-xs font-semibold text-foreground block leading-tight">
                    {action.label.split(' ').slice(1).join(' ')}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 block leading-tight opacity-70">
                    Klik untuk bertanya
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}
        {chatMutation.isPending && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-2 animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <span>UntirtaBot sedang mengetik...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (Ongoing Chat - Compact) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-background scrollbar-hide shrink-0 border-t border-border animate-in slide-in-from-bottom-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(action.text)}
              disabled={chatMutation.isPending}
              className="whitespace-nowrap px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground rounded-full text-[11px] transition-all duration-200 border border-border disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}


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
