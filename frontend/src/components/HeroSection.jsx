import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const floatingBooks = [
    { id: 1, title: 'Bestseller', image: 'https://picsum.photos/seed/book1/400/600', position: 'top-20 left-10' },
    { id: 2, title: 'New Release', image: 'https://picsum.photos/seed/book2/400/600', position: 'bottom-20 left-10' },
    { id: 3, title: "Editor's Pick", image: 'https://picsum.photos/seed/book3/400/600', position: 'top-20 right-10' },
    { id: 4, title: 'Must Read', image: 'https://picsum.photos/seed/book4/400/600', position: 'bottom-20 right-10' }
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden max-w-full">
      {/* Darker Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900"></div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-full">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-white"
          >
            <span className="block">Your favorite book could</span>
            <span className="block">win you amazing PRIZES!</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Join our community of students and book lovers around the world. We thrive to promote the reading culture via incentive programs in African schools.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link 
              to="/signup" 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 px-8 py-4 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              Get Started
            </Link>
            <Link to="/books" className="btn-secondary flex items-center justify-center space-x-2">
              <i className="ri-book-line text-lg"></i>
              <span>Browse Collection</span>
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Floating Books */}
      {floatingBooks.map((book, index) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
          className={`absolute hidden md:block ${book.position}`}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
            className="relative group"
          >
            <motion.img
              whileHover={{ scale: 1.1, rotate: 2 }}
              src={book.image}
              alt={book.title}
              className="w-36 h-48 object-cover rounded-lg shadow-2xl"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
              {book.title}
            </div>
          </motion.div>
        </motion.div>
      ))}
      
      {/* Decorative Elements */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
          className={`absolute w-${3 + i} h-${3 + i} bg-white/20 rounded-full`}
          style={{
            top: `${25 + i * 25}%`,
            left: `${25 + i * 15}%`
          }}
        />
      ))}
    </div>
  );
}
