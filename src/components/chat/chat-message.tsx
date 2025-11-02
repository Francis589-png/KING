'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Message, Role } from '@/lib/types';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PlayIcon, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { getAudioForText } from '@/app/actions';

interface ChatMessageProps {
  message: Message;
  kingAvatar: string;
  userAvatar: string;
  isLoading?: boolean;
}

export default function ChatMessage({
  message,
  kingAvatar,
  userAvatar,
  isLoading,
}: ChatMessageProps) {
  const isAssistant = message.role === Role.assistant;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayAudio = async () => {
    if (isPlaying && audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    
    if (audio) {
      audio.play();
      setIsPlaying(true);
      return;
    }

    setIsFetchingAudio(true);
    const result = await getAudioForText(message.content);
    setIsFetchingAudio(false);

    if (result.audio) {
      const newAudio = new Audio(result.audio);
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
      newAudio.onended = () => {
        setIsPlaying(false);
      };
    } else {
      console.error('Failed to fetch audio:', result.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10 border-2 border-primary/50">
          <div className="bg-primary flex h-full w-full items-center justify-center rounded-full text-primary-foreground">
            <Icons.crown className="h-6 w-6" />
          </div>
        </Avatar>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('group flex items-start gap-3', {
        'flex-row-reverse': !isAssistant,
      })}
    >
      <Avatar className="h-10 w-10 border-2 border-primary/50">
        {isAssistant ? (
          <div className="bg-primary flex h-full w-full items-center justify-center rounded-full text-primary-foreground">
            <Icons.crown className="h-6 w-6 text-accent" />
          </div>
        ) : (
          userAvatar && <Image src={userAvatar} alt="User" width={40} height={40} data-ai-hint="person portrait" />
        )}
        <AvatarFallback>{isAssistant ? 'K' : 'U'}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-3 text-sm md:text-base shadow-md',
          isAssistant
            ? 'bg-card text-card-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      {isAssistant && message.content && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handlePlayAudio}
          disabled={isFetchingAudio}
          aria-label="Play audio"
        >
          {isFetchingAudio ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <PlayIcon className={cn(isPlaying && 'fill-foreground')} />
          )}
        </Button>
      )}
    </div>
  );
}
