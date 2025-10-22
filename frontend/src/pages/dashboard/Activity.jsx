import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useActivity } from '../../hooks';
import { ActivitySkeleton } from '../../components/SkeletonLoader';

export default function Activity() {
  const { activities, loading, hasMore, loadMore } = useActivity();

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
            {loading ? (
              [...Array(5)].map((_, i) => <ActivitySkeleton key={i} />)
            ) : activities.length > 0 ? (
              activities.map((activity, index) => (
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
            ))
            ) : (
              <div className="text-center py-12">
                <i className="ri-time-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">No activities yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <button 
              onClick={loadMore}
              className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Load More Activities
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
