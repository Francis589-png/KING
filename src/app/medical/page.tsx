'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getMedicalAdvice } from '@/app/actions';
import type { MedicalTeachingOutput } from '@/ai/flows/medical-teaching';
import { Stethoscope, Pill, Leaf, AlertTriangle, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function MedicalPage() {
  const [topic, setTopic] = useState('');
  const [advice, setAdvice] = useState<MedicalTeachingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFetchAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Topic Entered',
        description: 'Please enter an ailment or topic to receive advice.',
      });
      return;
    }
    setIsLoading(true);
    setAdvice(null);
    const result = await getMedicalAdvice(topic);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.advice) {
      setAdvice(result.advice);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center text-center mb-8">
        <Stethoscope className="h-16 w-16 mb-4 text-primary" />
        <h1 className="font-headline text-4xl font-bold">The Royal Apothecary</h1>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Seek counsel from the Royal Physician. Enter an ailment or health topic below to receive guidance on symptoms, natural remedies, and modern medical advice.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Seek Medical Counsel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFetchAdvice} className="flex gap-4">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Common Cold, Headaches, Skincare..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Get Advice'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="max-w-2xl mx-auto animate-in fade-in-50 duration-500">
          <CardHeader>
             <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <Separator />
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
             <Separator />
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
           <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      )}

      {advice && (
        <Card className="max-w-2xl mx-auto animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">{advice.ailment}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center"><Pill className="h-5 w-5 mr-2 text-primary" />Common Symptoms</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {advice.symptoms.map((symptom, i) => <li key={i}>{symptom}</li>)}
              </ul>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center"><Leaf className="h-5 w-5 mr-2 text-green-500" />Natural Remedy: {advice.naturalRemedy.name}</h3>
              <p className="text-muted-foreground">{advice.naturalRemedy.description}</p>
            </div>
            <Separator />
             <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center"><Stethoscope className="h-5 w-5 mr-2 text-blue-500" />Modern Medical Advice</h3>
              <p className="text-muted-foreground">{advice.medicalAdvice}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Disclaimer</AlertTitle>
              <AlertDescription>{advice.disclaimer}</AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
