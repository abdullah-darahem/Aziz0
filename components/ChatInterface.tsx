import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { sendMessageToGeminiStream, resetSession, startChatSession } from '../services/geminiService';
import { WELCOME_MESSAGE } from '../constants';
import { Content } from '@google/genai';

const STORAGE_KEY = 'fci-chat-history';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize / Load History
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    
    if (savedHistory) {
      try {
        // Parse JSON and revive Date objects
        const parsedMessages: Message[] = JSON.parse(savedHistory, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        });
        
        setMessages(parsedMessages);

        // Convert UI messages to Gemini Content format for the SDK
        // We filter out any messages that might be in a streaming state or broken
        const geminiHistory: Content[] = parsedMessages
          .filter(m => !m.isStreaming && m.text.trim() !== '')
          .map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }));

        startChatSession(geminiHistory);
      } catch (e) {
        console.error("Failed to load chat history", e);
        initializeNewChat();
      }
    } else {
      initializeNewChat();
    }
  }, []);

  // Save History whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const initializeNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: WELCOME_MESSAGE,
        timestamp: new Date(),
      },
    ]);
    startChatSession([]);
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReset = () => {
    if (window.confirm('هل تريد بدء محادثة جديدة؟ (هيتم مسح التاريخ القديم)')) {
        localStorage.removeItem(STORAGE_KEY);
        resetSession();
        setMessages([]); // Clear first to avoid stale save
        setTimeout(() => initializeNewChat(), 0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    // Add User Message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsTyping(true);

    // Placeholder for Model Message
    const newModelMessageId = (Date.now() + 1).toString();
    const newModelMessage: Message = {
      id: newModelMessageId,
      role: 'model',
      text: '', // Start empty
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newModelMessage]);

    let fullText = '';

    await sendMessageToGeminiStream(userText, (chunk) => {
      fullText += chunk;
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === newModelMessageId 
            ? { ...msg, text: fullText } 
            : msg
        )
      );
    });

    setMessages((prev) => 
        prev.map((msg) => 
          msg.id === newModelMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
    );
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fci-400 to-fci-600 flex items-center justify-center shadow-md">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">FCI Assistant</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Online & Ready
            </p>
          </div>
        </div>
        <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-fci-600 transition-colors rounded-full hover:bg-slate-100"
            title="Start New Chat"
        >
            <RotateCcw size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && messages[messages.length - 1].text === '' && (
             <div className="flex justify-start mb-6 animate-pulse">
                 <div className="flex flex-row gap-3">
                    <div className="w-8 h-8 rounded-full bg-fci-600 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-slate-100 p-2 rounded-3xl border border-slate-200 focus-within:border-fci-400 focus-within:ring-2 focus-within:ring-fci-100 transition-all">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="اسألني في أي حاجة يا هندسة..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-3 px-4 text-slate-800 placeholder:text-slate-400"
            rows={1}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-full mb-1 transition-all duration-200 
              ${!inputValue.trim() || isTyping 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-fci-600 hover:bg-fci-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}`}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-slate-400">
            Made with ❤️ for FCI Students
        </div>
      </div>
    </div>
  );
};