'use client';

import { useState, useRef, useEffect, useMemo, useContext } from 'react';
import type { Message } from '@/lib/types';
import { Role } from '@/lib/types';
import ChatMessage from './chat-message';
import ChatInput from './chat-input';
import { getAiResponse } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp, CollectionReference } from 'firebase/firestore';
import { DetectionContext } from '@/context/detection-context';

const kingAvatar = PlaceHolderImages.find((img) => img.id === 'king-avatar')?.imageUrl ?? '';
const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar')?.imageUrl ?? '';

const initialMessage: Message = {
    id: 'initial-message',
    role: Role.assistant,
    content: "Greetings, my loyal subject. I am King A.J. How may I be of service to you today? Ask me anything you wish to know.",
    createdAt: new Date(),
};

interface StoredMessage {
    id: string;
    role: Role;
    content: string;
    createdAt: Timestamp;
}

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const { detections } = useContext(DetectionContext);

  const conversationCol = useMemo(() => {
      if (!firestore) return null;
      return collection(firestore, 'conversations') as CollectionReference<StoredMessage>;
  }, [firestore]);

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
            setMessages([initialMessage, ...loadedMessages]);
        }
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
        } as any);
    } catch (error) {
        console.error("Error saving message: ", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Omit<Message, 'id'|'createdAt'> = {
      role: Role.user,
      content: input,
    };
    
    // Optimistically update the UI
    const tempId = new Date().toISOString();
    setMessages((prev) => [...prev, { ...userMessage, id: tempId, createdAt: new Date() }]);
    saveMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // We pass the messages without id/createdAt to the AI
      const currentMessagesForAi: Omit<Message, 'id'|'createdAt'>[] = [...messages, {...userMessage, id: tempId, createdAt: new Date()}].map(({id, createdAt, ...rest}) => rest);
      const aiMessageContent = await getAiResponse(currentMessagesForAi, detections);
      
      // Save the AI message to Firestore, which will trigger the onSnapshot listener to update the UI
      saveMessage(aiMessageContent);

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
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  return (
    <Card className="w-full max-w-4xl flex flex-col shadow-2xl h-[calc(100vh_-_8rem)]">
       <CardContent className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden">
        <ScrollArea className="flex-grow -mx-4 -mt-4">
            <div className="space-y-6 p-4" ref={viewportRef}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  kingAvatar={kingAvatar}
                  userAvatar={userAvatar}
                />
              ))}
              {isLoading && (
                <ChatMessage
                  message={{
                    id: 'loading',
                    role: Role.assistant,
                    content: '',
                    createdAt: new Date(),
                  }}
                  kingAvatar={kingAvatar}
                  userAvatar={userAvatar}
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
            isLoading={isLoading || messagesLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
