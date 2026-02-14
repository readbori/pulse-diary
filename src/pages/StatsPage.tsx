import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Flame, ArrowRight, Lock, Crown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getAllRecords, getStreak } from '@/lib/db';
import { getUserTier } from '@/lib/user';
import { emotionLabels, emotionDotColors, emotionGradients, getEmotionLabel, getEmotionDotColor, normalizeEmotion } from '@/lib/emotions';
import { EmotionIcon } from '@/components/EmotionIcon';
import type { EmotionRecord, StreakData, EmotionType } from '@/types';


export function StatsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('pulse_user_id');
      if (!userId) return;
      
      const [recordsData, streakData] = await Promise.all([
        getAllRecords(userId),
        getStreak(userId)
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

  const getEmotionDistribution = () => {
    const distribution: Record<string, number> = {};
    records.forEach(r => {
      const raw = r.emotions?.primary || 'calm';
      const emotion = normalizeEmotion(raw) || 'calm';
      distribution[emotion] = (distribution[emotion] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .map(([emotion, count]) => ({
        name: getEmotionLabel(emotion),
        value: count,
        emotion: emotion as EmotionType,
        color: getEmotionDotColor(emotion),
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getMostFrequentEmotion = () => {
    const distribution = getEmotionDistribution();
    return distribution.length > 0 ? distribution[0] : null;
  };

  const getRecentRecords = () => {
    return records.slice(0, 5);
  };

  const chartData = getLast7DaysData();
  const emotionData = getEmotionDistribution();
  const mostFrequent = getMostFrequentEmotion();
  const totalRecords = records.length;
  const thisWeekRecords = chartData.reduce((sum, d) => sum + d.count, 0);
  const userTier = getUserTier();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pl-16 pr-4 py-20 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          통계
        </h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">이번 주</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{thisWeekRecords}</p>
            <p className="text-xs text-gray-400">기록</p>
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
            <p className="text-2xl font-bold text-gray-800">{streak?.currentStreak || 0}</p>
            <p className="text-xs text-gray-400">일</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-teal-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">최고 기록</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{streak?.longestStreak || 0}</p>
            <p className="text-xs text-gray-400">일 연속</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sky-500 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">총 기록</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalRecords}</p>
            <p className="text-xs text-gray-400">개</p>
          </motion.div>
        </div>

        {mostFrequent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={`bg-gradient-to-br ${emotionGradients[mostFrequent.emotion] || 'from-indigo-500 to-teal-500'} rounded-2xl p-5 shadow-sm mb-6 text-white`}
          >
            <p className="text-sm opacity-80 mb-2">가장 많이 느낀 감정</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 shadow-inner flex items-center justify-center">
                 <EmotionIcon emotion={mostFrequent.emotion} size={24} className="w-10 h-10 bg-transparent shadow-none" />
              </div>
              <div>
                <p className="text-xl font-bold">{mostFrequent.name}</p>
                <p className="text-sm opacity-80">{mostFrequent.value}번 기록됨</p>
              </div>
            </div>
          </motion.div>
        )}

        {emotionData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-5 shadow-sm mb-6"
          >
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              감정 분포
            </h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {emotionData.slice(0, 4).map((item, index) => (
                  <div key={item.emotion} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{item.value}회</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upsell 1: Curiosity Gap - After Pie Chart */}
        {userTier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white rounded-2xl p-5 shadow-sm mb-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">심층 감정 패턴 분석</h3>
              <p className="text-sm text-gray-500 mb-4">프리미엄에서 더 깊은 패턴을 발견하세요</p>
              <button 
                onClick={() => navigate('/settings')}
                className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                잠금 해제하기
              </button>
            </div>
            
            {/* Fake Content for Blur Effect */}
            <div className="filter blur-[3px] opacity-50 pointer-events-none select-none">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                심층 감정 패턴
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">주요 감정 트리거</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="w-3/4 h-full bg-indigo-400 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">감정 회복 탄력성</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/2 h-full bg-teal-400 rounded-full"></div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    최근 30일간의 데이터를 분석한 결과, 저녁 시간에 불안감이 상승하는 패턴이 보입니다...
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-6"
        >
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            최근 7일 기록
          </h2>
          
          {thisWeekRecords === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400">아직 이번 주 기록이 없어요</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: 12
                  }}
                  formatter={(value) => [`${value}개 기록`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Upsell 2: Loss Aversion - Below 7 Days Chart */}
        {userTier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mb-6 rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          >
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="w-4 h-4 text-purple-500 fill-purple-100" />
                  <span className="text-xs font-bold text-purple-600">프리미엄 리포트</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  프리미엄 회원은 30일 감정 추세와<br/>AI 인사이트를 받아보세요
                </p>
              </div>
              <button 
                onClick={() => navigate('/settings')}
                className="shrink-0 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                보기
              </button>
            </div>
          </motion.div>
        )}

        {getRecentRecords().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                최근 기록
              </h2>
              <button
                onClick={() => navigate('/history')}
                className="text-sm text-indigo-600 flex items-center gap-1 hover:underline"
              >
                전체보기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {getRecentRecords().map((record) => (
                <button
                  key={record.id}
                  onClick={() => navigate('/history')}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                >
                  <EmotionIcon 
                    emotion={record.emotions?.primary} 
                    size={16} 
                    className="w-7 h-7" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{record.transcript}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(record.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
