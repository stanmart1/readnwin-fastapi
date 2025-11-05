import { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    error: 'bg-gradient-to-r from-red-500 to-red-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  };

  const icons = {
    success: 'ri-checkbox-circle-fill',
    error: 'ri-error-warning-fill',
    info: 'ri-information-fill',
    warning: 'ri-alert-fill'
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className={`${styles[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[280px] sm:min-w-[320px] max-w-md`}>
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <i className={`${icons[type]} text-lg sm:text-xl`}></i>
        </div>
        <p className="flex-1 text-sm sm:text-base font-medium">{message}</p>
        <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1.5 transition-colors flex-shrink-0">
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
