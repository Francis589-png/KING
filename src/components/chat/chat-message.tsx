import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Message, Role } from '@/lib/types';
import Image from 'next/image';
import { Icons } from '@/components/icons';


interface ChatMessageProps {
    message: Message;
    kingAvatar: string;
    userAvatar: string;
    isLoading?: boolean;
}

export default function ChatMessage({ message, kingAvatar, userAvatar, isLoading }: ChatMessageProps) {
  const isAssistant = message.role === Role.assistant;

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
    )
  }
  
  return (
    <div
      className={cn('flex items-start gap-4', {
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
    </div>
  );
}
