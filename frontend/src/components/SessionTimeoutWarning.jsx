import { motion, AnimatePresence } from 'framer-motion';

export default function SessionTimeoutWarning({ show, timeRemaining, onExtend, onLogout }) {
  if (!show) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <i className="ri-time-line text-2xl text-yellow-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Session Expiring Soon</h3>
              <p className="text-sm text-gray-600">Your session is about to expire</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-center text-gray-700 mb-2">
              You will be logged out in:
            </p>
            <div className="text-center">
              <span className="text-4xl font-bold text-yellow-600">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onExtend}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Stay Logged In
            </button>
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Logout Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
