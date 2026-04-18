import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, BotMessageSquare } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useChat } from '../hooks/useChat';

export const ChatWindow = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Halo! Saya UntirtaBot. Ada yang bisa saya bantu terkait jadwal, materi, atau informasi akademik lainnya?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const chatMutation = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    chatMutation.mutate(userMessage, {
      onSuccess: (res) => {
        setMessages(prev => [...prev, { role: 'bot', content: res.data.reply }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'bot', content: 'Maaf, saya sedang mengalami gangguan sistem. Silakan coba lagi.' }]);
      }
    });
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
