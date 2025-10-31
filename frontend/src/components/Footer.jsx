import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <i className="ri-book-line text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold font-pacifico">ReadnWin</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The ultimate digital and social reading platform that promotes the reading culture amongst young African youths through incentive programs.
            </p>
            <div className="flex space-x-4">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <motion.a
                  key={social}
                  whileHover={{ scale: 1.1, y: -2 }}
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <i className={`ri-${social}-fill text-lg`}></i>
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          <div className="lg:col-span-2"></div>
          
          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <h3 className="text-lg font-semibold mb-4">Legal & Info</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 ReadnWin. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
        
        {/* Created with Love */}
        <div className="border-t border-gray-800 mt-4 pt-4 flex justify-center">
          <p className="text-gray-400 text-sm flex items-center space-x-1">
            <span>Created with</span>
            <motion.i
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ri-heart-fill text-red-500"
            />
            <span>by</span>
            <a
              href="tel:+2347062750516"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              ScaleITPro
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
