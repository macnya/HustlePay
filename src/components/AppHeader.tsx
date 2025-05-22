"use client";

import Link from 'next/link';
import { Menu, UserCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AppSidebar from '@/components/AppSidebar'; // Import AppSidebar for mobile
import { useSidebar } from '@/components/ui/sidebar';

export default function AppHeader() {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            {/* Pass isMobile explicitly if AppSidebar uses it internally differently than useSidebar hook */}
            <AppSidebar isMobileSheet /> 
          </SheetContent>
        </Sheet>
      ) : (
         <Button
            variant="ghost"
            size="icon"
            className="shrink-0 hidden md:flex"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
      )}
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          HustlePay
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" aria-label="User Profile">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">User Profile</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
