import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('voice_assistant_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [rate, setRate] = useState(1.05);
  const [volume, setVolume] = useState(1.0);
  const lastSpokenTextRef = useRef('');
  const lastSpokenTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('voice_assistant_enabled', JSON.stringify(enabled));
  }, [enabled]);

  const speak = useCallback((text, options = {}) => {
    if (!enabled || !text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const { cooldownMs = 2500, force = false } = options;
    const now = Date.now();

    // Prevent immediate repeated message or message within cooldown window
    if (!force) {
      if (text === lastSpokenTextRef.current && now - lastSpokenTimeRef.current < 4000) {
        return;
      }
      if (now - lastSpokenTimeRef.current < cooldownMs) {
        return;
      }
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any existing queue for real-time reactivity

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.volume = volume;
      utterance.pitch = 1.0;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
      };
      utterance.onend = () => {
        isSpeakingRef.current = false;
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
      };

      lastSpokenTextRef.current = text;
      lastSpokenTimeRef.current = now;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, [enabled, rate, volume]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  return {
    enabled,
    setEnabled,
    rate,
    setRate,
    volume,
    setVolume,
    speak,
    cancel
  };
}
