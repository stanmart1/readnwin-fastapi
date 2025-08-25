
'use client';

import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      title: 'Continue Reading',
      description: 'Pick up where you left off',
      icon: 'ri-book-open-line',
      href: '/reading',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Browse Books',
      description: 'Discover new favorites',
      icon: 'ri-search-line',
      href: '/books',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'My Library',
      description: 'View your collection',
      icon: 'ri-book-line',
      href: '/reading',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Reading Goals',
      description: 'Track your progress',
      icon: 'ri-target-line',
      href: '#goals',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`${action.color} text-white p-4 rounded-lg transition-colors cursor-pointer group`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className={`${action.icon} text-xl`}></i>
              </div>
              <div>
                <h3 className="font-medium text-sm whitespace-nowrap">{action.title}</h3>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
