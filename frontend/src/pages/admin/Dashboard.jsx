import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminLayout from '../../components/AdminLayout';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Users', value: '1,234', change: '+12%', icon: 'ri-user-line', color: 'bg-blue-500' },
    { label: 'Total Books', value: '5,678', change: '+8%', icon: 'ri-book-line', color: 'bg-green-500' },
    { label: 'Active Orders', value: '89', change: '+23%', icon: 'ri-shopping-cart-line', color: 'bg-purple-500' },
    { label: 'Revenue', value: '$12,345', change: '+15%', icon: 'ri-money-dollar-circle-line', color: 'bg-yellow-500' },
  ];

  const trendData = [
    { date: 'Jan', sales: 4000, orders: 240 },
    { date: 'Feb', sales: 3000, orders: 198 },
    { date: 'Mar', sales: 5000, orders: 320 },
    { date: 'Apr', sales: 4500, orders: 280 },
    { date: 'May', sales: 6000, orders: 390 },
    { date: 'Jun', sales: 5500, orders: 350 },
  ];

  const dailyActivity = [
    { day: 'Mon', active: 120, orders: 45 },
    { day: 'Tue', active: 150, orders: 52 },
    { day: 'Wed', active: 180, orders: 61 },
    { day: 'Thu', active: 140, orders: 48 },
    { day: 'Fri', active: 200, orders: 70 },
    { day: 'Sat', active: 160, orders: 55 },
    { day: 'Sun', active: 130, orders: 42 },
  ];

  const recentActivities = [
    { text: 'New user registered', time: '2 min ago', icon: 'ri-user-add-line', color: 'text-blue-600 bg-blue-100' },
    { text: 'Order #1234 completed', time: '15 min ago', icon: 'ri-checkbox-circle-line', color: 'text-green-600 bg-green-100' },
    { text: 'New book added', time: '1 hour ago', icon: 'ri-book-add-line', color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your ReadnWin platform</p>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
              <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center">
              <i className="ri-refresh-line mr-2"></i>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform transition-transform duration-200"
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <i className={`${stat.icon} text-white text-xl`}></i>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                  <p className="text-sm text-green-600 truncate">{stat.change} from last month</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Growth Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                      name === 'sales' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={2} name="sales" />
                  <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      value.toLocaleString(),
                      name === 'active' ? 'Active Users' : 'Orders'
                    ]}
                  />
                  <Bar dataKey="active" fill="#3B82F6" name="active" />
                  <Bar dataKey="orders" fill="#10B981" name="orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Last 7 days</span>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                  <i className={`${activity.icon} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
