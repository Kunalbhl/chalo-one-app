import { FirestoreService } from './firestoreService';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  category: 'rides' | 'food' | 'mart' | 'stays' | 'intercity' | 'wallet' | 'system';
}

export interface NotificationsDocument {
  userId: string;
  unreadCount: number;
  list: AppNotification[];
}

export const NotificationService = {
  /**
   * Subscribe to real-time notification alerts
   */
  subscribe(userId: string, onUpdate: (data: NotificationsDocument | null) => void): () => void {
    return FirestoreService.subscribeDocument<NotificationsDocument>('notifications', userId, onUpdate);
  },

  /**
   * Add a notification to user list
   */
  async addNotification(userId: string, title: string, message: string, category: AppNotification['category']): Promise<void> {
    const doc = await FirestoreService.getDocument<NotificationsDocument>('notifications', userId);
    const existingList = doc?.list || [];
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      timestamp: new Date().toLocaleString('en-IN'),
      isRead: false,
      category
    };

    const updatedList = [newNotif, ...existingList];
    const unreadCount = updatedList.filter(n => !n.isRead).length;

    await FirestoreService.setDocument('notifications', userId, {
      userId,
      unreadCount,
      list: updatedList
    });
  },

  /**
   * Mark all notifications or a specific one as read
   */
  async markAsRead(userId: string, notificationId?: string): Promise<void> {
    const doc = await FirestoreService.getDocument<NotificationsDocument>('notifications', userId);
    if (!doc) return;

    const list = doc.list.map(notif => {
      if (!notificationId || notif.id === notificationId) {
        return { ...notif, isRead: true };
      }
      return notif;
    });
    const unreadCount = list.filter(n => !n.isRead).length;

    await FirestoreService.setDocument('notifications', userId, {
      userId,
      unreadCount,
      list
    });
  },

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const doc = await FirestoreService.getDocument<NotificationsDocument>('notifications', userId);
    if (!doc) return;

    const list = doc.list.filter(notif => notif.id !== notificationId);
    const unreadCount = list.filter(n => !n.isRead).length;

    await FirestoreService.setDocument('notifications', userId, {
      userId,
      unreadCount,
      list
    });
  }
};
