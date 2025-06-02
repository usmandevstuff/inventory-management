
import Link from 'next/link';
import { Package } from 'lucide-react';

export function Logo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors duration-200 py-2">
      <Package className={`h-7 w-7 ${collapsed ? 'mx-auto' : ''} text-sidebar-primary shrink-0`} />
      {!collapsed && <span className="font-headline text-xl font-semibold leading-none tracking-tight whitespace-nowrap">Usman Cloth House</span>}
    </Link>
  );
}
