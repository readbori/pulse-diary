import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50/50 to-teal-50/50"
    >
      <div className="text-center space-y-6 max-w-md">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-9xl font-black gradient-text tracking-tighter"
        >
          404
        </motion.h1>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-gray-800">
            페이지를 찾을 수 없어요
          </h2>
          <p className="text-gray-500 font-medium">
            요청하신 페이지가 존재하지 않거나 이동되었습니다
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-white rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all duration-300 text-gray-700 font-semibold group"
          >
            <Home className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>홈으로 돌아가기</span>
          </Link>
        </motion.div>
      </div>

      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl mix-blend-multiply animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl mix-blend-multiply animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>
    </motion.div>
  );
}
