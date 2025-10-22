import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';

export default function Activity() {
  const activities = [
    {
      id: 1,
      type: 'completed',
      title: 'Completed "The Great Gatsby"',
      description: 'Finished reading in 5 days',
      time: '2 hours ago',
      icon: 'ri-check-line',
      color: 'green'
    },
    {
      id: 2,
      type: 'review',
      title: 'Posted a review',
      description: 'Reviewed "1984" - 5 stars',
      time: '5 hours ago',
      icon: 'ri-star-line',
      color: 'yellow'
    },
    {
      id: 3,
      type: 'started',
      title: 'Started reading',
      description: 'Began "To Kill a Mockingbird"',
      time: '1 day ago',
      icon: 'ri-book-open-line',
      color: 'blue'
    },
    {
      id: 4,
      type: 'milestone',
      title: 'Reading milestone',
      description: 'Read 100 pages this week!',
      time: '2 days ago',
      icon: 'ri-trophy-line',
      color: 'purple'
    },
    {
      id: 5,
      type: 'purchase',
      title: 'Purchased new book',
      description: 'Added "Pride and Prejudice" to library',
      time: '3 days ago',
      icon: 'ri-shopping-bag-line',
      color: 'pink'
    },
    {
      id: 6,
      type: 'streak',
      title: '7-day reading streak!',
      description: 'Keep up the great work',
      time: '3 days ago',
      icon: 'ri-fire-line',
      color: 'orange'
    },
    {
      id: 7,
      type: 'completed',
      title: 'Completed "Brave New World"',
      description: 'Finished reading in 7 days',
      time: '5 days ago',
      icon: 'ri-check-line',
      color: 'green'
    },
    {
      id: 8,
      type: 'goal',
      title: 'Goal achieved',
      description: 'Read 5 books this month',
      time: '1 week ago',
      icon: 'ri-flag-line',
      color: 'blue'
    }
  ];

  const getIconBg = (color) => {
    const colors = {
      green: 'bg-green-100',
      yellow: 'bg-yellow-100',
      blue: 'bg-blue-100',
      purple: 'bg-purple-100',
      pink: 'bg-pink-100',
      orange: 'bg-orange-100'
    };
    return colors[color] || 'bg-gray-100';
  };

  const getIconColor = (color) => {
    const colors = {
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      pink: 'text-pink-600',
      orange: 'text-orange-600'
    };
    return colors[color] || 'text-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Feed</h1>
          <p className="text-gray-600">Your recent reading activities and achievements</p>
        </div>

        {/* Activity Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Activities */}
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-16"
              >
                {/* Icon */}
                <div className={`absolute left-0 w-12 h-12 ${getIconBg(activity.color)} rounded-full flex items-center justify-center`}>
                  <i className={`${activity.icon} text-xl ${getIconColor(activity.color)}`}></i>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{activity.title}</h3>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-gray-600">{activity.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
            Load More Activities
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
