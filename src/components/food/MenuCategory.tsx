import React from 'react';
import { useFood } from './FoodContext';
import { MenuItem } from './MenuItem';

interface MenuCategoryProps {
  category: {
    name: string;
    items: any[];
  };
}

export const MenuCategory: React.FC<MenuCategoryProps> = React.memo(({ category }) => {
  const { dietFilter } = useFood();

  const matchedCategoryItems = React.useMemo(() => {
    return category.items.filter(it => 
      dietFilter === 'All' || it.dietType === dietFilter
    );
  }, [category.items, dietFilter]);

  if (matchedCategoryItems.length === 0) return null;

  return (
    <div className="space-y-2.5 font-sans">
      <h4 className="text-[11px] font-black uppercase text-rose-850 tracking-wider bg-rose-50/50 px-3 py-1 rounded-lg w-fit border border-rose-100/60 font-mono">
        ✦ {category.name} ({matchedCategoryItems.length})
      </h4>

      <div className="space-y-3">
        {matchedCategoryItems.map(dish => (
          <MenuItem key={dish.id} dish={dish} />
        ))}
      </div>
    </div>
  );
});

MenuCategory.displayName = 'MenuCategory';
