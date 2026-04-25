import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    if (!inline && match) {
                      return (
                        <div className="rounded-lg overflow-hidden my-3 border border-slate-700/50 shadow-sm bg-[#282c34]">
                          <div className="bg-[#21252b] px-3 py-1.5 flex items-center justify-between border-b border-white/5">
                            <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest leading-none">
                              {language}
                            </span>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={language}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              fontSize: '0.8rem',
                              lineHeight: '1.5',
                              background: 'transparent',
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code 
                        className={`${className} px-1 rounded bg-slate-200 text-pink-600 font-mono text-[0.9em]`} 
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                }}
              >
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
