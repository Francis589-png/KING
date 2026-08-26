'use client';

export default function SplashScreen() {
  return (
    <div className="splash-screen" aria-label="JUSU AI loading">
      <div className="splash-content text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-2xl animate-pulse">
          <span className="font-headline text-4xl font-bold text-primary-foreground">J</span>
        </div>
        <h1 className="font-headline text-6xl font-bold text-primary text-3d">
          JUSU AI
        </h1>
        <p className="font-body text-2xl text-foreground/80 mt-2">
          FROM JTT
        </p>
      </div>
    </div>
  );
}
