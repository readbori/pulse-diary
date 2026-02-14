import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Trash2, User, FileText, Info, Zap, Download, Upload, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings, getProfile, saveProfile } from '@/lib/db';
import { exportBackup, importBackup } from '@/lib/backup';
import { useAuth } from '@/contexts/AuthContext';

import type { UserSettings, UserProfile } from '@/types';

export function SettingsPage() {
  const { user, linkGoogleAccount, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [backupResult, setBackupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isLocalUser = !user && localStorage.getItem('pulse_auth_type') !== 'google';

  const handleLinkGoogle = async () => {
    try {
      setIsLinking(true);
      await linkGoogleAccount();
    } catch (error) {
      console.error('Google 연동 실패:', error);
      showToast('연동에 실패했습니다. 다시 시도해주세요.');
      setIsLinking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      showToast('로그아웃에 실패했습니다.');
    }
  };

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
      <div className="max-w-md mx-auto pt-16 px-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-indigo-600" />
          설정
        </h1>

      <main className="space-y-4">
        {isLocalUser && (
          <section className="bg-gradient-to-r from-indigo-50 to-teal-50 rounded-2xl p-5 shadow-sm border border-indigo-100/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Shield className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">데이터를 안전하게 보관하세요</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  구글 계정을 연동하면 기록이 클라우드에 자동 백업됩니다.
                  기기를 변경해도 데이터가 유지돼요.
                </p>
                <button
                  onClick={handleLinkGoogle}
                  disabled={isLinking}
                  className="w-full py-2.5 bg-white rounded-xl text-sm font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLinking ? (
                    <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  구글 계정 연동하기
                </button>
              </div>
            </div>
          </section>
        )}

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
                {user
                  ? ' 구글 계정으로 연동되어 클라우드에 안전하게 백업됩니다.'
                  : ' 모든 데이터는 기기에만 저장되며 외부 서버로 전송되지 않습니다.'}
              </p>
            </div>
          </div>
        </section>

        {user && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-500" />
              계정
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium">{user.email}</p>
                  <p className="text-xs text-teal-600">구글 계정 연동됨</p>
                </div>
                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-teal-500" />
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center gap-2 border border-gray-100 rounded-xl hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </section>
        )}
      </main>
      </div>

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
