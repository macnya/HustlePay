import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
        <SidebarRail />
      </SidebarInset>
    </SidebarProvider>
  );
}
