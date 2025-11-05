'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getFullSura, getRecitationFeedback } from '@/app/actions';
import type { GetFullSuraOutput } from '@/ai/flows/get-full-sura';
import type { PronunciationCoachOutput } from '@/ai/flows/pronunciation-coach';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Mic, Square, LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suraList } from '@/lib/suras';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Verse = GetFullSuraOutput['verses'][0];

interface VerseFeedback extends PronunciationCoachOutput {
  verseNumber: number;
}

export default function QuranPage() {
  const [suraData, setSuraData] = useState<GetFullSuraOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSura, setSelectedSura] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState<number | null>(null); // verse number
  const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null); // verse number
  const [feedback, setFeedback] = useState<VerseFeedback | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleFetchSura = async () => {
    if (!selectedSura) {
      toast({
        variant: 'destructive',
        title: 'No Sura Selected',
        description: 'Please select a Sura to study.',
      });
      return;
    }
    setIsLoading(true);
    setSuraData(null);
    setFeedback(null);
    const result = await getFullSura(selectedSura);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.sura) {
      setSuraData(result.sura);
    }
  };

  const startRecording = async (verse: Verse) => {
    setFeedback(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioPermission(false);
      toast({ variant: 'destructive', title: 'Audio Error', description: 'Audio recording is not supported in your browser.' });
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
          setIsAnalyzing(verse.verseNumber);
          const result = await getRecitationFeedback(base64Audio, verse.arabicText);
          setIsAnalyzing(null);
          if (result.feedback) {
            setFeedback({ ...result.feedback, verseNumber: verse.verseNumber });
          } else {
            toast({
              variant: 'destructive',
              title: 'Analysis Failed',
              description: result.error,
            });
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(verse.verseNumber);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setAudioPermission(false);
      toast({ variant: 'destructive', title: 'Microphone Access Denied', description: 'Please enable microphone permissions in your browser.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <BookOpen className="h-16 w-16 mb-4 text-primary" />
        <h1 className="font-headline text-4xl font-bold">Quran Study Hall</h1>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Select a Sura to read its complete text, translation, and practice your recitation with AI feedback.
        </p>
      </div>

      <div className="flex justify-center mb-8 gap-4 flex-wrap">
        <Select onValueChange={setSelectedSura} value={selectedSura}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a Sura" />
          </SelectTrigger>
          <SelectContent>
            {suraList.map((sura, index) => (
              <SelectItem key={index} value={sura}>
                {index + 1}. {sura}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleFetchSura} disabled={isLoading || !selectedSura} size="lg">
          {isLoading ? 'Loading Sura...' : 'Load Sura'}
        </Button>
      </div>

      {isLoading && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {suraData && (
        <Card className="max-w-4xl mx-auto animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">
              {suraData.suraName}
            </CardTitle>
            <CardDescription className="text-center pt-4 whitespace-pre-wrap">{suraData.introduction}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />
            <Accordion type="single" collapsible className="w-full">
              {suraData.verses.map((verse) => (
                <AccordionItem value={`verse-${verse.verseNumber}`} key={verse.verseNumber}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 text-right w-full">
                      <span className="text-sm font-bold text-primary mr-2">{verse.verseNumber}</span>
                      <p className="font-quranic text-xl flex-1" dir="rtl">{verse.arabicText}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary">Translation</h4>
                      <p className="text-muted-foreground italic">"{verse.englishTranslation}"</p>
                    </div>
                    
                    <Separator />
                    
                    <div className='space-y-2'>
                        <h4 className="font-semibold text-primary">Recitation Coach</h4>
                        {audioPermission === false && (
                            <Alert variant="destructive">
                                <AlertTitle>Microphone Access Denied</AlertTitle>
                                <AlertDescription>Please enable microphone permissions in your browser to use the Recitation Coach.</AlertDescription>
                            </Alert>
                        )}
                        <Button 
                            onClick={() => isRecording === verse.verseNumber ? stopRecording() : startRecording(verse)}
                            disabled={isAnalyzing !== null && isAnalyzing !== verse.verseNumber}
                            className={cn(isRecording === verse.verseNumber && 'bg-destructive hover:bg-destructive/90')}
                        >
                            {isRecording === verse.verseNumber ? <Square className="mr-2 h-4 w-4 fill-white" /> : <Mic className="mr-2 h-4 w-4" />}
                            {isRecording === verse.verseNumber ? 'Stop Recording' : 'Practice Recitation'}
                        </Button>
                         {isAnalyzing === verse.verseNumber && (
                            <div className='flex items-center text-muted-foreground'>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                <p>Analyzing...</p>
                            </div>
                        )}
                    </div>

                    {feedback && feedback.verseNumber === verse.verseNumber && (
                        <div className='space-y-4 pt-2'>
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
