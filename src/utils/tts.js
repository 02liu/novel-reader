const MAX_SEGMENT_LENGTH = 180;

function splitLongSegment(segment, maxLength = MAX_SEGMENT_LENGTH) {
  const text = segment.trim();
  if (!text) return [];
  if (text.length <= maxLength) return [text];

  const result = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    const windowText = remaining.slice(0, maxLength + 1);
    const breakpoints = [
      windowText.lastIndexOf('，'),
      windowText.lastIndexOf(','),
      windowText.lastIndexOf('、'),
      windowText.lastIndexOf('：'),
      windowText.lastIndexOf(':'),
      windowText.lastIndexOf(' '),
    ];
    const bestBreakpoint = Math.max(...breakpoints);
    const cutIndex = bestBreakpoint > Math.floor(maxLength * 0.45)
      ? bestBreakpoint + 1
      : maxLength;

    result.push(remaining.slice(0, cutIndex).trim());
    remaining = remaining.slice(cutIndex).trim();
  }

  if (remaining) {
    result.push(remaining);
  }

  return result;
}

/**
 * 按中文/英文标点及换行切分文本，避免 Web Speech API 一次朗读过长文本。
 */
export function splitTextToSentences(text) {
  if (!text) return [];

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const matches = normalized.match(/[^。！？!?；;\n]+[。！？!?；;]?|[^\n]+\n?/g) || [];

  return matches
    .flatMap(item => splitLongSegment(item.replace(/\n+/g, ' ').trim()))
    .filter(Boolean);
}

