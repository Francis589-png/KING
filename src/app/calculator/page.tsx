'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CalculatorPage() {
  const [decimal, setDecimal] = useState('10');
  const [binary, setBinary] = useState('1010');
  const [hex, setHex] = useState('a');

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

  return (
    <div className="container mx-auto py-10">
      <h1 className="font-headline text-3xl font-bold mb-6">Tech Calculator</h1>
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
    </div>
  );
}
