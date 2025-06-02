
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/contexts/StoreContext';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Filter, ListFilter, Loader2, Receipt, Search, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { Transaction } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

type SortableTransactionColumns = 'productName' | 'type' | 'quantityChange' | 'timestamp' | 'totalValue';
type SortDirection = 'asc' | 'desc';

export default function HistoryPage() {
  const { transactions, products, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortColumn, setSortColumn] = useState<SortableTransactionColumns>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const transactionTypes = useMemo(() => Array.from(new Set(transactions.map(t => t.type))).sort(), [transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => {
      const txDate = parseISO(tx.timestamp);
      if (!isValid(txDate)) return false; // Skip invalid dates

      const matchesSearch = tx.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType ? tx.type === filterType : true;
      const matchesProduct = filterProduct ? tx.productId === filterProduct : true;
      const matchesDate = (!dateRange.from || txDate >= dateRange.from) && 
                          (!dateRange.to || txDate <= new Date(dateRange.to.setHours(23,59,59,999)));
      return matchesSearch && matchesType && matchesProduct && matchesDate;
    });

    return filtered.sort((a, b) => {
      let compareA, compareB;
      switch(sortColumn) {
        case 'quantityChange':
          compareA = a.quantityChange;
          compareB = b.quantityChange;
          break;
        case 'totalValue':
          compareA = a.totalValue || 0;
          compareB = b.totalValue || 0;
          break;
        case 'timestamp':
          compareA = parseISO(a.timestamp).getTime();
          compareB = parseISO(b.timestamp).getTime();
          break;
        default: 
          compareA = (a[sortColumn] || '').toLowerCase();
          compareB = (b[sortColumn] || '').toLowerCase();
      }
      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, searchTerm, filterType, filterProduct, dateRange, sortColumn, sortDirection]);

  const handleSort = (column: SortableTransactionColumns) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'timestamp' ? 'desc' : 'asc');
    }
  };
  
  const SortIndicator = ({ column }: { column: SortableTransactionColumns }) => {
    if (sortColumn !== column) return <ChevronDown className="h-4 w-4 inline ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline ml-1 text-primary" /> : <ChevronDown className="h-4 w-4 inline ml-1 text-primary" />;
  };

  const handlePrintInvoice = () => {
    const printContents = document.getElementById("invoice-print-area")?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        // Re-initialize any event listeners if needed, or simply reload the page for complex scenarios
        // For this simple case, restoring originalContents should be okay, but React state might be lost.
        // A better approach for complex apps is a dedicated print view or iframe.
        window.location.reload(); // Simplest way to restore state & listeners
    }
  };

  if (isLoading) {
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }

  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <h1 className="font-headline text-4xl text-primary">Transaction History</h1>
        
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="font-body pl-10 h-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="font-body h-10"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                <SelectContent className="font-body">
                  <SelectItem value="">All Types</SelectItem>
                  {transactionTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="font-body h-10"><SelectValue placeholder="Filter by Product" /></SelectTrigger>
                <SelectContent className="font-body">
                  <SelectItem value="">All Products</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal font-body h-10">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                      : format(dateRange.from, "LLL dd, y")
                    ) : "Filter by Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    initialFocus
                    className="font-body"
                    numberOfMonths={2}
                  />
                  { (dateRange.from || dateRange.to) && 
                    <Button onClick={() => setDateRange({})} variant="ghost" className="w-full justify-start text-sm text-destructive hover:text-destructive font-body h-auto py-1.5 px-2">
                      <XCircle className="mr-2 h-4 w-4" /> Clear dates
                    </Button>
                  }
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredAndSortedTransactions.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground font-body">
                <ListFilter className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 font-headline">No Transactions Found</h3>
                <p>Try adjusting your search or filters, or check back later.</p>
              </div>
            ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('timestamp')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Date <SortIndicator column="timestamp"/></TableHead>
                    <TableHead onClick={() => handleSort('productName')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Product <SortIndicator column="productName"/></TableHead>
                    <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Type <SortIndicator column="type"/></TableHead>
                    <TableHead onClick={() => handleSort('quantityChange')} className="text-right cursor-pointer hover:text-primary font-headline text-sm p-3">Quantity <SortIndicator column="quantityChange"/></TableHead>
                     <TableHead className="hidden md:table-cell text-right font-headline text-sm p-3">Stock Before</TableHead>
                    <TableHead className="hidden md:table-cell text-right font-headline text-sm p-3">Stock After</TableHead>
                    <TableHead onClick={() => handleSort('totalValue')} className="text-right hidden sm:table-cell cursor-pointer hover:text-primary font-headline text-sm p-3">Value <SortIndicator column="totalValue"/></TableHead>
                    <TableHead className="text-center font-headline text-sm p-3">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-secondary/50 transition-colors font-body">
                      <TableCell className="p-3">{format(parseISO(tx.timestamp), 'PP pp')}</TableCell>
                      <TableCell className="font-medium p-3">{tx.productName}</TableCell>
                      <TableCell className="p-3">
                        <Badge 
                          variant={tx.type === 'sale' || (tx.type==='adjustment' && tx.quantityChange < 0) ? 'destructive' : tx.type === 'restock' || tx.type === 'return' || (tx.type==='adjustment' && tx.quantityChange > 0) ? 'default' : 'secondary'}
                          className="capitalize text-xs"
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium p-3 ${tx.quantityChange < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right p-3">{tx.stockBefore}</TableCell>
                      <TableCell className="hidden md:table-cell text-right p-3">{tx.stockAfter}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell p-3">
                        {tx.totalValue !== undefined ? `$${tx.totalValue.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-center p-3">
                        <Dialog onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedTransaction(tx)} className="h-8 w-8 hover:bg-primary/10">
                              <Receipt className="h-4 w-4 text-primary" />
                            </Button>
                          </DialogTrigger>
                           {selectedTransaction && selectedTransaction.id === tx.id && ( // ensure correct dialog content
                            <DialogContent className="sm:max-w-lg font-body" id="invoice-dialog-content">
                                <div id="invoice-print-area">
                                <DialogHeader className="mb-4 border-b pb-4">
                                    <DialogTitle className="font-headline text-2xl text-primary">Transaction Details</DialogTitle>
                                    <DialogDescription>Transaction ID: <span className="font-mono text-xs">{selectedTransaction.id}</span></DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                                    <span className="font-semibold text-muted-foreground">Date:</span><span>{format(parseISO(selectedTransaction.timestamp), 'PPP ppp')}</span>
                                    <span className="font-semibold text-muted-foreground">Product:</span><span className="font-medium">{selectedTransaction.productName}</span>
                                    <span className="font-semibold text-muted-foreground">Type:</span><span className="capitalize">{selectedTransaction.type}</span>
                                    <span className="font-semibold text-muted-foreground">Quantity:</span><span>{selectedTransaction.quantityChange}</span>
                                    <span className="font-semibold text-muted-foreground">Stock Before:</span><span>{selectedTransaction.stockBefore}</span>
                                    <span className="font-semibold text-muted-foreground">Stock After:</span><span>{selectedTransaction.stockAfter}</span>
                                    {selectedTransaction.pricePerUnit !== undefined && (<><span className="font-semibold text-muted-foreground">Price/Unit:</span><span>${selectedTransaction.pricePerUnit.toFixed(2)}</span></>)}
                                    {selectedTransaction.totalValue !== undefined && (<><span className="font-semibold text-muted-foreground">Total Value:</span><span className="font-bold text-lg text-foreground">${selectedTransaction.totalValue.toFixed(2)}</span></>)}
                                    {selectedTransaction.notes && (<><span className="font-semibold text-muted-foreground col-span-2">Notes:</span><p className="col-span-2 bg-secondary/30 p-2 rounded-md text-xs">{selectedTransaction.notes}</p></>)}
                                </div>
                                </div>
                                <DialogFooter className="pt-6 border-t mt-4">
                                <Button type="button" variant="outline" onClick={handlePrintInvoice} className="font-body">Print</Button>
                                <DialogClose asChild><Button type="button" className="font-body">Close</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>
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
