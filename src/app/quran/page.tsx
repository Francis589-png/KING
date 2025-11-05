'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getQuranicTeaching, getRecitationFeedback } from '@/app/actions';
import type { QuranicTeachingOutput } from '@/ai/flows/quranic-teaching';
import type { PronunciationCoachOutput } from '@/ai/flows/pronunciation-coach';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Share2, Twitter, MessageCircle, Mic, Square, LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suraList } from '@/lib/suras';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function QuranPage() {
  const [teaching, setTeaching] = useState<QuranicTeachingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSura, setSelectedSura] = useState<string>('random');
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<PronunciationCoachOutput | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleFetchTeaching = async () => {
    setIsLoading(true);
    setTeaching(null);
    setFeedback(null);
    const result = await getQuranicTeaching(selectedSura === 'random' ? '' : selectedSura);
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

  const shareOnTwitter = () => {
    if (!teaching) return;
    const text = `A teaching from the Quran (${teaching.suraName} ${teaching.verseNumber}):\n\n"${teaching.translation}"\n\n- King A.J.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareOnWhatsApp = () => {
    if (!teaching) return;
    const text = `A teaching from the Quran (${teaching.suraName} ${teaching.verseNumber}):\n\n"${teaching.translation}"\n\n- King A.J.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const startRecording = async () => {
    setFeedback(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission(true);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (teaching?.verse) {
            setIsAnalyzing(true);
            const result = await getRecitationFeedback(base64Audio, teaching.verse);
            setIsAnalyzing(false);
            if (result.feedback) {
              setFeedback(result.feedback);
            } else {
              toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: result.error,
              });
            }
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setAudioPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePracticeClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <BookOpen className="h-16 w-16 mb-4 text-primary" />
        <h1 className="font-headline text-4xl font-bold">Quranic & Prophetic Teachings</h1>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Select a Sura or receive a random verse, related Hadith, and practice your recitation with AI feedback.
        </p>
      </div>

      <div className="flex justify-center mb-8 gap-4 flex-wrap">
        <Select onValueChange={setSelectedSura} value={selectedSura}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a Sura (or get random)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="random">Random Verse & Hadith</SelectItem>
            {suraList.map((sura, index) => (
              <SelectItem key={index} value={sura}>
                {index + 1}. {sura}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleFetchTeaching} disabled={isLoading} size="lg">
          {isLoading ? 'Revealing Wisdom...' : 'Reveal a Teaching'}
        </Button>
      </div>

      {isLoading && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Separator />
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      )}

      {teaching && (
        <Card className="max-w-3xl mx-auto animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardDescription className="text-center">{teaching.suraName}, Verse {teaching.verseNumber}</CardDescription>
            <CardTitle className="text-3xl font-quranic text-right pt-2" dir="rtl">
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
              <h3 className="font-semibold text-lg mb-2 text-primary">Prophetic Teaching (Hadith)</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{teaching.hadith}</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">The King's Wisdom</h3>
              <p className="whitespace-pre-wrap">{teaching.explanation}</p>
            </div>

            <Separator />

            <div className='space-y-4 text-center'>
                <h3 className="font-semibold text-lg text-primary">Recitation Coach</h3>
                {audioPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Microphone Access Denied</AlertTitle>
                        <AlertDescription>Please enable microphone permissions in your browser to use the Recitation Coach.</AlertDescription>
                    </Alert>
                )}
                <Button onClick={handlePracticeClick} disabled={isAnalyzing} size="lg" className={cn(isRecording && 'bg-destructive hover:bg-destructive/90')}>
                    {isRecording ? <Square className="mr-2 h-4 w-4 fill-white" /> : <Mic className="mr-2 h-4 w-4" />}
                    {isRecording ? 'Stop Recording' : 'Practice Recitation'}
                </Button>
                {isAnalyzing && (
                    <div className='flex items-center justify-center text-muted-foreground'>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        <p>The King is analyzing your recitation...</p>
                    </div>
                )}
            </div>

            {feedback && (
                <div className='space-y-4'>
                    <h3 className="font-semibold text-lg text-primary">Recitation Feedback</h3>
                    <Alert variant={feedback.isCorrect ? 'default' : 'destructive'}>
                        <AlertTitle>{feedback.isCorrect ? "Excellent Recitation!" : "Needs Improvement"}</AlertTitle>
                        <AlertDescription className='whitespace-pre-wrap'>{feedback.feedback}</AlertDescription>
                    </Alert>
                    {!feedback.isCorrect && feedback.correctiveAudioUri && (
                        <div>
                            <p className='text-sm font-medium mb-2'>Listen to the correct pronunciation:</p>
                            <audio controls src={feedback.correctiveAudioUri} className='w-full' />
                        </div>
                    )}
                </div>
            )}

          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Separator />
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span>Share this wisdom</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={shareOnTwitter} aria-label="Share on Twitter">
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                </Button>
                <Button variant="outline" size="icon" onClick={shareOnWhatsApp} aria-label="Share on WhatsApp">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
