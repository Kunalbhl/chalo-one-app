import { UnifiedCart, UnifiedMenuItem, CartItem, ProviderId, MenuVariant, MenuAddon } from '../../models/UnifiedModels';

export class UnifiedCartService {
  private cart: UnifiedCart = {
    masterCartId: `cart_${Date.now()}`,
    userId: '',
    providerCarts: {} as any,
    totalSubtotal: 0,
    totalFees: 0,
    totalTaxes: 0,
    totalDiscounts: 0,
    grandTotal: 0
  };

  private notifyListeners: ((cart: UnifiedCart) => void)[] = [];

  subscribe(listener: (cart: UnifiedCart) => void) {
    this.notifyListeners.push(listener);
    return () => {
      this.notifyListeners = this.notifyListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.calculateMasterTotals();
    this.notifyListeners.forEach(l => l({...this.cart}));
  }

  getCart(): UnifiedCart {
    return { ...this.cart };
  }

  addItem(menuItem: UnifiedMenuItem, quantity: number = 1, variant?: MenuVariant, addons: MenuAddon[] = []) {
    const provider = menuItem.provider;
    
    if (!this.cart.providerCarts[provider]) {
      this.cart.providerCarts[provider] = {
        provider,
        items: [],
        subtotal: 0,
        packingFee: 0,
        platformFee: 0,
        deliveryFee: 0,
        taxes: 0,
        couponsApplied: [],
        discountAmount: 0,
        total: 0,
        estimatedDeliveryTime: 30
      };
    }

    const providerCart = this.cart.providerCarts[provider];
    
    // Check if item exists
    const existingItem = providerCart.items.find(i => 
      i.menuItem.itemId === menuItem.itemId && 
      i.selectedVariant?.id === variant?.id
    );

    const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
    const itemPrice = (variant ? variant.price : menuItem.price) + addonTotal;

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalItemPrice = existingItem.quantity * itemPrice;
    } else {
      providerCart.items.push({
        cartItemId: `ci_${Date.now()}_${0.5}`,
        menuItem,
        quantity,
        selectedVariant: variant,
        selectedAddons: addons,
        totalItemPrice: quantity * itemPrice
      });
    }

    this.calculateProviderTotals(provider);
    this.notify();
  }

  removeItem(cartItemId: string, provider: ProviderId) {
    const providerCart = this.cart.providerCarts[provider];
    if (!providerCart) return;

    providerCart.items = providerCart.items.filter(i => i.cartItemId !== cartItemId);
    
    if (providerCart.items.length === 0) {
      delete this.cart.providerCarts[provider];
    } else {
      this.calculateProviderTotals(provider);
    }
    this.notify();
  }

  private calculateProviderTotals(provider: ProviderId) {
    const providerCart = this.cart.providerCarts[provider];
    if (!providerCart) return;

    providerCart.subtotal = providerCart.items.reduce((sum, item) => sum + item.totalItemPrice, 0);
    providerCart.packingFee = 15;
    providerCart.platformFee = 5;
    providerCart.deliveryFee = 40;
    providerCart.taxes = providerCart.subtotal * 0.05;
    
    providerCart.total = providerCart.subtotal + 
      providerCart.packingFee + 
      providerCart.platformFee + 
      providerCart.deliveryFee + 
      providerCart.taxes - 
      providerCart.discountAmount;
  }

  private calculateMasterTotals() {
    this.cart.totalSubtotal = 0;
    this.cart.totalFees = 0;
    this.cart.totalTaxes = 0;
    this.cart.totalDiscounts = 0;
    this.cart.grandTotal = 0;

    Object.values(this.cart.providerCarts).forEach(pc => {
      this.cart.totalSubtotal += pc.subtotal;
      this.cart.totalFees += (pc.packingFee + pc.platformFee + pc.deliveryFee);
      this.cart.totalTaxes += pc.taxes;
      this.cart.totalDiscounts += pc.discountAmount;
      this.cart.grandTotal += pc.total;
    });
  }

  clearCart() {
    this.cart.providerCarts = {} as any;
    this.calculateMasterTotals();
    this.notify();
  }
}

export const UnifiedCartInstance = new UnifiedCartService();
