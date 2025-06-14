
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Search, ChevronDown, ChevronUp, Loader2, Repeat, FileText, XCircle, Info, View } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { Transaction } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription as ShadcnDialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

type SortableTransactionColumns = 'timestamp' | 'productName' | 'type' | 'quantityChange' | 'stockAfter';
type SortDirection = 'asc' | 'desc';

export default function TransactionsPage() {
  const { transactions, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortColumn, setSortColumn] = useState<SortableTransactionColumns>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => {
      const txDate = parseISO(tx.timestamp);
      if (!isValid(txDate)) return false;

      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = 
        (tx.productName && tx.productName.toLowerCase().includes(lowerSearchTerm)) ||
        tx.type.toLowerCase().includes(lowerSearchTerm) ||
        (tx.notes && tx.notes.toLowerCase().includes(lowerSearchTerm));

      const matchesDate = (!dateRange.from || txDate >= dateRange.from) && 
                          (!dateRange.to || txDate <= new Date(dateRange.to.setHours(23,59,59,999)));
      return matchesSearch && matchesDate;
    });

    return filtered.sort((a, b) => {
      let compareA, compareB;
      switch(sortColumn) {
        case 'quantityChange':
        case 'stockAfter':
          compareA = a[sortColumn];
          compareB = b[sortColumn];
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
  }, [transactions, searchTerm, dateRange, sortColumn, sortDirection]);

  const handleSort = (column: SortableTransactionColumns) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'timestamp' ? 'desc' : 'asc');
    }
  };
  
  const SortIndicator = ({ column }: { column: SortableTransactionColumns }) => {
    if (sortColumn !== column) return <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 text-primary" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 text-primary" />;
  };

  const getTransactionTypeBadgeVariant = (type: Transaction['type']) => {
    switch(type) {
      case 'sale': return 'destructive';
      case 'restock':
      case 'return':
      case 'initial': return 'default'; 
      case 'adjustment': return 'secondary';
      default: return 'outline';
    }
  };
  
  const formatQuantityChange = (tx: Transaction) => {
    if (tx.type === 'sale' && tx.quantityChange > 0) { 
        return `-${tx.quantityChange}`;
    }
    if ((tx.type === 'restock' || tx.type === 'return' || tx.type === 'initial') && tx.quantityChange < 0) { 
        return `+${Math.abs(tx.quantityChange)}`;
    }
    return tx.quantityChange > 0 ? `+${tx.quantityChange}` : `${tx.quantityChange}`;
  };


  if (isLoading && !isClient) { 
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }

  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center gap-2 sm:gap-3 border-b pb-3 sm:pb-4">
          <Repeat className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary">All Transactions</h1>
        </div>
        
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b p-4">
             <CardDescription className="font-body text-xs sm:text-sm md:text-md text-muted-foreground">
                A detailed log of all stock movements. Currently showing {filteredAndSortedTransactions.length} of {transactions.length} total transactions.
            </CardDescription>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-end pt-3 sm:pt-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, type, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="font-body pl-10 h-9 sm:h-10 w-full text-xs sm:text-sm"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal font-body h-9 sm:h-10 text-xs sm:text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                      : format(dateRange.from, "LLL dd, y")
                    ) : "Filter by Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    initialFocus
                    className="font-body"
                    numberOfMonths={isClient && typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                  />
                   { (dateRange.from || dateRange.to) && 
                    <Button onClick={() => setDateRange({})} variant="ghost" className="w-full justify-start text-xs sm:text-sm text-destructive hover:text-destructive font-body h-auto py-1.5 px-2">
                      <XCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Clear dates
                    </Button>
                  }
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredAndSortedTransactions.length === 0 ? (
               <div className="text-center py-10 sm:py-12 text-muted-foreground font-body">
                <FileText className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4 text-gray-400" />
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 font-headline">No Transactions Found</h3>
                <p className="text-sm sm:text-base">{searchTerm || dateRange.from || dateRange.to ? "Try adjusting your search or date filters." : "No transactions have been recorded yet."}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('timestamp')} className="cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Date <SortIndicator column="timestamp"/></TableHead>
                    <TableHead onClick={() => handleSort('productName')} className="cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Product <SortIndicator column="productName"/></TableHead>
                    <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Type <SortIndicator column="type"/></TableHead>
                    <TableHead onClick={() => handleSort('quantityChange')} className="text-center cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Change <SortIndicator column="quantityChange"/></TableHead>
                    <TableHead className="text-center font-headline text-xs sm:text-sm p-2 sm:p-3 hidden md:table-cell">Stock Before</TableHead>
                    <TableHead onClick={() => handleSort('stockAfter')} className="text-center cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Stock After <SortIndicator column="stockAfter"/></TableHead>
                    <TableHead className="font-headline text-xs sm:text-sm p-2 sm:p-3 hidden lg:table-cell">Notes</TableHead>
                    <TableHead className="text-center font-headline text-xs sm:text-sm p-2 sm:p-3">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((tx) => (
                    <TableRow 
                        key={tx.id} 
                        className="hover:bg-primary/10 transition-colors font-body cursor-pointer"
                        onClick={() => setSelectedTransaction(tx)}
                    >
                      <TableCell className="p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm">{format(parseISO(tx.timestamp), 'PP p')}</TableCell>
                      <TableCell className="font-medium p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm">{tx.productName || 'N/A'}</TableCell>
                      <TableCell className="p-2 sm:p-3">
                        <Badge 
                          variant={getTransactionTypeBadgeVariant(tx.type)}
                          className="capitalize text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5"
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-center p-2 sm:p-3 font-medium text-xs sm:text-sm ${tx.quantityChange < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatQuantityChange(tx)}
                      </TableCell>
                      <TableCell className="text-center p-2 sm:p-3 hidden md:table-cell text-xs sm:text-sm">{tx.stockBefore}</TableCell>
                      <TableCell className="text-center p-2 sm:p-3 font-bold text-xs sm:text-sm">{tx.stockAfter}</TableCell>
                      <TableCell className="p-2 sm:p-3 text-xs text-muted-foreground max-w-[80px] sm:max-w-[100px] md:max-w-[120px] truncate hidden lg:table-cell" title={tx.notes || ''}>{tx.notes || '-'}</TableCell>
                       <TableCell className="text-center p-2 sm:p-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/20" onClick={(e) => { e.stopPropagation(); setSelectedTransaction(tx); }}>
                            <View className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
          <DialogContent className="sm:max-w-md md:max-w-lg font-body data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[90vh] flex flex-col">
            <DialogHeader className="pb-3 sm:pb-4 border-b">
              <DialogTitle className="font-headline text-xl sm:text-2xl md:text-3xl text-primary">Transaction Details</DialogTitle>
              <ShadcnDialogDescription className="text-xs sm:text-sm pt-1">
                ID: <span className="font-mono text-xs font-medium text-foreground">{selectedTransaction.id}</span>
              </ShadcnDialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 sm:pr-0 sm:-mr-0 py-3 sm:py-4 space-y-3 sm:space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div><span className="font-semibold text-muted-foreground">Date:</span> {format(parseISO(selectedTransaction.timestamp), 'PPP p')}</div>
                <div><span className="font-semibold text-muted-foreground">Type:</span> <Badge variant={getTransactionTypeBadgeVariant(selectedTransaction.type)} className="capitalize text-xs">{selectedTransaction.type}</Badge></div>
              </div>
               <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-headline text-md sm:text-lg text-primary mb-1.5 sm:mb-2">Product Information</h4>
                <div><span className="font-semibold text-muted-foreground">Product Name:</span> {selectedTransaction.productName || 'N/A'}</div>
                <div><span className="font-semibold text-muted-foreground">Product ID:</span> <span className="font-mono text-xs">{selectedTransaction.productId || 'N/A'}</span></div>
              </div>
              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-headline text-md sm:text-lg text-primary mb-1.5 sm:mb-2">Stock Change Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                    <div><span className="font-semibold text-muted-foreground">Change:</span> <span className={selectedTransaction.quantityChange < 0 ? 'text-destructive font-bold' : 'text-green-600 font-bold'}>{formatQuantityChange(selectedTransaction)}</span></div>
                    <div><span className="font-semibold text-muted-foreground">Stock Before:</span> {selectedTransaction.stockBefore}</div>
                    <div><span className="font-semibold text-muted-foreground">Stock After:</span> {selectedTransaction.stockAfter}</div>
                </div>
              </div>
              {(selectedTransaction.type === 'sale' || selectedTransaction.pricePerUnit !== undefined) && (
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-headline text-md sm:text-lg text-primary mb-1.5 sm:mb-2">Financials</h4>
                  <div><span className="font-semibold text-muted-foreground">Price/Unit:</span> ${selectedTransaction.pricePerUnit?.toFixed(2) || 'N/A'}</div>
                  <div><span className="font-semibold text-muted-foreground">Total Value:</span> ${selectedTransaction.totalValue?.toFixed(2) || 'N/A'}</div>
                </div>
              )}
              {selectedTransaction.notes && (
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-headline text-md sm:text-lg text-primary mb-1.5 sm:mb-2">Notes</h4>
                  <p className="bg-secondary/30 p-2 sm:p-3 rounded-md text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4 sm:pt-6 border-t mt-auto">
              <DialogClose asChild><Button type="button" className="font-body text-xs sm:text-sm w-full sm:w-auto">Close</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainAppLayoutWrapper>
  );
}
