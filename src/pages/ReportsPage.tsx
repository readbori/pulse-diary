import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Settings, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getReports, getAllRecords } from '@/lib/db';
import type { WeeklyReport } from '@/types';

export function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordCount, setRecordCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = localStorage.getItem('pulse_user_id');
    if (!userId) return;

    const [reportsData, recordsData] = await Promise.all([
      getReports(userId),
      getAllRecords(userId)
    ]);

    setReports(reportsData);
    setRecordCount(recordsData.length);
    setLoading(false);
  };

  const handleCheckNow = () => {
    setShowAnalysisModal(true);
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            리포트
          </h1>
          <button
            onClick={handleCheckNow}
            disabled={recordCount === 0}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              recordCount > 0
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            지금 분석하기
          </button>
        </div>

        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-sm text-center"
          >
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              아직 리포트가 없어요
            </h2>
            <p className="text-gray-500 mb-6">
              일주일간 감정을 기록하면<br/>
              AI가 리포트를 만들어드려요
            </p>
            
            <div className="bg-indigo-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">정하신 날짜에 리포트가 도착해요</span>
              </div>
              <p className="text-xs text-indigo-600">
                일별, 주간별, 월간별로 리포트를 받을 수 있어요
              </p>
            </div>

            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              리포트 설정하기
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">정하신 날짜에 리포트가 도착해요</span>
                </div>
                <Link
                  to="/settings"
                  className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
                >
                  설정
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate('/history')}
                  className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      {formatDateRange(report.weekStart, report.weekEnd)}
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      {report.recordCount}개 기록
                    </span>
                  </div>

                  <div className="space-y-3">
                    {report.content.summary && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">감정 요약</h3>
                        <p className="text-gray-700 text-sm">{report.content.summary}</p>
                      </div>
                    )}
                    
                    {report.content.empathy && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">위로의 말</h3>
                        <p className="text-gray-700 text-sm">{report.content.empathy}</p>
                      </div>
                    )}

                    {report.content.suggestions && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">다음 주 제안</h3>
                        <p className="text-gray-700 text-sm">{report.content.suggestions}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end text-xs text-indigo-600">
                    <span>기록 보기</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnalysisModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 relative z-10 text-center"
            >
              {isAnalyzing ? (
                <div className="py-8">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-indigo-100 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full"
                    />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    AI가 기록을 분석중입니다
                  </h3>
                  <p className="text-gray-500">
                    잠시만 기다려주세요...
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    분석이 완료되었습니다!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    (데모 버전에서는 실제 분석이 수행되지 않습니다)
                  </p>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                  >
                    확인
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
