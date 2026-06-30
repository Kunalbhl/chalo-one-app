import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, TrendingUp, HelpCircle, ArrowRight, MapPin, Calendar, Compass, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAssistantProps {
  preferenceMode: string;
  foodPrefs: string[];
  martPrefs: string[];
  ridePrefs: string[];
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  setActiveTab?: (tab: string) => void;
  onCloseFloatingChat?: () => void;
}

export default function AIAssistant({
  preferenceMode,
  foodPrefs,
  martPrefs,
  ridePrefs,
  initialQuery,
  onClearInitialQuery,
  setActiveTab,
  onCloseFloatingChat
}: AIAssistantProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: "👋 Namaste! I am **Chalo One AI Assistant**. I can compare rates, ETAs, and cancel/surge policies in real time across Swiggy, Zomato, Blinkit, Zepto, Uber, Ola, Agoda and Booking.com.\n\nAsk me anything! For example:\n- *\"Cheapest way to travel Jaipur to Delhi?\"*\n- *\"Best Chicken Biryani deals under ₹300?\"*\n- *\"Cheapest milk nearby?\"*\n- *\"3-star hotel under ₹2500?\"*\n- *\"How can I save money?\"*"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart Travel Planner States
  const [showTravelPlanner, setShowTravelPlanner] = useState(false);
  const [plannerFrom, setPlannerFrom] = useState('Delhi');
  const [plannerTo, setPlannerTo] = useState('Jaipur');
  const [plannerDate, setPlannerDate] = useState('2026-07-05');
  const [plannerStays, setPlannerStays] = useState('3-Star Boutique');
  const [plannerBudget, setPlannerBudget] = useState('₹3,000/day');

  const presets = [
    "Cheapest Jaipur to Delhi taxi?",
    "Biryani deals under ₹300",
    "Cheapest milk online",
    "Goa hotels comparison"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           messages: [...messages, userMsg],
           userPreferences: {
             preferenceMode,
             food: foodPrefs,
             mart: martPrefs,
             rides: ridePrefs
           }
         })
      });

      if (!response.ok) {
        throw new Error("API return error state.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Sorry! There was a network glitch. Let me answer with my local fallback intelligence:\n\nFor most food or stay bookings: try prioritizing **"Cheapest First"** inside settings to comparison shop. Behrouz Biryani has direct discount codes on Behrouz/Zomato coupon blocks right now!`
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  const handlePlannerSubmit = () => {
    const plannerPrompt = `I am using the Smart Travel Planner. Create a fully comparative, price-conscious split itinerary from ${plannerFrom} to ${plannerTo} on ${plannerDate}. I prefer ${plannerStays} stays with a target budget of ${plannerBudget} per day. Recommend exact rides, food, and stays options comparing Uber vs Ola and Booking.com vs Agoda.`;
    setShowTravelPlanner(false);
    handleSendMessage(plannerPrompt);
  };

  const getDetectedCategoryAction = (text: string) => {
    const lower = text.toLowerCase();
    const actions = [];
    if (lower.includes('ride') || lower.includes('cab') || lower.includes('uber') || lower.includes('ola') || lower.includes('rapido') || lower.includes('taxi')) {
      actions.push({ tab: 'rides', label: '🚖 Compare Rides', desc: 'Uber, Ola, Rapido' });
    }
    if (lower.includes('intercity') || lower.includes('travel') || lower.includes('jaipur') || lower.includes('delhi') || lower.includes('mumbai') || lower.includes('km')) {
      actions.push({ tab: 'intercity', label: '🚌 Compare Intercity', desc: 'Outstation' });
    }
    if (lower.includes('food') || lower.includes('restaurant') || lower.includes('biryani') || lower.includes('zomato') || lower.includes('swiggy') || lower.includes('eatsure') || lower.includes('burger') || lower.includes('pizza')) {
      actions.push({ tab: 'food', label: '🍔 Compare Food Deals', desc: 'Zomato vs Swiggy' });
    }
    if (lower.includes('milk') || lower.includes('grocery') || lower.includes('mart') || lower.includes('blinkit') || lower.includes('zepto') || lower.includes('instamart') || lower.includes('vegetable')) {
      actions.push({ tab: 'mart', label: '🛒 Fast Grocery Mart', desc: 'Blinkit, Zepto, Instamart' });
    }
    if (lower.includes('hotel') || lower.includes('stay') || lower.includes('goa') || lower.includes('booking') || lower.includes('agoda') || lower.includes('makemytrip')) {
      actions.push({ tab: 'stays', label: '🏨 Compare Hotels', desc: 'Booking.com, Agoda' });
    }
    return actions;
  };

  return (
    <div id="ai_assistant_container" className="p-4 max-w-xl mx-auto flex flex-col h-[520px] font-sans text-gray-800 bg-white rounded-3xl border border-gray-150 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg text-amber-950">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <h2 className="text-sm font-semibold text-gray-900 font-display">Chalo One AI Assistant</h2>
              <span className="text-[9px] bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.2 rounded uppercase">Live</span>
            </div>
            <p className="text-[11px] text-gray-500">Cross-app comparison intelligence engine powered by Chalo One</p>
          </div>
        </div>

        {/* Smart Travel Planner Button */}
        <button
          type="button"
          onClick={() => {
            handleSendMessage("I want to plan a custom trip using the Chalo Smart Travel Planner 🚀");
          }}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:from-indigo-600 hover:to-indigo-700 transition cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Smart Travel Planner</span>
        </button>
      </div>

      {/* Chat scroll content container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-none py-1">
        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant';
          const detectedCategoryActions = isAI ? getDetectedCategoryAction(msg.content) : [];

          return (
            <div key={i} className={`flex items-start ${isAI ? 'justify-start' : 'justify-end'} gap-2`}>
              {isAI && (
                <div className="p-1.5 bg-amber-150 text-amber-900 rounded-lg mt-1 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="space-y-1.5 max-w-[85%]">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isAI 
                      ? 'bg-gray-100 text-gray-800 rounded-tl-none font-medium' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-tr-none font-bold'
                  }`}
                >
                  {/* Simplified custom markdown reader */}
                  <div className="whitespace-pre-line space-y-1">
                    {msg.content.split('\n').map((line: string, lineIdx: number) => {
                      // Check bold markers: **Text**
                      let formatted = line;
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      let match;
                      const parts = [];
                      let lastIndex = 0;

                      while ((match = boldRegex.exec(line)) !== null) {
                        parts.push(line.substring(lastIndex, match.index));
                        parts.push(<strong key={match.index} className="font-extrabold text-gray-900 dark:text-amber-800">{match[1]}</strong>);
                        lastIndex = boldRegex.lastIndex;
                      }
                      parts.push(line.substring(lastIndex));

                      return (
                        <p key={lineIdx} className="leading-snug">
                          {parts.length > 1 ? parts : line}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic CLICKABLE REDIRECT OPTIONS if category keyword detected */}
                {isAI && detectedCategoryActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {detectedCategoryActions.map((act) => (
                      <button
                        key={act.tab}
                        type="button"
                        onClick={() => {
                          if (setActiveTab) {
                            setActiveTab(act.tab);
                          }
                          if (onCloseFloatingChat) {
                            onCloseFloatingChat();
                          }
                        }}
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>{act.label}</span>
                        <ChevronRight className="w-3 h-3 text-amber-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isAI && (
                <div className="p-1.5 bg-gray-200 text-gray-700 rounded-lg mt-1 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-gray-100 rounded-2xl rounded-tl-none text-xs text-gray-500 font-mono flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]">s</span>
              <span>Scoping deals on Zomato, Swiggy, Uber Cab tariffs...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Instant Presets pills */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(preset)}
              className="text-[10.5px] font-bold text-gray-750 bg-gray-50 hover:bg-amber-50/50 hover:text-amber-800 p-2.5 rounded-xl border border-gray-150 transition-colors text-left flex items-center justify-between cursor-pointer"
            >
              <span>{preset}</span>
              <ArrowRight className="w-3 h-3 text-amber-500 shrink-0 ml-1" />
            </button>
          ))}
        </div>
      )}

      {/* Input Submit box */}
      <div className="mt-3 shrink-0">
        <div className="flex items-center space-x-2 bg-white border border-gray-155 p-2 rounded-xl focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputVal)}
            placeholder="Type your budget/ride comparison query here..."
            id="ai_chat_input"
            className="w-full text-xs outline-none bg-transparent font-medium py-1 placeholder-gray-400 pl-1"
          />
          <button
            type="button"
            id="send_ai_query_btn"
            onClick={() => handleSendMessage(inputVal)}
            className="p-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white transition flex items-center justify-center cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
