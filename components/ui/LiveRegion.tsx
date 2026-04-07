"use client";
import { useState, useCallback, createContext, useContext } from "react";

const LiveRegionContext = createContext<(msg: string) => void>(() => {});

export function useLiveAnnounce() {
  return useContext(LiveRegionContext);
}

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  const announce = useCallback((msg: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(msg));
  }, []);

  return (
    <LiveRegionContext.Provider value={announce}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{message}</div>
    </LiveRegionContext.Provider>
  );
}
