'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { translateToBinary } from '@/app/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalculatorPage() {
  const [decimal, setDecimal] = useState('10');
  const [binary, setBinary] = useState('1010');
  const [hex, setHex] = useState('a');

  const [humanText, setHumanText] = useState('');
  const [machineLanguage, setMachineLanguage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDecimal(value);

    if (value === '' || isNaN(parseInt(value))) {
      setBinary('');
      setHex('');
      return;
    }

    const decValue = parseInt(value, 10);
    setBinary(decValue.toString(2));
    setHex(decValue.toString(16));
  };

  const handleBinaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBinary(value);

    if (value === '' || !/^[01]+$/.test(value)) {
      setDecimal('');
      setHex('');
      return;
    }

    const decValue = parseInt(value, 2);
    setDecimal(decValue.toString(10));
    setHex(decValue.toString(16));
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHex(value);

    if (value === '' || !/^[0-9a-fA-F]+$/.test(value)) {
      setDecimal('');
      setBinary('');
      return;
    }

    const decValue = parseInt(value, 16);
    setDecimal(decValue.toString(10));
    setBinary(decValue.toString(2));
  };

  const handleTranslate = async () => {
    if (!humanText.trim()) {
      setTranslationError('Please enter some text to translate.');
      return;
    }
    setIsTranslating(true);
    setTranslationError(null);
    setMachineLanguage('');
    const result = await translateToBinary(humanText);
    setIsTranslating(false);
    if (result.error) {
      setTranslationError(result.error);
    } else {
      setMachineLanguage(result.binary ?? '');
    }
  };


  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="font-headline text-3xl font-bold">Tech Calculator</h1>
      <Card>
        <CardHeader>
          <CardTitle>Number Base Converter</CardTitle>
          <CardDescription>
            Convert numbers between Decimal, Binary, and Hexadecimal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="decimal">Decimal</Label>
            <Input
              id="decimal"
              value={decimal}
              onChange={handleDecimalChange}
              placeholder="e.g. 10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="binary">Binary</Label>
            <Input
              id="binary"
              value={binary}
              onChange={handleBinaryChange}
              placeholder="e.g. 1010"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hex">Hexadecimal</Label>
            <Input
              id="hex"
              value={hex}
              onChange={handleHexChange}
              placeholder="e.g. a"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Human to Machine Language</CardTitle>
          <CardDescription>
            Translate natural language into binary code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="human-text">Your Text</Label>
            <Textarea
              id="human-text"
              value={humanText}
              onChange={(e) => setHumanText(e.target.value)}
              placeholder="Enter any text, and I shall convert it to the tongue of the machine..."
              rows={4}
            />
          </div>
          <Button onClick={handleTranslate} disabled={isTranslating}>
            {isTranslating ? 'Translating...' : 'Translate to Binary'}
          </Button>
          {translationError && (
            <Alert variant="destructive">
              <AlertDescription>{translationError}</AlertDescription>
            </Alert>
          )}
          {isTranslating && (
             <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
             </div>
          )}
          {machineLanguage && (
            <div className="space-y-2">
              <Label>Machine Language (Binary)</Label>
              <Alert variant="default">
                <AlertDescription className="font-mono text-sm break-words">
                  {machineLanguage}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
