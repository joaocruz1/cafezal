"use client";

import { Spinner } from "./Spinner";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Carregando…" }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="text-neutral-500" />
        <p className="text-sm text-neutral-500">{message}</p>
      </div>
    </div>
  );
}
