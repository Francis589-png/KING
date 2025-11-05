'use client';

import { Stethoscope } from 'lucide-react';
import ChatInterface from '@/components/chat/chat-interface';
import { getMedicalChatResponse } from '@/app/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MedicalPage() {
    const physicianAvatar = PlaceHolderImages.find((img) => img.id === 'king-avatar')?.imageUrl ?? '';

  return (
    <div className="container mx-auto py-10 h-full flex flex-col">
      <div className="flex flex-col items-center text-center mb-8">
        <Stethoscope className="h-16 w-16 mb-4 text-primary" />
        <h1 className="font-headline text-4xl font-bold">The Royal Apothecary</h1>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Converse with the Royal Physician. Describe your ailment or ask a health-related question to receive compassionate guidance.
        </p>
      </div>

      <ChatInterface
        initialMessage={{
            role: 'assistant',
            content: "Greetings. I am the Royal Physician. How may I be of service to your health today? Please describe what ails you, and I shall offer my counsel.",
        }}
        getAiResponse={getMedicalChatResponse}
        assistantAvatar={physicianAvatar}
        assistantIcon={<Stethoscope className="h-6 w-6" />}
        storageKey="medical-conversation"
      />
    </div>
  );
}
