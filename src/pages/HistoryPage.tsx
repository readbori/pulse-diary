import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronRight, Trash2, X, Edit2, ChevronLeft } from 'lucide-react';
import { getRecordsByDateRange, deleteRecord, updateRecord } from '@/lib/db';
import type { EmotionRecord } from '@/types';

export function HistoryPage() {
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<EmotionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTranscript, setEditTranscript] = useState('');

  useEffect(() => {
    loadRecords();
  }, [selectedDate, viewMode]);

  const loadRecords = async () => {
    const userId = localStorage.getItem('pulse_user_id');
    if (!userId) return;

    let startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    if (viewMode === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    const data = await getRecordsByDateRange(userId, startDate, endDate);
    setRecords(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteRecord(id);
      setRecords(records.filter(r => r.id !== id));
      setSelectedRecord(null);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRecord) return;
    
    const updatedRecord = { ...selectedRecord, transcript: editTranscript };
    await updateRecord(updatedRecord);
    setRecords(records.map(r => r.id === selectedRecord.id ? updatedRecord : r));
    setIsEditing(false);
    setSelectedRecord(updatedRecord);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const getDaysInWeek = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(current.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (delta * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-6 py-6 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-violet-600" />
            기록 보기
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'monthly' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'
              }`}
            >
              월간
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <span className="font-medium text-lg">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
            {viewMode === 'weekly' && ` ${getDaysInWeek(selectedDate)[0].getDate()}일 - ${getDaysInWeek(selectedDate)[6].getDate()}일`}
          </span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className={`grid ${viewMode === 'weekly' ? 'grid-cols-7' : 'grid-cols-7'} gap-1 text-center`}>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-xs text-gray-400 mb-2">{day}</div>
          ))}
          {(viewMode === 'weekly' ? getDaysInWeek(selectedDate) : getDaysInMonth(selectedDate)).map((date, i) => {
            // Add empty cells for monthly view start padding
            if (viewMode === 'monthly' && i === 0) {
               const startDay = date.getDay();
               // This logic is simplified, might need proper grid placement
            }
            
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const hasRecord = records.some(r => new Date(r.createdAt).toDateString() === date.toDateString());

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square rounded-full flex flex-col items-center justify-center relative
                  ${isSelected ? 'bg-violet-100 text-violet-600 font-bold' : 'hover:bg-gray-100'}
                  ${isToday ? 'border border-violet-400' : ''}
                `}
              >
                <span className="text-sm">{date.getDate()}</span>
                {hasRecord && <div className="w-1 h-1 bg-violet-500 rounded-full mt-1" />}
              </button>
            );
          })}
        </div>
      </header>

      <main className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {formatDate(selectedDate)}의 기록
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : records.filter(r => new Date(r.createdAt).toDateString() === selectedDate.toDateString()).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">기록이 없습니다</p>
          </div>
        ) : (
          records
            .filter(r => new Date(r.createdAt).toDateString() === selectedDate.toDateString())
            .map(record => (
              <motion.div
                key={record.id}
                layoutId={record.id}
                onClick={() => {
                  setSelectedRecord(record);
                  setEditTranscript(record.transcript);
                  setIsEditing(false);
                }}
                className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              >
                <p className="text-gray-700 line-clamp-2 mb-2">{record.transcript}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(record.createdAt)}
                  </div>
                  {record.emotions?.primary && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {record.emotions.primary}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedRecord.id}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {formatDate(selectedRecord.createdAt)}
                    </h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(selectedRecord.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={editTranscript}
                    onChange={(e) => setEditTranscript(e.target.value)}
                    className="w-full h-40 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-violet-200 resize-none mb-4"
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl mb-6 min-h-[100px]">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.transcript}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="flex-1 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors"
                      >
                        저장하기
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 py-3 bg-violet-50 text-violet-600 rounded-xl font-medium hover:bg-violet-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(selectedRecord.id)}
                        className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
