import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronRight, Trash2, X, Edit2, ChevronLeft, Mic, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRecordsByDateRange, deleteRecord, updateRecord } from '@/lib/db';
import { getMonthHolidays, type HolidayInfo } from '@/lib/holidays';
import { getEmotionIcon, getEmotionColor } from '@/lib/emotions';
import type { EmotionRecord } from '@/types';

export function HistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<EmotionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTranscript, setEditTranscript] = useState('');
  const [holidays, setHolidays] = useState<Map<number, HolidayInfo>>(new Map());

  useEffect(() => {
    loadRecords();
    const monthHolidays = getMonthHolidays(selectedDate.getFullYear(), selectedDate.getMonth());
    setHolidays(monthHolidays);
  }, [selectedDate, viewMode]);

  const loadRecords = async () => {
    const userId = localStorage.getItem('pulse_user_id');
    if (!userId) return;

    let startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    if (viewMode === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
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

  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
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

  const getRecordsForDate = (date: Date) => {
    return records.filter(r => new Date(r.createdAt).toDateString() === date.toDateString());
  };

  const handleRecordNow = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            기록 보기
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'
              }`}
            >
              월간
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <span className="font-medium text-base">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
            {viewMode === 'weekly' && ` ${getDaysInWeek(selectedDate)[0].getDate()}일 - ${getDaysInWeek(selectedDate)[6].getDate()}일`}
          </span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div key={day} className={`text-xs mb-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
              {day}
            </div>
          ))}
          {(viewMode === 'weekly' ? getDaysInWeek(selectedDate) : getCalendarDays()).map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dateRecords = getRecordsForDate(date);
            const hasRecord = dateRecords.length > 0;
            const holiday = holidays.get(date.getDate());
            const isSunday = date.getDay() === 0;
            const isSaturday = date.getDay() === 6;

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center relative p-1
                  ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-gray-100'}
                  ${isToday ? 'font-bold' : ''}
                `}
              >
                <span className={`text-xs leading-none ${
                  holiday || isSunday ? 'text-red-500' : 
                  isSaturday ? 'text-blue-500' : 
                  'text-gray-700'
                }`}>
                  {date.getDate()}
                </span>
                {holiday && (
                  <span className="text-[8px] text-red-400 truncate w-full text-center leading-none mt-0.5">
                    {holiday.name.length > 3 ? holiday.name.slice(0, 3) : holiday.name}
                  </span>
                )}
                {hasRecord && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dateRecords.slice(0, 3).map((r, idx) => (
                      <span key={idx} className="text-[10px] leading-none">
                        {getEmotionIcon(r.emotions?.primary)}
                      </span>
                    ))}
                    {dateRecords.length > 3 && (
                      <span className="text-[8px] text-gray-400">+{dateRecords.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">
            {formatDate(selectedDate)}
          </h2>
          <button
            onClick={handleRecordNow}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            <Mic className="w-4 h-4" />
            녹음하기
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : getRecordsForDate(selectedDate).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 mb-3">이 날의 기록이 없습니다</p>
            <button
              onClick={handleRecordNow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              기록 추가하기
            </button>
          </div>
        ) : (
          getRecordsForDate(selectedDate).map(record => (
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
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${getEmotionColor(record.emotions?.primary)}`}>
                  {getEmotionIcon(record.emotions?.primary)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 line-clamp-2 text-sm">{record.transcript}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(record.createdAt)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>

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
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getEmotionColor(selectedRecord.emotions?.primary)}`}>
                      {getEmotionIcon(selectedRecord.emotions?.primary)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {formatDate(selectedRecord.createdAt)}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTime(selectedRecord.createdAt)}
                      </p>
                    </div>
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
                    className="w-full h-40 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-200 resize-none mb-4"
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
                        className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
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
                        className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
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
