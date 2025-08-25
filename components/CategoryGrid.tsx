
'use client';

import Link from 'next/link';

export default function CategoryGrid() {
  const categories = [
    {
      id: 'fiction',
      name: 'Fiction',
      description: 'Novels, stories, and literature',
      icon: 'ri-book-open-line',
      color: 'bg-blue-100 text-blue-600',
      image: 'https://readdy.ai/api/search-image?query=fiction%20books%20collection%2C%20literary%20novels%2C%20classic%20literature%2C%20bookshelf%20with%20novels%2C%20warm%20lighting%2C%20cozy%20reading%20atmosphere&width=300&height=200&seq=category-1&orientation=landscape'
    },
    {
      id: 'non-fiction',
      name: 'Non-Fiction',
      description: 'Biographies, history, and facts',
      icon: 'ri-file-text-line',
      color: 'bg-green-100 text-green-600',
      image: 'https://readdy.ai/api/search-image?query=non-fiction%20books%20collection%2C%20educational%20books%2C%20biography%20section%2C%20informational%20texts%2C%20professional%20library%20setting&width=300&height=200&seq=category-2&orientation=landscape'
    },
    {
      id: 'self-help',
      name: 'Self-Help',
      description: 'Personal development & growth',
      icon: 'ri-user-heart-line',
      color: 'bg-purple-100 text-purple-600',
      image: 'https://readdy.ai/api/search-image?query=self-help%20books%20collection%2C%20personal%20development%2C%20motivational%20books%2C%20success%20and%20growth%20themes%2C%20inspiring%20library%20setup&width=300&height=200&seq=category-3&orientation=landscape'
    },
    {
      id: 'mystery',
      name: 'Mystery',
      description: 'Thrillers, crime, and suspense',
      icon: 'ri-spy-line',
      color: 'bg-red-100 text-red-600',
      image: 'https://readdy.ai/api/search-image?query=mystery%20thriller%20books%20collection%2C%20crime%20novels%2C%20suspense%20stories%2C%20dark%20atmospheric%20setting%2C%20detective%20fiction%20bookshelf&width=300&height=200&seq=category-4&orientation=landscape'
    },
    {
      id: 'romance',
      name: 'Romance',
      description: 'Love stories and relationships',
      icon: 'ri-heart-line',
      color: 'bg-pink-100 text-pink-600',
      image: 'https://readdy.ai/api/search-image?query=romance%20novels%20collection%2C%20love%20stories%2C%20relationship%20books%2C%20romantic%20literature%2C%20soft%20pastel%20bookshelf%2C%20elegant%20setting&width=300&height=200&seq=category-5&orientation=landscape'
    },
    {
      id: 'sci-fi',
      name: 'Sci-Fi',
      description: 'Science fiction and fantasy',
      icon: 'ri-rocket-line',
      color: 'bg-indigo-100 text-indigo-600',
      image: 'https://readdy.ai/api/search-image?query=science%20fiction%20books%20collection%2C%20fantasy%20novels%2C%20futuristic%20themes%2C%20space%20and%20technology%2C%20modern%20bookshelf%20with%20sci-fi%20titles&width=300&height=200&seq=category-6&orientation=landscape'
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Categories</h2>
          <p className="text-lg text-gray-600">Discover books across different genres and topics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${category.id}`}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mb-3`}>
                      <i className={`${category.icon} text-xl`}></i>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-200">{category.description}</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Browse Collection</span>
                    <i className="ri-arrow-right-line text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
