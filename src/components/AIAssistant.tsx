import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, TrendingUp, HelpCircle, ArrowRight, MapPin, Calendar, Compass, ChevronRight, Minimize2, AlertCircle } from 'lucide-react';
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
  isDedicatedPage?: boolean;
  onMinimize?: () => void;
}

export default function AIAssistant({
  preferenceMode,
  foodPrefs,
  martPrefs,
  ridePrefs,
  initialQuery,
  onClearInitialQuery,
  setActiveTab,
  onCloseFloatingChat,
  isDedicatedPage,
  onMinimize
}: AIAssistantProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: "👋 Namaste! I am **Chalo One AI Assistant**. I can compare rates, ETAs, and cancel/surge policies in real time across Swiggy, Zomato, Blinkit, Zepto, Uber, Ola, Agoda and Booking.com.\n\nAsk me anything! For example:\n- *\"Cheapest way to travel Jaipur to Delhi?\"*\n- *\"Best Chicken Biryani deals under ₹300?\"*\n- *\"Cheapest milk nearby?\"*\n- *\"3-star hotel under ₹2500?\"*\n- *\"How can I save money?\"*"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBillingAlert, setShowBillingAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Interactive Smart Travel Planner Step States
  const [plannerStep, setPlannerStep] = useState(0);
  const [plannerFrom, setPlannerFrom] = useState('');
  const [plannerTo, setPlannerTo] = useState('');
  const [plannerMembers, setPlannerMembers] = useState('');
  const [plannerStyle, setPlannerStyle] = useState('');
  const [plannerDuration, setPlannerDuration] = useState('');
  const [plannerTransit, setPlannerTransit] = useState('');

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
      if (data.isBillingError || data.isFallback) {
        setShowBillingAlert(true);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (e: any) {
      console.error(e);
      setShowBillingAlert(true);
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
      if (initialQuery.includes("Chalo Smart Travel Planner") || initialQuery.includes("Plan a Trip")) {
        setPlannerStep(1);
        if (onClearInitialQuery) {
          onClearInitialQuery();
        }
      } else {
        handleSendMessage(initialQuery);
        if (onClearInitialQuery) {
          onClearInitialQuery();
        }
      }
    }
  }, [initialQuery]);

  const submitPlanner = (finalTransit: string) => {
    const prompt = `Plan a detailed, price-conscious day-wise, member-wise, and route-wise comfort itinerary from ${plannerFrom} to ${plannerTo} for ${plannerMembers}. Trip duration: ${plannerDuration}. Budget & accommodation style: ${plannerStyle}. Preferred transit mode: ${finalTransit}. Explicitly compare cab tariffs on Uber vs Ola and booking options on Booking.com vs Agoda. Include travel distance, toll taxes, senior/kid comfort facilities, and Chalo One bundle savings.`;
    
    setMessages(prev => [
      ...prev,
      { 
        role: 'user', 
        content: `I want to plan an interactive trip from ${plannerFrom} to ${plannerTo} for ${plannerMembers}. Duration: ${plannerDuration}, Style: ${plannerStyle}, Transit: ${finalTransit}.` 
      }
    ]);
    setPlannerStep(0); // Reset interactive step
    handleSendMessage(prompt);
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
    <div id="ai_assistant_container" className={`p-4 max-w-6xl mx-auto w-full flex flex-col font-sans text-gray-800 bg-white rounded-3xl border border-gray-150 shadow-xs ${isDedicatedPage ? 'h-[620px] md:h-full' : 'h-[520px]'}`}>
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

        {/* Minimize Button when in Dedicated page tab */}
        {isDedicatedPage && onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-250 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border border-gray-200"
            title="Minimize to Floating Chat"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Floating Mode</span>
          </button>
        )}
      </div>

      {showBillingAlert && (
        <div id="gemini_billing_alert_banner" className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2.5 shadow-xs shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <h4 className="font-extrabold uppercase tracking-tight text-[10px]">Chalo One Offline Heuristic Mode</h4>
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              The Google AI Studio prepayment credits are depleted for this workspace (Gemini API Error 429).
              To keep your experience completely continuous, Chalo's fast offline local heuristic comparison engine has been enabled!
            </p>
            <button
              type="button"
              onClick={() => setShowBillingAlert(false)}
              className="text-[10px] font-black text-amber-700 hover:text-amber-800 uppercase tracking-wider block mt-1 hover:underline cursor-pointer"
            >
              Dismiss Notice ✕
            </button>
          </div>
        </div>
      )}

      {/* Chat scroll content container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-none py-1">
        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant';
          const detectedCategoryActions = isAI ? getDetectedCategoryAction(msg.content) : [];

          return (
            <React.Fragment key={i}>
              <div className={`flex items-start ${isAI ? 'justify-start' : 'justify-end'} gap-2`}>
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
                          parts.push(<strong key={match.index} className="font-extrabold text-gray-900 dark:text-amber-850">{match[1]}</strong>);
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

              {/* Clickable Smart Travel Planner Banner directly below first assistant greeting */}
              {isAI && i === 0 && (
                <div className="ml-9 mt-1 mb-2 p-3 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl space-y-2.5 shadow-xs">
                  <div className="flex items-center space-x-1.5 text-amber-700 font-mono font-extrabold uppercase text-[10px]">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>AI Help & Travel Planning Options</span>
                  </div>
                  <p className="text-[11.5px] font-bold text-indigo-950 leading-snug">
                    Select an action below or click the smart planner to design a custom day-by-day itinerary:
                  </p>
                  
                  <div className="space-y-1.5">
                    {/* Clickable message to plan a trip */}
                    <button
                      type="button"
                      onClick={() => setPlannerStep(1)}
                      className="w-full text-left bg-white hover:bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl transition cursor-pointer flex items-start space-x-2 shadow-2xs"
                    >
                      <span className="text-base shrink-0">🗺️</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11.5px] font-black text-amber-900 block truncate">Plan a Trip with Chalo Smart Travel Planner</span>
                        <span className="text-[9.5px] text-gray-500 block mt-0.5 whitespace-normal">Click here to start interactive day, member & route-wise trip setup</span>
                      </div>
                    </button>

                    {/* Other options */}
                    <button
                      type="button"
                      onClick={() => handleSendMessage("Compare Delhi to Jaipur cab rates across Uber and Ola")}
                      className="w-full text-left bg-white hover:bg-gray-50 border border-slate-150 p-2 rounded-xl transition cursor-pointer flex items-start space-x-2 shadow-2xs"
                    >
                      <span className="text-base shrink-0">🚕</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">Compare outstation cab tariffs</span>
                        <span className="text-[9px] text-gray-400 block">Quick Delhi ➔ Jaipur price checks</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Find cheapest 3-star resort in Goa on Agoda vs Booking")}
                      className="w-full text-left bg-white hover:bg-gray-50 border border-slate-150 p-2 rounded-xl transition cursor-pointer flex items-start space-x-2 shadow-2xs"
                    >
                      <span className="text-base shrink-0">🏨</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">Compare Goa resorts on Agoda vs Booking</span>
                        <span className="text-[9px] text-gray-400 block">Compare live ratings, prices, and room reviews</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
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
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span>Scoping deals on Zomato, Swiggy, Uber Cab tariffs...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Trip Planner Questionnaire Panel */}
      {plannerStep > 0 && (
        <div className="bg-slate-50 border border-indigo-200 p-4 rounded-2xl space-y-3 mt-2 shrink-0 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
            <span className="text-[10px] bg-indigo-650 text-white font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase">
              Step {plannerStep} of 5: Trip Setup
            </span>
            <button
              type="button"
              onClick={() => setPlannerStep(0)}
              className="text-gray-400 hover:text-gray-600 text-[10px] font-bold font-mono"
            >
              Cancel ✕
            </button>
          </div>

          {/* STEP 1: Route Setup */}
          {plannerStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-900">Where are you traveling from and to?</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-gray-200 p-2 rounded-xl flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase pl-0.5">From:</span>
                  <input
                    type="text"
                    value={plannerFrom}
                    onChange={(e) => setPlannerFrom(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="text-xs font-semibold outline-none bg-transparent pt-0.5"
                  />
                </div>
                <div className="bg-white border border-gray-200 p-2 rounded-xl flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase pl-0.5">To:</span>
                  <input
                    type="text"
                    value={plannerTo}
                    onChange={(e) => setPlannerTo(e.target.value)}
                    placeholder="e.g. Jaipur"
                    className="text-xs font-semibold outline-none bg-transparent pt-0.5"
                  />
                </div>
              </div>

              {/* Quick Route Pairs */}
              <div className="space-y-1">
                <span className="text-[8px] font-black text-indigo-700 uppercase tracking-wider block font-mono pl-0.5">Trending Routes</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { from: 'Delhi', to: 'Jaipur', label: '🚗 Delhi ➔ Jaipur' },
                    { from: 'Bangalore', to: 'Goa', label: '✈️ Bangalore ➔ Goa' },
                    { from: 'Mumbai', to: 'Pune', label: '🚗 Mumbai ➔ Pune' },
                    { from: 'Delhi', to: 'Agra', label: '🚂 Delhi ➔ Agra' }
                  ].map((route, rIdx) => (
                    <button
                      key={rIdx}
                      type="button"
                      onClick={() => {
                        setPlannerFrom(route.from);
                        setPlannerTo(route.to);
                      }}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-[10px] font-semibold text-gray-700 rounded-lg cursor-pointer transition"
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!plannerFrom.trim() || !plannerTo.trim()}
                onClick={() => setPlannerStep(2)}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white disabled:opacity-50 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Next: Select Co-Travelers ➔
              </button>
            </div>
          )}

          {/* STEP 2: Co-Travelers Selection */}
          {plannerStep === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-900">Who is traveling on this trip?</p>
              <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {[
                  { key: 'solo', val: 'Solo Explorer 🧭', desc: 'Optimal, cost-efficient individual tariffs' },
                  { key: 'couple', val: 'Couple / Duo 👥', desc: 'Standard double occupancy stays and cozy cab routes' },
                  { key: 'family_kids', val: 'Family with Kids 👨‍👩‍👧‍👦', desc: 'Kid-friendly resorts and spacious multi-stop rides' },
                  { key: 'seniors', val: 'Family with Seniors 👵👴', desc: 'Low-walking plans, AC cabs, wheelchair-accessible stays' },
                  { key: 'friends', val: 'Group of Friends 🎒', desc: 'Shared budget rentals, multi-bed stay packages' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setPlannerMembers(opt.val);
                      setPlannerStep(3);
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      plannerMembers === opt.val 
                        ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300' 
                        : 'bg-white border-gray-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-950 block">{opt.val}</span>
                    <span className="text-[9px] text-gray-500 font-medium block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Trip Duration */}
          {plannerStep === 3 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-900">What is your vacation duration?</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { val: '2 Days (Weekend Getaway) ⏱️', desc: 'Quick, optimized highlights itinerary' },
                  { val: '3-4 Days (Short Vacation) 🗓️', desc: 'Relaxed schedule with deep-dive sightseeing' },
                  { val: '5-7 Days (Detailed Trip) 🗺️', desc: 'Comprehensive day-by-day leisure exploration' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setPlannerDuration(opt.val);
                      setPlannerStep(4);
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      plannerDuration === opt.val 
                        ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300' 
                        : 'bg-white border-gray-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-950 block">{opt.val}</span>
                    <span className="text-[9px] text-gray-500 font-medium block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Budget & Luxury Style */}
          {plannerStep === 4 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-900">What is your target daily budget & luxury style?</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { val: 'Economy Saver 🏷️ (₹1,500 - ₹3,000/day)', desc: 'Focus on direct tariff deals & cheap rides' },
                  { val: 'Moderate Comfort 🏨 (₹3,000 - ₹7,000/day)', desc: 'Balanced star resorts & AC sedan transport' },
                  { val: 'Elite Luxury 🌟 (₹7,000+/day)', desc: 'Top-tier boutique stays & premium private chauffeurs' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setPlannerStyle(opt.val);
                      setPlannerStep(5);
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      plannerStyle === opt.val 
                        ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300' 
                        : 'bg-white border-gray-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-950 block">{opt.val}</span>
                    <span className="text-[9px] text-gray-500 font-medium block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Travel Mode Selection */}
          {plannerStep === 5 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-900">How do you prefer to travel?</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { val: 'Premium AC Cab 🚕 (Ola/Uber comparison)', desc: 'Doorstep pickup, zero-fatigue professional drivers' },
                  { val: 'Private Vehicle / Self-Drive 🚗', desc: 'Complete flexibility on bypass highway routes' },
                  { val: 'Flight / Train + Local Cab Transit ✈️', desc: 'Rapid inter-city transit matched with city pickups' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setPlannerTransit(opt.val);
                      submitPlanner(opt.val);
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      plannerTransit === opt.val 
                        ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300' 
                        : 'bg-white border-gray-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-950 block">{opt.val}</span>
                    <span className="text-[9px] text-gray-500 font-medium block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instant Presets pills */}
      {messages.length === 1 && plannerStep === 0 && (
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
