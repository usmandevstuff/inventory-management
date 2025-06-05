
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
    if (sortColumn !== column) return <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 text-primary" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 inline ml-1 text-primary" />;
  };

  const handlePrintInvoice = () => {
    const printContents = document.getElementById("invoice-print-area")?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents && isClient) {
        document.body.innerHTML = `<div class="print-container p-4 sm:p-8 font-body">${printContents}</div><style>@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; font-family: 'Poppins', serif; } .print-container h1, .print-container h2, .print-container h3, .print-container h4 { font-family: 'Raleway', sans-serif;} .print-container .font-headline { font-family: 'Raleway', sans-serif !important; } .print-container .font-body { font-family: 'Poppins', serif !important; } .print-container .text-primary { color: hsl(var(--primary)) !important; } .print-container .text-foreground { color: hsl(var(--foreground)) !important; } .print-container .text-muted-foreground { color: hsl(var(--muted-foreground)) !important; } .print-container .bg-secondary\\/30 { background-color: hsla(var(--secondary), 0.3) !important; } .print-container .border-b { border-bottom-width: 1px !important; } .print-container .border-t { border-top-width: 1px !important; } .print-container .pb-4 { padding-bottom: 1rem !important; } .print-container .pt-2 { padding-top: 0.5rem !important; } .print-container .pt-6 { padding-top: 1.5rem !important; } .print-container .mt-1 { margin-top: 0.25rem !important; } .print-container .mt-6 { margin-top: 1.5rem !important; } .print-container .mb-1 { margin-bottom: 0.25rem !important; } .print-container .mb-2 { margin-bottom: 0.5rem !important; } .print-container .mb-6 { margin-bottom: 1.5rem !important; } .print-container .p-3 { padding: 0.75rem !important; } .print-container .rounded-md { border-radius: 0.375rem !important; } .print-container table { width: 100%; border-collapse: collapse; } .print-container th, .print-container td { border: 1px solid hsl(var(--border)); padding: 0.25rem 0.5rem; text-align: left;} .print-container .text-right { text-align: right !important; } .print-container .text-center { text-align: center !important; } .print-container .font-semibold { font-weight: 600 !important; } .print-container .font-bold { font-weight: 700 !important; } .print-container .font-extrabold { font-weight: 800 !important; } .print-container .text-xs { font-size: 0.75rem !important; } .print-container .text-sm { font-size: 0.875rem !important; } .print-container .text-md { font-size: 1rem !important; } .print-container .text-lg { font-size: 1.125rem !important; } .print-container .text-xl { font-size: 1.25rem !important; } .print-container .text-2xl { font-size: 1.5rem !important; } .print-container .text-3xl { font-size: 1.875rem !important; } }</style>`;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); 
    }
  };

  if (isLoading && !isClient) { 
    return <MainAppLayoutWrapper><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainAppLayoutWrapper>;
  }


  return (
    <MainAppLayoutWrapper>
      <div className="space-y-6">
        <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary">Order History</h1>
        
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="border-b p-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-end">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID, product, notes..."
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
            {filteredAndSortedOrders.length === 0 ? (
               <div className="text-center py-10 sm:py-12 text-muted-foreground font-body">
                <ShoppingBag className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4 text-gray-400" />
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 font-headline">No Orders Found</h3>
                <p className="text-sm sm:text-base">{searchTerm || dateRange.from || dateRange.to ? "Try adjusting your search or filters." : "No orders have been placed yet."}</p>
              </div>
            ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('orderNumber')} className="cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Order ID <SortIndicator column="orderNumber"/></TableHead>
                    <TableHead onClick={() => handleSort('orderDate')} className="cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Date <SortIndicator column="orderDate"/></TableHead>
                    <TableHead className="font-headline text-xs sm:text-sm p-2 sm:p-3 hidden md:table-cell">Items</TableHead>
                    <TableHead onClick={() => handleSort('grandTotal')} className="text-right cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Total <SortIndicator column="grandTotal"/></TableHead>
                    <TableHead onClick={() => handleSort('status')} className="text-center cursor-pointer hover:text-primary font-headline text-xs sm:text-sm p-2 sm:p-3">Status <SortIndicator column="status"/></TableHead>
                    <TableHead className="text-center font-headline text-xs sm:text-sm p-2 sm:p-3">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-secondary/50 transition-colors font-body text-xs sm:text-sm">
                      <TableCell className="font-medium p-2 sm:p-3 whitespace-nowrap">{order.orderNumber}</TableCell>
                      <TableCell className="p-2 sm:p-3 whitespace-nowrap">{format(parseISO(order.orderDate), 'PP p')}</TableCell>
                      <TableCell className="p-2 sm:p-3 hidden md:table-cell">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                      <TableCell className="text-right font-medium p-2 sm:p-3 whitespace-nowrap">${order.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-center p-2 sm:p-3">
                        <Badge 
                          variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                          className="capitalize text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center p-2 sm:p-3">
                        <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10">
                              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            </Button>
                          </DialogTrigger>
                           {selectedOrder && selectedOrder.id === order.id && (
                            <DialogContent className="sm:max-w-2xl font-body data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[90vh] flex flex-col" id="invoice-dialog-content">
                                <DialogHeader className="mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
                                    <DialogTitle className="font-headline text-xl sm:text-2xl md:text-3xl text-primary">Invoice / Order Details</DialogTitle>
                                    <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-muted-foreground gap-1">
                                        <span>Order ID: <span className="font-mono text-xs font-medium text-foreground">{selectedOrder.orderNumber}</span></span>
                                        <span>Date: <span className="font-medium text-foreground">{format(parseISO(selectedOrder.orderDate), 'PPP')}</span></span>
                                    </div>
                                </DialogHeader>
                                <div className="flex-grow overflow-y-auto pr-2 -mr-2 sm:pr-0 sm:-mr-0">
                                  <div id="invoice-print-area">
                                    <h3 className="font-headline text-md sm:text-lg text-primary mb-2">Items:</h3>
                                    <div className="overflow-x-auto mb-4 sm:mb-6">
                                      <Table className="mb-0 text-xs sm:text-sm">
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead className="font-semibold whitespace-nowrap p-1.5 sm:p-2">Product</TableHead>
                                                  <TableHead className="text-center font-semibold p-1.5 sm:p-2">Qty</TableHead>
                                                  <TableHead className="text-right font-semibold whitespace-nowrap p-1.5 sm:p-2">Price/Unit</TableHead>
                                                  <TableHead className="text-right font-semibold whitespace-nowrap hidden sm:table-cell p-1.5 sm:p-2">Discount/Unit</TableHead>
                                                  <TableHead className="text-right font-semibold whitespace-nowrap p-1.5 sm:p-2">Final Price/Unit</TableHead>
                                                  <TableHead className="text-right font-semibold whitespace-nowrap p-1.5 sm:p-2">Line Total</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {selectedOrder.items.map(item => (
                                                  <TableRow key={item.productId}>
                                                      <TableCell className="p-1.5 sm:p-2">{item.productName}</TableCell>
                                                      <TableCell className="text-center p-1.5 sm:p-2">{item.quantity}</TableCell>
                                                      <TableCell className="text-right whitespace-nowrap p-1.5 sm:p-2">${item.unitPrice.toFixed(2)}</TableCell>
                                                      <TableCell className="text-right text-green-600 whitespace-nowrap hidden sm:table-cell p-1.5 sm:p-2">${item.discount.toFixed(2)}</TableCell>
                                                      <TableCell className="text-right font-medium whitespace-nowrap p-1.5 sm:p-2">${item.finalUnitPrice.toFixed(2)}</TableCell>
                                                      <TableCell className="text-right font-bold whitespace-nowrap p-1.5 sm:p-2">${item.lineTotal.toFixed(2)}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm md:text-md w-full ml-auto max-w-xs sm:max-w-sm mr-0">
                                        <span className="font-semibold text-muted-foreground">Subtotal:</span><span className="text-right">${selectedOrder.subtotal.toFixed(2)}</span>
                                        <span className="font-semibold text-muted-foreground">Total Discount:</span><span className="text-right text-green-600">-${selectedOrder.totalDiscount.toFixed(2)}</span>
                                        <span className="font-bold text-md sm:text-lg md:text-xl text-primary border-t pt-1 sm:pt-2 mt-1">Grand Total:</span><span className="text-right font-extrabold text-md sm:text-lg md:text-xl text-primary border-t pt-1 sm:pt-2 mt-1">${selectedOrder.grandTotal.toFixed(2)}</span>
                                    </div>

                                    {selectedOrder.notes && (
                                        <div className="mt-4 sm:mt-6">
                                            <h4 className="font-headline text-sm sm:text-md text-primary mb-1">Notes:</h4>
                                            <p className="bg-secondary/30 p-2 sm:p-3 rounded-md text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                  </div>
                                </div>
                                <DialogFooter className="pt-4 sm:pt-6 border-t mt-auto flex flex-col sm:flex-row gap-2 w-full">
                                  <Button type="button" variant="outline" onClick={handlePrintInvoice} className="font-body text-xs sm:text-sm w-full sm:w-auto">Print Invoice</Button>
                                  <DialogClose asChild><Button type="button" className="font-body text-xs sm:text-sm w-full sm:w-auto">Close</Button></DialogClose>
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
