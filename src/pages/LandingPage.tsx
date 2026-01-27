import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, Heart, BarChart3, Calendar, MessageCircle, Sparkles, ChevronRight, Star, Shield, Zap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-lg relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-rose-300 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl rotate-12"
          >
            <Heart className="w-12 h-12 text-white -rotate-12" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-text">Pulse Diary</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-3 font-emotional"
          >
            AI가 기억하는 나의 감정 아카이브
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 mb-10 leading-relaxed"
          >
            매일 30초, 음성으로 감정을 기록하세요.<br />
            AI가 당신의 마음을 이해하고 함께 성장해요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-4"
          >
            <Link
              to={localStorage.getItem('pulse_user_id') ? "/home" : "/onboarding"}
              className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 text-white rounded-2xl font-medium text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              무료로 시작하기
            </Link>
            
            <p className="text-sm text-gray-400">
              가입 없이 바로 사용 가능
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 animate-bounce"
        >
          <ChevronRight className="w-6 h-6 text-gray-300 rotate-90" />
        </motion.div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-800 mb-12"
          >
            왜 <span className="gradient-text">Pulse Diary</span>인가요?
          </motion.h2>

          <div className="space-y-6">
            {[
              {
                icon: Mic,
                title: '30초면 충분해요',
                desc: '텍스트로 쓸 필요 없이, 버튼 하나로 음성 기록',
                color: 'from-purple-400 to-violet-400'
              },
              {
                icon: MessageCircle,
                title: '지금 바로 상담',
                desc: '주 5회 무료 AI 상담으로 즉시 마음 케어',
                color: 'from-pink-400 to-rose-400'
              },
              {
                icon: BarChart3,
                title: '감정 패턴 발견',
                desc: 'AI가 분석한 주간 리포트로 나를 이해하기',
                color: 'from-amber-400 to-orange-400'
              },
              {
                icon: Shield,
                title: '완전한 프라이버시',
                desc: '모든 데이터는 기기에만 저장, 서버 전송 없음',
                color: 'from-emerald-400 to-teal-400'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl soft-shadow"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-purple-50/50">
        <div className="max-w-lg mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-gray-800 mb-8"
          >
            심플한 가격
          </motion.h2>

          <div className="grid gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 bg-white rounded-2xl soft-shadow"
            >
              <h3 className="font-semibold text-gray-800 mb-2">무료</h3>
              <p className="text-3xl font-bold text-gray-800 mb-4">₩0</p>
              <ul className="text-sm text-gray-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  무제한 음성 기록
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  주간 AI 리포트
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  주 5회 즉석 상담
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                추천
              </div>
              <h3 className="font-semibold mb-2">Advanced</h3>
              <p className="text-3xl font-bold mb-1">₩13,900</p>
              <p className="text-sm text-white/70 mb-4">평생 이용권</p>
              <ul className="text-sm space-y-2 text-left text-white/90">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  무제한 즉석 상담
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  고품질 AI 분석 (Sonnet)
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  리포트 무제한 보관
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  상세 감정 통계
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-gray-800 mb-4"
          >
            오늘부터 시작하세요
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-500 mb-8 font-emotional"
          >
            당신의 감정은 소중해요.<br />
            Pulse Diary가 함께 기억할게요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              to={localStorage.getItem('pulse_user_id') ? "/home" : "/onboarding"}
              className="inline-flex items-center gap-2 py-4 px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 text-white rounded-2xl font-medium text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <Heart className="w-5 h-5" />
              지금 시작하기
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-6 text-center text-gray-400 text-sm">
        <p>Made with 💜 by Pulse Diary</p>
      </footer>
    </div>
  );
}
