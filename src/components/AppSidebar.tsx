"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, HandCoins, Users, Cog, LogOut, GitFork } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/chamas', label: 'Chamas', icon: Landmark, badge: '3' },
  { href: '/contributions', label: 'Contributions', icon: HandCoins },
  { href: '/auth', label: 'Auth Screen (Dev)', icon: GitFork },
  // Add more items as needed
];

const bottomNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Cog },
  { href: '/logout', label: 'Logout', icon: LogOut },
];

interface AppSidebarProps {
  isMobileSheet?: boolean; // Indicates if rendered within a mobile sheet
}

export default function AppSidebar({ isMobileSheet = false }: AppSidebarProps) {
  const pathname = usePathname();

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <Link href={item.href} passHref legacyBehavior>
          <SidebarMenuButton
            isActive={pathname === item.href}
            asChild={false} // Ensure it's a button or acts like one for styling
            className="w-full"
            tooltip={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    ));
  }
  
  const sidebarContent = (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
            {/* You can use an SVG/Image logo here */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            <span className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">HustlePay</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 px-2">
        <SidebarMenu>
          {renderNavItems(navItems)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          {renderNavItems(bottomNavItems)}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  if (isMobileSheet) {
    // For mobile sheet, we don't need the Sidebar wrapper from ui/sidebar
    // as SheetContent provides the container.
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        {sidebarContent}
      </div>
    );
  }

  // For desktop, use the Sidebar component from ui/sidebar
  return (
     <Sidebar collapsible="icon" variant="sidebar" side="left">
      {sidebarContent}
    </Sidebar>
  );
}
