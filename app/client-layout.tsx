"use client";

import { AuthProvider } from "./providers";
import { ToastProvider } from "@/components/ui/Toast";
import { LiveRegionProvider } from "@/components/ui/LiveRegion";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LiveRegionProvider>
        {children}
        <ToastProvider />
      </LiveRegionProvider>
    </AuthProvider>
  );
}
