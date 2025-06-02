
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product, Transaction, Order, OrderItem } from '@/lib/types';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid'; // Ignoring for scaffold, in real app ensure uuid types are installed

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  orders: Order[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock'>, initialStock: number) => Product;
  updateProduct: (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Product | undefined;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'productName' | 'stockBefore' | 'stockAfter'> & { productName?: string, stockBefore?: number, stockAfter?: number }) => Transaction;
  getProductStock: (productId: string) => number;
  updateStock: (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number) => Product | undefined;
  addOrder: (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status'>) => Order;
  getOrderById: (orderId: string) => Order | undefined;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const PRODUCTS_KEY = 'threadcount_products';
const TRANSACTIONS_KEY = 'threadcount_transactions';
const ORDERS_KEY = 'threadcount_orders';

const initialProducts: Product[] = [
  {
    id: '1', name: 'Classic White Tee', description: 'A comfortable and stylish white t-shirt made from premium organic cotton. Perfect for everyday wear.', price: 25.99, stock: 50, lowStockThreshold: 10, category: 'Tops', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'white t-shirt', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: '2', name: 'Slim Fit Jeans - Dark Wash', description: 'Modern slim fit jeans crafted from stretch denim for maximum comfort and style. Features a classic five-pocket design.', price: 79.50, stock: 5, lowStockThreshold: 5, category: 'Bottoms', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'blue jeans', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: '3', name: 'Wool Blend Scarf - Charcoal', description: 'A luxurious and warm wool blend scarf in a versatile charcoal grey. Ideal for chilly days.', price: 35.00, stock: 30, lowStockThreshold: 8, category: 'Accessories', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'wool scarf', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
];


export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let loadedProducts: Product[] = [];
    let loadedTransactions: Transaction[] = [];
    let loadedOrders: Order[] = [];
    try {
      const storedProducts = localStorage.getItem(PRODUCTS_KEY);
      const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      const storedOrders = localStorage.getItem(ORDERS_KEY);

      if (storedProducts) {
        loadedProducts = JSON.parse(storedProducts);
      } else {
        loadedProducts = initialProducts; 
      }
      setProducts(loadedProducts);

      if (storedTransactions) {
        loadedTransactions = JSON.parse(storedTransactions);
      }
      
      if (!storedProducts && loadedProducts === initialProducts) {
          const initialStockTransactions: Transaction[] = initialProducts
            .filter(p => !loadedTransactions.some(lt => lt.productId === p.id && lt.type === 'initial')) 
            .map(p => ({
                id: uuidv4(),
                productId: p.id,
                productName: p.name,
                type: 'initial',
                quantityChange: p.stock,
                stockBefore: 0,
                stockAfter: p.stock,
                timestamp: new Date().toISOString(),
                notes: 'Initial stock load for sample product'
          }));
          loadedTransactions = [...loadedTransactions, ...initialStockTransactions];
      }
      setTransactions(loadedTransactions);

      if (storedOrders) {
        loadedOrders = JSON.parse(storedOrders);
      }
      setOrders(loadedOrders);

    } catch (error) {
      console.error("Failed to access localStorage or parse data:", error);
      setProducts(initialProducts); 
      setTransactions(initialProducts.map(p => ({
        id: uuidv4(), productId: p.id, productName: p.name, type: 'initial', quantityChange: p.stock, stockBefore: 0, stockAfter: p.stock, timestamp: new Date().toISOString(), notes: 'Initial stock load (fallback)'
      })));
      setOrders([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      } catch (error) {
        console.error("Failed to save products to localStorage:", error);
      }
    }
  }, [products, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      } catch (error) {
        console.error("Failed to save transactions to localStorage:", error);
      }
    }
  }, [transactions, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      } catch (error) {
        console.error("Failed to save orders to localStorage:", error);
      }
    }
  }, [orders, isLoading]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stock'>, initialStock: number): Product => {
    const newProduct: Product = {
      ...productData,
      id: uuidv4(),
      stock: initialStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
    addTransaction({
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'initial',
      quantityChange: initialStock,
      stockBefore: 0,
      stockAfter: initialStock,
      notes: 'Initial stock added',
    });
    return newProduct;
  };

  const updateProduct = (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Product | undefined => {
    let updatedProductInst: Product | undefined;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          updatedProductInst = { ...p, ...productData, updatedAt: new Date().toISOString() };
          return updatedProductInst;
        }
        return p;
      })
    );
    return updatedProductInst;
  };
  
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const getProductStock = (productId: string): number => {
    const product = getProductById(productId);
    return product ? product.stock : 0;
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'timestamp'>): Transaction => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };
  
  const updateStock = (productId: string, quantityChange: number, type: Transaction['type'], notes?: string, pricePerUnit?: number): Product | undefined => {
    const product = getProductById(productId);
    if (!product) return undefined;

    const stockBefore = product.stock;
    const newStock = stockBefore + quantityChange;
    
    const updatedProductFields = { stock: newStock };
    const updatedProd = updateProduct(productId, updatedProductFields);

    if(updatedProd){
        addTransaction({
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
    }
    return updatedProd;
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber' | 'status'>): Order => {
    const newOrderNumber = `ORD-${String(orders.length + 1).padStart(4, '0')}`;
    const newOrder: Order = {
      ...orderData,
      id: uuidv4(),
      orderNumber: newOrderNumber,
      orderDate: new Date().toISOString(),
      status: 'completed', // Default to completed for now
    };

    // Process stock updates and transactions for each item
    newOrder.items.forEach(item => {
      updateStock(item.productId, -item.quantity, 'sale', `Order ${newOrder.orderNumber} - ${item.productName}`, item.finalUnitPrice);
    });
    
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
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
        isLoading 
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
