import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getAllRecords, getStreak } from '@/lib/db';
import type { EmotionRecord, StreakData } from '@/types';

const DEMO_USER_ID = 'demo-user';

export function StatsPage() {
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [recordsData, streakData] = await Promise.all([
        getAllRecords(DEMO_USER_ID),
        getStreak(DEMO_USER_ID)
      ]);
      setRecords(recordsData);
      setStreak(streakData || null);
      setLoading(false);
    };
    loadData();
  }, []);

  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = records.filter(r => 
        new Date(r.createdAt).toISOString().split('T')[0] === dateStr
      );
      data.push({
        day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
        count: dayRecords.length,
        date: dateStr
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();
  const totalRecords = records.length;
  const thisWeekRecords = chartData.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-600" />
          통계
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">이번 주</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{thisWeekRecords}</p>
            <p className="text-sm text-gray-400">기록</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">연속 기록</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{streak?.currentStreak || 0}</p>
            <p className="text-sm text-gray-400">일</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">최고 기록</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{streak?.longestStreak || 0}</p>
            <p className="text-sm text-gray-400">일 연속</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">총 기록</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalRecords}</p>
            <p className="text-sm text-gray-400">개</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            최근 7일 기록
          </h2>
          
          {thisWeekRecords === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">아직 이번 주 기록이 없어요</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`${value}개 기록`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
