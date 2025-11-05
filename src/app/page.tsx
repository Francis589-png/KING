'use client';

import ChatLayout from '@/components/chat/chat-layout';
import { getAiResponse } from '@/app/actions';
import { useContext } from 'react';
import { DetectionContext } from '@/context/detection-context';

export default function Home() {
    const { detections } = useContext(DetectionContext);
    
    // Wrapper function to match the expected signature of ChatInterface
    const getKingResponse = (messages: any[]) => {
        return getAiResponse(messages, detections);
    }

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <ChatLayout getKingResponse={getKingResponse} />
    </main>
  );
}
