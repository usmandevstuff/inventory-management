
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Transaction, Order, OrderItem, OrderStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

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
      setHasFetchedInitialData(false); // Reset for next login
      return;
    }

    if (hasFetchedInitialData && isLoading) return; // Avoid re-fetch if already fetching or fetched

    setIsLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      if (productsError) throw productsError;
      
      let currentProducts = productsData || [];

      if (currentProducts.length === 0) {
        const seededProducts: Product[] = [];
        for (let i = 0; i < initialProductsData.length; i++) {
          const productBase = initialProductsData[i];
          const stock = initialStocks[i];
          const newProductToSeed = {
            ...productBase,
            stock: stock,
            user_id: user.id,
          };
          const { data: insertedProduct, error: insertError } = await supabase
            .from('products')
            .insert(newProductToSeed)
            .select()
            .single();
          
          if (insertError) throw insertError;
          if (insertedProduct) {
            seededProducts.push(insertedProduct as Product);
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
        currentProducts = seededProducts;
      }
      setProducts(currentProducts);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;
       setOrders(ordersData ? ordersData.map(o => ({...o, items: o.order_items || []} as Order)) : []);

    } catch (error: any) {
      console.error("Error fetching store data:", error);
      toast({ title: "Data Load Error", description: error?.message || "Could not load store data.", variant: "destructive"});
      // Don't clear local data on fetch error, it might be a temporary network issue
    } finally {
      setIsLoading(false);
      setHasFetchedInitialData(true);
    }
  }, [user, isAuthenticated, toast, hasFetchedInitialData, isLoading]);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && user && !hasFetchedInitialData) {
        fetchStoreData();
    } else if (!authIsLoading && !isAuthenticated) {
        setProducts([]);
        setTransactions([]);
        setOrders([]);
        setIsLoading(false);
        setHasFetchedInitialData(false); 
    }
  }, [user, authIsLoading, isAuthenticated, fetchStoreData, hasFetchedInitialData]);


  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>, initialStock: number): Promise<Product | null> => {
    if (!user) return null;
    setIsLoading(true);
    const newProductPayload = {
      ...productData,
      stock: initialStock,
      user_id: user.id,
    };
    const { data, error } = await supabase.from('products').insert(newProductPayload).select().single();
    
    if (error) {
      let errorMessage = 'Unknown error occurred.';
      if (typeof error === 'object' && error !== null) {
        const supabaseError = error as any; // Type assertion to access potential Supabase error properties
        errorMessage = supabaseError.message || JSON.stringify(error);
        
        console.error('Error adding product (raw object):', error);
        if (supabaseError.details) console.error('Supabase error details:', supabaseError.details);
        if (supabaseError.hint) console.error('Supabase error hint:', supabaseError.hint);
        if (supabaseError.code) console.error('Supabase error code:', supabaseError.code);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.error('Error adding product (processed message):', errorMessage);
      toast({ title: "Error", description: `Failed to add product: ${errorMessage}`, variant: "destructive"});
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
      // No need to call fetchStoreData() here, as addTransaction will call it if it modifies products array through updateStock
      // For direct addProduct, we can update the local state to be faster
       setProducts(prev => [...prev, data as Product]);
       // We also need to update transactions locally or refetch them
       const { data: newTransaction } = await supabase.from('transactions').select('*').eq('product_id', data.id).eq('type', 'initial').single();
       if (newTransaction) {
         setTransactions(prev => [newTransaction as Transaction, ...prev]);
       }
    }
    setIsLoading(false);
    return data as Product;
  };

  const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock' | 'user_id'>>): Promise<Product | null> => {
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
    if (data) {
      setProducts(prev => prev.map(p => p.id === productId ? data as Product : p));
    }
    setIsLoading(false);
    return data as Product;
  };
  
  const deleteProduct = async (productId: string) => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', productId).eq('user_id', user.id);
    if (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error", description: `Failed to delete product: ${error.message}`, variant: "destructive"});
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
      // Consider also removing related transactions locally or refetching transactions
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
    if (!user) return null;
    const newTransactionPayload = {
      ...transactionData,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('transactions').insert(newTransactionPayload).select().single();
    if (error) {
      console.error('Error adding transaction:', error);
      // Toast might be too noisy for internal calls like initial stock. Consumer can toast.
      return null;
    }
    if (data) {
        setTransactions(prev => [data as Transaction, ...prev.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())]);
    }
    return data as Transaction;
  };
  
  const updateStock = async (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number): Promise<Product | null> => {
    if (!user) return null;
    
    const product = getProductById(productId); 
    if (!product) {
      toast({ title: "Error", description: "Product not found for stock update.", variant: "destructive"});
      return null;
    }

    setIsLoading(true); // Set loading true only before async operations
    const stockBefore = product.stock;
    const newStock = stockBefore + quantityChange;

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
    
    if (updatedProductData) {
      setProducts(prev => prev.map(p => p.id === productId ? updatedProductData as Product : p));
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
    }
    setIsLoading(false);
    return updatedProductData as Product;
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Order | null> => {
    if (!user) return null;
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
    const newOrderNumber = `ORD-${String((orderCount || 0) + 1).padStart(4, '0')}`;
    const orderPayload = {
      ...orderData,
      user_id: user.id,
      order_number: newOrderNumber,
      order_date: now,
      status: 'completed' as OrderStatus,
      created_at: now,
      updated_at: now,
    };

    const { data: newOrderResult, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError || !newOrderResult) {
      console.error('Error adding order:', orderError);
      toast({ title: "Order Creation Error", description: orderError?.message || "Failed to create order.", variant: "destructive"});
      setIsLoading(false);
      return null;
    }

    const orderItemsPayload = orderData.items.map(item => ({
      ...item,
      order_id: newOrderResult.id,
      user_id: user.id, 
      created_at: now,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);

    if (itemsError) {
      console.error('Error adding order items:', itemsError);
      toast({ title: "Order Item Error", description: itemsError.message, variant: "destructive"});
      await supabase.from('orders').delete().eq('id', newOrderResult.id); // Rollback order
      setIsLoading(false);
      return null;
    }

    // Process stock updates and add transactions for each item
    // Keep track of updated products to update local state once
    const updatedProductPromises = orderData.items.map(item => 
      updateStock(item.productId, -item.quantity, 'sale', `Order ${newOrderNumber} - ${item.productName}`, item.finalUnitPrice)
    );
    await Promise.all(updatedProductPromises);
    // updateStock already updates local products and transactions state.

    // Construct the full order object to return/add to local state
    const completeOrder: Order = {
      ...(newOrderResult as Order), // Casting here assumes newOrderResult matches Order structure
      items: orderData.items, // Attach the items from the input
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
        isLoading: isLoading || authIsLoading,
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


    