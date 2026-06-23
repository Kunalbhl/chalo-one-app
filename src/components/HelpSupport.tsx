import React, { useState } from 'react';
import { FAQS } from '../data';
import { SupportTicket } from '../types';
import { MessageSquare, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Send, CheckCircle } from 'lucide-react';

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
  const [complaintCategory, setComplaintCategory] = useState<'Rides' | 'Food' | 'Mart' | 'Stays' | 'Payments' | 'Wallet'>('Rides');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const newTicket: SupportTicket = {
      id: "CHALO-TKT-" + Math.floor(10000 + Math.random() * 90000),
      subject,
      category: complaintCategory,
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
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    replyToTicket(selectedTicketId, replyText);
    setReplyText('');

    // Simulate Agent Auto-responder after 3 seconds
    setTimeout(() => {
      // Simulate reply from helpdesk Agent
      const replies = [
        "Thank you for confirming. I have flagged your order with Zomato's central hub, and your refund of ₹120 is being split back to your original payment card within 3 hrs.",
        "Your ride issue is currently being reviewed by our dedicated grievance desk. We have processed a compensation voucher of ₹50 into your Chalo Wallet. Check your balance!",
        "Our logistics team has re-routed the delivery boys from Blinkit. Your groceries will arrive at your door in less than 5 mins. Thanks for your patience."
      ];
      const selectedReply = replies[Math.floor(Math.random() * replies.length)];

      const tIdx = tickets.findIndex(t => t.id === selectedTicketId);
      if (tIdx !== -1) {
        tickets[tIdx].messages.push({
          sender: 'support',
          text: selectedReply,
          timestamp: new Date().toLocaleTimeString()
        });
        tickets[tIdx].status = 'In Progress';
      }
    }, 4000);
  };

  return (
    <div id="support_module_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-emerald-950">AI Support Desk</h2>
          <p className="text-xs text-gray-500">Search quick FAQs, file refund complaints, and chat live with helpdesk experts</p>
        </div>
      </div>

      {/* FAQs lookups */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3">
        <div className="flex items-center space-x-1.5 pb-1">
          <HelpCircle className="w-5 h-5 text-gray-400" />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Quick Help & FAQs</h3>
        </div>

        <div className="space-y-1.5 divide-y divide-gray-100">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="pt-2.5 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left flex items-center justify-between text-xs font-bold text-gray-900 focus:outline-none py-1.5 cursor-pointer"
                >
                  <span className="leading-relaxed">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />}
                </button>
                {isOpen && (
                  <p className="text-[11px] text-gray-500 leading-relaxed pt-1 pb-2 pl-0.5">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support ticket creation form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Raised complaints Form box */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs space-y-3">
          <div className="flex items-center space-x-1">
            <AlertCircle className="w-4.5 h-4.5 text-red-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Raise Dispute / Complaint</h3>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-2.5">
            <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-150 flex items-center justify-between px-3">
              <span className="text-[10px] uppercase font-bold text-gray-400">Category:</span>
              <select
                value={complaintCategory}
                onChange={(e) => setComplaintCategory(e.target.value as any)}
                id="complaint_cat_selector"
                className="text-xs font-bold outline-none border-none bg-transparent"
              >
                {['Rides', 'Food', 'Mart', 'Stays', 'Payments', 'Wallet'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
              <span className="text-[9px] text-gray-400 font-bold uppercase pl-1">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Refund needed for Zomato order..."
                id="complaint_subject"
                className="text-xs font-semibold outline-none bg-transparent p-0.5"
                required
              />
            </div>

            <div className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex flex-col">
              <span className="text-[9px] text-gray-400 font-bold uppercase pl-1">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details of transaction issues..."
                id="complaint_body"
                rows={3}
                className="text-xs font-semibold outline-none bg-transparent p-0.5 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              id="submit_complaint_btn"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Submit Dispute Ticket
            </button>
          </form>

          {successMsg && (
            <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-center text-xs font-semibold">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              <span>Ticket raised & routed to billing resolver desk!</span>
            </div>
          )}
        </div>

        {/* Existing tickets selector & details chat box */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs flex flex-col space-y-3 justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pb-1 border-b border-gray-100">Dispute History Logs</span>
            
            <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2">
              {tickets.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicketId(selectedTicketId === t.id ? null : t.id)}
                  className={`w-full text-left p-2 rounded-lg border transition text-xs flex justify-between items-center cursor-pointer ${
                    selectedTicketId === t.id ? 'border-indigo-500 bg-indigo-50/55' : 'border-gray-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="block font-bold text-gray-950 truncate max-w-[130px]">{t.subject}</span>
                    <span className="text-[10px] text-gray-400">{t.category} • {t.createdAt}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono uppercase ${
                    t.status === 'Open' ? 'bg-amber-100 text-amber-800' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {t.status}
                  </span>
                </button>
              ))}

              {tickets.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-6">No raised complaint disputes recorded catalog.</p>
              )}
            </div>
          </div>

          {/* Active Ticket Chat loop */}
          {activeTicket && (
            <div className="border border-indigo-150 rounded-xl p-2.5 bg-indigo-50/30 flex flex-col justify-between h-42">
              <div className="overflow-y-auto space-y-2 text-xs pr-1 flex-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-0.2 rounded-full self-start">
                  Ticket id: {activeTicket.id}
                </span>

                <div className="space-y-2 pt-1 font-sans">
                  {activeTicket.messages.map((m, id) => (
                    <div
                      key={id}
                      className={`p-2 rounded-lg ${
                        m.sender === 'user' ? 'bg-indigo-600 text-white self-end ml-4' : 'bg-white text-gray-800 self-start mr-4 border border-gray-100'
                      }`}
                    >
                      <p className="leading-relaxed text-[11px] font-medium">{m.text}</p>
                      <span className="text-[8px] text-gray-300 block text-right mt-0.5 font-mono">{m.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleReplySubmit} className="flex gap-1 shadow-xs bg-white rounded-lg p-1 border border-gray-150 mt-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Send reply message..."
                  id="ticket_reply_input"
                  className="w-full text-xs font-semibold outline-none px-1"
                  required
                />
                <button type="submit" id="send_reply_btn" className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-sm cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
