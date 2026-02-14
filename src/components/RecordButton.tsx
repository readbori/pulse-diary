import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RotateCcw, Check } from 'lucide-react';
import { getEmotionGradient } from '@/lib/emotions';

interface RecordButtonProps {
  isRecording: boolean;
  isPreparing: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  hasRecording: boolean;
  onSave: () => void;
  recentEmotion?: string;
}

export function RecordButton({
  isRecording,
  isPreparing,
  duration,
  onStart,
  onStop,
  onReset,
  hasRecording,
  onSave,
  recentEmotion
}: RecordButtonProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <AnimatePresence mode="wait">
        {!hasRecording ? (
          <motion.div
            key="record"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative"
          >
            {isRecording && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-indigo-400/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-teal-400/20"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-sky-400/20"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: "easeOut" }}
                />
              </>
            )}
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={isPreparing ? undefined : (isRecording ? onStop : onStart)}
              disabled={isPreparing}
              className={`
                relative w-36 h-36 rounded-full flex items-center justify-center
                soft-shadow
                ${isPreparing
                  ? 'bg-gradient-to-br from-indigo-400 via-teal-400 to-sky-300 animate-pulse-soft'
                  : isRecording 
                    ? 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 animate-pulse-ring' 
                    : `bg-gradient-to-br ${recentEmotion ? getEmotionGradient(recentEmotion) : 'from-indigo-500 via-teal-500 to-sky-400'} ${!recentEmotion ? 'hover:from-indigo-600 hover:via-teal-600 hover:to-sky-500' : ''}`
                }
              `}
            >
              <motion.div
                animate={isRecording ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.8, repeat: isRecording ? Infinity : 0 }}
              >
                {isPreparing ? (
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isRecording ? (
                  <Square className="w-12 h-12 text-white fill-white drop-shadow-lg" />
                ) : (
                  <Mic className="w-14 h-14 text-white drop-shadow-lg" />
                )}
              </motion.div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="controls"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex gap-6"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={onReset}
              className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center soft-shadow"
            >
              <RotateCcw className="w-6 h-6 text-gray-500" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={onSave}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 flex items-center justify-center soft-shadow"
            >
              <Check className="w-10 h-10 text-white drop-shadow" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center min-h-[60px]">
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-3xl font-light text-indigo-600 tracking-wider">
              {formatDuration(duration)}
            </span>
            <span className="text-sm text-gray-400 font-emotional">
              지금 느끼는 감정을 말해주세요...
            </span>
          </motion.div>
        )}
        
        {isPreparing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-lg text-indigo-500 font-emotional">
              마이크 준비 중...
            </span>
          </motion.div>
        )}

        {!isRecording && !isPreparing && !hasRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-gray-400 font-emotional text-lg">
              버튼을 눌러 마음을 기록하세요
            </p>
            <p className="text-xs text-gray-300">
              최대 2분까지 녹음할 수 있어요
            </p>
          </motion.div>
        )}
        
        {hasRecording && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 font-emotional"
          >
            저장하거나 다시 녹음할 수 있어요
          </motion.p>
        )}
      </div>
    </div>
  );
}
