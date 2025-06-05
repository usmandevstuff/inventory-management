
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import type { Product } from "@/lib/types";
import { useStore } from "@/contexts/StoreContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from "@/components/ui/card";
import { Loader2, PackagePlus, Edit } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const productFormSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(1000),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  initialStock: z.coerce.number().int().min(0, { message: "Initial stock must be non-negative." }).optional(),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  category: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().min(0, {message: "Low stock threshold must be non-negative."}),
  dataAiHint: z.string().max(50, {message: "AI Hint max 50 chars (1-2 keywords recommended)"}).optional(),
  stockAdjustment: z.coerce.number().int().optional(),
  stockAdjustmentType: z.enum(["restock", "sale", "adjustment", "return"]).optional(),
  stockAdjustmentNotes: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const { addProduct, updateProduct, updateStock, getProductById } = useStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentProduct = product ? getProductById(product.id) : undefined;

  const defaultValues: Partial<ProductFormValues> = currentProduct 
    ? { 
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price,
        imageUrl: currentProduct.imageUrl || '',
        category: currentProduct.category || '',
        lowStockThreshold: currentProduct.lowStockThreshold,
        dataAiHint: currentProduct.dataAiHint || '',
      } 
    : { lowStockThreshold: 10, initialStock: 0 };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      if (currentProduct) { 
        const { stockAdjustment, stockAdjustmentType, stockAdjustmentNotes, ...productData } = data;
        const updatedProduct = updateProduct(currentProduct.id, productData);
        
        if (updatedProduct && stockAdjustment !== undefined && stockAdjustment !== 0 && stockAdjustmentType) {
          let quantityChange = stockAdjustment;
          if (stockAdjustmentType === 'sale') {
            quantityChange = -Math.abs(stockAdjustment);
          } else if (stockAdjustmentType === 'restock' || stockAdjustmentType === 'return') {
             quantityChange = Math.abs(stockAdjustment);
          }
          updateStock(currentProduct.id, quantityChange, stockAdjustmentType, stockAdjustmentNotes || `${stockAdjustmentType} adjustment`);
        }
        toast({ title: "Success", description: `${productData.name} updated successfully.` });
      } else { 
        addProduct(
          {
            name: data.name,
            description: data.description,
            price: data.price,
            imageUrl: data.imageUrl,
            category: data.category,
            lowStockThreshold: data.lowStockThreshold,
            dataAiHint: data.dataAiHint,
          },
          data.initialStock || 0
        );
        toast({ title: "Success", description: `${data.name} added successfully.` });
      }
      form.reset(); 
      router.push("/inventory");
      router.refresh(); 
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({ title: "Error", description: "Failed to save product. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="border-b p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {product ? <Edit className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /> : <PackagePlus className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
          <CardTitle className="font-headline text-xl sm:text-2xl md:text-3xl text-primary">
            {product ? "Edit Product" : "Add New Product"}
          </CardTitle>
        </div>
        {product && <ShadcnCardDescription className="font-body pt-1 text-xs sm:text-sm">Modify details for <span className="font-semibold text-foreground">{product.name}</span>.</ShadcnCardDescription>}
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-sm sm:text-base">Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Organic Cotton T-Shirt" {...field} className="font-body text-sm sm:text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-sm sm:text-base">Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tops, Accessories" {...field} className="font-body text-sm sm:text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-headline text-sm sm:text-base">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the product..."
                      className="resize-y min-h-[100px] sm:min-h-[120px] font-body text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-sm sm:text-base">Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="29.99" {...field} className="font-body text-sm sm:text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!currentProduct && (
                <FormField
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-headline text-sm sm:text-base">Initial Stock</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} className="font-body text-sm sm:text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
               <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-sm sm:text-base">Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} className="font-body text-sm sm:text-base"/>
                    </FormControl>
                    <FormDescription className="font-body text-xs">Alert when stock falls to or below this level.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-6">
                <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="font-headline text-sm sm:text-base">Image URL</FormLabel>
                    <FormControl>
                        <Input placeholder="https://placehold.co/600x400.png" {...field} className="font-body text-sm sm:text-base"/>
                    </FormControl>
                    <FormDescription className="font-body text-xs">Must be a valid URL.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="font-headline text-sm sm:text-base">Image AI Hint</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., 'silk scarf'" {...field} className="font-body text-sm sm:text-base"/>
                    </FormControl>
                    <FormDescription className="font-body text-xs">Keywords for placeholders (max 2 words).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            {currentProduct && (
              <Card className="mt-6 sm:mt-8 bg-secondary/30 border-primary/30 rounded-md">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="font-headline text-lg sm:text-xl text-primary">Stock Management</CardTitle>
                  <ShadcnCardDescription className="font-body text-xs sm:text-sm">Current Stock: <span className="font-bold text-foreground">{currentProduct.stock}</span></ShadcnCardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="stockAdjustment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-headline text-sm sm:text-base">Adjust Stock By</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 10 or -5" {...field} className="font-body text-sm sm:text-base" />
                          </FormControl>
                           <FormDescription className="font-body text-xs">Positive for increase, negative for decrease.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="stockAdjustmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-headline text-sm sm:text-base">Adjustment Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="font-body text-sm sm:text-base">
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="font-body text-sm sm:text-base">
                              <SelectItem value="restock">Restock (+)</SelectItem>
                              <SelectItem value="sale">Sale (-)</SelectItem>
                              <SelectItem value="return">Customer Return (+)</SelectItem>
                              <SelectItem value="adjustment">Manual Adjustment (+/-)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="stockAdjustmentNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-headline text-sm sm:text-base">Notes for Adjustment</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Received new shipment" {...field} className="font-body text-sm sm:text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 sm:pt-8 border-t mt-6 sm:mt-8">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="font-body text-sm sm:text-base py-2 px-4 sm:px-6 w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-body bg-accent text-accent-foreground hover:bg-accent/90 text-sm sm:text-base py-2 px-4 sm:px-6 w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {product ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
