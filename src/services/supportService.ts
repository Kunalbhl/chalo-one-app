import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, query, where, 
  serverTimestamp, orderBy, addDoc, updateDoc
} from 'firebase/firestore';
import { ErrorService } from './errorService';
import { AuditService } from './auditService';
import { StorageService } from './storageService';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
  unreadCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  content: string;
  attachments?: { url: string; name: string; type: string }[];
  createdAt: any;
}

export const SupportService = {
  async createTicket(
    userId: string, 
    subject: string, 
    category: string, 
    priority: SupportTicket['priority'],
    initialMessage: string,
    files?: File[]
  ): Promise<string> {
    try {
      const ticketRef = doc(collection(db, 'support_tickets'));
      
      let attachments = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const result = await StorageService.uploadFile(userId, 'support', file);
          attachments.push({
            url: result.url,
            name: file.name,
            type: file.type
          });
        }
      }

      await setDoc(ticketRef, {
        id: ticketRef.id,
        userId,
        subject,
        category,
        priority,
        status: 'open',
        unreadCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const messageRef = doc(collection(db, 'support_messages'));
      await setDoc(messageRef, {
        id: messageRef.id,
        ticketId: ticketRef.id,
        senderId: userId,
        senderType: 'user',
        content: initialMessage,
        attachments,
        createdAt: serverTimestamp()
      });

      AuditService.log(userId, 'SUPPORT_TICKET', { action: 'CREATED', ticketId: ticketRef.id });

      return ticketRef.id;
    } catch (error) {
      ErrorService.logError(error, 'SupportService.createTicket', { userId });
      throw error;
    }
  },

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const q = query(
        collection(db, 'support_tickets'), 
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data() as SupportTicket);
    } catch (error) {
      ErrorService.logError(error, 'SupportService.getUserTickets', { userId });
      return [];
    }
  },

  async getMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
      const q = query(
        collection(db, 'support_messages'),
        where('ticketId', '==', ticketId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data() as SupportMessage);
    } catch (error) {
      ErrorService.logError(error, 'SupportService.getMessages', { ticketId });
      return [];
    }
  },

  async replyToTicket(
    ticketId: string, 
    senderId: string, 
    senderType: 'user' | 'admin', 
    content: string,
    files?: File[]
  ): Promise<void> {
    try {
      let attachments = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const result = await StorageService.uploadFile(senderId, 'support', file);
          attachments.push({
            url: result.url,
            name: file.name,
            type: file.type
          });
        }
      }

      await addDoc(collection(db, 'support_messages'), {
        ticketId,
        senderId,
        senderType,
        content,
        attachments,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: senderType === 'user' ? 'open' : 'waiting_on_user',
        updatedAt: serverTimestamp()
      });
      
      AuditService.log(senderId, 'SUPPORT_TICKET', { action: 'REPLY', ticketId });
    } catch (error) {
      ErrorService.logError(error, 'SupportService.replyToTicket', { ticketId, senderId });
      throw error;
    }
  }
};
