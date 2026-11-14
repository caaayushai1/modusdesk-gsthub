'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { ComingSoonView } from '@/components/coming-soon-view';
import { QuickLoginModal } from '@/components/quick-login/quick-login-modal';

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);

  const isComposition = pathname.startsWith('/composition');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader 
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)} 
        onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
      />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="md:pl-56 pt-16 min-h-screen">
        <div className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8">
          {isComposition ? (
            children
          ) : (
            <ComingSoonView onOpenQuickLogin={() => setIsQuickLoginOpen(true)} />
          )}
        </div>
      </main>

      {/* Primary Quick Login Modal */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
      />
    </div>
  );
}
