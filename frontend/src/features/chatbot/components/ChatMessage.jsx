import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatMessage = ({ role, content }) => {
  const isBot = role === 'bot';

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'} items-end gap-2`}>
        {/* Avatar */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${isBot ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>
        
        {/* Message Bubble */}
        <div className={`px-4 py-3 rounded-2xl ${
          isBot ? 'bg-muted/50 rounded-bl-sm text-foreground' : 'bg-primary text-primary-foreground rounded-br-sm'
        }`}>
          {isBot ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};
