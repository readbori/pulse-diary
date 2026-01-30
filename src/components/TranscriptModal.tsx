import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function TranscriptModal({
  isOpen,
  onClose,
  transcript,
  onConfirm,
  isProcessing
}: TranscriptModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">기록 확인</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 mb-6 min-h-[120px] max-h-[200px] overflow-y-auto">
              <p className="text-gray-700 leading-relaxed">
                {transcript || '(음성이 텍스트로 변환됩니다...)'}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={isProcessing || !transcript}
              className={`
                w-full py-4 rounded-2xl font-medium text-white
                flex items-center justify-center gap-2
                ${isProcessing || !transcript
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-teal-600 hover:from-indigo-600 hover:to-teal-700'
                }
              `}
            >
              {isProcessing ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>오늘의 기록 저장</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
