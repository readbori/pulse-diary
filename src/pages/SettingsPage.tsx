import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Trash2, User, FileText, Info, Sparkles, Zap, Download, Upload } from 'lucide-react';
import { getSettings, saveSettings, getProfile, saveProfile } from '@/lib/db';
import { exportBackup, importBackup } from '@/lib/backup';
import { getUserTier, setUserTier, getAIModelInfo, type UserTier } from '@/lib/user';
import type { UserSettings, UserProfile } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<UserTier>(getUserTier());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupResult, setBackupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = localStorage.getItem('pulse_user_id');
    if (!userId) return;

    const [loadedSettings, loadedProfile] = await Promise.all([
      getSettings(userId),
      getProfile(userId)
    ]);

    if (loadedSettings) {
      setSettings({
        ...loadedSettings,
        reportFrequency: loadedSettings.reportFrequency || 'weekly',
        maxReportsPerWeek: loadedSettings.maxReportsPerWeek || 1
      });
    }
    if (loadedProfile) setProfile(loadedProfile);
    setLoading(false);
  };

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    showToast('설정이 저장되었습니다');
  };

  const handleProfileChange = async (key: keyof UserProfile, value: any) => {
    if (!profile) return;

    const newProfile = { ...profile, [key]: value, updatedAt: new Date() };
    setProfile(newProfile);
    await saveProfile(newProfile);
    showToast('프로필이 업데이트되었습니다');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleTierChange = (tier: UserTier) => {
    setUserTier(tier);
    setCurrentTier(tier);
    showToast(`${tier === 'free' ? '무료' : '프리미엄'} 등급으로 전환되었습니다`);
  };

  const handleExportBackup = async () => {
    const userId = localStorage.getItem('pulse_user_id');
    if (!userId) {
      const errorMessage = '사용자 정보를 찾을 수 없습니다.';
      setBackupResult({ type: 'error', message: errorMessage });
      showToast(errorMessage);
      return;
    }

    try {
      setIsExporting(true);
      setBackupResult(null);
      await exportBackup(userId);
      const successMessage = '백업 파일이 다운로드되었습니다';
      setBackupResult({ type: 'success', message: successMessage });
      showToast(successMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '백업 내보내기에 실패했습니다.';
      setBackupResult({ type: 'error', message: errorMessage });
      showToast(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    try {
      setIsImporting(true);
      setBackupResult(null);
      const result = await importBackup(selectedFile);
      const successMessage = `${result.records}개의 기록과 ${result.reports}개의 리포트를 복구했습니다`;
      setBackupResult({ type: 'success', message: successMessage });
      showToast(successMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '백업 가져오기에 실패했습니다.';
      setBackupResult({ type: 'error', message: errorMessage });
      showToast(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          설정
        </h1>
      </header>

      <main className="p-4 space-y-4">
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            내 프로필
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">이름</label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">MBTI</label>
              <select
                value={profile?.mbti || ''}
                onChange={(e) => handleProfileChange('mbti', e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">선택안함</option>
                {(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'] as const).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">직업/상황</label>
              <select
                value={profile?.occupation || ''}
                onChange={(e) => handleProfileChange('occupation', e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-200"
              >
                {['학생', '직장인', '프리랜서', '주부', '취업준비생', '기타'].map(job => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-500" />
            알림 설정
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-sm">매일 기록 알림</span>
              <button
                onClick={() => handleSettingChange('dailyReminderEnabled', !settings?.dailyReminderEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings?.dailyReminderEnabled ? 'bg-teal-500' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  settings?.dailyReminderEnabled ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
            
            {settings?.dailyReminderEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="pt-2 border-t border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">알림 시간</span>
                  <input
                    type="time"
                    value={settings?.dailyReminderTime || '21:00'}
                    onChange={(e) => handleSettingChange('dailyReminderTime', e.target.value)}
                    className="bg-gray-50 p-2 rounded-lg text-sm"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            리포트 설정
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-sm">리포트 알림</span>
              <button
                onClick={() => handleSettingChange('weeklyReportEnabled', !settings?.weeklyReportEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings?.weeklyReportEnabled ? 'bg-indigo-500' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  settings?.weeklyReportEnabled ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {settings?.weeklyReportEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4 pt-2 border-t border-gray-100"
              >
                <div>
                  <label className="block text-sm text-gray-500 mb-2">리포트 주기</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'daily', label: '매일' },
                      { value: 'weekly', label: '주간' },
                      { value: 'monthly', label: '월간' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSettingChange('reportFrequency', option.value)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                          settings?.reportFrequency === option.value
                            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                            : 'bg-gray-50 text-gray-600 border-2 border-transparent'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    주간 최대 리포트 횟수
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleSettingChange('maxReportsPerWeek', num)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          settings?.maxReportsPerWeek === num
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    일주일에 최대 {settings?.maxReportsPerWeek || 1}회까지 리포트를 받을 수 있어요
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">발송 요일</span>
                  <select
                    value={settings?.weeklyReportDay || 0}
                    onChange={(e) => handleSettingChange('weeklyReportDay', parseInt(e.target.value))}
                    className="bg-gray-50 p-2 rounded-lg text-sm"
                  >
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                      <option key={i} value={i}>{day}요일</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            데이터 관리
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-sm">오디오 자동 삭제</span>
              <button
                onClick={() => handleSettingChange('autoDeleteAudio', !settings?.autoDeleteAudio)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings?.autoDeleteAudio ? 'bg-red-500' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  settings?.autoDeleteAudio ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
            {settings?.autoDeleteAudio && (
              <p className="text-xs text-gray-400">
                30일이 지난 오디오 파일은 자동으로 삭제됩니다. (텍스트는 유지)
              </p>
            )}

            <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
              <p className="text-sm font-medium text-gray-700">백업 및 복구</p>
              <p className="text-xs text-gray-400">
                모든 감정 기록, 리포트, 설정을 JSON 파일로 내보내거나 복구할 수 있습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleExportBackup}
                  disabled={isExporting || isImporting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  내보내기
                </button>

                <label
                  className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-teal-50 text-teal-600 hover:bg-teal-100 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isImporting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  가져오기
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    disabled={isExporting || isImporting}
                    onChange={handleImport}
                  />
                </label>
              </div>

              {backupResult && (
                <p
                  className={`text-xs ${backupResult.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {backupResult.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI 분석 등급
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTierChange('free')}
                className={`p-4 rounded-xl text-left transition-all border-2 ${
                  currentTier === 'free'
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-semibold text-gray-800">Free</span>
                </div>
                <p className="text-xs text-gray-500">기본 AI 분석</p>
                <p className="text-xs text-gray-400">무료 제공</p>
              </button>
              <button
                onClick={() => setShowPremiumModal(true)}
                className={`p-4 rounded-xl text-left transition-all border-2 ${
                  currentTier === 'premium' || currentTier === 'advanced'
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-800">Premium</span>
                </div>
                <p className="text-xs text-gray-500">고급 심리 분석 AI</p>
                <p className="text-xs text-gray-400">프리미엄 전용</p>
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">
                현재 등급: <span className="font-semibold text-gray-700">{currentTier === 'free' ? '무료' : '프리미엄'}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            앱 정보
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>버전</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>개발사</span>
              <span className="font-medium">Pulse Diary Team</span>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                Pulse Diary는 사용자의 개인정보를 소중히 다룹니다.
                모든 데이터는 기기에만 저장되며 외부 서버로 전송되지 않습니다.
              </p>
            </div>
          </div>
        </section>
      </main>
      </div>

      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremiumModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-1">프리미엄으로 업그레이드</h3>
                <p className="text-sm text-white/80">더 깊은 감정 분석을 경험하세요</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">고급 심리 분석 AI</p>
                      <p className="text-xs text-gray-500">더 정확하고 깊이 있는 감정 분석 제공</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">무제한 감정 리포트</p>
                      <p className="text-xs text-gray-500">일별, 주간별, 월간별 상세 리포트</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">맞춤 성장 상담</p>
                      <p className="text-xs text-gray-500">나의 감정 히스토리 기반 누적 성장 코칭</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleTierChange('premium');
                    setShowPremiumModal(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg"
                >
                  프리미엄 시작하기
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full py-2 mt-2 text-gray-400 text-sm"
                >
                  나중에 할게요
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
