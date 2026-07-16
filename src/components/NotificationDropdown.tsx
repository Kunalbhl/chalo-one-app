import React, { useEffect, useState } from 'react';
import { LoyaltyGrowthService, UserNotification } from '../services/loyaltyGrowthService';
import { Bell, X, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

export default function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      LoyaltyGrowthService.getUserNotifications(uid).then(setNotifications);
    }
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await LoyaltyGrowthService.updateNotificationStatus(id, 'read');
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
  };

  const handleMarkAll = async () => {
    for (const n of notifications.filter(x => x.status === 'unread')) {
      await LoyaltyGrowthService.updateNotificationStatus(n.id, 'read');
    }
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
  };

  return (
    <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col max-h-[400px] overflow-hidden">
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="font-display font-black text-sm uppercase">Notifications</h3>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleMarkAll} className="text-[9px] text-amber-400 hover:text-amber-300 font-mono font-bold uppercase tracking-wider">
            Mark all read
          </button>
          <button onClick={onClose} className="text-white hover:text-amber-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50">
        {notifications.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-10 font-medium">
            No notifications available.
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`p-3 rounded-xl border ${n.status === 'unread' ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-white border-slate-100'} transition cursor-pointer relative pr-10`} onClick={() => handleMarkAsRead(n.id)}>
              <div className="flex items-start space-x-3">
                <div className="text-xl">{('🔔')}</div>
                <div className="flex-1">
                  <h4 className={`text-[11px] font-black font-display uppercase tracking-tight ${n.status === 'unread' ? 'text-amber-900' : 'text-slate-700'}`}>{n.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{n.body}</p>
                </div>
              </div>
              {n.status === 'unread' && (
                <div className="absolute right-3 top-3 w-2 h-2 bg-amber-500 rounded-full shadow-sm"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
