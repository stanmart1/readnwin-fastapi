import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useAnalytics } from '../../hooks';
import { StatCardSkeleton } from '../../components/SkeletonLoader';
import api from '../../lib/api';

export default function Analytics() {
  const [period, setPeriod] = useState('week');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    goal_type: 'books',
    target_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const { stats, weeklyData, goals, loading, createGoal, refetch } = useAnalytics(period);
  const [deletingGoalId, setDeletingGoalId] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const maxMinutes = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.minutes || 0)) : 100;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      
      if (result.completed) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      
      showToast('Reading goal created successfully!');
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleEditGoal = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reading-goals/${editingGoal.id}`, {
        target_value: parseInt(editingGoal.target_value),
        end_date: new Date(editingGoal.end_date).toISOString()
      });
      setEditingGoal(null);
      refetch();
      showToast('Goal updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update goal', 'error');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      setDeletingGoalId(goalId);
      await api.delete(`/reading-goals/${goalId}`);
      refetch();
      showToast('Goal deleted successfully!');
    } catch (err) {
      showToast('Failed to delete goal', 'error');
    } finally {
      setDeletingGoalId(null);
    }
  };

  const getStatusBadge = (goal) => {
    const progress = (goal.current / goal.target) * 100;
    const now = new Date();
    const endDate = new Date(goal.end_date);
    
    if (progress >= 100) return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    if (now > endDate) return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  };

  const getGoalTypeLabel = (type) => {
    const labels = {
      books: 'Books to Read',
      pages: 'Pages to Read',
      minutes: 'Reading Time (minutes)',
      streak: 'Reading Streak'
    };
    return labels[type] || type;
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Reading Time</h2>
          <div className="space-y-4">
            {weeklyData.length > 0 ? weeklyData.map((day, index) => (
              <div key={day.day} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium text-gray-600">{day.day}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  {day.minutes > 0 ? (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full flex items-center justify-end pr-3"
                    >
                      <span className="text-white text-sm font-semibold">{day.minutes}m</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400 text-xs">No reading time</span>
                    </div>
                  )}
                </div>
                <span className="w-16 text-sm text-gray-600">{day.pages} pages</span>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">No reading data available yet. Start reading to see your progress!</p>
            )}
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
            {goals.length > 0 ? goals.map((goal) => {
              const status = getStatusBadge(goal);
              const progress = Math.min((goal.current / goal.target) * 100, 100);
              
              return (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{getGoalTypeLabel(goal.goal)}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{getDaysRemaining(goal.end_date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit goal"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        disabled={deletingGoalId === goal.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete goal"
                      >
                        {deletingGoalId === goal.id ? (
                          <i className="ri-loader-4-line animate-spin text-lg"></i>
                        ) : (
                          <i className="ri-delete-bin-line text-lg"></i>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{progress.toFixed(0)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12">
                <i className="ri-trophy-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reading Goals Yet</h3>
                <p className="text-gray-500 mb-6">Set goals to track your reading progress and stay motivated!</p>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  Create Your First Goal
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Edit Goal Modal */}
        {editingGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold mb-4">Edit Goal</h3>
              <form onSubmit={handleEditGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target</label>
                  <input
                    type="number"
                    value={editingGoal.target}
                    onChange={(e) => setEditingGoal({...editingGoal, target: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={editingGoal.end_date?.split('T')[0]}
                    onChange={(e) => setEditingGoal({...editingGoal, end_date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
                  >
                    Update Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
                      <div className="font-semibold mb-1">Books</div>
                      <div className="text-sm text-gray-600">Number of books to complete</div>
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
                      <div className="font-semibold mb-1">Pages</div>
                      <div className="text-sm text-gray-600">Total pages to read</div>
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
                      <div className="font-semibold mb-1">Minutes</div>
                      <div className="text-sm text-gray-600">Reading time in minutes</div>
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
                      <div className="font-semibold mb-1">Streak</div>
                      <div className="text-sm text-gray-600">Consecutive days reading</div>
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

        {/* Toast Notification */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <i className={`${toast.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} text-xl`}></i>
            <span>{toast.message}</span>
          </motion.div>
        )}

        {/* Celebration Animation */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: 2 }}
              >
                <i className="ri-trophy-line text-9xl text-yellow-500"></i>
              </motion.div>
              <h2 className="text-4xl font-bold text-gray-900 mt-4">Goal Completed! 🎉</h2>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
