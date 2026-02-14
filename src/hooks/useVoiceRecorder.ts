import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPreparing: boolean;
  audioBlob: Blob | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  error: string | null;
}

export function useVoiceRecorder(maxDuration = 120): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const stopRecordingRef = useRef<() => void>(() => {});

  const isAndroid = /Android/i.test(navigator.userAgent);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRecording(true);

    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);

      if (elapsed >= maxDuration) {
        // Use ref to avoid stale closure — stopRecording is defined after startTimer
        stopRecordingRef.current();
      }
    }, 100);
  }, [maxDuration]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsPreparing(true);
      chunksRef.current = [];

      // Android Chrome: getUserMedia와 SpeechRecognition 동시 사용 불가
      // (Chromium bug #41083534). 타이머만 실행하고 SpeechRecognition에 마이크 양보.
      if (isAndroid) {
        startTimer();
        setIsPreparing(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // iOS Safari는 audio/webm 미지원 → mp4/aac 폴백
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      startTimer();
      setIsPreparing(false);
      
    } catch (err) {
      setIsPreparing(false);
      setError('마이크 권한이 필요합니다.');
      console.error('Recording error:', err);
    }
  }, [maxDuration, isAndroid, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (timerRef.current) {
      // Android 타이머 전용 모드: MediaRecorder 없이 녹음 완료 신호
      setAudioBlob(new Blob([], { type: 'audio/webm' }));
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Keep ref in sync so startTimer's interval can call the latest stopRecording
  stopRecordingRef.current = stopRecording;

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    isPreparing,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
    error
  };
}
