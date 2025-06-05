
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/contexts/StoreContext';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Edit3, PackageOpen, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function LowStockPage() {
  const { products, isLoading } = useStore();

  if (isLoading) {
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }

  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold).sort((a,b) => a.stock - b.stock);

  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center gap-2 sm:gap-3 border-b pb-3 sm:pb-4">
          <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-destructive">Low Stock Alerts</h1>
        </div>
        <p className="font-body text-sm sm:text-base md:text-lg text-muted-foreground">
          The following items are running low on stock and may require reordering. Currently, there are <span className="font-bold text-destructive">{lowStockProducts.length}</span> product(s) at or below their low stock threshold.
        </p>

        <Card className="shadow-xl rounded-lg border-t-4 border-destructive">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl md:text-2xl">Items Requiring Attention</CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">Review these products and consider restocking soon.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-muted-foreground font-body">
                <PackageOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4 text-gray-400" />
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 font-headline">All Stock Levels OK!</h3>
                <p className="text-sm sm:text-base">No products are currently below their low stock threshold. Well done!</p>
              </div>
            ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] sm:w-[80px] hidden sm:table-cell p-2 sm:p-3"></TableHead>
                    <TableHead className="font-headline text-xs sm:text-sm p-2 sm:p-3">Product Name</TableHead>
                    <TableHead className="hidden md:table-cell font-headline text-xs sm:text-sm p-2 sm:p-3">Category</TableHead>
                    <TableHead className="text-right font-headline text-xs sm:text-sm p-2 sm:p-3">Current Stock</TableHead>
                    <TableHead className="text-right font-headline text-xs sm:text-sm p-2 sm:p-3">Threshold</TableHead>
                    <TableHead className="text-center font-headline text-xs sm:text-sm p-2 sm:p-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-secondary/50 transition-colors group font-body text-xs sm:text-sm">
                      <TableCell className="hidden sm:table-cell p-1.5 sm:p-2">
                        <Image
                          alt={product.name}
                          className="aspect-square rounded-md object-cover"
                          height="48"
                          src={product.imageUrl || "https://placehold.co/56x56.png"}
                          width="48"
                          data-ai-hint={product.dataAiHint || "clothing item"}
                        />
                      </TableCell>
                      <TableCell className="font-medium p-2 sm:p-3">{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell p-2 sm:p-3">{product.category || 'N/A'}</TableCell>
                      <TableCell className="text-right p-2 sm:p-3">
                        <Badge variant="destructive" className="text-xs sm:text-sm px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">{product.stock}</Badge>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-3">{product.lowStockThreshold}</TableCell>
                      <TableCell className="text-center p-2 sm:p-3">
                        <Button asChild variant="outline" size="sm" className="hover:border-primary hover:text-primary font-body text-xs px-2 py-1 h-auto sm:px-3 sm:py-1.5 group-hover:opacity-100 opacity-80 sm:opacity-70 transition-opacity">
                          <Link href={`/inventory/edit/${product.id}`}>
                            <Edit3 className="mr-1 sm:mr-2 h-3 w-3" /> Restock/Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainAppLayoutWrapper>
  );
}
