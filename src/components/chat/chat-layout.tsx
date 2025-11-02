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
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';

const kingAvatar = PlaceHolderImages.find((img) => img.id === 'king-avatar')?.imageUrl ?? '';
const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar')?.imageUrl ?? '';

const initialMessage: Message = {
    id: 'initial-message',
    role: Role.assistant,
    content: "Greetings, my loyal subject. I am King A.J. How may I be of service to you today? Ask me anything you wish to know.",
    createdAt: new Date(),
};

interface StoredMessage {
    id?: string;
    role: Role;
    content: string;
    createdAt: Timestamp;
}

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const [conversationCol, setConversationCol] = useState<any>(null);
  const [conversationQuery, setConversationQuery] = useState<any>(null);

  useEffect(() => {
    if (firestore) {
      const col = collection(firestore, 'conversations');
      setConversationCol(col);
      setConversationQuery(query(col, orderBy('createdAt', 'asc')));
    }
  }, [firestore]);

  const { data: storedMessages, loading: messagesLoading } = useCollection<StoredMessage>(conversationQuery);

  useEffect(() => {
    if (storedMessages && storedMessages.length > 0) {
      const loadedMessages = storedMessages.map(msg => ({
          ...msg,
          createdAt: msg.createdAt?.toDate() ?? new Date(),
      }));
      setMessages([initialMessage, ...loadedMessages]);
    }
  }, [storedMessages]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const saveMessage = async (message: Omit<Message, 'id' | 'createdAt'>) => {
    if (!conversationCol) return;
    try {
        await addDoc(conversationCol, {
            ...message,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving message: ", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: new Date().toISOString(),
      role: Role.user,
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    saveMessage({role: userMessage.role, content: userMessage.content});
    setInput('');
    setIsLoading(true);

    try {
      const currentMessages: Message[] = [...messages, userMessage].map(({id, createdAt, ...rest}) => rest);
      const aiMessage = await getAiResponse(currentMessages);
      const fullAiMessage = { ...aiMessage, id: new Date().toISOString() + '-ai', createdAt: new Date() };
      setMessages((prev) => [...prev, fullAiMessage]);
      saveMessage({role: fullAiMessage.role, content: fullAiMessage.content});

    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: new Date().toISOString() + '-error',
        role: Role.assistant,
        content: 'My apologies, I seem to be having trouble communicating. Please try again later.',
        createdAt: new Date(),
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
            {isLoading && <ChatMessage message={{id: 'loading', role: Role.assistant, content: '', createdAt: new Date()}} kingAvatar={kingAvatar} userAvatar={userAvatar} isLoading />}
          </div>
        </ScrollArea>
        <div className="mt-auto pt-4 border-t">
          <ChatInput
            handleSubmit={handleSubmit}
            input={input}
            handleInputChange={handleInputChange}
            isLoading={isLoading || messagesLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
