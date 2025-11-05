'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getQuranicTeaching } from '@/app/actions';
import type { QuranicTeachingOutput } from '@/ai/flows/quranic-teaching';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';

export default function QuranPage() {
  const [teaching, setTeaching] = useState<QuranicTeachingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFetchTeaching = async () => {
    setIsLoading(true);
    setTeaching(null);
    const result = await getQuranicTeaching();
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.teaching) {
      setTeaching(result.teaching);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <BookOpen className="h-16 w-16 mb-4 text-primary" />
        <h1 className="font-headline text-4xl font-bold">Quranic Teachings</h1>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Receive a verse from the Holy Quran, along with its translation and a brief explanation from King A.J. to enlighten your day.
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <Button onClick={handleFetchTeaching} disabled={isLoading} size="lg">
          {isLoading ? 'Revealing Wisdom...' : 'Reveal a Verse'}
        </Button>
      </div>

      {isLoading && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      )}

      {teaching && (
        <Card className="max-w-3xl mx-auto animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="text-3xl font-quranic text-right" dir="rtl">
              {teaching.verse}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Translation</h3>
              <p className="text-muted-foreground italic">"{teaching.translation}"</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">The King's Wisdom</h3>
              <p className="whitespace-pre-wrap">{teaching.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
