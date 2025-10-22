import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';

export default function Analytics() {
  const [period, setPeriod] = useState('week');

  const readingStats = {
    totalTime: 1250, // minutes
    booksCompleted: 3,
    pagesRead: 450,
    currentStreak: 7,
    longestStreak: 14
  };

  const weeklyData = [
    { day: 'Mon', minutes: 45, pages: 30 },
    { day: 'Tue', minutes: 60, pages: 40 },
    { day: 'Wed', minutes: 30, pages: 20 },
    { day: 'Thu', minutes: 75, pages: 50 },
    { day: 'Fri', minutes: 90, pages: 60 },
    { day: 'Sat', minutes: 120, pages: 80 },
    { day: 'Sun', minutes: 100, pages: 70 }
  ];

  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes));

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
          {[
            { label: 'Reading Time', value: `${Math.floor(readingStats.totalTime / 60)}h ${readingStats.totalTime % 60}m`, icon: 'ri-time-line', color: 'blue' },
            { label: 'Books Completed', value: readingStats.booksCompleted, icon: 'ri-book-line', color: 'green' },
            { label: 'Pages Read', value: readingStats.pagesRead, icon: 'ri-file-list-line', color: 'purple' },
            { label: 'Current Streak', value: `${readingStats.currentStreak} days`, icon: 'ri-fire-line', color: 'orange' },
            { label: 'Longest Streak', value: `${readingStats.longestStreak} days`, icon: 'ri-trophy-line', color: 'yellow' }
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
          ))}
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
            <button className="text-blue-600 hover:text-purple-600 font-semibold">
              <i className="ri-add-line mr-1"></i>
              Set Goal
            </button>
          </div>

          <div className="space-y-6">
            {[
              { goal: 'Read 5 books this month', current: 3, target: 5, unit: 'books' },
              { goal: 'Read 30 minutes daily', current: 210, target: 210, unit: 'minutes' },
              { goal: 'Finish 500 pages this week', current: 350, target: 500, unit: 'pages' }
            ].map((goal, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{goal.goal}</span>
                  <span className="text-sm text-gray-600">
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${(goal.current / goal.target) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
