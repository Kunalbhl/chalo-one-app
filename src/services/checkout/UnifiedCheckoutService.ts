import { UnifiedCart, MasterOrder, ProviderOrder, OrderStatus, ProviderId } from '../../models/UnifiedModels';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp, writeBatch, collection } from 'firebase/firestore';

export class UnifiedCheckoutService {
  async processCheckout(
    userId: string, 
    cart: UnifiedCart, 
    address: string, 
    coordinates: {lat: number, lng: number}, 
    paymentDetails: any
  ): Promise<MasterOrder> {
    
    // Simulate Payment Processing
    const transactionId = `txn_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const providerOrders: ProviderOrder[] = [];
    const batch = writeBatch(db);

    const masterOrderId = `mo_${Date.now()}`;
    
    // Delegate to individual providers
    for (const [providerIdStr, providerCart] of Object.entries(cart.providerCarts)) {
      const providerId = providerIdStr as ProviderId;
      const adapter = ProviderRegistry.getAdapter(providerId);
      
      if (!adapter) {
        throw new Error(`Provider adapter not found for ${providerId}`);
      }

      // Allow adapter to handle actual placement logic (like WebView proxy or API call)
      const providerOrder = await adapter.placeOrder(providerCart, address, coordinates, paymentDetails);
      providerOrders.push(providerOrder);

      // Save Provider Order to Firestore
      const poRef = doc(collection(db, 'provider_orders'), providerOrder.providerOrderId);
      batch.set(poRef, {
        ...providerOrder,
        masterOrderId,
        userId
      });

      // Save Transaction Split
      const ptRef = doc(collection(db, 'provider_transactions'), `ptxn_${providerOrder.providerOrderId}`);
      batch.set(ptRef, {
        masterTransactionId: transactionId,
        providerOrderId: providerOrder.providerOrderId,
        provider: providerId,
        amount: providerOrder.total,
        status: 'completed',
        createdAt: serverTimestamp()
      });
    }

    const masterOrder: MasterOrder = {
      masterOrderId,
      userId,
      providerOrders,
      status: 'accepted',
      grandTotal: cart.grandTotal,
      deliveryAddress: address,
      deliveryCoordinates: coordinates,
      paymentTransactionId: transactionId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save Master Order
    const moRef = doc(collection(db, 'master_orders'), masterOrderId);
    batch.set(moRef, {
      ...masterOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Save Master Transaction
    const mtRef = doc(collection(db, 'transactions'), transactionId);
    batch.set(mtRef, {
      userId,
      masterOrderId,
      amount: masterOrder.grandTotal,
      status: 'completed',
      paymentMethod: paymentDetails.method || 'wallet',
      createdAt: serverTimestamp()
    });

    // Commit all to Firestore atomically
    await batch.commit();

    return masterOrder;
  }
}

export const UnifiedCheckoutInstance = new UnifiedCheckoutService();
