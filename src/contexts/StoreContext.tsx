
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Transaction, Order, OrderItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  orders: Order[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock'>, initialStock: number) => Promise<Product | null>;
  updateProduct: (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock'>>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined; // Remains sync for UI, data fetched async
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'timestamp'>) => Promise<Transaction | null>;
  getProductStock: (productId: string) => number; // Remains sync for UI
  updateStock: (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number) => Promise<Product | null>;
  addOrder: (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status'>) => Promise<Order | null>;
  getOrderById: (orderId: string) => Order | undefined; // Remains sync for UI
  isLoading: boolean;
  fetchStoreData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialProductsData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>[] = [
  { name: 'Classic White Tee', description: 'A comfortable and stylish white t-shirt made from premium organic cotton. Perfect for everyday wear.', price: 25.99, lowStockThreshold: 10, category: 'Tops', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'white t-shirt' },
  { name: 'Slim Fit Jeans - Dark Wash', description: 'Modern slim fit jeans crafted from stretch denim for maximum comfort and style. Features a classic five-pocket design.', price: 79.50, lowStockThreshold: 5, category: 'Bottoms', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'blue jeans' },
  { name: 'Wool Blend Scarf - Charcoal', description: 'A luxurious and warm wool blend scarf in a versatile charcoal grey. Ideal for chilly days.', price: 35.00, lowStockThreshold: 8, category: 'Accessories', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'wool scarf' },
];
const initialStocks = [50, 5, 30];


export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authIsLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  const fetchStoreData = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setProducts([]);
      setTransactions([]);
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Seed initial products if none exist for the user
      if (productsData && productsData.length === 0) {
        const seededProducts: Product[] = [];
        for (let i = 0; i < initialProductsData.length; i++) {
          const productBase = initialProductsData[i];
          const stock = initialStocks[i];
          const newProduct = {
            ...productBase,
            stock: stock,
            user_id: user.id,
            // Supabase auto-generates id, createdAt, updatedAt
          };
          const { data: insertedProduct, error: insertError } = await supabase
            .from('products')
            .insert(newProduct)
            .select()
            .single();
          
          if (insertError) throw insertError;
          if (insertedProduct) {
            seededProducts.push(insertedProduct as Product);
            // Add initial transaction for seeded product
            await supabase.from('transactions').insert({
              product_id: insertedProduct.id,
              user_id: user.id,
              product_name: insertedProduct.name,
              type: 'initial',
              quantity_change: stock,
              stock_before: 0,
              stock_after: stock,
              notes: 'Initial stock for sample product',
              timestamp: new Date().toISOString(),
            });
          }
        }
        setProducts(seededProducts);
      }


      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)') // Fetch orders and their related items
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;
       setOrders(ordersData ? ordersData.map(o => ({...o, items: o.order_items || []})) : []);


    } catch (error: any) {
      console.error("Error fetching store data:", error);
      toast({ title: "Data Load Error", description: error.message || "Could not load store data.", variant: "destructive"});
      setProducts([]);
      setTransactions([]);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setHasFetchedInitialData(true);
    }
  }, [user, isAuthenticated, toast]);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && user && !hasFetchedInitialData) {
        fetchStoreData();
    } else if (!authIsLoading && !isAuthenticated) {
        // Clear data if user logs out
        setProducts([]);
        setTransactions([]);
        setOrders([]);
        setIsLoading(false);
        setHasFetchedInitialData(false); // Reset for next login
    }
  }, [user, authIsLoading, isAuthenticated, fetchStoreData, hasFetchedInitialData]);


  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock'>, initialStock: number): Promise<Product | null> => {
    if (!user) return null;
    setIsLoading(true);
    const newProductPayload = {
      ...productData,
      stock: initialStock,
      user_id: user.id,
    };
    const { data, error } = await supabase.from('products').insert(newProductPayload).select().single();
    if (error) {
      console.error('Error adding product:', error);
      toast({ title: "Error", description: `Failed to add product: ${error.message}`, variant: "destructive"});
      setIsLoading(false);
      return null;
    }
    if (data) {
      await addTransaction({
        productId: data.id,
        productName: data.name,
        type: 'initial',
        quantityChange: initialStock,
        stockBefore: 0,
        stockAfter: initialStock,
        notes: 'Initial stock added',
      });
      await fetchStoreData(); // Refetch to update local state
    }
    setIsLoading(false);
    return data as Product;
  };

  const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock'>>): Promise<Product | null> => {
    if (!user) return null;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .update({ ...productData, updatedAt: new Date().toISOString() })
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
    if (data) await fetchStoreData();
    setIsLoading(false);
    return data as Product;
  };
  
  const deleteProduct = async (productId: string) => {
    if (!user) return;
    setIsLoading(true);
    // Consider what to do with transactions/orders related to this product.
    // For now, just deleting the product.
    const { error } = await supabase.from('products').delete().eq('id', productId).eq('user_id', user.id);
    if (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error", description: `Failed to delete product: ${error.message}`, variant: "destructive"});
    } else {
      await fetchStoreData();
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

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction | null> => {
    if (!user) return null;
    const newTransactionPayload = {
      ...transactionData,
      user_id: user.id,
      timestamp: new Date().toISOString(), // Ensure timestamp is set server-side or consistently
    };
    const { data, error } = await supabase.from('transactions').insert(newTransactionPayload).select().single();
    if (error) {
      console.error('Error adding transaction:', error);
      // Toast might be too noisy for internal calls like initial stock. Consumer can toast.
      return null;
    }
    // No automatic refetch here, rely on caller or main data fetch
    return data as Transaction;
  };
  
  const updateStock = async (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number): Promise<Product | null> => {
    if (!user) return null;
    setIsLoading(true);
    const product = getProductById(productId); // Get current client-side state for stock_before
    if (!product) {
      toast({ title: "Error", description: "Product not found for stock update.", variant: "destructive"});
      setIsLoading(false);
      return null;
    }

    const stockBefore = product.stock;
    const newStock = stockBefore + quantityChange;

    // Update product stock in DB
    const { data: updatedProductData, error: productUpdateError } = await supabase
      .from('products')
      .update({ stock: newStock, updatedAt: new Date().toISOString() })
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
    
    // Add transaction record
    if (updatedProductData) {
      await addTransaction({
        productId,
        productName: product.name,
        type,
        quantityChange,
        stockBefore,
        stockAfter: newStock,
        notes,
        pricePerUnit: (type === 'sale' && quantityChange < 0) ? (pricePerUnit || product.price) : undefined,
        totalValue: (type === 'sale' && quantityChange < 0) ? Math.abs(quantityChange) * (pricePerUnit || product.price) : undefined,
      });
      await fetchStoreData(); // Refetch all data to ensure consistency
    }
    setIsLoading(false);
    return updatedProductData as Product;
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status'>): Promise<Order | null> => {
    if (!user) return null;
    setIsLoading(true);
    
    // Fetch current order count to generate orderNumber
    const { count: orderCount, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (countError) {
        console.error('Error fetching order count:', countError);
        toast({ title: "Order Creation Error", description: "Could not determine order number.", variant: "destructive"});
        setIsLoading(false);
        return null;
    }

    const newOrderNumber = `ORD-${String((orderCount || 0) + 1).padStart(4, '0')}`;
    const orderPayload = {
      ...orderData,
      user_id: user.id,
      order_number: newOrderNumber,
      order_date: new Date().toISOString(),
      status: 'completed' as OrderStatus, // Default status
    };

    // Insert order (excluding items for now)
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('Error adding order:', orderError);
      toast({ title: "Order Creation Error", description: orderError?.message || "Failed to create order.", variant: "destructive"});
      setIsLoading(false);
      return null;
    }

    // Insert order items
    const orderItemsPayload = orderData.items.map(item => ({
      ...item,
      order_id: newOrder.id,
      user_id: user.id, // Denormalize user_id for easier RLS on order_items if needed
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);

    if (itemsError) {
      console.error('Error adding order items:', itemsError);
      toast({ title: "Order Item Error", description: itemsError.message, variant: "destructive"});
      // Potentially roll back order insertion or mark as failed
      await supabase.from('orders').delete().eq('id', newOrder.id);
      setIsLoading(false);
      return null;
    }

    // Process stock updates for each item
    for (const item of orderData.items) {
      await updateStock(item.productId, -item.quantity, 'sale', `Order ${newOrderNumber} - ${item.productName}`, item.finalUnitPrice);
    }
    
    await fetchStoreData(); // Refetch to get the new order with items and updated product stocks/transactions
    setIsLoading(false);
    // Find the newly added order in the fetched data to return it (since direct insert might not return nested items)
    const freshlyFetchedOrder = orders.find(o => o.id === newOrder.id) || 
                                (await supabase.from('orders').select('*, order_items(*)').eq('id', newOrder.id).single()).data;

    return freshlyFetchedOrder ? {...freshlyFetchedOrder, items: freshlyFetchedOrder.order_items || []} as Order : null;
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
