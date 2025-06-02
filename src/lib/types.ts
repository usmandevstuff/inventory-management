
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

export interface OrderItem {
  productId: string;
  productName: string; // Denormalized for invoice display
  quantity: number;
  unitPrice: number; // Price per unit for this item in this order (can be default or overridden)
  discount: number; // Discount amount per unit for this item
  finalUnitPrice: number; // Calculated: unitPrice - discount
  lineTotal: number; // Calculated: finalUnitPrice * quantity
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string; // User-friendly e.g., ORD-0001
  orderDate: string; // ISO string
  items: OrderItem[];
  subtotal: number; // Sum of (item.unitPrice * item.quantity)
  totalDiscount: number; // Sum of (item.discount * item.quantity)
  grandTotal: number; // subtotal - totalDiscount
  status: OrderStatus;
  notes?: string;
}
