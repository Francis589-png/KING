'use client';

import { createContext, useState, ReactNode } from 'react';

export type DetectedObject = {
    name: string;
    description: string;
    confidence: number;
};

type DetectionContextType = {
    detections: DetectedObject[];
    setDetections: (detections: DetectedObject[]) => void;
};

export const DetectionContext = createContext<DetectionContextType>({
    detections: [],
    setDetections: () => {},
});

export const DetectionProvider = ({ children }: { children: ReactNode }) => {
    const [detections, setDetections] = useState<DetectedObject[]>([]);

    return (
        <DetectionContext.Provider value={{ detections, setDetections }}>
            {children}
        </DetectionContext.Provider>
    );
};
