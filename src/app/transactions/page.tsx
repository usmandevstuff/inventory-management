
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
import { Calendar as CalendarIcon, Search, ChevronDown, ChevronUp, Loader2, Repeat, FileText, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { Transaction } from '@/lib/types';

type SortableTransactionColumns = 'timestamp' | 'productName' | 'type' | 'quantityChange' | 'stockAfter';
type SortDirection = 'asc' | 'desc';

export default function TransactionsPage() {
  const { transactions, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortColumn, setSortColumn] = useState<SortableTransactionColumns>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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
    if (sortColumn !== column) return <ChevronDown className="h-4 w-4 inline ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline ml-1 text-primary" /> : <ChevronDown className="h-4 w-4 inline ml-1 text-primary" />;
  };

  const getTransactionTypeBadgeVariant = (type: Transaction['type']) => {
    switch(type) {
      case 'sale': return 'destructive';
      case 'restock':
      case 'return':
      case 'initial': return 'default'; // Consider a specific 'success' or 'positive' variant
      case 'adjustment': return 'secondary';
      default: return 'outline';
    }
  };
  
  const formatQuantityChange = (tx: Transaction) => {
    if (tx.type === 'sale' && tx.quantityChange > 0) { // Sale should be negative
        return `-${tx.quantityChange}`;
    }
    if ((tx.type === 'restock' || tx.type === 'return' || tx.type === 'initial') && tx.quantityChange < 0) { // These should be positive
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
        <div className="flex items-center gap-3 border-b pb-4">
          <Repeat className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-4xl text-primary">All Transactions</h1>
        </div>
        
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b">
             <CardDescription className="font-body text-md text-muted-foreground">
                A detailed log of all stock movements. Currently showing {filteredAndSortedTransactions.length} of {transactions.length} total transactions.
            </CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, type, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="font-body pl-10 h-10"
                />
              </div>
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
                <FileText className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 font-headline">No Transactions Found</h3>
                <p>{searchTerm || dateRange.from || dateRange.to ? "Try adjusting your search or date filters." : "No transactions have been recorded yet."}</p>
              </div>
            ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('timestamp')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Date <SortIndicator column="timestamp"/></TableHead>
                    <TableHead onClick={() => handleSort('productName')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Product Name <SortIndicator column="productName"/></TableHead>
                    <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Type <SortIndicator column="type"/></TableHead>
                    <TableHead onClick={() => handleSort('quantityChange')} className="text-center cursor-pointer hover:text-primary font-headline text-sm p-3">Change <SortIndicator column="quantityChange"/></TableHead>
                    <TableHead className="text-center font-headline text-sm p-3">Stock Before</TableHead>
                    <TableHead onClick={() => handleSort('stockAfter')} className="text-center cursor-pointer hover:text-primary font-headline text-sm p-3">Stock After <SortIndicator column="stockAfter"/></TableHead>
                    <TableHead className="font-headline text-sm p-3">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-secondary/50 transition-colors font-body">
                      <TableCell className="p-3 whitespace-nowrap">{format(parseISO(tx.timestamp), 'PP pp')}</TableCell>
                      <TableCell className="font-medium p-3">{tx.productName || 'N/A'}</TableCell>
                      <TableCell className="p-3">
                        <Badge 
                          variant={getTransactionTypeBadgeVariant(tx.type)}
                          className="capitalize text-xs"
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-center p-3 font-medium ${tx.quantityChange < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatQuantityChange(tx)}
                      </TableCell>
                      <TableCell className="text-center p-3">{tx.stockBefore}</TableCell>
                      <TableCell className="text-center p-3 font-bold">{tx.stockAfter}</TableCell>
                      <TableCell className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={tx.notes}>{tx.notes || '-'}</TableCell>
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
