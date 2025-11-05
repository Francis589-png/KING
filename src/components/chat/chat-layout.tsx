'use client';

import ChatInterface from './chat-interface';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Icons } from '@/components/icons';
import type { Message } from '@/lib/types';
import type { DetectedObject } from '@/context/detection-context';

const kingAvatar = PlaceHolderImages.find((img) => img.id === 'king-avatar')?.imageUrl ?? '';

interface ChatLayoutProps {
    getKingResponse: (messages: Omit<Message, 'id' | 'createdAt'>[], detections?: DetectedObject[]) => Promise<Omit<Message, 'id' | 'createdAt'>>;
}


export default function ChatLayout({ getKingResponse }: ChatLayoutProps) {
  
  return (
    <ChatInterface
        initialMessage={{
            role: 'assistant',
            content: "Greetings, my loyal subject. I am King A.J. How may I be of service to you today? Ask me anything you wish to know.",
        }}
        getAiResponse={getKingResponse}
        assistantAvatar={kingAvatar}
        assistantIcon={<Icons.crown className="h-6 w-6 text-accent" />}
        storageKey="conversations"
      />
  );
}
