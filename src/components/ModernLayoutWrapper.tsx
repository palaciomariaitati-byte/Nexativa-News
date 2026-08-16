"use client";

import { usePathname } from "next/navigation";

export default function ModernLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/clasico") || pathname?.startsWith("/noraitu")) {
    return null;
  }
  
  return <>{children}</>;
}
