// Speech-to-text using Web Speech API
export function startSpeechRecognition(opts: {
  onResult: (text: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
  lang?: string;
}): { stop: () => void } | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    opts.onError("Speech recognition not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = opts.lang || "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = "";

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interim += transcript;
      }
    }
    opts.onResult(finalTranscript + interim);
  };

  recognition.onerror = (event: any) => {
    if (event.error !== "aborted") {
      opts.onError(`Speech error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    opts.onEnd();
  };

  recognition.start();

  return {
    stop: () => {
      recognition.stop();
    },
  };
}

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}
