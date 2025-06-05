
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Transaction, Order, OrderItem, OrderStatus } from '@/lib/types';
// We will use the Supabase client from AuthContext for consistency
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  orders: Order[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>, initialStock: number) => Promise<Product | null>;
  updateProduct: (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'user_id'>) => Promise<Transaction | null>;
  getProductStock: (productId: string) => number;
  updateStock: (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number) => Promise<Product | null>;
  addOrder: (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Order | null>;
  getOrderById: (orderId: string) => Order | undefined;
  isLoading: boolean;
  fetchStoreData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- Helper functions for mapping Product data between JS (camelCase) and DB (snake_case) ---
function mapProductToDbPayload(
  productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>>,
  userId?: string,
  stockValue?: number
): Record<string, any> {
  const payload: Record<string, any> = {};
  if (productData.name !== undefined) payload.name = productData.name;
  if (productData.description !== undefined) payload.description = productData.description;
  if (productData.price !== undefined) payload.price = productData.price;
  if (productData.category !== undefined) payload.category = productData.category;
  if (productData.imageUrl !== undefined) payload.image_url = productData.imageUrl;
  if (productData.dataAiHint !== undefined) payload.data_ai_hint = productData.dataAiHint;
  if (productData.lowStockThreshold !== undefined) payload.low_stock_threshold = productData.lowStockThreshold;
  
  if (stockValue !== undefined) payload.stock = stockValue;
  if (userId) payload.user_id = userId;
  
  return payload;
}

function mapDbProductToProduct(dbData: any): Product {
  return {
    id: dbData.id,
    name: dbData.name,
    description: dbData.description,
    price: dbData.price,
    stock: dbData.stock,
    imageUrl: dbData.image_url,
    lowStockThreshold: dbData.low_stock_threshold,
    category: dbData.category,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
    dataAiHint: dbData.data_ai_hint,
  };
}


export const StoreProvider = ({ children }: { children: ReactNode }) => {
  // Use the Supabase client from AuthContext
  const { user, isLoading: authIsLoading, isAuthenticated, supabase } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  const fetchStoreData = useCallback(async () => {
    if (!user || !isAuthenticated || !supabase) { // Check for supabase client
      setProducts([]);
      setTransactions([]);
      setOrders([]);
      setIsLoading(false);
      setHasFetchedInitialData(false); 
      return;
    }

    if (hasFetchedInitialData && (isLoading || authIsLoading)) return; 

    setIsLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      if (productsError) throw productsError;
      
      const currentProductsFromDb = (productsData || []).map(mapDbProductToProduct);
      setProducts(currentProductsFromDb);

      // Removed initial data seeding logic here

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      if (transactionsError) throw transactionsError;
      setTransactions((transactionsData || []).map(tx => ({
        id: tx.id,
        productId: tx.product_id,
        productName: tx.product_name,
        type: tx.type,
        quantityChange: tx.quantity_change,
        stockBefore: tx.stock_before,
        stockAfter: tx.stock_after,
        pricePerUnit: tx.price_per_unit,
        totalValue: tx.total_value,
        timestamp: tx.timestamp,
        notes: tx.notes,
      } as Transaction)));

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)') 
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;
       setOrders(ordersData ? ordersData.map(o => ({
         id: o.id,
         orderNumber: o.order_number,
         orderDate: o.order_date,
         subtotal: o.subtotal,
         totalDiscount: o.total_discount,
         grandTotal: o.grand_total,
         status: o.status as OrderStatus,
         notes: o.notes,
         createdAt: o.created_at, 
         updatedAt: o.updated_at, 
         items: (o.order_items || []).map((oi: any) => ({
            productId: oi.product_id,
            productName: oi.product_name,
            quantity: oi.quantity,
            unitPrice: oi.unit_price,
            discount: oi.discount,
            finalUnitPrice: oi.final_unit_price,
            lineTotal: oi.line_total,
         } as OrderItem))
       } as Order)) : []);

    } catch (error: any) {
      console.error("Error fetching store data:", error);
      toast({ title: "Data Load Error", description: error?.message || "Could not load store data.", variant: "destructive"});
    } finally {
      setIsLoading(false);
      setHasFetchedInitialData(true);
    }
  }, [user, isAuthenticated, toast, hasFetchedInitialData, isLoading, supabase, authIsLoading]);

  useEffect(() => {
    if (supabase && !authIsLoading && isAuthenticated && user && !hasFetchedInitialData) {
        fetchStoreData();
    } else if (!authIsLoading && !isAuthenticated) {
        setProducts([]);
        setTransactions([]);
        setOrders([]);
        setIsLoading(false); 
        setHasFetchedInitialData(false); 
    }
  }, [user, authIsLoading, isAuthenticated, fetchStoreData, hasFetchedInitialData, supabase]);


  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>, initialStock: number): Promise<Product | null> => {
    if (!user || !supabase) return null;
    setIsLoading(true);
    
    const newProductDbPayload = mapProductToDbPayload(productData, user.id, initialStock);
    
    const { data: dbData, error } = await supabase.from('products').insert(newProductDbPayload).select().single();
    
    if (error) {
      let errorMessage = 'Unknown error occurred.';
      if (typeof error === 'object' && error !== null) {
        const supabaseError = error as any; 
        errorMessage = supabaseError.message || JSON.stringify(error);
        if(supabaseError.details) errorMessage += ` Details: ${supabaseError.details}`;
        if(supabaseError.hint) errorMessage += ` Hint: ${supabaseError.hint}`;
        if(supabaseError.code) errorMessage += ` Code: ${supabaseError.code}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.error('Error adding product (processed message):', errorMessage);
      toast({ title: "Error", description: `Failed to add product: ${errorMessage}`, variant: "destructive"});
      setIsLoading(false);
      return null;
    }

    if (dbData) {
      const newProduct = mapDbProductToProduct(dbData);
      await addTransaction({ 
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'initial',
        quantityChange: initialStock,
        stockBefore: 0,
        stockAfter: initialStock,
        notes: 'Initial stock added',
      });
       setProducts(prev => [...prev, newProduct].sort((a,b) => a.name.localeCompare(b.name)));
    }
    setIsLoading(false);
    return dbData ? mapDbProductToProduct(dbData) : null;
  };

  const updateProduct = async (productId: string, productUpdateData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>>): Promise<Product | null> => {
    if (!user || !supabase) return null;
    setIsLoading(true);

    const dbPayload = mapProductToDbPayload(productUpdateData);
    dbPayload.updated_at = new Date().toISOString(); 

    if (Object.keys(dbPayload).length <= 1 && dbPayload.updated_at) {
        const currentProduct = products.find(p => p.id === productId);
        setIsLoading(false);
        return currentProduct || null;
    }
    
    const { data: dbData, error } = await supabase
      .from('products')
      .update(dbPayload)
      .eq('id', productId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      toast({ title: "Error", description: `Failed to update product: ${error.message}`, variant: "destructive"});
      setIsLoading(false);
      return null;
    }
    if (dbData) {
      const updatedProduct = mapDbProductToProduct(dbData);
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
      return updatedProduct;
    }
    setIsLoading(false);
    return null;
  };
  
  const deleteProduct = async (productId: string) => {
    if (!user || !supabase) return;
    setIsLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', productId).eq('user_id', user.id);
    if (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error", description: `Failed to delete product: ${error.message}`, variant: "destructive"});
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setTransactions(prev => prev.filter(t => t.productId !== productId));
    }
    setIsLoading(false);
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const getProductStock = (productId: string): number => {
    const product = getProductById(productId);
    return product ? product.stock : 0;
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'user_id'>): Promise<Transaction | null> => {
    if (!user || !supabase) return null;
    const newTransactionDbPayload = {
      product_id: transactionData.productId,
      product_name: transactionData.productName,
      type: transactionData.type,
      quantity_change: transactionData.quantityChange,
      stock_before: transactionData.stockBefore,
      stock_after: transactionData.stockAfter,
      price_per_unit: transactionData.pricePerUnit,
      total_value: transactionData.totalValue,
      notes: transactionData.notes,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    };

    const { data: dbData, error } = await supabase.from('transactions').insert(newTransactionDbPayload).select().single();
    if (error) {
      console.error('Error adding transaction:', error);
      toast({ title: "Transaction Error", description: `Failed to record transaction: ${error.message}`, variant: "destructive"});
      return null;
    }
    if (dbData) {
        const newTransaction: Transaction = {
            id: dbData.id,
            productId: dbData.product_id,
            productName: dbData.product_name,
            type: dbData.type,
            quantityChange: dbData.quantity_change,
            stockBefore: dbData.stock_before,
            stockAfter: dbData.stock_after,
            pricePerUnit: dbData.price_per_unit,
            totalValue: dbData.total_value,
            timestamp: dbData.timestamp,
            notes: dbData.notes,
        };
        setTransactions(prev => [newTransaction, ...prev.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())]);
        return newTransaction;
    }
    return null;
  };
  
  const updateStock = async (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number): Promise<Product | null> => {
    if (!user || !supabase) return null;
    
    const product = getProductById(productId); 
    if (!product) {
      toast({ title: "Error", description: "Product not found for stock update.", variant: "destructive"});
      return null;
    }

    setIsLoading(true); 
    const stockBefore = product.stock;
    const newStock = stockBefore + quantityChange;

    const { data: updatedDbProductData, error: productUpdateError } = await supabase
      .from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() }) 
      .eq('id', productId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (productUpdateError) {
      console.error('Error updating product stock:', productUpdateError);
      toast({ title: "Stock Update Error", description: productUpdateError.message, variant: "destructive"});
      setIsLoading(false);
      return null;
    }
    
    if (updatedDbProductData) {
      const updatedProduct = mapDbProductToProduct(updatedDbProductData);
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name)));
      await addTransaction({ 
        productId,
        productName: product.name,
        type,
        quantityChange,
        stockBefore,
        stockAfter: newStock,
        notes,
        pricePerUnit: (type === 'sale' && quantityChange < 0) ? (pricePerUnit || product.price) : undefined,
        totalValue: (type === 'sale' && quantityChange < 0 && pricePerUnit !== undefined) ? Math.abs(quantityChange) * pricePerUnit : (type === 'sale' && quantityChange < 0 ? Math.abs(quantityChange) * product.price : undefined),
      });
      setIsLoading(false);
      return updatedProduct;
    }
    setIsLoading(false);
    return null;
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Order | null> => {
    if (!user || !supabase) return null;
    setIsLoading(true);
    
    const { count: orderCount, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (countError) {
        console.error('Error fetching order count:', countError);
        toast({ title: "Order Creation Error", description: countError?.message || "Could not determine order number.", variant: "destructive"});
        setIsLoading(false);
        return null;
    }

    const now = new Date().toISOString();
    const newOrderNumberGenerated = `ORD-${String((orderCount || 0) + 1).padStart(4, '0')}`;
    
    const orderDbPayload = {
      user_id: user.id,
      order_number: newOrderNumberGenerated,
      order_date: now,
      subtotal: orderData.subtotal,
      total_discount: orderData.totalDiscount,
      grand_total: orderData.grandTotal,
      status: 'completed' as OrderStatus, 
      notes: orderData.notes,
      created_at: now,
      updated_at: now,
    };

    const { data: newOrderDbResult, error: orderError } = await supabase
      .from('orders')
      .insert(orderDbPayload)
      .select()
      .single();

    if (orderError || !newOrderDbResult) {
      console.error('Error adding order:', orderError);
      toast({ title: "Order Creation Error", description: orderError?.message || "Failed to create order.", variant: "destructive"});
      setIsLoading(false);
      return null;
    }

    const orderItemsDbPayload = orderData.items.map(item => ({
      order_id: newOrderDbResult.id,
      user_id: user.id, 
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount,
      final_unit_price: item.finalUnitPrice,
      line_total: item.lineTotal,
      created_at: now,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsDbPayload);

    if (itemsError) {
      console.error('Error adding order items:', itemsError);
      toast({ title: "Order Item Error", description: itemsError.message, variant: "destructive"});
      await supabase.from('orders').delete().eq('id', newOrderDbResult.id); 
      setIsLoading(false);
      return null;
    }

    const updatedProductPromises = orderData.items.map(item => 
      updateStock(item.productId, -item.quantity, 'sale', `Order ${newOrderNumberGenerated} - ${item.productName}`, item.finalUnitPrice)
    );
    await Promise.all(updatedProductPromises);
    
    const completeOrder: Order = {
      id: newOrderDbResult.id,
      orderNumber: newOrderDbResult.order_number,
      orderDate: newOrderDbResult.order_date,
      items: orderData.items, 
      subtotal: newOrderDbResult.subtotal,
      totalDiscount: newOrderDbResult.total_discount,
      grandTotal: newOrderDbResult.grand_total,
      status: newOrderDbResult.status as OrderStatus,
      notes: newOrderDbResult.notes,
      createdAt: newOrderDbResult.created_at,
      updatedAt: newOrderDbResult.updated_at,
    };
    
    setOrders(prev => [completeOrder, ...prev.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())]);
    
    setIsLoading(false);
    return completeOrder;
  };


  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(o => o.id === orderId);
  };

  return (
    <StoreContext.Provider value={{ 
        products, 
        transactions, 
        orders,
        addProduct, 
        updateProduct, 
        deleteProduct,
        getProductById, 
        addTransaction, 
        getProductStock, 
        updateStock,
        addOrder,
        getOrderById,
        isLoading: isLoading || authIsLoading, // Combine loading states
        fetchStoreData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

