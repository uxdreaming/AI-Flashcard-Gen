"use client";

import { useState, useCallback, useRef, useEffect } from "react";

function detectLanguage(text: string): string {
  // Simple heuristic: if text has common Spanish characters/words, use es
  const spanishPattern = /[áéíóúñ¿¡]|(\b(el|la|los|las|de|del|en|es|un|una|que|por|con|para|como|más|pero|este|esta)\b)/i;
  return spanishPattern.test(text) ? "es" : "en";
}

export function useAudio() {
  const [speaking, setSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = detectLanguage(text);
    utterance.lang = lang === "es" ? "es-ES" : "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleAutoRead = useCallback(() => {
    setAutoRead((prev) => !prev);
  }, []);

  return { speak, stop, speaking, autoRead, toggleAutoRead };
}
