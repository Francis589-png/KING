'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LiveVoiceButtonProps = {
  onTurn: (userText: string, assistantText: string) => void;
  disabled?: boolean;
};

type LiveMessage = {
  serverContent?: {
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string } }> };
    interrupted?: boolean;
    turnComplete?: boolean;
  };
};

function base64ToInt16(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const samples = new Int16Array(bytes.byteLength / 2);
  for (let i = 0; i < samples.length; i += 1) samples[i] = view.getInt16(i * 2, true);
  return samples;
}

function int16ToBase64(samples: Int16Array) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) view.setInt16(i * 2, samples[i], true);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function LiveVoiceButton({ onTurn, disabled = false }: LiveVoiceButtonProps) {
  const [live, setLive] = useState(false);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextOutputTimeRef = useRef(0);
  const userTextRef = useRef('');
  const assistantTextRef = useRef('');

  const stop = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    sessionRef.current?.close?.();
    sessionRef.current = null;
    inputContextRef.current?.close().catch(() => undefined);
    outputContextRef.current?.close().catch(() => undefined);
    inputContextRef.current = null;
    outputContextRef.current = null;
    nextOutputTimeRef.current = 0;
    setLive(false);
  };

  const playPcm = (base64: string) => {
    const context = outputContextRef.current;
    if (!context) return;
    const samples = base64ToInt16(base64);
    const buffer = context.createBuffer(1, samples.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) channel[i] = samples[i] / 32768;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.02, nextOutputTimeRef.current);
    source.start(startAt);
    nextOutputTimeRef.current = startAt + buffer.duration;
  };

  const start = async () => {
    if (disabled || live) return;
    try {
      const tokenResponse = await fetch('/api/gemini/live-token', { method: 'POST', cache: 'no-store' });
      if (!tokenResponse.ok) throw new Error('Unable to provision Gemini Live session.');
      const { token, model } = await tokenResponse.json();

      const ai = new GoogleGenAI({ apiKey: token });
      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          sessionResumption: {},
        },
        callbacks: {
          onmessage: (message: LiveMessage) => {
            const content = message.serverContent;
            if (!content) return;
            if (content.inputTranscription?.text) userTextRef.current += content.inputTranscription.text;
            if (content.outputTranscription?.text) assistantTextRef.current += content.outputTranscription.text;
            if (content.interrupted) {
              nextOutputTimeRef.current = outputContextRef.current?.currentTime ?? 0;
            }
            for (const part of content.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) playPcm(part.inlineData.data);
            }
            if (content.turnComplete) {
              const userText = userTextRef.current.trim();
              const assistantText = assistantTextRef.current.trim();
              if (userText || assistantText) onTurn(userText, assistantText);
              userTextRef.current = '';
              assistantTextRef.current = '';
            }
          },
          onerror: (event: unknown) => console.error('Gemini Live error:', event),
          onclose: () => setLive(false),
        },
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const inputContext = new AudioContext({ sampleRate: 16000 });
      const outputContext = new AudioContext({ sampleRate: 24000 });
      await inputContext.resume();
      await outputContext.resume();
      const source = inputContext.createMediaStreamSource(stream);
      const processor = inputContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = event => {
        const channel = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(channel.length);
        for (let i = 0; i < channel.length; i += 1) pcm[i] = Math.max(-1, Math.min(1, channel[i])) * 32767;
        session.sendRealtimeInput({ audio: { data: int16ToBase64(pcm), mimeType: 'audio/pcm;rate=16000' } });
      };
      source.connect(processor);
      processor.connect(inputContext.destination);
      sessionRef.current = session;
      streamRef.current = stream;
      inputContextRef.current = inputContext;
      outputContextRef.current = outputContext;
      sourceRef.current = source;
      processorRef.current = processor;
      nextOutputTimeRef.current = outputContext.currentTime;
      setLive(true);
    } catch (error) {
      console.error('Unable to start JUSU AI Live:', error);
      stop();
      window.alert('JUSU AI live voice could not start. Please check microphone permission and try again.');
    }
  };

  useEffect(() => () => stop(), []);

  return (
    <Button type="button" size="icon" variant={live ? 'destructive' : 'ghost'} onClick={live ? stop : start} disabled={disabled} aria-label={live ? 'Stop live conversation' : 'Start live conversation'} title={live ? 'Stop live conversation' : 'Start live conversation'}>
      {live ? <MicOff /> : <Mic />}
    </Button>
  );
}
