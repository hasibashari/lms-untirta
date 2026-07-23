import { useState, lazy, Suspense } from 'react';
import { MessageCircle } from 'lucide-react';

const ChatWindow = lazy(() =>
  import('./ChatWindow').then((module) => ({ default: module.ChatWindow }))
);

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all z-50 focus:outline-none focus:ring-4 focus:ring-primary/20 animate-in fade-in duration-200"
          aria-label="Buka Chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <Suspense fallback={null}>
          <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
};
