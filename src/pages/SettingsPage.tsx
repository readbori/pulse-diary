import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Trash2, User, ChevronRight, Moon, Sun, Globe, Shield, Info } from 'lucide-react';
import { getSettings, saveSettings, getProfile, saveProfile } from '@/lib/db';
import type { UserSettings, UserProfile } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

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

    if (loadedSettings) setSettings(loadedSettings);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-6 py-6 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">설정</h1>
      </header>

      <main className="p-6 space-y-6">
        {/* Profile Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            내 프로필
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">이름</label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">직업/상황</label>
              <select
                value={profile?.occupation || ''}
                onChange={(e) => handleProfileChange('occupation', e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-200"
              >
                {['학생', '직장인', '프리랜서', '주부', '취업준비생', '기타'].map(job => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-500" />
            알림 설정
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">매일 기록 알림</span>
              <button
                onClick={() => handleSettingChange('dailyReminderEnabled', !settings?.dailyReminderEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings?.dailyReminderEnabled ? 'bg-purple-500' : 'bg-gray-200'
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
                <div className="flex items-center justify-between mb-3">
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

        {/* Weekly Report */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            주간 리포트
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">리포트 발행 알림</span>
              <button
                onClick={() => handleSettingChange('weeklyReportEnabled', !settings?.weeklyReportEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings?.weeklyReportEnabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  settings?.weeklyReportEnabled ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            데이터 관리
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">오디오 자동 삭제</span>
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
              <p className="text-xs text-gray-400 mt-2">
                30일이 지난 오디오 파일은 자동으로 삭제되어 용량을 확보합니다.
                (텍스트 기록은 유지됩니다)
              </p>
            )}
          </div>
        </section>

        {/* App Info */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
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

      {/* Toast Notification */}
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
