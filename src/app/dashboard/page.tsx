
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/contexts/StoreContext';
import Link from 'next/link';
import { Archive, AlertTriangle, PlusSquare, ListOrdered, BarChart3, Loader2, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const { products, transactions, isLoading } = useStore();

  if (isLoading) {
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <MainAppLayoutWrapper>
      <div className="space-y-8">
        <h1 className="font-headline text-4xl text-primary">Dashboard Overview</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg border-l-4 border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body text-muted-foreground">Total Products</CardTitle>
              <Archive className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">{totalProducts}</div>
              <p className="text-xs text-muted-foreground font-body">Unique items in inventory</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg border-l-4 border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body text-muted-foreground">Low Stock Items</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-destructive">{lowStockProducts.length}</div>
              <Link href="/low-stock" className="text-xs text-muted-foreground hover:text-primary font-body">
                View items needing reorder
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg border-l-4 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body text-muted-foreground">Total Stock Value</CardTitle>
              <BarChart3 className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">
                ${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground font-body">Estimated value of all items</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" className="font-body justify-start text-base py-6 hover:bg-primary/10 hover:border-primary hover:text-primary rounded-md transition-all duration-200">
                <Link href="/inventory/add">
                  <PlusSquare className="mr-3 h-5 w-5" /> Add New Product
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-body justify-start text-base py-6 hover:bg-primary/10 hover:border-primary hover:text-primary rounded-md transition-all duration-200">
                <Link href="/inventory">
                  <ListOrdered className="mr-3 h-5 w-5" /> View Full Inventory
                </Link>
              </Button>
               <Button asChild variant="outline" className="font-body justify-start text-base py-6 hover:bg-primary/10 hover:border-primary hover:text-primary rounded-md transition-all duration-200">
                <Link href="/history">
                  <History className="mr-3 h-5 w-5" /> Transaction History
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-body justify-start text-base py-6 hover:bg-destructive/10 hover:border-destructive hover:text-destructive rounded-md transition-all duration-200">
                <Link href="/low-stock">
                  <AlertTriangle className="mr-3 h-5 w-5" /> Low Stock Alerts
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Recent Activity</CardTitle>
              <CardDescription className="font-body">Last 5 transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <ul className="space-y-3">
                  {recentTransactions.map(tx => (
                    <li key={tx.id} className="flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary/70 rounded-md font-body text-sm transition-colors duration-200">
                      <div>
                        <span className={`font-semibold ${tx.quantityChange < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}:
                        </span>{' '}
                        {tx.productName} ({tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground font-body">No recent transactions.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {lowStockProducts.length > 0 && (
          <Card className="shadow-lg rounded-lg border-t-4 border-destructive">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6" /> Urgent: Low Stock Items
              </CardTitle>
              <CardDescription className="font-body">These items require your immediate attention for restocking.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lowStockProducts.slice(0,4).map(product => ( 
                <Link href={`/inventory/edit/${product.id}`} key={product.id} className="block group">
                  <Card className="overflow-hidden h-full flex flex-col rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300">
                    <div className="relative w-full h-40">
                      <Image 
                        src={product.imageUrl || "https://placehold.co/300x200.png"} 
                        alt={product.name} 
                        fill={true}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        style={{objectFit:"cover"}}
                        className="group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={product.dataAiHint || "clothing item"}
                      />
                    </div>
                    <CardHeader className="p-3 flex-grow">
                      <CardTitle className="text-base font-headline truncate group-hover:text-primary transition-colors duration-200">{product.name}</CardTitle>
                      <CardDescription className="text-xs font-body">Current Stock: <span className="font-bold text-destructive">{product.stock}</span> (Threshold: {product.lowStockThreshold})</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                       <Button size="sm" variant="destructive" className="w-full font-body text-xs">Restock Now</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </CardContent>
             {lowStockProducts.length > 4 && (
                <CardContent className="text-center pt-4">
                    <Button asChild variant="link" className="text-primary hover:text-accent font-body">
                        <Link href="/low-stock">View all {lowStockProducts.length} low stock items <TrendingUp className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardContent>
            )}
          </Card>
        )}

      </div>
    </MainAppLayoutWrapper>
  );
}
