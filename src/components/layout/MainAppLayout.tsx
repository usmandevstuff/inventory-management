
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { 
  LayoutDashboard, 
  Archive, 
  PlusSquare, 
  History, 
  AlertTriangle, 
  LogOut,
  Settings,
  Loader2,
  ShoppingCart,
  UserCog, // Changed from Settings for sidebar
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Archive },
  { href: '/inventory/add', label: 'Add Product', icon: PlusSquare },
  { href: '/orders/create', label: 'Create Order', icon: ShoppingCart },
  { href: '/history', label: 'Order History', icon: History },
  { href: '/low-stock', label: 'Low Stock', icon: AlertTriangle },
  { href: '/settings', label: 'Account Settings', icon: UserCog }, // Added Settings
];

function MainAppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sidebar = useSidebar(); 
  const isSidebarOpen = sidebar ? sidebar.open : true;

  const [isClientHydrated, setIsClientHydrated] = useState(false);

  useEffect(() => {
    setIsClientHydrated(true); 
  }, []);

  useEffect(() => {
    if (isClientHydrated && !authIsLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isClientHydrated, authIsLoading, isAuthenticated, router]);

  let pageTitle = 'Threadcount Tracker'; // Default title

  const currentPageNavItem = navItems.find(item => {
    if (item.href === '/dashboard') return pathname === item.href;
    // For other items, check if pathname starts with item.href,
    // but exclude more specific paths that might also start with it.
    // e.g. /inventory should match, but /inventory/add should match "Add Product"
    return pathname.startsWith(item.href) && 
           !navItems.some(other => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length);
  });

  if (currentPageNavItem) {
    pageTitle = currentPageNavItem.label;
  } else if (pathname.startsWith('/inventory/edit')) {
    pageTitle = 'Edit Product'; // Specific case for dynamic route
  }
  // Add other specific dynamic route titles if needed

  if (!isClientHydrated) {
    // Render nothing or a very minimal, stable placeholder during server render & first client render pass
    return <div className="flex min-h-screen bg-background opacity-0" aria-hidden="true"></div>;
  }

  if (authIsLoading || (!isAuthenticated && isClientHydrated)) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-md">
          <SidebarHeader className="p-3 items-center border-b border-sidebar-border">
             <Logo collapsed={!isSidebarOpen} />
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent className="p-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && !(item.href === '/inventory' && (pathname.startsWith('/inventory/add') || pathname.startsWith('/inventory/edit'))) && !(item.href === '/dashboard' && pathname !== '/dashboard'))}
                        tooltip={item.label}
                        className="justify-start font-body text-sm"
                      >
                        <item.icon className="h-5 w-5 mr-3 shrink-0" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-3 mt-auto border-t border-sidebar-border">
             <SidebarMenuButton onClick={logout} className="justify-start w-full font-body text-sm">
                <LogOut className="h-5 w-5 mr-3 shrink-0" />
                <span>Logout</span>
              </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/90 backdrop-blur-sm px-6 justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <h1 className="font-headline text-xl text-primary">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                      <AvatarImage src={user?.user_metadata?.avatar_url || "https://placehold.co/100x100.png"} alt={user?.user_metadata?.full_name || user?.email || "User avatar"} data-ai-hint="user avatar" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.email ? user.email.substring(0,2).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-body">
                  <DropdownMenuLabel className="font-headline">
                    {user?.user_metadata?.full_name || user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
  );
}

export default function MainAppLayoutWrapper(props: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <MainAppLayout {...props} />
    </SidebarProvider>
  );
}
