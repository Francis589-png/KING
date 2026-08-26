'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Message } from '@/lib/types';
import { Role } from '@/lib/types';
import ChatMessage from './chat-message';
import ChatInput from './chat-input';
import { getAudioForText } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp, CollectionReference } from 'firebase/firestore';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar')?.imageUrl ?? '';

interface StoredMessage {
    id: string;
    role: Role;
    content: string;
    createdAt: Timestamp;
}

interface ChatInterfaceProps {
    initialMessage: Omit<Message, 'id' | 'createdAt'>;
    getAiResponse: (messages: Omit<Message, 'id' | 'createdAt'>[]) => Promise<Omit<Message, 'id' | 'createdAt'>>;
    assistantAvatar: string;
    assistantIcon: React.ReactNode;
    storageKey: string;
}

export default function ChatInterface({
    initialMessage,
    getAiResponse,
    assistantAvatar,
    assistantIcon,
    storageKey
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([{...initialMessage, id: 'initial', createdAt: new Date()}]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const conversationCol = useMemo(() => {
      if (!firestore) return null;
      return collection(firestore, storageKey) as CollectionReference<StoredMessage>;
  }, [firestore, storageKey]);

  const conversationQuery = useMemo(() => {
    if (!conversationCol) return null;
    return query(conversationCol, orderBy('createdAt', 'asc'));
  }, [conversationCol]);

  const { data: storedMessages, loading: messagesLoading } = useCollection<StoredMessage>(conversationQuery);

  useEffect(() => {
    if (storedMessages) {
        const loadedMessages = storedMessages.map(msg => ({
            ...msg,
            id: msg.id,
            createdAt: msg.createdAt?.toDate() ?? new Date(),
        }));
        if(loadedMessages.length > 0) {
            setMessages([{ ...initialMessage, id: 'initial', createdAt: new Date() }, ...loadedMessages]);
        }
    }
  }, [storedMessages, initialMessage]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const saveMessage = async (message: Omit<Message, 'id' | 'createdAt'>) => {
    if (!conversationCol) return;
    try {
        await addDoc(conversationCol, {
            ...message,
            createdAt: serverTimestamp(),
        } as any);
    } catch (error) {
        console.error("Error saving message: ", error);
    }
  };

  const askKing = async (text: string, speakResponse = false) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Omit<Message, 'id'|'createdAt'> = {
      role: Role.user,
      content: trimmed,
    };

    const tempId = new Date().toISOString();
    setMessages((prev) => [...prev, { ...userMessage, id: tempId, createdAt: new Date() }]);
    saveMessage(userMessage);
    setInput('');
    setIsLoading(true);
    if (speakResponse) setVoiceBusy(true);

    try {
      const currentMessagesForAi: Omit<Message, 'id'|'createdAt'>[] = [
        ...messages,
        { ...userMessage, id: tempId, createdAt: new Date() },
      ].map(({id, createdAt, ...rest}) => rest);
      const aiMessage = await getAiResponse(currentMessagesForAi);
      saveMessage(aiMessage);

      if (speakResponse) {
        const audioResult = await getAudioForText(aiMessage.content);
        if (audioResult.audio) {
          audioRef.current?.pause();
          const audio = new Audio(audioResult.audio);
          audioRef.current = audio;
          audio.onended = () => setVoiceBusy(false);
          audio.onerror = () => setVoiceBusy(false);
          try {
            await audio.play();
          } catch (error) {
            console.error('Unable to play voice response:', error);
            setVoiceBusy(false);
          }
        } else {
          setVoiceBusy(false);
        }
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: new Date().toISOString() + '-error',
        role: Role.assistant,
        content: 'My apologies, I seem to be having trouble communicating. Please try again later.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setVoiceBusy(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await askKing(input);
  };

  const handleVoiceTranscript = async (text: string) => {
    await askKing(text, true);
  };
  
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <Card className="w-full max-w-4xl flex flex-col shadow-2xl flex-1">
       <CardContent className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden">
        <ScrollArea className="flex-grow -mx-4 -mt-4">
            <div className="space-y-6 p-4" ref={viewportRef}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  assistantAvatar={assistantAvatar}
                  userAvatar={userAvatar}
                  assistantIcon={assistantIcon}
                />
              ))}
              {(isLoading || voiceBusy) && (
                <ChatMessage
                  message={{
                    id: 'loading',
                    role: Role.assistant,
                    content: '',
                    createdAt: new Date(),
                  }}
                  assistantAvatar={assistantAvatar}
                  userAvatar={userAvatar}
                  assistantIcon={assistantIcon}
                  isLoading
                />
              )}
            </div>
        </ScrollArea>
        <div className="pt-4 border-t">
          <ChatInput
            handleSubmit={handleSubmit}
            input={input}
            handleInputChange={handleInputChange}
            onVoiceTranscript={handleVoiceTranscript}
            isLoading={isLoading || messagesLoading || voiceBusy}
          />
        </div>
      </CardContent>
    </Card>
  );
}
