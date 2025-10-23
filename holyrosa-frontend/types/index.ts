export type Role = 'superadmin' | 'admin' | 'store_officer' | 'ipp' | 'dispensary';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Medicine {
  id: string;
  barcode?: string;
  name: string;
  genericName: string;
  brand?: string;
  quantity: number;
  unit: string;
  packageType: 'Tablet' | 'Syrup' | 'Injection' | 'Cream' | 'Others';
  manufacturingDate: string;
  expiryDate: string;
  buyPrice: number;
  totalPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Delegation {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  quantity: number;
  fromUserId?: string;
  fromUserName?: string;
  toRole: 'ipp' | 'dispensary' | 'other';
  toUserId?: string;
  toUserName?: string;
  remarks?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  delegationDate: string;
  expiryDate?: string;
  barcode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  soldBy: string;
  soldByName: string;
  createdAt: string;
}

export interface Stats {
  totalMedicines: number;
  inStock?: number;
  expired?: number;
  lowStock?: number;
  outOfStock?: number;
  todaySalesAmount: number;
  salesData: {
    date: string;
    amount: number;
  }[];
  isDelegatedView?: boolean;
  monthlySalesTotal?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Product type for e-commerce/catalog features
export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  category: string;
  inStock: boolean;
}
