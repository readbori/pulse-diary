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
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Duplicate guard: stores the last committed text to detect phantom re-emissions
  const lastCommittedTextRef = useRef('');

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

    // Android Chrome has two unfixed Chromium bugs:
    //   crbug.com/40324711 (2013): continuous=true causes onend to never fire + duplicates
    //   crbug.com/40272768 (2024): interimResults=true causes duplicate concatenation
    // react-speech-recognition (166K weekly downloads) also defaults to continuous=false
    // and marks Android as NOT supporting continuous listening.
    // Fix: single-shot mode on Android, restart via onend to simulate continuous.
    const isAndroid = platform.isAndroid;
    recognition.continuous = !isAndroid;
    recognition.interimResults = !isAndroid;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isAndroid) {
        // Android single-shot mode: each session produces exactly one final result.
        // Extract it directly — no need to iterate all results.
        const result = event.results[event.results.length - 1];
        if (!result) return;

        if (result.isFinal) {
          const text = result[0].transcript;
          // Guard: skip phantom finals with zero confidence
          if (result[0].confidence === 0) return;
          // Guard: skip if this exact text was already committed (phantom re-emission)
          if (text === lastCommittedTextRef.current) return;

          sessionTranscriptRef.current = text;
          setTranscript(committedTranscriptRef.current + text);
        }
        // interimResults is false on Android, so no interim handling needed
      } else {
        // Desktop: continuous mode with interim results.
        // Rebuild current session's transcript from the full event.results array.
        // This is idempotent — if Chrome re-emits the same final, we rebuild the same string.
        let sessionFinals = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            sessionFinals += result[0].transcript;
          }
        }

        sessionTranscriptRef.current = sessionFinals;
        setTranscript(committedTranscriptRef.current + sessionFinals);
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
    
    recognition.onend = () => {
      if (isListeningRef.current) {
        // Commit this session's finals before starting a new session.
        // recognition.start() resets event.results to empty, so anything
        // not committed here would be lost.
        const sessionText = sessionTranscriptRef.current;
        committedTranscriptRef.current += sessionText;
        lastCommittedTextRef.current = sessionText;
        sessionTranscriptRef.current = '';

        if (isAndroid) {
          // Android: delay restart to prevent rapid mic cycling and give the
          // audio subsystem time to cleanly release the previous session.
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
            if (isListeningRef.current) {
              try {
                recognition.start();
              } catch {
                setIsListening(false);
              }
            }
          }, 300);
        } else {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        }
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
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
    lastCommittedTextRef.current = '';

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
    // Cancel any pending Android restart timer
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
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
    lastCommittedTextRef.current = '';
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
