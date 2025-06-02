
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
import { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, ListFilter, Loader2, Receipt, Search, ChevronDown, ChevronUp, XCircle, ShoppingBag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { Order, OrderItem } from '@/lib/types';
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

type SortableOrderColumns = 'orderNumber' | 'orderDate' | 'grandTotal' | 'status';
type SortDirection = 'asc' | 'desc';

export default function HistoryPage() {
  const { orders, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortColumn, setSortColumn] = useState<SortableOrderColumns>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const orderDate = parseISO(order.orderDate);
      if (!isValid(orderDate)) return false;

      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(lowerSearchTerm) ||
        (order.notes && order.notes.toLowerCase().includes(lowerSearchTerm)) ||
        order.items.some(item => item.productName.toLowerCase().includes(lowerSearchTerm));

      const matchesDate = (!dateRange.from || orderDate >= dateRange.from) && 
                          (!dateRange.to || orderDate <= new Date(dateRange.to.setHours(23,59,59,999)));
      return matchesSearch && matchesDate;
    });

    return filtered.sort((a, b) => {
      let compareA, compareB;
      switch(sortColumn) {
        case 'grandTotal':
          compareA = a.grandTotal;
          compareB = b.grandTotal;
          break;
        case 'orderDate':
          compareA = parseISO(a.orderDate).getTime();
          compareB = parseISO(b.orderDate).getTime();
          break;
        default: 
          compareA = (a[sortColumn] || '').toLowerCase();
          compareB = (b[sortColumn] || '').toLowerCase();
      }
      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, searchTerm, dateRange, sortColumn, sortDirection]);

  const handleSort = (column: SortableOrderColumns) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'orderDate' ? 'desc' : 'asc');
    }
  };
  
  const SortIndicator = ({ column }: { column: SortableOrderColumns }) => {
    if (sortColumn !== column) return <ChevronDown className="h-4 w-4 inline ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline ml-1 text-primary" /> : <ChevronDown className="h-4 w-4 inline ml-1 text-primary" />;
  };

  const handlePrintInvoice = () => {
    const printContents = document.getElementById("invoice-print-area")?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents && isClient) {
        document.body.innerHTML = `<div class="print-container p-8">${printContents}</div><style>@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; } }</style>`;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); 
    }
  };

  if (isLoading && !isClient) { // Show loader only if not yet client-side hydrated and still loading
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }


  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <h1 className="font-headline text-4xl text-primary">Order History</h1>
        
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID, product, notes..."
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
            {filteredAndSortedOrders.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground font-body">
                <ShoppingBag className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 font-headline">No Orders Found</h3>
                <p>{searchTerm || dateRange.from || dateRange.to ? "Try adjusting your search or filters." : "No orders have been placed yet."}</p>
              </div>
            ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('orderNumber')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Order ID <SortIndicator column="orderNumber"/></TableHead>
                    <TableHead onClick={() => handleSort('orderDate')} className="cursor-pointer hover:text-primary font-headline text-sm p-3">Date <SortIndicator column="orderDate"/></TableHead>
                    <TableHead className="font-headline text-sm p-3">Items</TableHead>
                    <TableHead onClick={() => handleSort('grandTotal')} className="text-right cursor-pointer hover:text-primary font-headline text-sm p-3">Total <SortIndicator column="grandTotal"/></TableHead>
                    <TableHead onClick={() => handleSort('status')} className="text-center cursor-pointer hover:text-primary font-headline text-sm p-3">Status <SortIndicator column="status"/></TableHead>
                    <TableHead className="text-center font-headline text-sm p-3">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-secondary/50 transition-colors font-body">
                      <TableCell className="font-medium p-3">{order.orderNumber}</TableCell>
                      <TableCell className="p-3">{format(parseISO(order.orderDate), 'PP pp')}</TableCell>
                      <TableCell className="p-3">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                      <TableCell className="text-right font-medium p-3">${order.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-center p-3">
                        <Badge 
                          variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                          className="capitalize text-xs"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center p-3">
                        <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} className="h-8 w-8 hover:bg-primary/10">
                              <Receipt className="h-4 w-4 text-primary" />
                            </Button>
                          </DialogTrigger>
                           {selectedOrder && selectedOrder.id === order.id && (
                            <DialogContent className="sm:max-w-2xl font-body" id="invoice-dialog-content">
                                <div id="invoice-print-area">
                                <DialogHeader className="mb-6 border-b pb-4">
                                    <DialogTitle className="font-headline text-3xl text-primary">Invoice / Order Details</DialogTitle>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Order ID: <span className="font-mono text-xs font-medium text-foreground">{selectedOrder.orderNumber}</span></span>
                                        <span>Date: <span className="font-medium text-foreground">{format(parseISO(selectedOrder.orderDate), 'PPP')}</span></span>
                                    </div>
                                </DialogHeader>
                                
                                <h3 className="font-headline text-lg text-primary mb-2">Items:</h3>
                                <Table className="mb-6 text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold">Product</TableHead>
                                            <TableHead className="text-center font-semibold">Qty</TableHead>
                                            <TableHead className="text-right font-semibold">Price/Unit</TableHead>
                                            <TableHead className="text-right font-semibold">Discount/Unit</TableHead>
                                            <TableHead className="text-right font-semibold">Final Price/Unit</TableHead>
                                            <TableHead className="text-right font-semibold">Line Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items.map(item => (
                                            <TableRow key={item.productId}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-green-600">${item.discount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-medium">${item.finalUnitPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold">${item.lineTotal.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-md w-full ml-auto max-w-xs mr-0">
                                    <span className="font-semibold text-muted-foreground">Subtotal:</span><span className="text-right">${selectedOrder.subtotal.toFixed(2)}</span>
                                    <span className="font-semibold text-muted-foreground">Total Discount:</span><span className="text-right text-green-600">-${selectedOrder.totalDiscount.toFixed(2)}</span>
                                    <span className="font-bold text-xl text-primary border-t pt-2 mt-1">Grand Total:</span><span className="text-right font-extrabold text-xl text-primary border-t pt-2 mt-1">${selectedOrder.grandTotal.toFixed(2)}</span>
                                </div>

                                {selectedOrder.notes && (
                                    <div className="mt-6">
                                        <h4 className="font-headline text-md text-primary mb-1">Notes:</h4>
                                        <p className="bg-secondary/30 p-3 rounded-md text-sm text-muted-foreground whitespace-pre-wrap">{selectedOrder.notes}</p>
                                    </div>
                                )}
                                </div>
                                <DialogFooter className="pt-6 border-t mt-6">
                                <Button type="button" variant="outline" onClick={handlePrintInvoice} className="font-body">Print Invoice</Button>
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
