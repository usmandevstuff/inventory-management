
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { AccountSettingsForm } from '@/components/settings/AccountSettingsForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function AccountSettingsPage() {
  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">Account Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="font-headline text-3xl text-primary border-b pb-4">
          Manage Your Account
        </h1>
        
        <AccountSettingsForm />
      </div>
    </MainAppLayoutWrapper>
  );
}
