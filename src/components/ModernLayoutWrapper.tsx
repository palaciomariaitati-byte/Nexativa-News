"use client";

import { usePathname } from "next/navigation";

export default function ModernLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/clasico")) {
    return null;
  }
  
  return <>{children}</>;
}
