import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useFood } from './FoodContext';
import { FoodItem } from '../../types';

export const CustomizationModal: React.FC = React.memo(() => {
  const { customizationDish, setCustomizationDish, addToCart, selectedRestaurant } = useFood();

  // Selected state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [nestedAddons, setNestedAddons] = useState<any[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Spicy'>('Medium');

  // Dynamic high-fidelity options generator for Pizza, Biryanis, Burgers, etc.
  const dynamicOptions = useMemo(() => {
    if (!customizationDish) return null;
    
    if (customizationDish.variants && customizationDish.addonGroups) {
      return {
        variants: customizationDish.variants,
        addonGroups: customizationDish.addonGroups
      };
    }
    
    const nameLower = customizationDish.name.toLowerCase();
    const isPizza = nameLower.includes('pizza') || nameLower.includes('pie');
    const isBiryani = nameLower.includes('biryani') || nameLower.includes('spiced rice');
    const isBurger = nameLower.includes('burger') || nameLower.includes('sandwich');
                     
    if (isPizza) {
      return {
        variants: [
          { id: 'v_s', name: 'Small (7")', additionalPrice: 0, inStock: true },
          { id: 'v_m', name: 'Medium (9")', additionalPrice: 120, inStock: true },
          { id: 'v_l', name: 'Large (12")', additionalPrice: 240, inStock: true }
        ],
        addonGroups: [
          {
            id: 'g_crust',
            name: 'Select Crust (Required)',
            minSelect: 1,
            maxSelect: 1,
            addons: [
              { id: 'cr_thin', name: 'Classic Thin Crust', price: 0, inStock: true },
              { id: 'cr_wheat', name: 'Whole Wheat Crust', price: 20, inStock: true },
              { id: 'cr_burst', name: 'Cheeseburst Crust', price: 75, inStock: true }
            ]
          },
          {
            id: 'g_cheese',
            name: 'Extra Cheese & Sauces',
            minSelect: 0,
            maxSelect: 3,
            addons: [
              { 
                id: 'ch_mozz', 
                name: 'Extra Mozzarella Cheese', 
                price: 45, 
                inStock: true,
                nestedAddons: [
                  { id: 'ch_stuff', name: 'Stuffed Crust Edge', price: 30, inStock: true }
                ]
              },
              { id: 'ch_cheddar', name: 'Creamy Cheddar Dip', price: 25, inStock: true },
              { id: 'ch_jalapeno', name: 'Spicy Garlic Sauce', price: 35, inStock: true }
            ]
          }
        ]
      };
    } else if (isBiryani) {
      return {
        variants: [
          { id: 'v_half', name: 'Half Serving', additionalPrice: 0, inStock: true },
          { id: 'v_full', name: 'Full Serving (Serves 2)', additionalPrice: 110, inStock: true }
        ],
        addonGroups: [
          {
            id: 'g_extra',
            name: 'Add Extra Portions',
            minSelect: 0,
            maxSelect: 3,
            addons: [
              { id: 'ex_meat', name: 'Extra Topping Cubes', price: 80, inStock: true },
              { id: 'ex_egg', name: 'Boiled Egg (Single)', price: 15, inStock: true },
              { id: 'ex_raita', name: 'Creamy Yogurt Raita', price: 10, inStock: true }
            ]
          }
        ]
      };
    } else if (isBurger) {
      return {
        variants: [
          { id: 'v_single', name: 'Single Patty', additionalPrice: 0, inStock: true },
          { id: 'v_double', name: 'Double Patty Combo', additionalPrice: 60, inStock: true }
        ],
        addonGroups: [
          {
            id: 'g_burger_addons',
            name: 'Extra Burger Fillings',
            minSelect: 0,
            maxSelect: 4,
            addons: [
              { id: 'b_cheese', name: 'Salty Melted Cheese', price: 25, inStock: true },
              { id: 'b_jalapeno', name: 'Pickled Jalapenos', price: 15, inStock: true },
              { id: 'b_patty', name: 'Crispy Extra Patty', price: 35, inStock: true }
            ]
          }
        ]
      };
    }
    
    // Default fallback matching the original UI list exactly
    return {
      variants: [],
      addonGroups: [
        {
          id: 'g_general_addons',
          name: 'Select Extra Add-ons',
          minSelect: 0,
          maxSelect: 4,
          addons: [
            { id: 'a_cheese', name: 'Extra Cheese 🧀', price: 40, inStock: true },
            { id: 'a_peri', name: 'Spicy peri peri sprinkle 🌶️', price: 15, inStock: true },
            { id: 'a_coke', name: 'Fresh cold Coke can 🥤', price: 45, inStock: true },
            { id: 'a_garlic', name: 'Thick Garlic Dip 🧄', price: 20, inStock: true }
          ]
        }
      ]
    };
  }, [customizationDish]);

  // Set default variant and required groups on open
  useEffect(() => {
    if (dynamicOptions) {
      if (dynamicOptions.variants.length > 0) {
        setSelectedVariant(dynamicOptions.variants[0]);
      } else {
        setSelectedVariant(null);
      }

      // Automatically preselect first addon of required groups
      const initialAddons: any[] = [];
      dynamicOptions.addonGroups.forEach(group => {
        if (group.minSelect > 0 && group.addons.length > 0) {
          initialAddons.push(group.addons[0]);
        }
      });
      setSelectedAddons(initialAddons);
      setNestedAddons([]);
    }
  }, [dynamicOptions]);

  const toggleAddon = useCallback((addon: any, group: any) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.id === addon.id);
      
      if (group.maxSelect === 1) {
        // Single choice selection (radio style)
        const filtered = prev.filter(a => !group.addons.some((gAddon: any) => gAddon.id === a.id));
        return [...filtered, addon];
      } else {
        if (exists) {
          // Check if we need to clean nested addons
          if (addon.nestedAddons) {
            setNestedAddons(nestPrev => nestPrev.filter(n => !addon.nestedAddons.some((na: any) => na.id === n.id)));
          }
          return prev.filter(a => a.id !== addon.id);
        } else {
          return [...prev, addon];
        }
      }
    });
  }, []);

  const toggleNestedAddon = useCallback((nestedAddon: any) => {
    setNestedAddons(prev => 
      prev.some(na => na.id === nestedAddon.id) 
        ? prev.filter(na => na.id !== nestedAddon.id)
        : [...prev, nestedAddon]
    );
  }, []);

  const totalExtraPrice = useMemo(() => {
    let price = 0;
    if (selectedVariant) {
      price += selectedVariant.additionalPrice;
    }
    selectedAddons.forEach(a => {
      price += a.price;
    });
    nestedAddons.forEach(na => {
      price += na.price;
    });
    return price;
  }, [selectedVariant, selectedAddons, nestedAddons]);

  const handleClose = useCallback(() => {
    setCustomizationDish(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
    setNestedAddons([]);
    setSpiceLevel('Medium');
  }, [setCustomizationDish]);

  const handleAdd = useCallback(() => {
    if (!customizationDish) return;
    
    const cheapestDeal = [...customizationDish.platformDeals].sort((a, b) => {
      const netA = a.price + a.deliveryFee - a.discount;
      const netB = b.price + b.deliveryFee - b.discount;
      return netA - netB;
    })[0];

    // Build human customized name representation
    const selections: string[] = [];
    if (selectedVariant) {
      selections.push(selectedVariant.name);
    }
    selections.push(spiceLevel);
    selectedAddons.forEach(a => {
      selections.push(a.name);
    });
    nestedAddons.forEach(na => {
      selections.push(na.name);
    });

    const customizedItemName = `${customizationDish.name} (${selections.join(', ')})`;
    
    const item: FoodItem = {
      id: `${customizationDish.id}_custom_${Date.now()}`,
      name: customizedItemName,
      restaurant: selectedRestaurant?.name || 'Restaurant',
      platform: cheapestDeal.platform,
      price: cheapestDeal.price + totalExtraPrice,
      deliveryFee: cheapestDeal.deliveryFee,
      discount: cheapestDeal.discount,
      deliveryTime: cheapestDeal.deliveryTime,
      rating: cheapestDeal.rating,
      image: customizationDish.image,
      isVeg: customizationDish.isVeg
    };

    addToCart(item);
    handleClose();
  }, [customizationDish, selectedVariant, spiceLevel, selectedAddons, nestedAddons, totalExtraPrice, selectedRestaurant, addToCart, handleClose]);

  if (!customizationDish || !dynamicOptions) return null;

  return (
    <div id="customization-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div id="customization-modal" className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black font-mono text-amber-600 uppercase tracking-widest block">Enterprise Customization</span>
            <h3 className="text-sm font-black text-slate-900 line-clamp-1">{customizationDish.name}</h3>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Variants */}
          {dynamicOptions.variants.length > 0 && (
            <div className="space-y-2">
              <span className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">Choose Variant</span>
              <div className="grid grid-cols-2 gap-2">
                {dynamicOptions.variants.map((v: any) => {
                  const isSel = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`py-2 px-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">{v.name}</span>
                      <span className="text-[10px] font-mono opacity-80 mt-1">
                        {v.additionalPrice > 0 ? `+₹${v.additionalPrice}` : 'Base Price'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level */}
          <div className="space-y-2">
            <span className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">Select Spice Level</span>
            <div className="grid grid-cols-3 gap-2">
              {(['Mild', 'Medium', 'Spicy'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpiceLevel(level)}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                    spiceLevel === level
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons groups */}
          {dynamicOptions.addonGroups.map((group: any) => (
            <div key={group.id} className="space-y-2">
              <span className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">{group.name}</span>
              <div className="space-y-2">
                {group.addons.map((addon: any) => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <div key={addon.id} className="space-y-2">
                      <div
                        onClick={() => toggleAddon(addon, group)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-50/20' 
                            : 'border-slate-150 hover:border-slate-250 bg-white'
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-800">{addon.name}</span>
                        <div className="flex items-center space-x-2.5 font-mono">
                          {addon.price > 0 && <span className="text-xs text-slate-500 font-bold">+₹{addon.price}</span>}
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {/* Nested Addons Renderer */}
                      {isSelected && addon.nestedAddons && addon.nestedAddons.length > 0 && (
                        <div className="pl-6 border-l-2 border-slate-100 space-y-2 py-1 animate-in slide-in-from-left-2 duration-200">
                          <span className="block text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Configure {addon.name}</span>
                          {addon.nestedAddons.map((na: any) => {
                            const isNaSelected = nestedAddons.some(n => n.id === na.id);
                            return (
                              <div
                                key={na.id}
                                onClick={() => toggleNestedAddon(na)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isNaSelected 
                                    ? 'border-amber-400 bg-amber-50/10' 
                                    : 'border-slate-100 hover:border-slate-200 bg-white'
                                }`}
                              >
                                <span className="text-[11px] font-bold text-slate-700">{na.name}</span>
                                <div className="flex items-center space-x-2 font-mono">
                                  {na.price > 0 && <span className="text-[10px] text-slate-500 font-bold">+₹{na.price}</span>}
                                  <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition ${
                                    isNaSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-250 bg-white'
                                  }`}>
                                    {isNaSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Dynamic total</span>
            <span className="text-base font-black text-slate-900 font-mono">
              ₹{([...customizationDish.platformDeals].sort((a,b)=> (a.price+a.deliveryFee-a.discount) - (b.price+b.deliveryFee-b.discount))[0]?.price || 0) + totalExtraPrice}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-2xl cursor-pointer shadow-md transition uppercase tracking-wider"
          >
            Add to List ➔
          </button>
        </div>
      </div>
    </div>
  );
});

CustomizationModal.displayName = 'CustomizationModal';
