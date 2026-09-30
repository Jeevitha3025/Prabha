import { useCallback, useMemo, useState } from "react";

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const isSupported = useMemo(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window), []);
  const startListening = useCallback((lang, onResult) => {
    if (!isSupported) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN";
    recognition.onresult = (event) => onResult(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  }, [isSupported]);
  const stopListening = useCallback(() => setIsListening(false), []);
  const speak = useCallback((text, lang) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);
  return { startListening, stopListening, speak, isListening, isSupported };
}