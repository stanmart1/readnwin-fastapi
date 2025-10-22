import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useAnalytics } from '../../hooks';
import { StatCardSkeleton } from '../../components/SkeletonLoader';

export default function Analytics() {
  const [period, setPeriod] = useState('week');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    goal_type: 'books',
    target_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const { stats, weeklyData, goals, loading, createGoal } = useAnalytics(period);

  const maxMinutes = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.minutes || 0)) : 100;

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    const result = await createGoal({
      ...goalForm,
      target_value: parseInt(goalForm.target_value),
      start_date: new Date(goalForm.start_date).toISOString(),
      end_date: new Date(goalForm.end_date).toISOString()
    });
    
    if (result.success) {
      setShowGoalModal(false);
      setGoalForm({
        goal_type: 'books',
        target_value: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
    } else {
      alert(result.error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reading Analytics</h1>
            <p className="text-gray-600">Track your reading progress and habits</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  period === p
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {loading ? (
            [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            [
              { 
                label: 'Reading Time', 
                value: stats?.total_time ? `${Math.floor(stats.total_time / 60)}h ${stats.total_time % 60}m` : '0m', 
                icon: 'ri-time-line', 
                color: 'blue' 
              },
              { label: 'Books Completed', value: stats?.books_completed || 0, icon: 'ri-book-line', color: 'green' },
              { label: 'Pages Read', value: stats?.pages_read || 0, icon: 'ri-file-list-line', color: 'purple' },
              { label: 'Current Streak', value: `${stats?.current_streak || 0} days`, icon: 'ri-fire-line', color: 'orange' },
              { label: 'Longest Streak', value: `${stats?.longest_streak || 0} days`, icon: 'ri-trophy-line', color: 'yellow' }
            ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <i className={`${stat.icon} text-2xl text-${stat.color}-600`}></i>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          )))}
        </div>

        {/* Reading Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Reading Time</h2>
          <div className="space-y-4">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium text-gray-600">{day.day}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full flex items-center justify-end pr-3"
                  >
                    <span className="text-white text-sm font-semibold">{day.minutes}m</span>
                  </motion.div>
                </div>
                <span className="w-16 text-sm text-gray-600">{day.pages} pages</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reading Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Reading Goals</h2>
            <button 
              onClick={() => setShowGoalModal(true)}
              className="text-blue-600 hover:text-purple-600 font-semibold"
            >
              <i className="ri-add-line mr-1"></i>
              Set Goal
            </button>
          </div>

          <div className="space-y-6">
            {goals.length > 0 ? goals.map((goal, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{goal.title || goal.goal}</span>
                  <span className="text-sm text-gray-600">
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-4">No reading goals set yet</p>
            )}
          </div>
        </motion.div>

        {/* Goal Creation Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">Set Reading Goal</h3>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Goal Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGoalForm({...goalForm, goal_type: 'books'})}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        goalForm.goal_type === 'books' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold mb-1">Annual Books</div>
                      <div className="text-sm text-gray-600">Number of books to read in a year</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalForm({...goalForm, goal_type: 'pages'})}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        goalForm.goal_type === 'pages' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold mb-1">Monthly Pages</div>
                      <div className="text-sm text-gray-600">Number of pages to read per month</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalForm({...goalForm, goal_type: 'streak'})}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        goalForm.goal_type === 'streak' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold mb-1">Reading Streak</div>
                      <div className="text-sm text-gray-600">Consecutive days of reading</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalForm({...goalForm, goal_type: 'minutes'})}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        goalForm.goal_type === 'minutes' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold mb-1">Daily Hours</div>
                      <div className="text-sm text-gray-600">Hours of reading per day</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target</label>
                  <input
                    type="number"
                    value={goalForm.target_value}
                    onChange={(e) => setGoalForm({...goalForm, target_value: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., 10"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={goalForm.start_date}
                    onChange={(e) => setGoalForm({...goalForm, start_date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={goalForm.end_date}
                    onChange={(e) => setGoalForm({...goalForm, end_date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                    min={goalForm.start_date}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
