"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/** Clerk widgets and toasts follow the active light/dark theme. */
export default function ThemedProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider appearance={{ baseTheme: isDark ? dark : undefined }}>
      {children}
      <Toaster theme={isDark ? "dark" : "light"} richColors />
    </ClerkProvider>
  );
}
