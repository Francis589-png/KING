'use client';

import { useState } from 'react';
import { Stethoscope, LoaderCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getMedicalAdvice } from '@/app/actions';
import type { MedicalTeachingOutput } from '@/ai/flows/medical-teaching';
import { medicalTopics } from '@/lib/medical-topics';

export default function MedicalPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<MedicalTeachingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchAdvice = async () => {
    if (!selectedTopic) {
      setError('Please select a topic to learn about.');
      return;
    }
    setIsLoading(true);
    setAdvice(null);
    setError(null);
    const result = await getMedicalAdvice(selectedTopic);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
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
          Select a topic from the Royal Physician's library to receive guidance on common ailments.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Seek Counsel</CardTitle>
          <CardDescription>Choose a medical topic from the list below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select onValueChange={setSelectedTopic} value={selectedTopic}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a topic..." />
              </SelectTrigger>
              <SelectContent>
                {medicalTopics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleFetchAdvice} disabled={isLoading || !selectedTopic}>
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Seeking...
                </>
              ) : (
                'Get Advice'
              )}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {advice && (
        <Card className="max-w-2xl mx-auto mt-8 animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle className='font-headline text-3xl'>{advice.ailment}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div>
                    <h3 className='font-semibold text-lg text-primary mb-2'>Symptoms</h3>
                    <ul className='list-disc list-inside text-muted-foreground space-y-1'>
                        {advice.symptoms.map((symptom, i) => <li key={i}>{symptom}</li>)}
                    </ul>
                </div>
                <Separator />
                <div>
                    <h3 className='font-semibold text-lg text-primary mb-2'>Natural Remedy: {advice.naturalRemedy.name}</h3>
                    <p className='text-muted-foreground whitespace-pre-wrap'>{advice.naturalRemedy.description}</p>
                </div>
                <Separator />
                 <div>
                    <h3 className='font-semibold text-lg text-primary mb-2'>Modern Medical Advice</h3>
                    <p className='text-muted-foreground whitespace-pre-wrap'>{advice.medicalAdvice}</p>
                </div>
            </CardContent>
            <CardFooter>
                 <Alert variant="destructive">
                    <AlertTitle>Disclaimer</AlertTitle>
                    <AlertDescription>{advice.disclaimer}</AlertDescription>
                </Alert>
            </CardFooter>
        </Card>
      )}

    </div>
  );
}