class TtsController {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.sentences = [];
    this.index = 0;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.runId = 0;
    this.options = {
      voiceURI: '',
      rate: 1,
      volume: 1,
    };
    this.callbacks = {
      onStateChange: null,
      onSentenceChange: null,
      onFinished: null,
      onError: null,
    };
  }

  isSupported() {
    return Boolean(
      this.synth
      && typeof SpeechSynthesisUtterance !== 'undefined'
    );
  }

  getVoices() {
    if (!this.isSupported()) return [];

    return [...this.synth.getVoices()].sort((a, b) => {
      const aChinese = /^zh(-|_)/i.test(a.lang) ? 0 : 1;
      const bChinese = /^zh(-|_)/i.test(b.lang) ? 0 : 1;
      if (aChinese !== bChinese) return aChinese - bChinese;

      const aMicrosoft = /Microsoft/i.test(a.name) ? 0 : 1;
      const bMicrosoft = /Microsoft/i.test(b.name) ? 0 : 1;
      if (aMicrosoft !== bMicrosoft) return aMicrosoft - bMicrosoft;

      return a.name.localeCompare(b.name);
    });
  }

  waitForVoices(timeout = 1500) {
    if (!this.isSupported()) {
      return Promise.resolve([]);
    }

    const existing = this.getVoices();
    if (existing.length > 0) {
      return Promise.resolve(existing);
    }

    return new Promise(resolve => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        this.synth.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(this.getVoices());
      };

      const handleVoicesChanged = () => finish();
      this.synth.addEventListener('voiceschanged', handleVoicesChanged);

      setTimeout(finish, timeout);
    });
  }

  setCallbacks(callbacks = {}) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  clearCallbacks() {
    this.callbacks = {
      onStateChange: null,
      onSentenceChange: null,
      onFinished: null,
      onError: null,
    };
  }

  setOptions(options = {}) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  setText(text, startIndex = 0) {
    this.stop();
    this.sentences = splitTextToSentences(text);
    this.index = Math.min(
      Math.max(Number(startIndex) || 0, 0),
      Math.max(this.sentences.length - 1, 0)
    );
    this.emitSentenceChange();
    this.emitState();
    return this.sentences.length;
  }

  getState() {
    return {
      supported: this.isSupported(),
      speaking: this.isSpeaking,
      paused: this.isPaused,
      index: this.index,
      total: this.sentences.length,
      sentence: this.sentences[this.index] || '',
    };
  }

  play(index = this.index) {
    if (!this.isSupported()) {
      this.emitError(new Error('当前 WebView2 不支持 Web Speech API'));
      return false;
    }

    if (this.sentences.length === 0) {
      return false;
    }

    if (this.isPaused && this.isSpeaking) {
      this.resume();
      return true;
    }

    this.index = Math.min(
      Math.max(Number(index) || 0, 0),
      this.sentences.length - 1
    );

    this.runId += 1;
    const currentRunId = this.runId;
    this.synth.cancel();

    this.isSpeaking = true;
    this.isPaused = false;
    this.emitState();
    this.speakCurrent(currentRunId);
    return true;
  }

  speakCurrent(runId) {
    if (runId !== this.runId || !this.isSpeaking) {
      return;
    }

    if (this.index >= this.sentences.length) {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.emitState();

      if (typeof this.callbacks.onFinished === 'function') {
        this.callbacks.onFinished();
      }
      return;
    }

    const sentence = this.sentences[this.index];
    const utterance = new SpeechSynthesisUtterance(sentence);
    const voice = this.resolveVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || 'zh-CN';
    } else {
      utterance.lang = 'zh-CN';
    }

    utterance.rate = Math.min(Math.max(Number(this.options.rate) || 1, 0.5), 2);
    utterance.volume = Math.min(Math.max(Number(this.options.volume) || 1, 0), 1);

    utterance.onstart = () => {
      if (runId !== this.runId) return;
      this.currentUtterance = utterance;
      this.emitSentenceChange();
      this.emitState();
    };

    utterance.onend = () => {
      if (runId !== this.runId) return;

      this.currentUtterance = null;
      this.index += 1;

      if (this.index < this.sentences.length) {
        this.emitSentenceChange();
        this.speakCurrent(runId);
      } else {
        this.isSpeaking = false;
        this.isPaused = false;
        this.emitState();

        if (typeof this.callbacks.onFinished === 'function') {
          this.callbacks.onFinished();
        }
      }
    };

    utterance.onerror = event => {
      if (runId !== this.runId) return;

      if (['interrupted', 'canceled'].includes(event.error)) {
        return;
      }

      this.currentUtterance = null;
      this.isSpeaking = false;
      this.isPaused = false;
      this.emitState();
      this.emitError(new Error(`TTS 朗读失败: ${event.error || 'unknown'}`));
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (!this.isSupported() || !this.isSpeaking || this.isPaused) {
      return;
    }

    this.synth.pause();
    this.isPaused = true;
    this.emitState();
  }

  resume() {
    if (!this.isSupported() || !this.isSpeaking || !this.isPaused) {
      return;
    }

    this.synth.resume();
    this.isPaused = false;
    this.emitState();
  }

  toggle() {
    if (this.isPaused) {
      this.resume();
      return;
    }

    if (this.isSpeaking) {
      this.pause();
      return;
    }

    this.play();
  }

  stop() {
    this.runId += 1;

    if (this.isSupported()) {
      this.synth.cancel();
    }

    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.emitState();
  }

  next() {
    if (this.sentences.length === 0) return;

    const shouldContinue = this.isSpeaking || this.isPaused;
    this.runId += 1;
    if (this.isSupported()) {
      this.synth.cancel();
    }

    this.index = Math.min(this.index + 1, this.sentences.length - 1);
    this.isSpeaking = false;
    this.isPaused = false;
    this.emitSentenceChange();
    this.emitState();

    if (shouldContinue) {
      this.play(this.index);
    }
  }

  previous() {
    if (this.sentences.length === 0) return;

    const shouldContinue = this.isSpeaking || this.isPaused;
    this.runId += 1;
    if (this.isSupported()) {
      this.synth.cancel();
    }

    this.index = Math.max(this.index - 1, 0);
    this.isSpeaking = false;
    this.isPaused = false;
    this.emitSentenceChange();
    this.emitState();

    if (shouldContinue) {
      this.play(this.index);
    }
  }

  resolveVoice() {
    const voices = this.getVoices();
    if (!voices.length) return null;

    if (this.options.voiceURI) {
      const selected = voices.find(
        voice => voice.voiceURI === this.options.voiceURI || voice.name === this.options.voiceURI
      );
      if (selected) return selected;
    }

    return voices.find(voice => /^zh(-|_)/i.test(voice.lang))
      || voices.find(voice => /Microsoft/i.test(voice.name))
      || voices[0];
  }

  emitSentenceChange() {
    if (typeof this.callbacks.onSentenceChange === 'function') {
      this.callbacks.onSentenceChange({
        index: this.index,
        total: this.sentences.length,
        sentence: this.sentences[this.index] || '',
      });
    }
  }

  emitState() {
    if (typeof this.callbacks.onStateChange === 'function') {
      this.callbacks.onStateChange(this.getState());
    }
  }

  emitError(error) {
    if (typeof this.callbacks.onError === 'function') {
      this.callbacks.onError(error);
    } else {
      console.error(error);
    }
  }
}

export const ttsController = new TtsController();
