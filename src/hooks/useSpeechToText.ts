import { useState, useRef, useEffect, useCallback } from 'react';
import { getPlatformInfo } from '@/lib/platform';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface UseSpeechToTextReturn {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
  isSupported: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechToText(language = 'ko-KR'): UseSpeechToTextReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);

  // Transcript accumulation across recognition sessions.
  // Chrome auto-stops recognition after ~60s of continuous use and onend restarts it.
  // event.results resets on each start(), so we must preserve prior sessions' text.
  const committedTranscriptRef = useRef('');
  const sessionTranscriptRef = useRef('');
  const isAndroidRef = useRef(false);

  // Keep ref in sync with state — avoids stale closures in onend handler
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Create SpeechRecognition instance ONCE per language change
  useEffect(() => {
    const platform = getPlatformInfo();
    isAndroidRef.current = platform.isAndroid;

    if (platform.isIOSStandalonePWA) {
      setIsSupported(false);
      setError('현재 환경에서는 음성 인식 기능이 제한됩니다.');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild current session's transcript from the full event.results array.
      // This prevents Android/Chrome duplicate final emissions — if Chrome re-emits
      // the same final result, we just rebuild the same string (idempotent).
      let sessionFinals = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Android Chrome sometimes emits phantom finals with confidence === 0.
          // Filter them out to avoid garbage text.
          if (isAndroidRef.current && result[0].confidence === 0) {
            continue;
          }
          sessionFinals += result[0].transcript;
        }
      }

      sessionTranscriptRef.current = sessionFinals;
      setTranscript(committedTranscriptRef.current + sessionFinals);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        return;
      }
      isListeningRef.current = false;
      setError(`음성 인식 오류: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (isListeningRef.current) {
        // Commit this session's finals before starting a new session.
        // recognition.start() resets event.results to empty, so anything
        // not committed here would be lost.
        committedTranscriptRef.current += sessionTranscriptRef.current;
        sessionTranscriptRef.current = '';

        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      recognition.stop();
    };
  }, [language]);

  const startListening = useCallback(() => {
    // Guard: prevent double-start (throws "recognition has already started")
    if (isListeningRef.current) return;
    setError(null);
    if (!recognitionRef.current) {
      setIsSupported(false);
      setError('현재 브라우저에서는 음성 인식을 지원하지 않습니다.');
      return;
    }

    // Clear accumulation state for fresh recording
    committedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';

    try {
      isListeningRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      isListeningRef.current = false;
      console.error('Start listening error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    // CRITICAL: Set ref BEFORE stop() — stop() triggers onend synchronously,
    // and onend checks isListeningRef to decide whether to restart.
    // If we don't set it first, onend sees true and creates a zombie instance.
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    committedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported
  };
}
