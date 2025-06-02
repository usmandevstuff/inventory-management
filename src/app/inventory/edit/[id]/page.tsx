
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { ProductForm } from '@/components/inventory/ProductForm';
import { useStore } from '@/contexts/StoreContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { getProductById, isLoading: storeIsLoading } = useStore();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); // For initial load of this page component

  const productId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (productId && !storeIsLoading) {
      const fetchedProduct = getProductById(productId);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
      } else {
        router.replace('/inventory'); 
      }
      setIsLoadingInitial(false);
    } else if (!storeIsLoading) { 
        setIsLoadingInitial(false); 
        if (!productId) router.replace('/inventory'); // No ID, redirect
    }
  }, [productId, getProductById, router, storeIsLoading]);

  if (isLoadingInitial || storeIsLoading) {
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }

  if (!product) {
    return <MainAppLayoutWrapper><div className="text-center py-10 font-body">Product not found. <Link href="/inventory" className="text-primary hover:underline">Return to Inventory</Link></div></MainAppLayoutWrapper>;
  }

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
              <BreadcrumbLink asChild><Link href="/inventory" className="hover:text-primary">Inventory</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">Edit: {product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <ProductForm product={product} />
      </div>
    </MainAppLayoutWrapper>
  );
}
