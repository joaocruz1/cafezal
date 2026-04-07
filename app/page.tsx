"use client";

import { useAuth } from "./providers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/ui";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace("/dashboard");
  }, [user, loading, router]);

  return <LoadingScreen />;
}
