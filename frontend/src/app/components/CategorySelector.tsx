import React from 'react';

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Категории событий</h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition
              ${selectedCategory === category 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }
            `}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;