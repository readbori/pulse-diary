import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

const PRIVACY_CONTENT = `Pulse Diary 개인정보처리방침

1. 수집하는 개인정보
- 구글 로그인 시: 이메일 주소, 프로필 이름
- 서비스 이용 시: 음성 녹음 텍스트, 감정 분석 결과, 사용자 설정

2. 개인정보의 이용 목적
- 감정 기록 저장 및 분석 서비스 제공
- AI 기반 감정 리포트 생성
- 서비스 개선 및 사용자 경험 최적화

3. 개인정보의 보관 및 파기
- 게스트 모드: 모든 데이터는 사용자 기기에만 저장됩니다
- 클라우드 동기화: 구글 계정 연동 시 암호화된 상태로 클라우드에 저장됩니다
- 회원 탈퇴 시 모든 개인정보는 즉시 파기됩니다

4. 개인정보의 제3자 제공
- 사용자의 개인정보는 제3자에게 제공되지 않습니다
- AI 분석을 위해 텍스트 데이터가 처리될 수 있으나, 개인 식별 정보는 포함되지 않습니다

5. 이용자의 권리
- 개인정보 열람, 수정, 삭제 요청 가능
- 설정 페이지에서 데이터 내보내기/삭제 가능

문의: support@pulsediary.app`;

const TERMS_CONTENT = `Pulse Diary 이용약관

1. 서비스 소개
Pulse Diary는 음성 기반 감정 기록 및 AI 분석 서비스입니다.

2. 이용 조건
- 만 14세 이상 이용 가능
- 서비스는 개인 용도로만 사용 가능합니다

3. 서비스 이용
- 무료 이용: 기본 음성 기록 및 주간 리포트
- 프리미엄: 고급 AI 분석 및 무제한 리포트 (₩13,900 평생 이용권)

4. 콘텐츠 권리
- 사용자가 기록한 콘텐츠의 저작권은 사용자에게 있습니다
- AI 분석 결과는 서비스 제공 목적으로만 사용됩니다

5. 서비스 변경 및 중단
- 서비스 내용은 사전 공지 후 변경될 수 있습니다
- 천재지변 등 불가항력적 사유 시 서비스가 중단될 수 있습니다

6. 면책사항
- AI 분석 결과는 참고용이며, 전문적인 심리 상담을 대체하지 않습니다
- 서비스 이용으로 인한 간접적 손해에 대해 책임지지 않습니다

7. 분쟁 해결
- 서비스 이용과 관련된 분쟁은 대한민국 법률에 따릅니다

시행일: 2025년 1월 1일`;

export function PrivacyModal({ isOpen, onClose, initialTab = 'privacy' }: PrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header / Tabs */}
              <div className="flex border-b border-gray-100 mt-2">
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex-1 py-5 text-sm font-semibold transition-colors relative ${
                    activeTab === 'privacy' 
                      ? 'text-gray-900' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  개인정보처리방침
                  {activeTab === 'privacy' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 mx-8"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`flex-1 py-5 text-sm font-semibold transition-colors relative ${
                    activeTab === 'terms' 
                      ? 'text-gray-900' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  이용약관
                  {activeTab === 'terms' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 mx-8"
                    />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="prose prose-sm prose-gray max-w-none"
                >
                  <div className="whitespace-pre-wrap text-gray-600 leading-relaxed font-sans">
                    {activeTab === 'privacy' ? PRIVACY_CONTENT : TERMS_CONTENT}
                  </div>
                </motion.div>
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
