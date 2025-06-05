
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { StoreProvider } from '@/contexts/StoreContext';
import { AuthProvider } from '@/contexts/AuthContext';
// import { PageTransitionWrapper } from '@/components/layout/PageTransitionWrapper'; // Removed
import { ThemeProvider } from "next-themes";


export const metadata: Metadata = {
  title: 'Threadcount Tracker',
  description: 'Inventory management for your clothing store',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StoreProvider>
              {/* <PageTransitionWrapper> Removed */}
                {children}
              {/* </PageTransitionWrapper> Removed */}
              <Toaster />
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
