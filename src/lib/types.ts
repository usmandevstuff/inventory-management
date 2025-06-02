export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  lowStockThreshold: number;
  category?: string; // Optional category
  createdAt: string;
  updatedAt: string;
  dataAiHint?: string; // For placeholder images
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'initial' | 'adjustment' | 'return';
  quantityChange: number; // Positive for restock/initial/return, negative for sale/adjustment (if decreasing)
  stockBefore: number;
  stockAfter: number;
  pricePerUnit?: number; // Relevant for sales
  totalValue?: number; // Relevant for sales (pricePerUnit * quantity)
  timestamp: string;
  notes?: string;
}
