import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-fci-600'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>

        {/* Message Content */}
        <div 
          className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert break-words" dir="auto">
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match && !String(children).includes('\n');
                    
                    if (isInline) {
                        return (
                            <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                            </code>
                        )
                    }

                    return (
                        <div className="bg-slate-900 text-slate-200 p-3 rounded-md my-2 overflow-x-auto text-xs font-mono">
                            <code className={className} {...props}>
                                {children}
                            </code>
                        </div>
                    )
                },
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                h3: ({children}) => <h3 className="text-lg font-bold mt-4 mb-2 text-fci-700">{children}</h3>,
                a: ({href, children}) => (
                    <a href={href} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-semibold break-all">
                        {children}
                    </a>
                )
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
          
          {/* Timestamp */}
          <div className={`text-[10px] mt-2 text-right opacity-70`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
