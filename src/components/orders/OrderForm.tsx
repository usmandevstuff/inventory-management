
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as _ from "lodash"; // For _.debounce
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, OrderItem as OrderItemType } from "@/lib/types";
import { useStore } from "@/contexts/StoreContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, ShoppingCart, PlusCircle, Trash2, Info } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";

const orderItemSchema = z.object({
  productId: z.string().min(1, { message: "Product must be selected." }),
  productName: z.string(), // Will be set when productId changes
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1." }),
  unitPrice: z.coerce.number().min(0, { message: "Unit price cannot be negative." }),
  discount: z.coerce.number().min(0, { message: "Discount cannot be negative." }).optional().default(0),
});

const orderFormSchema = z.object({
  items: z.array(orderItemSchema).min(1, { message: "Order must have at least one item." }),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export function OrderForm() {
  const { products, addOrder, getProductById, isLoading: storeIsLoading } = useStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    grandTotal: 0,
  });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0, discount: 0 }],
      notes: "",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const calculateAndUpdateTotalsInternal = useCallback((currentItems: OrderFormValues['items']) => {
    let subtotal = 0;
    let totalDiscount = 0;
    
    currentItems.forEach(item => {
      const itemUnitPrice = Number(item.unitPrice) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      const itemDiscountPerUnit = Number(item.discount) || 0;

      subtotal += itemUnitPrice * itemQuantity;
      totalDiscount += itemDiscountPerUnit * itemQuantity;
    });

    const grandTotal = subtotal - totalDiscount;
    setCalculatedTotals({ subtotal, totalDiscount, grandTotal });
  }, [setCalculatedTotals]);

  const debouncedCalculateAndUpdateTotals = useMemo(
    () => _.debounce(calculateAndUpdateTotalsInternal, 300),
    [calculateAndUpdateTotalsInternal]
  );

  useEffect(() => {
    if (watchedItems && watchedItems.length > 0) {
      debouncedCalculateAndUpdateTotals(watchedItems);
    } else {
      setCalculatedTotals({ subtotal: 0, totalDiscount: 0, grandTotal: 0 });
      debouncedCalculateAndUpdateTotals.cancel();
    }

    return () => {
      debouncedCalculateAndUpdateTotals.cancel();
    };
  }, [watchedItems, debouncedCalculateAndUpdateTotals]);


  const handleProductChange = (itemIndex: number, productId: string) => {
    const product = getProductById(productId);
    if (product) {
      form.setValue(`items.${itemIndex}.productName`, product.name, { shouldValidate: true });
      form.setValue(`items.${itemIndex}.unitPrice`, product.price, { shouldValidate: true });
      form.setValue(`items.${itemIndex}.discount`, 0, { shouldValidate: true }); 
    }
  };

  async function onSubmit(data: OrderFormValues) {
    setIsSubmitting(true);
    try {
      const orderItems: OrderItemType[] = data.items.map(item => {
        const finalUnitPrice = (Number(item.unitPrice) || 0) - (Number(item.discount) || 0);
        return {
          productId: item.productId,
          productName: item.productName, 
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount), 
          finalUnitPrice: finalUnitPrice,
          lineTotal: finalUnitPrice * (Number(item.quantity)),
        };
      });
      
      addOrder({
        items: orderItems,
        notes: data.notes,
        subtotal: calculatedTotals.subtotal,
        totalDiscount: calculatedTotals.totalDiscount,
        grandTotal: calculatedTotals.grandTotal,
      });

      toast({ title: "Success", description: "Order created successfully." });
      form.reset();
      router.push("/history"); 
      router.refresh();
    } catch (error) {
      console.error("Failed to create order:", error);
      toast({ title: "Error", description: "Failed to create order. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (storeIsLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <CardTitle className="font-headline text-3xl text-primary">Create New Order</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              {fields.map((field, index) => {
                const currentItem = watchedItems[index] || {};
                const product = currentItem.productId ? getProductById(currentItem.productId) : null;
                const finalUnitPrice = (Number(currentItem.unitPrice) || 0) - (Number(currentItem.discount) || 0);
                const lineTotal = finalUnitPrice * (Number(currentItem.quantity) || 0);

                return (
                  <Card key={field.id} className="p-4 bg-secondary/30 border-primary/20 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: controllerField }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel className="font-headline text-sm">Product</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                controllerField.onChange(value);
                                handleProductChange(index, value);
                              }} 
                              defaultValue={controllerField.value}
                            >
                              <FormControl>
                                <SelectTrigger className="font-body">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="font-body">
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>
                                    {p.name} (Stock: {p.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="font-headline text-sm">Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1" {...field} className="font-body" min="1" max={product?.stock} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="font-headline text-sm">Unit Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} className="font-body" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.discount`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="font-headline text-sm">Discount/Unit ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} className="font-body" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="md:col-span-2 space-y-1 pt-1">
                        <FormLabel className="font-headline text-sm text-muted-foreground">Line Total</FormLabel>
                        <p className="font-body text-lg font-semibold text-foreground">
                          ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                         <p className="font-body text-xs text-muted-foreground">
                          Final: ${finalUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/unit
                        </p>
                      </div>
                      <div className="md:col-span-1 flex items-end justify-end">
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-9 w-9 mt-3 md:mt-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {product && watchedItems[index]?.quantity > product.stock && (
                        <p className="text-xs text-destructive mt-2 flex items-center"><Info className="h-3 w-3 mr-1"/>Quantity exceeds available stock ({product.stock}).</p>
                    )}
                  </Card>
                );
              })}
            </div>
            
            <Button type="button" variant="outline" onClick={() => append({ productId: "", productName: "", quantity: 1, unitPrice: 0, discount: 0 })} className="font-body text-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-headline text-base">Order Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes for this order..." {...field} className="font-body min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Card className="mt-8 bg-background border-primary/30 rounded-md shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 font-body text-md">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">${calculatedTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Discount:</span>
                        <span className="font-semibold text-green-600">-${calculatedTotals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <hr className="my-2 border-border"/>
                    <div className="flex justify-between text-lg">
                        <span className="font-bold text-primary">Grand Total:</span>
                        <span className="font-extrabold text-primary">${calculatedTotals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </CardContent>
            </Card>


            <CardFooter className="flex justify-end space-x-4 pt-8 border-t mt-8 px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="font-body text-base py-2 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || storeIsLoading || form.formState.isSubmitting || !form.formState.isValid} className="font-body bg-accent text-accent-foreground hover:bg-accent/90 text-base py-2 px-6">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Order
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

