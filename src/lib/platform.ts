export interface PlatformInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isStandalonePWA: boolean;
  isIOSStandalonePWA: boolean;
  supportsGetUserMedia: boolean;
  supportsMediaRecorder: boolean;
  supportsSpeechRecognition: boolean;
}

export function getPlatformInfo(): PlatformInfo {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  const standaloneByMediaQuery =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const standaloneByNavigator =
    typeof navigator !== 'undefined' &&
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  const isStandalonePWA = standaloneByMediaQuery || standaloneByNavigator;

  const supportsGetUserMedia =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';
  const supportsMediaRecorder = typeof MediaRecorder !== 'undefined';
  const supportsSpeechRecognition =
    typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' ||
      typeof window.webkitSpeechRecognition !== 'undefined');

  return {
    isAndroid,
    isIOS,
    isStandalonePWA,
    isIOSStandalonePWA: isIOS && isStandalonePWA,
    supportsGetUserMedia,
    supportsMediaRecorder,
    supportsSpeechRecognition,
  };
}
