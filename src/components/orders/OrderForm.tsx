
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import React, { useState, useEffect, useCallback } from "react";

const orderItemSchema = z.object({
  productId: z.string().min(1, { message: "Product must be selected." }),
  productName: z.string(), 
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

  let subtotal = 0;
  let totalDiscount = 0;

  if (watchedItems && watchedItems.length > 0) {
    watchedItems.forEach(item => {
      const itemUnitPrice = Number(item.unitPrice) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      const itemDiscountPerUnit = Number(item.discount) || 0;

      subtotal += itemUnitPrice * itemQuantity;
      totalDiscount += itemDiscountPerUnit * itemQuantity;
    });
  }
  const grandTotal = subtotal - totalDiscount;

  const handleProductChange = (itemIndex: number, productId: string) => {
    const product = getProductById(productId);
    if (product) {
      form.setValue(`items.${index}.productName`, product.name, { shouldValidate: true });
      form.setValue(`items.${index}.unitPrice`, product.price, { shouldValidate: true });
      form.setValue(`items.${index}.discount`, 0, { shouldValidate: true });
      form.trigger(`items.${index}.quantity`);
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
          discount: Number(item.discount) || 0,
          finalUnitPrice: finalUnitPrice,
          lineTotal: finalUnitPrice * (Number(item.quantity)),
        };
      });
      
      addOrder({
        items: orderItems,
        notes: data.notes,
        subtotal: subtotal, 
        totalDiscount: totalDiscount, 
        grandTotal: grandTotal, 
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
  
  if (storeIsLoading && !products.length) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="border-b p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <CardTitle className="font-headline text-xl sm:text-2xl md:text-3xl text-primary">Create New Order</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              {fields.map((field, index) => {
                const currentItem = watchedItems[index] || {};
                const product = currentItem.productId ? getProductById(currentItem.productId) : null;
                const itemUnitPrice = Number(currentItem.unitPrice) || 0;
                const itemQuantity = Number(currentItem.quantity) || 0;
                const itemDiscountPerUnit = Number(currentItem.discount) || 0;
                
                const finalUnitPrice = itemUnitPrice - itemDiscountPerUnit;
                const lineTotal = finalUnitPrice * itemQuantity;

                return (
                  <Card key={field.id} className="p-3 sm:p-4 bg-secondary/30 border-primary/20 rounded-md">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: controllerField }) => (
                          <FormItem>
                            <FormLabel className="font-headline text-xs sm:text-sm">Product</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                controllerField.onChange(value);
                                handleProductChange(index, value);
                              }} 
                              defaultValue={controllerField.value}
                            >
                              <FormControl>
                                <SelectTrigger className="font-body text-xs sm:text-sm h-9 sm:h-10">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="font-body text-xs sm:text-sm">
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0 && p.id !== controllerField.value}>
                                    {p.name} (Stock: {p.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs"/>
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="font-headline text-xs sm:text-sm">Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="1" {...formField} className="font-body text-xs sm:text-sm h-9 sm:h-10" min="1" max={product?.stock} />
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="font-headline text-xs sm:text-sm">Unit Price ($)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...formField} className="font-body text-xs sm:text-sm h-9 sm:h-10" />
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.discount`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="font-headline text-xs sm:text-sm">Discount/Unit ($)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...formField} className="font-body text-xs sm:text-sm h-9 sm:h-10" />
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-1 sm:mt-2">
                        <div className="space-y-0.5 text-xs sm:text-sm">
                          <FormLabel className="font-headline text-xs text-muted-foreground">Line Total</FormLabel>
                          <p className="font-body font-semibold text-foreground">
                            ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            (Final: ${finalUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/unit)
                          </p>
                        </div>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-8 w-8 sm:h-9 sm:w-9 mt-2 sm:mt-0 self-end sm:self-center">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    {product && itemQuantity > product.stock && (
                        <p className="text-xs text-destructive mt-2 flex items-center"><Info className="h-3 w-3 mr-1"/>Quantity exceeds available stock ({product.stock}).</p>
                    )}
                  </Card>
                );
              })}
            </div>
            
            <Button type="button" variant="outline" onClick={() => append({ productId: "", productName: "", quantity: 1, unitPrice: 0, discount: 0 })} className="font-body text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4 h-auto w-full sm:w-auto">
              <PlusCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Item
            </Button>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-headline text-sm sm:text-base">Order Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes for this order..." {...field} className="font-body text-sm sm:text-base min-h-[70px] sm:min-h-[80px]" />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            
            <Card className="mt-6 sm:mt-8 bg-background border-primary/30 rounded-md shadow-md">
                <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="font-headline text-lg sm:text-xl text-primary">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 sm:space-y-2 font-body text-sm sm:text-md p-3 sm:p-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Discount:</span>
                        <span className="font-semibold text-green-600">-${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <hr className="my-1 sm:my-2 border-border"/>
                    <div className="flex justify-between text-md sm:text-lg">
                        <span className="font-bold text-primary">Grand Total:</span>
                        <span className="font-extrabold text-primary">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </CardContent>
            </Card>

            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 sm:pt-8 border-t mt-6 sm:mt-8 px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="font-body text-sm sm:text-base py-2 px-4 sm:px-6 w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || storeIsLoading || form.formState.isSubmitting || !form.formState.isValid || watchedItems.some(item => (getProductById(item.productId)?.stock ?? 0) < item.quantity)}
                className="font-body bg-accent text-accent-foreground hover:bg-accent/90 text-sm sm:text-base py-2 px-4 sm:px-6 w-full sm:w-auto"
              >
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
