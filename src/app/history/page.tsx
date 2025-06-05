
"use client";

import MainAppLayoutWrapper from '@/components/layout/MainAppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext'; 
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
import { useToast } from '@/hooks/use-toast';


type SortableOrderColumns = 'orderNumber' | 'orderDate' | 'grandTotal' | 'status';
type SortDirection = 'asc' | 'desc';

export default function HistoryPage() {
  const { orders, isLoading } = useStore();
  const { user } = useAuth(); 
  const { toast } = useToast();
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
    const printArea = document.getElementById("invoice-print-area");
    if (!printArea || !isClient || !selectedOrder) {
      toast({
        title: "Print Error",
        description: "Could not find invoice content or selected order to print.",
        variant: "destructive",
      });
      return;
    }

    const storeName = user?.user_metadata?.store_name || 'Threadcount Tracker';
    const invoiceGeneratedDate = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const invoiceHeaderHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-family: 'Raleway', sans-serif; font-size: 24px; color: hsl(var(--primary)) !important; margin-bottom: 5px !important;">${storeName}</h1>
        <p style="font-family: 'Poppins', sans-serif; font-size: 14px; color: hsl(var(--muted-foreground)) !important; margin-top: 0 !important;">Invoice Generated: ${invoiceGeneratedDate}</p>
        <p style="font-family: 'Poppins', sans-serif; font-size: 14px; color: hsl(var(--muted-foreground)) !important; margin-top: 5px !important;">Order ID: ${selectedOrder.orderNumber} | Order Date: ${format(parseISO(selectedOrder.orderDate), 'PPP')}</p>
      </div>
      <hr style="border: none; border-top: 1px solid hsl(var(--border)) !important; margin-bottom: 20px !important;">
    `;

    const invoiceContentHtml = printArea.innerHTML;
    
    const themeCssVariables = `
      :root {
        --background: 120 11% 95%; --foreground: 0 0% 10%;
        --card: 0 0% 100%; --card-foreground: 0 0% 10%;
        --popover: 0 0% 100%; --popover-foreground: 0 0% 10%;
        --primary: 176 25% 54%; --primary-foreground: 0 0% 100%;
        --secondary: 176 20% 88%; --secondary-foreground: 176 25% 25%;
        --muted: 176 15% 92%; --muted-foreground: 176 10% 45%;
        --accent: 16 70% 70%; --accent-foreground: 0 0% 10%;
        --destructive: 0 72% 51%; --destructive-foreground: 0 0% 100%;
        --border: 176 20% 80%; --input: 176 20% 90%;
        --ring: 16 70% 70%;
      }
    `;

    const printSpecificStyles = `
      body {
        font-family: 'Poppins', sans-serif;
        color: hsl(var(--foreground)) !important;
        background-color: #ffffff !important;
        margin: 0;
        padding: 20px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print-container { width: 100%; max-width: 800px; margin: 0 auto; }
      h1, h2, h3, h4, h5, h6, .font-headline { font-family: 'Raleway', sans-serif !important; }
      
      .text-primary { color: hsl(var(--primary)) !important; }
      .text-foreground { color: hsl(var(--foreground)) !important; }
      .text-muted-foreground { color: hsl(var(--muted-foreground)) !important; }
      .text-destructive { color: hsl(var(--destructive)) !important; }
      .text-green-600 { color: #16a34a !important; } /* Direct color for green */
      .bg-secondary\\/30 { background-color: hsla(var(--secondary), 0.3) !important; }

      table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
      th, td { border: 1px solid hsl(var(--border)) !important; padding: 8px !important; text-align: left !important; font-size: 12px; }
      th { font-weight: 600 !important; background-color: hsl(var(--muted)) !important; }
      td { vertical-align: top; }

      .font-semibold { font-weight: 600 !important; }
      .font-bold { font-weight: 700 !important; }
      .font-extrabold { font-weight: 800 !important; }
      .text-right { text-align: right !important; }
      .text-center { text-align: center !important; }
      
      .mb-1 { margin-bottom: 0.25rem !important; }
      .mb-2 { margin-bottom: 0.5rem !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .mb-6 { margin-bottom: 1.5rem !important; }
      .mt-1 { margin-top: 0.25rem !important; }
      .mt-4 { margin-top: 1rem !important; }
      .mt-6 { margin-top: 1.5rem !important; }
      .p-2 { padding: 0.5rem !important; }
      .p-3 { padding: 0.75rem !important; }
      .pt-1 { padding-top: 0.25rem !important; }
      .pt-2 { padding-top: 0.5rem !important; }
      .pb-4 { padding-bottom: 1rem !important; }
      .rounded-md { border-radius: 0.375rem !important; }
      .whitespace-pre-wrap { white-space: pre-wrap !important; }
      .border-t { border-top: 1px solid hsl(var(--border)) !important; }
      
      /* Mimic grid for summary section */
      .summary-grid { display: grid; grid-template-columns: auto auto; gap: 4px 16px; max-width: 320px; margin-left: auto; margin-right: 0; }
      .summary-grid span:nth-child(odd) { text-align: left; }
      .summary-grid span:nth-child(even) { text-align: right; }

      /* Font sizes from invoice-print-area */
      .text-xs { font-size: 0.75rem !important; }
      .text-sm { font-size: 0.875rem !important; }
      .text-md { font-size: 1rem !important; } /* Mapped from .text-md in JSX */
      .text-lg { font-size: 1.125rem !important; } /* Mapped from .text-lg in JSX */
      .text-xl { font-size: 1.25rem !important; } /* Mapped from .text-xl in JSX */

      @media print {
        @page { margin: 0.5in; }
        body { padding: 0; }
        .print-container { margin:0; max-width:none; }
        .no-print { display: none !important; }
        a[href]:after { content: none !important; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
      }
    `;
    
    const finalHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${selectedOrder.orderNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
        <style>
          ${themeCssVariables}
          ${printSpecificStyles}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${invoiceHeaderHtml}
          ${invoiceContentHtml.replace(/class="grid grid-cols-2 .*?"/g, 'class="summary-grid"')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'height=800,width=800,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes');

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(finalHtml);
      printWindow.document.close();
      
      printWindow.onload = () => { // Ensure content is loaded before printing
        setTimeout(() => {
          printWindow.focus(); // For some browsers
          printWindow.print();
          // printWindow.close(); // Optional: close window after printing
        }, 500); // Increased timeout for rendering
      };
    } else {
      toast({
        title: "Print Error",
        description: "Could not open print window. Please check your browser's pop-up blocker settings.",
        variant: "destructive",
      });
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
               <div className="relative w-full overflow-auto">
                <Table className="min-w-[600px]">
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
                                      <DialogDescription asChild>
                                        <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-muted-foreground gap-1 pt-1">
                                            <span>Order ID: <span className="font-mono text-xs font-medium text-foreground">{selectedOrder.orderNumber}</span></span>
                                            <span>Date: <span className="font-medium text-foreground">{format(parseISO(selectedOrder.orderDate), 'PPP')}</span></span>
                                        </div>
                                      </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex-grow overflow-y-auto pr-2 -mr-2 sm:pr-0 sm:-mr-0">
                                    <div id="invoice-print-area">
                                      <h3 className="font-headline text-md sm:text-lg text-primary mb-2">Items:</h3>
                                      <div className="overflow-x-auto mb-4 sm:mb-6">
                                        <Table className="mb-0 text-xs sm:text-sm min-w-[500px]">
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


    