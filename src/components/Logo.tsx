
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Logo({ collapsed }: { collapsed?: boolean }) {
  const { user } = useAuth();
  
  const storeName = user?.user_metadata?.store_name;
  const defaultName = "Tracker"; // For collapsed view
  const defaultFullName = "Threadcount Tracker";

  const displayName = collapsed 
    ? (storeName ? storeName.substring(0,1).toUpperCase() + (storeName.length > 1 ? storeName.substring(1,Math.min(storeName.length, 8)) : "") : defaultName.substring(0,1).toUpperCase() + defaultName.substring(1,Math.min(defaultName.length,8))) 
    : (storeName || defaultFullName);

  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors duration-200 py-2">
      <Package className={`h-7 w-7 ${collapsed ? 'mx-auto' : ''} text-sidebar-primary shrink-0`} />
      {!collapsed && <span className="font-headline text-xl font-semibold leading-none tracking-tight whitespace-nowrap truncate" title={displayName}>{displayName}</span>}
      {collapsed && storeName && <span className="sr-only">{storeName}</span>}
      {collapsed && !storeName && <span className="sr-only">{defaultFullName}</span>}
    </Link>
  );
}
