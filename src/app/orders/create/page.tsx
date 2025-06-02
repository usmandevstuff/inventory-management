
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { OrderForm } from '@/components/orders/OrderForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function CreateOrderPage() {
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
              <BreadcrumbPage className="font-semibold text-foreground">Create Order</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <OrderForm />
      </div>
    </MainAppLayoutWrapper>
  );
}
