'use client';

import { Icons } from './icons';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content text-center">
        <Icons.crown className="h-24 w-24 mx-auto mb-4 text-primary animate-pulse" />
        <h1 className="font-headline text-6xl font-bold text-primary text-3d">
          KING AJ
        </h1>
        <p className="font-body text-2xl text-foreground/80 mt-2">
          FROM JTT
        </p>
      </div>
    </div>
  );
}
