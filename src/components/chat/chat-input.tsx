'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useRef, type FormEvent } from 'react';

type ChatInputProps = {
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  input: string;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  isLoading: boolean;
};

export default function ChatInput({
  handleSubmit,
  input,
  handleInputChange,
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
        className="pr-16 text-sm md:text-base resize-none"
        rows={1}
        autoFocus
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        disabled={isLoading || !input.trim()}
        aria-label="Send message"
      >
        <Send />
      </Button>
    </form>
  );
}
