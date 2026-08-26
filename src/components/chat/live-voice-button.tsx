'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface LiveVoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function LiveVoiceButton({ onTranscript, disabled = false }: LiveVoiceButtonProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleListening = () => {
    if (disabled) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      window.alert('Live voice input is not supported by this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          const transcript = result[0]?.transcript?.trim();
          if (transcript) onTranscript(transcript);
        }
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={listening ? 'destructive' : 'ghost'}
      onClick={toggleListening}
      disabled={disabled}
      aria-label={listening ? 'Stop listening' : 'Start live voice conversation'}
      title={listening ? 'Stop listening' : 'Start live voice conversation'}
    >
      {listening ? <MicOff /> : <Mic />}
    </Button>
  );
}
