import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg"
    >
      <div className="flex items-center gap-1.5">
        <Flame className={`w-6 h-6 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
        <span className="text-xl font-bold text-gray-800">{currentStreak}</span>
      </div>
      
      <div className="w-px h-6 bg-gray-200" />
      
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{longestStreak}</span>일 최고기록
      </div>
    </motion.div>
  );
}
