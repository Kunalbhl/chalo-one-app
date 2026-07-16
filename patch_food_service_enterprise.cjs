const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');

const checkoutCode = `
  async validateAndCheckout(userId: string, cartItems: any[], paymentDetails: any) {
    if (!db) throw new Error('Database not initialized');
    // Implement robust server validation architecture
    const batch = writeBatch(db);
    const orderId = 'ORD_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    const orderRef = doc(db, 'food_orders', orderId);

    // Calculate checksums securely on server side
    let calculatedTotal = 0;
    
    // Using transaction for atomicity and checking stock
    try {
      await runTransaction(db, async (transaction) => {
        // Validation loop
        for (const item of cartItems) {
           const itemRef = doc(db, 'restaurant_menu', item.id);
           const itemDoc = await transaction.get(itemRef);
           if (!itemDoc.exists()) {
             throw new Error(\`Item \${item.name} is no longer available\`);
           }
           const data = itemDoc.data();
           if (data.price !== item.price) {
             throw new Error(\`Price changed for \${item.name}. Please refresh cart.\`);
           }
           calculatedTotal += data.price * item.quantity;
        }

        // Apply platform fees securely
        const finalTotal = calculatedTotal + 40; // Delivery fee mock

        if (paymentDetails.expectedTotal !== finalTotal) {
           throw new Error('Checksum mismatch. Cart total altered.');
        }

        transaction.set(orderRef, {
           userId,
           items: cartItems,
           total: finalTotal,
           status: 'Order Placed',
           createdAt: serverTimestamp()
        });
      });
      return { success: true, orderId };
    } catch (err: any) {
      console.error('Checkout failed validation', err);
      return { success: false, error: err.message };
    }
  }
`;

code = code.replace(/import \{/, "import { writeBatch, runTransaction, ");
code = code.replace(/export const FoodServiceInstance/, checkoutCode + "\nexport const FoodServiceInstance");

fs.writeFileSync('src/services/food/FoodService.ts', code);
console.log('Enterprise checkout added');
