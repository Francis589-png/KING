'use client';

import ChatInterface from '@/components/chat/chat-interface';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Icons } from '@/components/icons';
import { getMedicalChatResponse } from '@/app/actions';
import type { Message } from '@/lib/types';
import { Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const physicianAvatar = PlaceHolderImages.find((img) => img.id === 'king-avatar')?.imageUrl ?? '';

export default function MedicalPage() {
    // Wrapper function to match the expected signature of ChatInterface
    const getPhysicianResponse = (messages: Omit<Message, 'id'|'createdAt'>[]) => {
        return getMedicalChatResponse(messages);
    }

  return (
    <div className="container mx-auto py-10 flex flex-col h-full">
        <div className="flex flex-col items-center text-center mb-8">
            <Stethoscope className="h-16 w-16 mb-4 text-primary" />
            <h1 className="font-headline text-4xl font-bold">The Royal Apothecary</h1>
            <p className="text-muted-foreground max-w-2xl mt-2">
                Engage in a confidential conversation with the Royal Physician. Describe your ailments and receive wise counsel.
            </p>
        </div>
        <div className="flex-1 min-h-0">
             <ChatInterface
                initialMessage={{
                    role: 'assistant',
                    content: "Welcome, loyal subject. I am the Royal Physician. How may I be of service to your health today? Please describe what ails you.",
                }}
                getAiResponse={getPhysicianResponse}
                assistantAvatar={physicianAvatar}
                assistantIcon={<Stethoscope className="h-6 w-6 text-accent" />}
                storageKey="medical-conversation"
            />
        </div>
    </div>
  );
}
