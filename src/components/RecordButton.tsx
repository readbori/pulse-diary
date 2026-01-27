import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RotateCcw, Check, MessageCircle, Sparkles } from 'lucide-react';

interface RecordButtonProps {
  isRecording: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  hasRecording: boolean;
  onSave: () => void;
}

export function RecordButton({
  isRecording,
  duration,
  onStart,
  onStop,
  onReset,
  hasRecording,
  onSave
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
                  className="absolute inset-0 rounded-full bg-pink-300/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-300/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={isRecording ? onStop : onStart}
              className={`
                relative w-36 h-36 rounded-full flex items-center justify-center
                transition-all duration-500 soft-shadow
                ${isRecording 
                  ? 'bg-gradient-to-br from-rose-400 via-pink-400 to-purple-400' 
                  : 'bg-gradient-to-br from-purple-400 via-pink-400 to-rose-300 hover:from-purple-500 hover:via-pink-500 hover:to-rose-400'
                }
              `}
            >
              <motion.div
                animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
              >
                {isRecording ? (
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
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center soft-shadow"
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
            <span className="text-3xl font-light text-purple-600 tracking-wider">
              {formatDuration(duration)}
            </span>
            <span className="text-sm text-gray-400 font-emotional">
              지금 느끼는 감정을 말해주세요...
            </span>
          </motion.div>
        )}
        
        {!isRecording && !hasRecording && (
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
