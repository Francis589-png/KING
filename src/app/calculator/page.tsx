'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp, CollectionReference } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Calculation {
  id?: string;
  type: 'base' | 'text';
  input: string;
  output: string;
  createdAt: Timestamp;
}


export default function CalculatorPage() {
  const [decimal, setDecimal] = useState('10');
  const [binary, setBinary] = useState('1010');
  const [hex, setHex] = useState('a');

  const [humanText, setHumanText] = useState('');
  const [machineLanguage, setMachineLanguage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const firestore = useFirestore();
  
  const calculationsCol = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'calculations') as CollectionReference<Calculation>;
  }, [firestore]);

  const calculationsQuery = useMemo(() => {
    if (!calculationsCol) return null;
    return query(calculationsCol, orderBy('createdAt', 'desc'));
  }, [calculationsCol]);
  
  const { data: calculations, loading: calculationsLoading } = useCollection<Calculation>(calculationsQuery);

  const addCalculationToHistory = async (type: 'base' | 'text', input: string, output: string) => {
    if (!calculationsCol) return;
    try {
      await addDoc(calculationsCol, {
        type,
        input,
        output,
        createdAt: serverTimestamp(),
      } as any);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDecimal(value);

    if (value === '' || isNaN(parseInt(value))) {
      setBinary('');
      setHex('');
      return;
    }

    const decValue = parseInt(value, 10);
    const binValue = decValue.toString(2);
    const hexValue = decValue.toString(16);
    setBinary(binValue);
    setHex(hexValue);
    addCalculationToHistory('base', `Decimal: ${value}`, `Binary: ${binValue}, Hex: ${hexValue}`);
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
    const decString = decValue.toString(10);
    const hexValue = decValue.toString(16);
    setDecimal(decString);
    setHex(hexValue);
    addCalculationToHistory('base', `Binary: ${value}`, `Decimal: ${decString}, Hex: ${hexValue}`);
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
    const decString = decValue.toString(10);
    const binValue = decValue.toString(2);
    setDecimal(decString);
    setBinary(binValue);
    addCalculationToHistory('base', `Hex: ${value}`, `Decimal: ${decString}, Binary: ${binValue}`);
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
    } else if (result.binary) {
      setMachineLanguage(result.binary);
      addCalculationToHistory('text', humanText, result.binary);
    }
  };


  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className='flex items-center justify-between'>
        <h1 className="font-headline text-3xl font-bold">Tech Calculator</h1>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
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
        <Card>
            <CardHeader>
                <CardTitle>Calculation History</CardTitle>
                <CardDescription>A record of your past calculations.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Input</TableHead>
                                <TableHead>Output</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {calculationsLoading && (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <div className='space-y-2'>
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {calculations?.map((calc) => (
                                <TableRow key={calc.id}>
                                    <TableCell className="font-mono text-xs break-all">{calc.input}</TableCell>
                                    <TableCell className="font-mono text-xs break-all">{calc.output}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {calc.createdAt ? formatDistanceToNow(calc.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
