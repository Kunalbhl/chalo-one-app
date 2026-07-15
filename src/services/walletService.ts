import { FirestoreService } from './firestoreService';
import { ChaloWallet, WalletTransaction } from '../types';

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
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  },

  /**
   * Deduct cash balance for an order
   */
  async deductBalance(userId: string, amount: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) throw new Error('Wallet not found');
    if (doc.balance < amount) throw new Error('Insufficient wallet balance');

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  },

  /**
   * Reward user with loyalty points
   */
  async rewardPoints(userId: string, points: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) return;

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  },

  /**
   * Redeem loyalty points for cash or credit
   */
  async redeemPoints(userId: string, points: number, amountEquivalent: number, description: string): Promise<void> {
    const doc = await FirestoreService.getDocument<ChaloWallet>('wallets', userId);
    if (!doc) throw new Error('Wallet not found');
    if (doc.points < points) throw new Error('Insufficient reward points');

    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  }
};
