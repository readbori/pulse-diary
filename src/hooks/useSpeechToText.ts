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

  // Keep ref in sync with state — avoids stale closures in onend handler
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Create SpeechRecognition instance ONCE per language change
  // (NOT on every isListening toggle — that caused duplicate instances)
  useEffect(() => {
    const platform = getPlatformInfo();

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
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        return;
      }
      isListeningRef.current = false;
      setError(`음성 인식 오류: ${event.error}`);
      setIsListening(false);
    };
    
    // Read ref (not state) to avoid stale closure — the recognition instance
    // persists across isListening changes, so we need the latest value via ref.
    recognition.onend = () => {
      if (isListeningRef.current) {
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

    try {
      isListeningRef.current = true;  // Set ref BEFORE start() so onend sees correct value
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
