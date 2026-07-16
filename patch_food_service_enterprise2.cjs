const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');

code = code.replace(/async validateAndCheckout\([\s\S]*?\}\n\nexport const FoodServiceInstance/, "export const FoodServiceInstance");

const newMethod = `
  async validateAndCheckout(userId: string, cartItems: any[], paymentDetails: any) {
    if (!db) throw new Error('Database not initialized');
    const orderId = 'ORD_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    const orderRef = doc(db, 'food_orders', orderId);

    let calculatedTotal = 0;
    try {
      await runTransaction(db, async (transaction) => {
        for (const item of cartItems) {
           const itemRef = doc(db, 'restaurant_menu', item.id);
           const itemDoc = await transaction.get(itemRef);
           if (!itemDoc.exists()) throw new Error(\`Item \${item.name} not available\`);
           const data = itemDoc.data();
           if (data.price !== item.price) throw new Error(\`Price mismatch for \${item.name}\`);
           calculatedTotal += data.price * item.quantity;
        }
        const finalTotal = calculatedTotal + 40; 
        if (paymentDetails.expectedTotal !== finalTotal) throw new Error('Checksum mismatch.');
        
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
      console.warn('Checkout validation error', err);
      return { success: false, error: err.message };
    }
  }
}
`;

code = code.replace(/\}\n*export const FoodServiceInstance/, newMethod + "\nexport const FoodServiceInstance");

fs.writeFileSync('src/services/food/FoodService.ts', code);
