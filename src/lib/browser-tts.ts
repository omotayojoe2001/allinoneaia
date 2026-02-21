export const browserTTS = {
  getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices();
  },

  async generateVoice(text: string, voiceName?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = this.getVoices();
      
      if (voiceName) {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) utterance.voice = voice;
      }

      // Record audio
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(
        new MediaStream(),
        { mimeType: 'audio/webm' }
      );

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(URL.createObjectURL(blob));
      };

      utterance.onend = () => mediaRecorder.stop();
      utterance.onerror = reject;

      mediaRecorder.start();
      window.speechSynthesis.speak(utterance);
    });
  },

  speak(text: string, voiceName?: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.getVoices();
    
    if (voiceName) {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  },

  stop() {
    window.speechSynthesis.cancel();
  }
};
