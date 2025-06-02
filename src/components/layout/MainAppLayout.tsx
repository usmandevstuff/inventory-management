
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
import { 
  LayoutDashboard, 
  Archive, 
  PlusSquare, 
  History, 
  AlertTriangle, 
  LogOut,
  Settings,
  Loader2,
  ShoppingCart, // Added ShoppingCart
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Archive },
  { href: '/inventory/add', label: 'Add Product', icon: PlusSquare },
  { href: '/orders/create', label: 'Create Order', icon: ShoppingCart }, // Added Create Order link
  { href: '/history', label: 'Order History', icon: History }, // Label changed to Order History
  { href: '/low-stock', label: 'Low Stock', icon: AlertTriangle },
];

function MainAppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading, logout } = useAuth();
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

  let pageTitle = 'Threadcount Tracker';
  // Check for exact matches or more specific parent routes first
  if (pathname.startsWith('/inventory/edit')) {
    pageTitle = 'Edit Product';
  } else if (pathname === '/inventory/add') {
    pageTitle = 'Add Product';
  } else if (pathname === '/orders/create') {
    pageTitle = 'Create New Order';
  } else {
    const currentPageNavItem = navItems.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
    if (currentPageNavItem) {
      pageTitle = currentPageNavItem.label;
    }
  }


  // Step 1: Handle pre-hydration state (server render and initial client render)
  if (!isClientHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background opacity-0" aria-hidden="true">
        {/* Minimal, stable placeholder. Content hidden by opacity to prevent flash. */}
      </div>
    );
  }

  // Step 2: After hydration, handle auth loading
  if (authIsLoading) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Step 3: After hydration and auth loaded, handle not authenticated
  if (!isAuthenticated) { 
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
         <p className="font-body">Redirecting to login...</p>
         <Loader2 className="ml-2 h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  // Step 4: Authenticated and hydrated, render the main layout
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
                        isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && !(item.href === '/inventory' && pathname.startsWith('/inventory/add')))}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="user avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">TT</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-body">
                <DropdownMenuLabel className="font-headline">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
