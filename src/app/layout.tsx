import type { Metadata } from 'next';
import './globals.css';
import { PracticeProvider } from '@/context/PracticeContext';
import { AssessmentProvider } from '@/context/AssessmentContext';

export const metadata: Metadata = {
  title: 'Shuddho Clinical Functional Nutrition | বিশুদ্ধ ক্লিনিক্যাল ফাংশনাল নিউট্রিশন',
  description: 'Deterministic & Zero-AI Clinical Functional Nutrition Practice Management System for Bangladesh. Strict Evidence-Based Metabolic Protocols.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <PracticeProvider>
          <AssessmentProvider>
            {children}
          </AssessmentProvider>
        </PracticeProvider>
      </body>
    </html>
  );
}

