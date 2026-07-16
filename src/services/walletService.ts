import { FirestoreService } from './firestoreService';
import { ChaloWallet, WalletTransaction } from '../types';
import { NotificationService } from './notificationService';

export const WalletService = {
  /**
   * Subscribe to real-time wallet balance changes
   */
  subscribe(userId: string, onUpdate: (data: ChaloWallet | null) => void): () => void {
    return FirestoreService.subscribeDocument<ChaloWallet>('wallets', userId, onUpdate);
  },

  /**
   * Add credit to user cash balance
   */
  async addBalance(userId: string, amount: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) return;

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`,
      type: 'credit',
      amount,
      pointsSpentOrEarned: 0,
      description,
      timestamp: new Date().toLocaleString('en-IN')
    };

    const updatedWallet: ChaloWallet = {
      points: doc.points,
      balance: doc.balance + amount,
      history: [transaction, ...doc.history]
    };

    await FirestoreService.setDocument('wallets', userId, updatedWallet);
    
    // Automatically trigger notification
    await NotificationService.notifyWalletCredit(userId, amount, 0, description);
  },

  /**
   * Deduct cash balance for an order
   */
  async deductBalance(userId: string, amount: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) throw new Error('Wallet not found');
    if (doc.balance < amount) throw new Error('Insufficient wallet balance');

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`,
      type: 'debit',
      amount,
      pointsSpentOrEarned: 0,
      description,
      timestamp: new Date().toLocaleString('en-IN')
    };

    const updatedWallet: ChaloWallet = {
      points: doc.points,
      balance: doc.balance - amount,
      history: [transaction, ...doc.history]
    };

    await FirestoreService.setDocument('wallets', userId, updatedWallet);
    
    // Automatically trigger notification
    await NotificationService.notifyWalletDebit(userId, amount, 0, description);
  },

  /**
   * Reward user with loyalty points
   */
  async rewardPoints(userId: string, points: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) return;

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`,
      type: 'credit',
      amount: 0,
      pointsSpentOrEarned: points,
      description,
      timestamp: new Date().toLocaleString('en-IN')
    };

    const updatedWallet: ChaloWallet = {
      points: doc.points + points,
      balance: doc.balance,
      history: [transaction, ...doc.history]
    };

    await FirestoreService.setDocument('wallets', userId, updatedWallet);

    // Automatically trigger notification
    await NotificationService.notifyWalletCredit(userId, 0, points, description);
  },

  /**
   * Redeem loyalty points for cash or credit
   */
  async redeemPoints(userId: string, points: number, amountEquivalent: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) throw new Error('Wallet not found');
    if (doc.points < points) throw new Error('Insufficient reward points');

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`,
      type: 'debit',
      amount: amountEquivalent, // is added to wallet balance as cash, or treated as debit of points
      pointsSpentOrEarned: points,
      description,
      timestamp: new Date().toLocaleString('en-IN')
    };

    const updatedWallet: ChaloWallet = {
      points: doc.points - points,
      balance: doc.balance + amountEquivalent,
      history: [transaction, ...doc.history]
    };

    await FirestoreService.setDocument('wallets', userId, updatedWallet);

    // Automatically trigger notification
    await NotificationService.notifyWalletDebit(userId, 0, points, `Points redeemed: ${description}`);
    await NotificationService.notifyWalletCredit(userId, amountEquivalent, 0, `Equivalent cash credit: ${description}`);
  }
};
