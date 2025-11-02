'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { Role } from '@/lib/types';
import ChatMessage from './chat-message';
import ChatInput from './chat-input';
import { getAiResponse } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const kingAvatar = PlaceHolderImages.find((img) => img.id === 'king-avatar')?.imageUrl ?? '';
const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar')?.imageUrl ?? '';

const initialMessage: Message = {
    id: '0',
    role: Role.assistant,
    content: "Greetings, my loyal subject. I am King A.J. How may I be of service to you today? Ask me anything you wish to know.",
};

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: new Date().toISOString(),
      role: Role.user,
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiMessage = await getAiResponse([...messages, userMessage]);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: new Date().toISOString() + '-error',
        role: Role.assistant,
        content: 'My apologies, I seem to be having trouble communicating. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  return (
    <Card className="w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
      <CardContent className="flex flex-col flex-grow p-4 md:p-6 space-y-4">
        <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                kingAvatar={kingAvatar}
                userAvatar={userAvatar}
              />
            ))}
            {isLoading && <ChatMessage message={{id: 'loading', role: Role.assistant, content: ''}} kingAvatar={kingAvatar} userAvatar={userAvatar} isLoading />}
          </div>
        </ScrollArea>
        <div className="mt-auto pt-4 border-t">
          <ChatInput
            handleSubmit={handleSubmit}
            input={input}
            handleInputChange={handleInputChange}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
