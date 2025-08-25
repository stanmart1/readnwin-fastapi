'use client';

import { RiQuestionLine, RiFolderLine, RiEyeLine, RiTimeLine } from 'react-icons/ri';

interface FAQStatsProps {
  stats: {
    total_faqs: number;
    total_categories: number;
    total_views: number;
    recent_faqs?: any[];
  };
}

export default function FAQStats({ stats }: FAQStatsProps) {
  const statCards = [
    {
      title: 'Total FAQs',
      value: stats.total_faqs,
      icon: RiQuestionLine,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Categories',
      value: stats.total_categories,
      icon: RiFolderLine,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Views',
      value: stats.total_views,
      icon: RiEyeLine,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Recent FAQs',
      value: stats.recent_faqs?.length || 0,
      icon: RiTimeLine,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color} bg-opacity-10`}>
              <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 