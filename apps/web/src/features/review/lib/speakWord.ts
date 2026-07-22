export function speakWord(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const text = word.trim();
  if (!text) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
  return true;
}

export function canSpeakWord() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
