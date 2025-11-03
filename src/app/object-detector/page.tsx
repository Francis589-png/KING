'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { detectObjectsInImage } from '@/app/actions';
import { LoaderCircle, Video } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type DetectedObject = {
  name: string;
  confidence: number;
};

export default function ObjectDetectorPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleDetectObjects = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsDetecting(true);
    setDetectedObjects([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setIsDetecting(false);
        return;
    };
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const imageDataUri = canvas.toDataURL('image/jpeg');

    const result = await detectObjectsInImage(imageDataUri);

    setIsDetecting(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Detection Failed',
        description: result.error,
      });
    } else if (result.objects) {
      setDetectedObjects(result.objects);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="font-headline text-3xl font-bold mb-6">Object Observatory</h1>
      <Card>
        <CardHeader>
          <CardTitle>Live Object Detection</CardTitle>
          <CardDescription>
            Point your camera at objects, and the King's royal eye will identify them for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-md border bg-muted overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {hasCameraPermission === false && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Video className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Camera access is required.</p>
                </div>
            )}
             {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <LoaderCircle className="h-16 w-16 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground mt-4">Initializing camera...</p>
                </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button onClick={handleDetectObjects} disabled={!hasCameraPermission || isDetecting} size="lg">
              {isDetecting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                'Detect Objects'
              )}
            </Button>
          </div>

          {detectedObjects.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-2">Detected Objects:</h3>
              <ul className="space-y-2">
                {detectedObjects.map((obj, index) => (
                  <li key={index} className="p-3 bg-card rounded-md shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{obj.name}</span>
                        <span className="text-sm text-muted-foreground">
                            Confidence: {(obj.confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                    <Progress value={obj.confidence * 100} className="mt-2 h-2" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
