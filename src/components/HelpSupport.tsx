import React, { useState } from 'react';
import { FAQS } from '../data';
import { SupportTicket } from '../types';
import { MessageSquare, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Send, CheckCircle, PlusCircle, X } from 'lucide-react';

interface HelpSupportProps {
  tickets: SupportTicket[];
  addSupportTicket: (ticket: SupportTicket) => void;
  replyToTicket: (id: string, text: string) => void;
}

export default function HelpSupport({
  tickets,
  addSupportTicket,
  replyToTicket
}: HelpSupportProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [complaintCategory, setComplaintCategory] = useState<string>('Rides');
  const [customCategory, setCustomCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const finalCategory = complaintCategory === 'Other' ? (customCategory.trim() || 'Not Listed / Other') : complaintCategory;

    const newTicket: SupportTicket = {
      id: "CHALO-TKT-" + parseInt(crypto.randomUUID().slice(0, 4), 16),
      subject,
      category: finalCategory,
      description,
      status: 'Open',
      createdAt: new Date().toLocaleDateString(),
      messages: [
        { sender: 'user', text: description, timestamp: new Date().toLocaleTimeString() }
      ]
    };

    addSupportTicket(newTicket);
    setSubject('');
    setDescription('');
    setCustomCategory('');
    setComplaintCategory('Rides');
    setSuccessMsg(true);
    setShowCreateForm(false);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    replyToTicket(selectedTicketId, replyText);
    setReplyText('');
  };

  return (
    <div id="support_module_container" className="p-4 max-w-2xl mx-auto space-y-5 font-sans text-gray-800">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 shadow-xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black tracking-tight text-emerald-950 uppercase">Chalo Helpdesk</h2>
            <p className="text-[10.5px] text-gray-400 font-medium">Raise disputes, track tickets, and check instant resolutions</p>
          </div>
        </div>

        {/* Dynamic add ticket button */}
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-center text-xs font-semibold animate-fade-in flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Your support ticket was raised successfully and routed to our central agent desk!</span>
        </div>
      )}

      {/* RAISING TICKET FORM MODAL/DRAWER OVERLAY */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 w-full max-w-md shadow-2xl p-5 relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-gray-100">
              <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              <div>
                <h3 className="font-display font-black text-gray-950 text-sm uppercase">Create Support Ticket</h3>
                <p className="text-[10px] text-gray-400 font-semibold">Direct agent dispatch grievance lodging</p>
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
                <span className="text-[9px] uppercase font-bold text-gray-400 pl-1 mb-1">Issue Category</span>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  id="complaint_cat_selector"
                  className="text-xs font-bold outline-none border-none bg-transparent cursor-pointer text-gray-800"
                >
                  <option value="Rides">🚕 Ride Services Comparison</option>
                  <option value="Food">🍔 Food Delivery Outlets</option>
                  <option value="Mart">📦 Fast Groceries & Mart</option>
                  <option value="Stays">🏨 Hotels & Stays Comparison</option>
                  <option value="Payments">💳 Payments & Billing</option>
                  <option value="Wallet">💰 Wallet Points & Balance</option>
                  <option value="Other">📝 Other / Not Listed</option>
                </select>
              </div>

              {/* Dynamic Not Listed category box */}
              {complaintCategory === 'Other' && (
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200 flex flex-col animate-fade-in">
                  <span className="text-[9px] text-amber-800 font-bold uppercase pl-1 mb-1">Custom Category Name (Not Listed)</span>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter manual category category (e.g. Account Lock, App Speed)..."
                    id="complaint_custom_category"
                    className="text-xs font-black outline-none bg-transparent text-amber-950"
                    required
                  />
                </div>
              )}

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 flex flex-col">
                <span className="text-[9px] text-gray-400 font-bold uppercase pl-1 mb-1">Subject Title</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Charged twice for recent food order..."
                  id="complaint_subject"
                  className="text-xs font-bold outline-none bg-transparent"
                  required
                />
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 flex flex-col">
                <span className="text-[9px] text-gray-400 font-bold uppercase pl-1 mb-1">Detailed Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details to help support agents resolve your complaint quickly..."
                  id="complaint_body"
                  rows={4}
                  className="text-xs font-semibold outline-none bg-transparent resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit_complaint_btn"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEFAULT SECTION: Raised support tickets & chat */}
      <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4.5 h-4.5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">My Dispute Support Tickets</h3>
          </div>
          <span className="text-[9.5px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">
            {tickets.length} Total Logs
          </span>
        </div>

        <div className="space-y-3">
          {tickets.map(t => {
            const isSelected = selectedTicketId === t.id;
            return (
              <div
                key={t.id}
                className={`w-full p-4 rounded-3xl border transition text-xs flex flex-col space-y-3 cursor-pointer ${
                  isSelected ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'border-gray-150 hover:bg-slate-50 bg-white'
                }`}
                onClick={() => {
                  if (!isSelected) {
                    setSelectedTicketId(t.id);
                  }
                }}
              >
                {/* Header info - clicking here toggles expand/collapse */}
                <div 
                  className="flex justify-between items-start w-full"
                  onClick={(e) => {
                    if (isSelected) {
                      e.stopPropagation();
                      setSelectedTicketId(null);
                    }
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-extrabold text-gray-950 text-sm">{t.subject}</span>
                      <span className="text-[9px] font-mono text-gray-400 font-bold">({t.id})</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-semibold">
                      <span>🏷️ {t.category}</span>
                      <span>•</span>
                      <span>📅 {t.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[8.5px] font-black px-2.5 py-1 rounded-full font-mono uppercase ${
                      t.status === 'Open' ? 'bg-amber-100 text-amber-800 border border-amber-200' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-gray-400 text-xs font-bold font-mono">
                      {isSelected ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* If selected, show thread-like chat interface directly inside the card */}
                {isSelected && (
                  <div 
                    className="border-t border-gray-150 pt-3 space-y-3"
                    onClick={(e) => e.stopPropagation() /* prevent collapse on clicking inside chat */}
                  >
                    <span className="text-[9px] font-mono font-black text-indigo-550 uppercase tracking-widest block">Real-time Support Thread</span>
                    
                    {/* Chat messages stream list */}
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 bg-slate-50 p-3 rounded-2xl border border-gray-150">
                      {t.messages.map((m, id) => {
                        const isUser = m.sender === 'user';
                        return (
                          <div
                            key={id}
                            className={`flex flex-col space-y-0.5 ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[8px] font-mono font-black uppercase text-slate-450 px-1">
                              {isUser ? 'You' : 'Chalo Support Team'}
                            </span>
                            <div
                              className={`p-2.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed ${
                                isUser 
                                  ? 'bg-indigo-600 text-white rounded-br-none font-medium' 
                                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-2xs font-medium'
                              }`}
                            >
                              <p>{m.text}</p>
                            </div>
                            <span className="text-[8px] text-gray-400 font-mono pl-1 pr-1">{m.timestamp}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Instant reply input form inside card */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!replyText.trim()) return;
                        
                        // Call prop reply function
                        replyToTicket(t.id, replyText);
                        setReplyText('');
                      }} 
                      className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-2xs"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type message reply to Support Team..."
                        className="w-full text-xs font-semibold outline-none px-2 text-gray-800"
                        required
                      />
                      <button 
                        type="submit" 
                        className="bg-indigo-650 hover:bg-indigo-700 text-white p-2 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}

          {tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-300 mb-1.5" />
              <p className="text-[11px] text-center text-gray-400 font-semibold">No dispute tickets raised yet. Complete the form above to file a query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Standard FAQs lookup */}
      <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-xs space-y-3">
        <div className="flex items-center space-x-1.5 pb-1 border-b border-gray-100">
          <HelpCircle className="w-5 h-5 text-emerald-500 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-1.5 divide-y divide-gray-150">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="pt-2 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left flex items-center justify-between text-xs font-bold text-gray-900 py-2.5 cursor-pointer hover:text-emerald-700 transition"
                >
                  <span className="leading-relaxed">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />}
                </button>
                {isOpen && (
                  <p className="text-[11px] text-gray-500 leading-relaxed pt-1 pb-2.5 pl-0.5 font-medium animate-fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
