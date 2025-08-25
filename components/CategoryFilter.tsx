'use client';

import { useState } from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  className = '' 
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryIcons: { [key: string]: string } = {
    'all': 'ri-apps-line',
    'fiction': 'ri-book-open-line',
    'non-fiction': 'ri-file-text-line',
    'self-help': 'ri-heart-line',
    'personal finance': 'ri-money-dollar-circle-line',
    'romance': 'ri-heart-fill',
    'thriller': 'ri-shield-line',
    'science fiction': 'ri-rocket-line',
    'fantasy': 'ri-magic-line',
    'historical fiction': 'ri-time-line',
    'psychology': 'ri-brain-line',
    'biography': 'ri-user-line',
    'business': 'ri-briefcase-line',
    'cooking': 'ri-restaurant-line',
    'travel': 'ri-map-pin-line',
    'children': 'ri-child-line',
    'young adult': 'ri-user-star-line',
    'poetry': 'ri-quill-pen-line',
    'philosophy': 'ri-lightbulb-line',
    'religion': 'ri-prayer-line'
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, isExpanded ? categories.length : 8).map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <i className={`${categoryIcons[category] || 'ri-book-line'} text-sm`}></i>
            <span className="text-sm">
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </button>
        ))}
        
        {categories.length > 8 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-4 py-2 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 cursor-pointer"
          >
            <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-line text-sm`}></i>
            <span className="text-sm">{isExpanded ? 'Show Less' : 'Show More'}</span>
          </button>
        )}
      </div>
    </div>
  );
} 