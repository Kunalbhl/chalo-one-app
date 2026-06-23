import React, { useState, useRef, useEffect } from 'react';
import { AppPreferences } from '../types';
import { Send, Sparkles, MessageSquareCode, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface AIChatbotProps {
  userPreferences: AppPreferences;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isFallback?: boolean;
}

export default function AIChatbot({ userPreferences }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Namaste! I am Chalo, your India Everyday Super AI assistant.\n\nI can compare rates, find direct discounts, analyze ETAs, and help you save money on foods, groceries, hotels, or cab dispatch apps! How can I help you today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Cheapest travel Jaipur to Delhi for 4 pax?",
    "Best Biryani under ₹300 on Zomato vs Swiggy?",
    "Amul Milk price comparison nearby?",
    "Compare Goa stays under ₹2500?"
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userPreferences
        })
      });

      if (!response.ok) {
        throw new Error('Network response failed.');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        isFallback: !!data.isFallback
      }]);

    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ I faced a linking error, but here is a quick tip: Try searching for "Jaipur to Delhi" or "Biryani" directly in Chalo's specialised modules above. They operate instantly without active API keys!`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai_assistant_chatbot" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800 flex flex-col h-[520px] justify-between">
      
      {/* 1. Header with branding and status */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-950 font-display">Chalo Super AI Advisor</h2>
            <p className="text-[10px] text-gray-400 font-medium font-mono">Powered by Gemini Outstation Engines</p>
          </div>
        </div>
        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
          ● Online
        </span>
      </div>

      {/* 2. Messages conversation body */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 py-2 scroll-smooth">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-amber-500 text-white font-semibold rounded-tr-none shadow-sm' 
                    : 'bg-white text-gray-900 rounded-tl-none border border-gray-150 shadow-xs'
                }`}
              >
                {/* Format paragraphs/newlines neatly */}
                <div className="whitespace-pre-wrap font-sans">
                  {m.content}
                </div>

                {m.isFallback && (
                  <span className="text-[8px] bg-slate-100/80 text-gray-400 font-bold rounded px-1 mt-2 inline-block">
                    Heuristic mode
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-gray-150 flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-250"></div>
              </div>
              <span className="text-[10.5px] text-gray-400 font-medium font-mono">Chalo AI Advisor is thinking...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef}></div>
      </div>

      {/* 3. Quick prompts selection & input bar */}
      <div className="shrink-0 space-y-3 pt-2.5 border-t border-gray-100">
        
        {/* Quick Prompts horizontal list */}
        {messages.length <= 2 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">⚡ Popular Questions</span>
            <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  className="bg-gray-100 border border-gray-150 hover:bg-amber-50 hover:border-amber-400 text-gray-700 hover:text-amber-900 rounded-xl px-3 py-2 text-[10.5px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-gray-150 focus-within:border-amber-500 transition-all shadow-xs"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything, e.g. cheapest stay packages in Goa?"
            id="chat_text_input"
            disabled={loading}
            className="flex-1 text-xs outline-none px-3.5 py-2.5 font-medium placeholder-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            id="send_chat_btn"
            disabled={!inputText.trim() || loading}
            className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white rounded-xl cursor-pointer disabled:opacity-40 shrink-0 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
