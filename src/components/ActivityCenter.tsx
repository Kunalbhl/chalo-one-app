import React, { useState } from 'react';
import { OngoingActivity } from '../types';
import { PlayCircle, Clock, MapPin, Search, Calendar, Heart, ArrowUpRight, CheckCircle2, ChevronRight, Fuel, Map } from 'lucide-react';
import { jsPDF } from 'jspdf';
import ActiveRideMap from './ActiveRideMap';

interface ActivityCenterProps {
  activityList: OngoingActivity[];
  cancelActivity: (id: string) => void;
  onActivityClick?: (category: 'rides' | 'food' | 'mart' | 'stays' | 'intercity') => void;
  addSupportTicket?: (ticket: any) => void;
}

export default function ActivityCenter({ activityList, cancelActivity, onActivityClick, addSupportTicket }: ActivityCenterProps) {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');
  const [searchVal, setSearchVal] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Uber', 'Swiggy', 'Biryani']);
  const [searchFocused, setSearchFocused] = useState(false);

  // Deep Details Modal states
  const [selectedItem, setSelectedItem] = useState<OngoingActivity | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [isPdfDownloading, setIsPdfDownloading] = useState<boolean>(false);
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string>('');
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const handleTimelineSearch = (val: string) => {
    setSearchVal(val);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== val.toLowerCase());
      return [val, ...filtered].slice(0, 5);
    });
  };

  const getIssueOptionsByCategory = (category: string) => {
    switch (category) {
      case 'rides':
      case 'intercity':
        return [
          "Refund requested: Fare charged is higher than estimated price",
          "Driver behavior: Rude, unsafe driving, or unprofessional conduct",
          "Ride did not arrive: Charged cancellation fee incorrectly",
          "Route mismatch: Driver took incorrect longer routes",
          "Lost & Found: Left a personal item in the vehicle",
          "Vehicle condition: Broken AC or dirty seats",
          "Other ride complaint / technical glitch"
        ];
      case 'food':
      case 'mart':
        return [
          "Missing products: Items paid for but not delivered in package",
          "Damaged items: Food spilled, packet crushed or stale products",
          "Delivery delay: Order arrived extremely late (breached promise)",
          "Wrong items: Incorrect food dish or product brand delivered",
          "Payment/Discount issue: Offer code or coupon not applied",
          "Other order complaint / delivery dispute"
        ];
      case 'stays':
        return [
          "Description mismatch: Room amenities didn't match booking info",
          "Check-in issues: Host unreachable or denied check-in",
          "Cleanliness: Unhygienic bathrooms, beds, or dirty premise",
          "Amenity failure: AC, Wi-Fi, or Geyser not functional",
          "Billing dispute: Double charged or incorrect cancellation fee",
          "Other stay complaint / host dispute"
        ];
      default:
        return [
          "Incorrect billing: Transaction amount dispute",
          "Payment failure but amount deducted from bank",
          "Platform speed: Slow confirmation / delayed booking receipt",
          "Other customer support issue"
        ];
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedItem) return;
    setIsPdfDownloading(true);
    
    setTimeout(() => {
      setIsPdfDownloading(false);
      
      try {
        const doc = new jsPDF();
        
        // 1. Title & Header Banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('CHALO ONE APP', 20, 20);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(251, 191, 36); // amber-400
        doc.text("INDIA'S EVERYDAY SUPER COMPARISON APP", 20, 28);
        
        // 2. Receipt Title
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('OFFICIAL BOOKING RECEIPT', 20, 52);
        
        // Horizontal line
        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(20, 58, 190, 58);
        
        // 3. Metadata Table Block
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105); // slate-600
        
        const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
        
        doc.text(`Receipt Number:`, 20, 68);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(receiptNo, 60, 68);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Booking Reference:`, 20, 74);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(selectedItem.id, 60, 74);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Category:`, 20, 80);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(selectedItem.category.toUpperCase(), 60, 80);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Platform Provider:`, 20, 86);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(selectedItem.platform, 60, 86);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Service Date:`, 20, 92);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(selectedItem.date, 60, 92);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Service Time / Status:`, 20, 98);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(selectedItem.time, 60, 98);
        
        // Horizontal line
        doc.line(20, 104, 190, 104);
        
        // 4. Description of booked items / services
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('BOOKING DETAILS & DESCRIPTION', 20, 112);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text(selectedItem.title, 20, 120);
        if (selectedItem.subtitle) {
          const lines = doc.splitTextToSize(selectedItem.subtitle, 170);
          doc.text(lines, 20, 126);
        }
        
        // Horizontal line
        doc.line(20, 136, 190, 136);
        
        // 5. Financial details
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('FARE & TRANSACTION SUMMARY', 20, 144);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        
        const baseFare = Math.round(selectedItem.amount * 0.82);
        const taxes = Math.round(selectedItem.amount * 0.18) - 15;
        
        doc.text(`Base Fare:`, 20, 154);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`INR ${baseFare.toLocaleString('en-IN')}.00`, 150, 154);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Platform Fees:`, 20, 160);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`INR 15.00`, 150, 160);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Taxes & GST (18%):`, 20, 166);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`INR ${taxes.toLocaleString('en-IN')}.00`, 150, 166);
        
        // Thick line for final total
        doc.setLineWidth(1.0);
        doc.line(20, 172, 190, 172);
        
        // Total Amount Paid
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`TOTAL AMOUNT PAID:`, 20, 180);
        doc.setTextColor(220, 38, 38); // rose-600
        doc.text(`INR ${selectedItem.amount.toLocaleString('en-IN')}.00`, 150, 180);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240);
        doc.line(20, 186, 190, 186);
        
        // 6. Security Footer
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text('● PAYMENT STATUS: SUCCESSFUL / VERIFIED', 20, 194);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('This is a digitally generated authentic PDF transaction receipt, verified by Chalo One core ledger system.', 105, 220, { align: 'center' });
        doc.text("Thank you for using Chalo One - India's Everyday Super App Platform!", 105, 226, { align: 'center' });
        
        doc.save(`ChaloOne_Receipt_${selectedItem.id}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to generate PDF. Downloading standard TXT backup.");
        
        const receiptText = `
=========================================
            CHALO ONE RECEIPT
=========================================
Receipt No:     REC-${Math.floor(100000 + Math.random() * 900000)}
Booking ID:     ${selectedItem.id}
Category:       ${selectedItem.category.toUpperCase()}
Platform:       ${selectedItem.platform}
Date:           ${selectedItem.date}
Time:           ${selectedItem.time}
-----------------------------------------
TOTAL AMOUNT:   ₹${selectedItem.amount}.00
=========================================
        `;
        const element = document.createElement("a");
        const file = new Blob([receiptText.trim()], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `ChaloOne_Receipt_${selectedItem.id}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    }, 1000);
  };

  const handleRaiseIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!selectedIssue) {
      alert("Please select a valid issue point from the dropdown options.");
      return;
    }

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const categoryLabel = 
      selectedItem.category === 'rides' ? 'Ride Comparison' : 
      selectedItem.category === 'food' ? 'Food Ordering' : 
      selectedItem.category === 'stays' ? 'Stay Booking' : 'General Support';

    const ticket = {
      id: ticketId,
      subject: `Issue on ${selectedItem.platform} ${selectedItem.category.toUpperCase()} (${selectedItem.id})`,
      category: categoryLabel,
      description: `Selected Issue: ${selectedIssue}\nDetails: ${issueDescription || 'None provided'}`,
      status: 'Open' as const,
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      messages: [
        {
          sender: 'user' as const,
          text: `Hi support, I raised an issue regarding my ${selectedItem.platform} booking ${selectedItem.id} (${selectedItem.title}).\nSelected category of complaint: ${selectedIssue}.\nDetails: ${issueDescription || 'No additional details provided.'}`,
          timestamp: new Date().toLocaleTimeString()
        },
        {
          sender: 'support' as const,
          text: `Hello! We've successfully registered your grievance ticket regarding "${selectedIssue}" for your ${selectedItem.platform} transaction. Our billing and escalations desk has initiated an automated review. A representative will contact you shortly.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]
    };

    if (addSupportTicket) {
      addSupportTicket(ticket);
    } else {
      const saved = JSON.parse(localStorage.getItem('chalo_support_tickets') || '[]');
      localStorage.setItem('chalo_support_tickets', JSON.stringify([ticket, ...saved]));
    }

    setTicketSubmittedId(ticketId);
    setIssueDescription('');
    setSelectedIssue('');
  };

  const ongoingItems = activityList.filter(item => item.status === 'ongoing');
  const historyItems = activityList.filter(item => item.status === 'completed' || item.status === 'cancelled');

  const filteredOngoing = ongoingItems.filter(item => 
    item.title.toLowerCase().includes(searchVal.toLowerCase()) || 
    (item.subtitle && item.subtitle.toLowerCase().includes(searchVal.toLowerCase()))
  );

  const filteredHistory = historyItems.filter(item => 
    item.title.toLowerCase().includes(searchVal.toLowerCase()) || 
    (item.subtitle && item.subtitle.toLowerCase().includes(searchVal.toLowerCase()))
  );

  return (
    <div id="activity_center_container" className="p-4 max-w-6xl mx-auto w-full space-y-4 font-sans text-gray-800">
      <div className="flex border-b border-gray-150 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('ongoing')}
          className={`flex-1 py-2.5 font-display font-semibold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === 'ongoing' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📍 Active Journeys & Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 font-display font-semibold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 Transaction History
        </button>
      </div>

      {/* Smart search timeline filter */}
      <div className="space-y-1.5">
        <div className="relative flex items-center bg-gray-50 border border-gray-150 p-2.5 rounded-xl">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchVal}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTimelineSearch(searchVal);
              }
            }}
            placeholder="Search items, platforms, restaurants ..."
            id="activity_timeline_search"
            className="w-full bg-transparent text-xs outline-none font-medium text-gray-700"
          />
          {(searchVal || searchFocused) && (
            <button
              type="button"
              onClick={() => {
                setSearchVal('');
                setSearchFocused(false);
              }}
              className="text-gray-400 hover:text-gray-700 text-[10px] uppercase font-black tracking-tight"
            >
              Clear
            </button>
          )}
        </div>

        {/* Focus recommendations with no-mixing parameters for Timeline records */}
        {searchFocused && (
          <div className="bg-amber-50/45 rounded-xl border border-amber-150 p-3 space-y-2.5">
            {recentSearches.length > 0 && (
              <div>
                <span className="text-[8px] font-black text-amber-850 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Timeline Searches</span>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTimelineSearch(term)}
                      className="px-2 py-0.5 bg-white hover:bg-amber-50 text-[10px] font-bold text-gray-750 border border-amber-150 rounded-lg cursor-pointer transition"
                    >
                      📋 {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest block mb-1 font-mono">🔍 Filter by Category:</span>
              <div className="flex flex-wrap gap-1">
                {['Uber rides 🚗', 'Blinkit store 🛒', 'Zomato food 🍔', 'Hotel stay 🏨'].map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleTimelineSearch(term.replace(/ [^ ]+$/, ''))}
                    className="px-2.5 py-0.5 bg-white hover:bg-indigo-50 text-[10px] font-extrabold text-blue-900 border border-gray-150 rounded-lg cursor-pointer transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'ongoing' ? (
        <div className="space-y-4 animate-fade-in">
          {filteredOngoing.length > 0 ? (
            filteredOngoing.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedItem(item);
                  setTicketSubmittedId('');
                  setSelectedIssue('');
                }}
                className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3.5 shadow-sm relative overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
                title="Click to view comparative details"
              >
                {/* Yellow light pulse animation on ongoing card */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>

                <div className="flex justify-between items-start pl-1">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider font-mono animate-pulse">
                        LIVE UPDATE
                      </span>
                      <span className="text-gray-300 font-mono">|</span>
                      <span className="text-[9.5px] bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider font-mono">
                        {item.platform}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mt-1 font-display tracking-tight leading-snug group-hover:text-amber-600 transition-colors">{item.title}</h4>
                    {item.subtitle && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.subtitle}</p>}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-extrabold text-gray-950 block">₹{item.amount}</span>
                    {item.eta && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-bold font-mono px-2 py-0.5 rounded-sm inline-block mt-1">
                        ETA: {item.eta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ride specific metadata simulation: OTP validation and map tracker graphics */}
                {item.category === 'rides' && (
                  <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-150 text-[11px] font-medium text-gray-700">
                    <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Driver verification code:</span>
                      <span className="font-mono bg-indigo-100 text-indigo-800 font-black px-2.5 py-0.5 rounded text-sm animate-pulse">
                        OTP {item.otpConfirm || '9912'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <span className="text-[9.5px] text-gray-400 block font-bold">ROUTE MONITOR</span>
                          <span className="leading-normal text-xs text-slate-700">{item.routeString || 'Your driver is heading towards pickup hotspot point...'}</span>
                        </div>
                      </div>
                      {item.pickupCoords && item.destCoords && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMapId(expandedMapId === item.id ? null : item.id);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9.5px] font-black tracking-wider uppercase transition shrink-0 cursor-pointer shadow-xs border border-amber-600/20"
                        >
                          {expandedMapId === item.id ? 'Hide Tracker' : 'Live Track Map'}
                        </button>
                      )}
                    </div>

                    {expandedMapId === item.id && item.pickupCoords && item.destCoords && (
                      <div className="pt-3 border-t border-gray-150" onClick={(e) => e.stopPropagation()}>
                        <ActiveRideMap 
                          pickupCoords={item.pickupCoords}
                          destCoords={item.destCoords}
                          driverName={item.subtitle?.split('Captain: ')[1]?.split(' • ')[0] || item.subtitle?.split('Assigned: ')[1]?.split(' (')[0] || "Amit Kumar"}
                          vehicleInfo={item.subtitle?.split(' • ')[1] || item.subtitle?.split(' (')[1]?.replace(')', '') || "DL 1CA 4492"}
                          statusLabel={item.status}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1.5 pl-1">
                  <span className="text-[10.5px] text-emerald-600 font-bold flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {item.time} ({item.date})
                  </span>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details ➔
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelActivity(item.id);
                      }}
                      className="text-red-500 hover:text-red-700 border border-transparent hover:border-red-150 px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer relative z-10"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-gray-50 border border-gray-150 rounded-2xl">
              <Fuel className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-600">No active rides or orders</h3>
              <p className="text-xs text-gray-400 mt-1">Book a comparative ride or checkout food items in the super-app catalog</p>
            </div>
          )}
        </div>
      ) : (
        /* Completed historic transactions */
        <div className="space-y-3 animate-fade-in">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedItem(item);
                  setTicketSubmittedId('');
                  setSelectedIssue('');
                }}
                className="bg-white rounded-xl border border-gray-150 p-3.5 hover:bg-gray-50 hover:border-amber-400 transition flex justify-between items-center text-xs cursor-pointer group"
                title="Click to view comparative details"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9.5px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.2 rounded uppercase font-mono">
                      {item.platform}
                    </span>
                    <span className="text-[9.5px] text-gray-400 font-mono">ID: {item.id}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 leading-tight group-hover:text-amber-600 transition-colors">{item.title}</h4>
                  {item.subtitle && <p className="text-[10.5px] text-gray-400 font-medium leading-none">{item.subtitle}</p>}
                  <p className="text-[9.5px] text-gray-400 font-semibold">{item.time} • {item.date}</p>
                </div>

                <div className="text-right font-mono text-xs shrink-0 pl-1 flex flex-col items-end">
                  <span className="font-black text-gray-950 block">₹{item.amount}</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[9px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details ➔
                    </span>
                    <span className={`text-[9.5px] font-bold block uppercase ${
                      item.status === 'completed' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {item.status === 'completed' ? 'Success' : 'Cancelled'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-gray-50 border border-gray-150 rounded-2xl">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 mt-1">No comparative order transaction histories found.</p>
            </div>
          )}
        </div>
      )}

      {/* DETAILED ACTIVITY MODAL with PDF download & Category-based Support systems */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-gray-100 rounded-[28px] max-w-md w-full p-6 space-y-5 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9.5px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                    {selectedItem.platform}
                  </span>
                  <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded uppercase font-mono ${
                    selectedItem.status === 'ongoing' ? 'bg-indigo-100 text-indigo-800' :
                    selectedItem.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>
                <h3 className="font-display font-black text-base text-gray-900 mt-1 tracking-tight leading-tight">
                  {selectedItem.title}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Booking Reference ID: {selectedItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Complete Transaction & Booking Details */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 text-xs space-y-3">
              <span className="text-[9px] text-gray-400 font-mono font-black uppercase tracking-widest block">Original Booking Details</span>
              
              <div className="grid grid-cols-2 gap-3 font-medium">
                <div>
                  <span className="text-gray-400 text-[10px] block">DATE & TIME</span>
                  <span className="text-gray-800">{selectedItem.date} at {selectedItem.time}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">PAYMENT MODE</span>
                  <span className="text-gray-800">Google Pay / UPI</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">SUB-TOTAL PRICE</span>
                  <span className="text-gray-800">₹{selectedItem.amount}.00</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">CATEGORY</span>
                  <span className="text-amber-700 uppercase font-bold text-[10.5px]">{selectedItem.category}</span>
                </div>
              </div>

              {selectedItem.subtitle && (
                <div className="border-t border-gray-200/60 pt-2 font-medium">
                  <span className="text-gray-400 text-[10px] block">BOOKING HIGHLIGHTS</span>
                  <p className="text-gray-700 leading-snug">{selectedItem.subtitle}</p>
                </div>
              )}

              {/* Special category layouts */}
              {selectedItem.category === 'rides' && (
                <div className="border-t border-gray-200/60 pt-2 space-y-2.5 font-medium">
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150">
                    <span className="text-gray-500">Cab OTP:</span>
                    <span className="font-mono bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded text-[11px]">{selectedItem.otpConfirm || '9912'}</span>
                  </div>
                  {selectedItem.routeString && (
                    <div className="flex items-start space-x-1 text-gray-600 bg-white p-2 rounded-lg border border-gray-150">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-[10.5px] leading-relaxed">{selectedItem.routeString}</span>
                    </div>
                  )}
                  {selectedItem.status === 'ongoing' && selectedItem.pickupCoords && selectedItem.destCoords && (
                    <div className="pt-2">
                      <span className="text-[9.5px] text-gray-400 font-mono font-black uppercase tracking-wider block mb-1.5">Interactive Driver Tracking</span>
                      <ActiveRideMap 
                        pickupCoords={selectedItem.pickupCoords}
                        destCoords={selectedItem.destCoords}
                        driverName={selectedItem.subtitle?.split('Captain: ')[1]?.split(' • ')[0] || selectedItem.subtitle?.split('Assigned: ')[1]?.split(' (')[0] || "Amit Kumar"}
                        vehicleInfo={selectedItem.subtitle?.split(' • ')[1] || selectedItem.subtitle?.split(' (')[1]?.replace(')', '') || "DL 1CA 4492"}
                        statusLabel={selectedItem.status}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Downable PDF Receipt Segment - ONLY accessible once done & delivered */}
            {(selectedItem.status === 'completed' || selectedItem.status === 'delivered') ? (
              <div className="border border-gray-150 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">Download Receipt</h4>
                    <p className="text-[10px] text-gray-400">Get complete digital proof of this transaction</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isPdfDownloading}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isPdfDownloading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Download PDF</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-[11px] text-amber-800 font-bold">
                  🔒 Receipt download will become active once your order is fully completed/delivered.
                </p>
              </div>
            )}

            {/* Raise an Issue Segment */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-gray-900 flex items-center text-red-600">
                  ⚠️ Need Assistance / Raise Issue?
                </h4>
                <p className="text-[10px] text-gray-400">Report refund requests, driver misconduct, stays quality, or wrong food delivery points.</p>
              </div>

              {ticketSubmittedId ? (
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs space-y-1.5 text-center animate-fade-in">
                  <span className="text-lg block">🎫</span>
                  <span className="font-bold text-emerald-800 block">Support Ticket Logged!</span>
                  <p className="text-emerald-700 leading-snug">
                    We have successfully registered ticket <strong className="font-mono text-emerald-900">{ticketSubmittedId}</strong> in our CRM.
                  </p>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    You can inspect status, chat with customer agents, or add screenshots in the "Help & Support" center in your Account menu.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRaiseIssueSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-450 font-mono font-black uppercase tracking-wider block">Complaint Category / Point</label>
                    <select
                      required
                      value={selectedIssue}
                      onChange={(e) => setSelectedIssue(e.target.value)}
                      className="w-full bg-gray-55 border border-gray-150 rounded-xl p-2.5 text-xs text-gray-700 outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">-- Choose what went wrong --</option>
                      {getIssueOptionsByCategory(selectedItem.category).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-455 font-mono font-black uppercase tracking-wider block">Describe the issue in detail</label>
                    <textarea
                      rows={2}
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Explain what happened (e.g. driver asked for extra cash, items missing from Blinkit packet, AC not cooling room...)"
                      className="w-full bg-gray-55 border border-gray-150 rounded-xl p-2.5 text-xs text-gray-700 outline-none focus:border-amber-400 resize-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Log Dispute Ticket</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
