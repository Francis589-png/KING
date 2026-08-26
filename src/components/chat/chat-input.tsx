'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useRef, type FormEvent } from 'react';
import LiveVoiceButton from './live-voice-button';

type ChatInputProps = {
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  input: string;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  onVoiceTranscript: (text: string) => void;
  isLoading: boolean;
};

export default function ChatInput({
  handleSubmit,
  input,
  handleInputChange,
  onVoiceTranscript,
  isLoading,
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative flex w-full items-center"
    >
      <Textarea
        ref={inputRef}
        name="message"
        value={input}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        placeholder="Ask the king a question..."
        className="pr-24 text-sm md:text-base resize-none"
        rows={1}
        autoFocus
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <LiveVoiceButton onTranscript={onVoiceTranscript} disabled={isLoading} />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          <Send />
        </Button>
      </div>
    </form>
  );
}
