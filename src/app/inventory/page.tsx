
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/contexts/StoreContext';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit3, Trash2, Search, Filter, ChevronDown, ChevronUp, Loader2, PackageOpen, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type SortableColumns = 'name' | 'price' | 'stock' | 'category';
type SortDirection = 'asc' | 'desc';

export default function InventoryPage() {
  const { products, deleteProduct, isLoading } = useStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortableColumns>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const allCategories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])).sort(), [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (categoryFilter.length > 0) {
      filtered = filtered.filter(product => product.category && categoryFilter.includes(product.category));
    }

    return filtered.sort((a, b) => {
      let compareA, compareB;
      switch (sortColumn) {
        case 'price':
        case 'stock':
          compareA = a[sortColumn];
          compareB = b[sortColumn];
          break;
        default: 
          compareA = (a[sortColumn] || '').toLowerCase();
          compareB = (b[sortColumn] || '').toLowerCase();
      }
      
      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, sortColumn, sortDirection, categoryFilter]);

  const handleSort = (column: SortableColumns) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleDelete = (productId: string, productName: string) => {
    deleteProduct(productId);
    toast({
      title: "Product Deleted",
      description: `${productName} has been removed from your inventory.`,
      variant: "destructive"
    });
  };
  
  const SortIndicator = ({ column }: { column: SortableColumns }) => {
    if (sortColumn !== column) return <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 text-primary" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 text-primary" />;
  };

  if (isLoading) {
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }

  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary">Product Inventory</h1>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm sm:text-base py-2 px-4 sm:py-2.5 sm:px-5 rounded-md shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
            <Link href="/inventory/add">
              <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add New Product
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b p-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-stretch md:items-center">
              <div className="relative flex-1 md:grow-0 w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-background pl-10 md:w-[200px] lg:w-[300px] font-body h-9 sm:h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto font-body h-9 sm:h-10 text-xs sm:text-sm">
                    <Filter className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Categories ({categoryFilter.length > 0 ? categoryFilter.length : 'All'}) <ChevronDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] sm:w-[220px] font-body">
                  <DropdownMenuLabel className="font-headline text-sm">Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allCategories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat}
                      checked={categoryFilter.includes(cat)}
                      onCheckedChange={(checked) => {
                        setCategoryFilter(prev => 
                          checked ? [...prev, cat] : prev.filter(c => c !== cat)
                        );
                      }}
                      className="text-xs sm:text-sm"
                    >
                      {cat}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {categoryFilter.length > 0 && (
                    <>
                    <DropdownMenuSeparator />
                    <Button variant="ghost" size="sm" onClick={() => setCategoryFilter([])} className="w-full justify-start text-destructive hover:text-destructive h-auto py-1.5 px-2 text-xs sm:text-sm">
                        <XCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Clear filters
                    </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-muted-foreground font-body">
                <PackageOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4 text-gray-400" />
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 font-headline">No Products Found</h3>
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  {searchTerm || categoryFilter.length > 0 ? "Try adjusting your search or filters." : "You haven't added any products yet."}
                </p>
                {!searchTerm && categoryFilter.length === 0 && (
                   <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-sm sm:text-base">
                    <Link href="/inventory/add">
                      <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add Your First Product
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] sm:w-[80px] hidden sm:table-cell p-2 sm:p-3"></TableHead>
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Name <SortIndicator column="name" /></TableHead>
                    <TableHead onClick={() => handleSort('category')} className="hidden md:table-cell cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Category <SortIndicator column="category" /></TableHead>
                    <TableHead onClick={() => handleSort('price')} className="text-right cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Price <SortIndicator column="price" /></TableHead>
                    <TableHead onClick={() => handleSort('stock')} className="text-right cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Stock <SortIndicator column="stock" /></TableHead>
                    <TableHead className="text-right font-headline text-xs sm:text-sm p-2 sm:p-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.map((product) => (
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
                      <TableCell className="font-medium p-2 sm:p-3">
                        <Link href={`/inventory/edit/${product.id}`} className="hover:underline hover:text-primary">{product.name}</Link>
                        <p className="text-xs text-muted-foreground md:hidden">{product.category}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 sm:p-3">{product.category || 'N/A'}</TableCell>
                      <TableCell className="text-right p-2 sm:p-3">${product.price.toFixed(2)}</TableCell>
                      <TableCell className={`text-right p-2 sm:p-3 ${product.stock <= product.lowStockThreshold ? 'text-destructive font-bold' : ''}`}>
                        {product.stock}
                        {product.stock <= product.lowStockThreshold && <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs px-1.5 py-0.5 sm:px-2">Low</Badge>}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-3">
                        <div className="flex gap-1 sm:gap-2 justify-end">
                          <Button asChild variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:border-primary hover:text-primary group-hover:opacity-100 opacity-70 sm:opacity-50 transition-opacity">
                            <Link href={`/inventory/edit/${product.id}`}>
                              <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:border-destructive hover:text-destructive group-hover:opacity-100 opacity-70 sm:opacity-50 transition-opacity">
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="font-body">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-headline">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the product "{product.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(product.id, product.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
