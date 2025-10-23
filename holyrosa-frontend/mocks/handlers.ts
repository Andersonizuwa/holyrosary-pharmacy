import { http, HttpResponse } from 'msw';
import { mockUsers, mockMedicines, mockDelegations, mockSales, mockCredentials, mockProducts } from './data';
import { Medicine, Delegation, Sale } from '../types';

let medicines = [...mockMedicines];
let delegations = [...mockDelegations];
let sales = [...mockSales];
let users = [...mockUsers];

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }: { request: Request }) => {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    console.log('Login attempt:', { email, availableCredentials: Object.keys(mockCredentials) });

    if (mockCredentials[email] && mockCredentials[email] === password) {
      const user = users.find(u => u.email === email);
      if (user) {
        return HttpResponse.json({
          token: 'mock-jwt-token',
          user,
        });
      }
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/auth/me', ({ request }: { request: Request }) => {
    const authHeader = request.headers.get('Authorization');
    console.log('Auth check request:', { authHeader: authHeader ? 'present' : 'missing' });

    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Validating token:', token);

    // Check if it's a valid mock token
    if (token === 'mock-jwt-token' || token.startsWith('mock-token-')) {
      // Return the first user (superadmin) as mock response
      const user = users[0];
      console.log('Found user:', user ? { id: user.id, email: user.email } : null);
      if (user) {
        return HttpResponse.json({ user });
      }
    }

    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }),

  // Stats endpoint
  http.get('/api/stats', () => {
    const now = new Date();
    const totalMedicines = medicines.length;
    const inStock = medicines.filter(m => m.quantity > 0).length;
    const expired = medicines.filter(m => new Date(m.expiryDate) < now).length;
    const lowStock = medicines.filter(m => m.quantity > 0 && m.quantity <= m.lowStockThreshold).length;
    const outOfStock = medicines.filter(m => m.quantity === 0).length;
    const todaySalesAmount = sales
      .filter(s => new Date(s.createdAt).toDateString() === now.toDateString())
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const salesData = last7Days.map(date => {
      const dateStr = date.toDateString();
      const amount = sales
        .filter(s => new Date(s.createdAt).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return {
        date: date.toISOString().split('T')[0],
        amount,
      };
    });

    return HttpResponse.json({
      totalMedicines,
      inStock,
      expired,
      lowStock,
      outOfStock,
      todaySalesAmount,
      salesData,
    });
  }),

  // Medicine endpoints
  http.get('/api/medicines', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = medicines;
    if (search) {
      filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.genericName.toLowerCase().includes(search) ||
        (m.brand && m.brand.toLowerCase().includes(search)) ||
        (m.barcode && m.barcode.toLowerCase().includes(search))
      );
    }

    const start = (page - 1) * limit;
    const paginatedItems = filtered.slice(start, start + limit);

    return HttpResponse.json({
      items: paginatedItems,
      total: filtered.length,
    });
  }),

  http.get('/api/medicines/:id', ({ params }: { params: { id: string } }) => {
    const { id } = params;
    const medicine = medicines.find(m => m.id === id);

    if (medicine) {
      return HttpResponse.json(medicine);
    }

    return HttpResponse.json({ message: 'Medicine not found' }, { status: 404 });
  }),

  http.post('/api/medicines', async ({ request }: { request: Request }) => {
    const body = await request.json() as Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>;

    const newMedicine: Medicine = {
      ...body,
      id: `m${medicines.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    medicines.push(newMedicine);
    return HttpResponse.json(newMedicine, { status: 201 });
  }),

  http.put('/api/medicines/:id', async (info: any) => {
    const { id } = info.params;
    const body = await info.request.json() as Partial<Medicine>;

    const index = medicines.findIndex(m => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Medicine not found' }, { status: 404 });
    }

    medicines[index] = {
      ...medicines[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(medicines[index]);
  }),

  http.delete('/api/medicines/:id', ({ params }: { params: { id: string } }) => {
    const { id } = params;
    const index = medicines.findIndex(m => m.id === id);

    if (index === -1) {
      return HttpResponse.json({ message: 'Medicine not found' }, { status: 404 });
    }

    medicines.splice(index, 1);
    return HttpResponse.json({ message: 'Medicine deleted successfully' });
  }),

  // Delegation endpoints
  http.post('/api/delegations', async ({ request }: { request: Request }) => {
    const body = await request.json() as {
      medicineId: string;
      quantity: number;
      toRole: string;
      toUserId?: string;
    };

    const medicine = medicines.find(m => m.id === body.medicineId);
    if (!medicine) {
      return HttpResponse.json({ message: 'Medicine not found' }, { status: 404 });
    }

    if (body.quantity > medicine.quantity) {
      return HttpResponse.json(
        { message: 'Cannot delegate more than available quantity' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = token.replace('mock-token-', '');
    const fromUser = users.find(u => u.id === userId);

    const toUser = body.toUserId ? users.find(u => u.id === body.toUserId) : null;

    const newDelegation: Delegation = {
      id: `d${delegations.length + 1}`,
      medicineId: body.medicineId,
      medicineName: medicine.name,
      genericName: medicine.genericName,
      quantity: body.quantity,
      fromUserId: userId,
      fromUserName: fromUser?.name || 'Unknown',
      toRole: body.toRole as any,
      toUserId: body.toUserId,
      toUserName: toUser?.name,
      status: 'accepted',
      delegationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    delegations.push(newDelegation);

    // Reduce medicine quantity
    medicine.quantity -= body.quantity;
    medicine.updatedAt = new Date().toISOString();

    return HttpResponse.json(newDelegation, { status: 201 });
  }),

  http.get('/api/delegations', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const toRole = url.searchParams.get('toRole');
    const toUserId = url.searchParams.get('toUserId');

    let filtered = delegations;

    if (toRole) {
      filtered = filtered.filter(d => d.toRole === toRole);
    }

    if (toUserId) {
      filtered = filtered.filter(d => d.toUserId === toUserId);
    }

    return HttpResponse.json(filtered);
  }),

  // Sales endpoints
  http.get('/api/sales', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let filtered = sales;

    if (dateFrom) {
      filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(dateTo));
    }

    // Calculate totals
    const totalAmount = filtered.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalItemsSold = filtered.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const txCount = filtered.length;

    return HttpResponse.json({
      items: filtered,
      totals: {
        revenue: totalAmount,
        itemsSold: totalItemsSold,
        txCount: txCount,
      },
    });
  }),

  http.post('/api/sales', async ({ request }: { request: Request }) => {
    const body = await request.json() as {
      items: Array<{
        medicineId: string;
        quantity: number;
        price: number;
      }>;
    };

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = token.replace('mock-token-', '');
    const user = users.find(u => u.id === userId);

    // Validate and reduce stock
    for (const item of body.items) {
      const medicine = medicines.find(m => m.id === item.medicineId);
      if (!medicine) {
        return HttpResponse.json(
          { message: `Medicine ${item.medicineId} not found` },
          { status: 404 }
        );
      }

      if (item.quantity > medicine.quantity) {
        return HttpResponse.json(
          { message: `Insufficient stock for ${medicine.name}` },
          { status: 400 }
        );
      }
    }

    // Create sale
    const saleItems = body.items.map(item => {
      const medicine = medicines.find(m => m.id === item.medicineId)!;
      return {
        medicineId: item.medicineId,
        medicineName: medicine.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      };
    });

    const newSale: Sale = {
      id: `s${sales.length + 1}`,
      items: saleItems,
      totalAmount: saleItems.reduce((sum, item) => sum + item.total, 0),
      soldBy: userId,
      soldByName: user?.name || 'Unknown',
      createdAt: new Date().toISOString(),
    };

    sales.push(newSale);

    // Reduce stock
    for (const item of body.items) {
      const medicine = medicines.find(m => m.id === item.medicineId)!;
      medicine.quantity -= item.quantity;
      medicine.updatedAt = new Date().toISOString();
    }

    return HttpResponse.json(newSale, { status: 201 });
  }),

  // User endpoints
  http.get('/api/users', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const start = (page - 1) * limit;
    const paginatedUsers = users.slice(start, start + limit);

    return HttpResponse.json({
      items: paginatedUsers,
      total: users.length,
    });
  }),

  http.put('/api/users/:id/password', async (info: any) => {
    const { id } = info.params;
    const body = await info.request.json() as { newPassword: string };

    const authHeader = info.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = token.replace('mock-token-', '');
    const currentUser = users.find(u => u.id === userId);

    if (currentUser?.role !== 'superadmin') {
      return HttpResponse.json(
        { message: 'Only superadmin can reset passwords' },
        { status: 403 }
      );
    }

    const user = users.find(u => u.id === id);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update password in mock credentials
    mockCredentials[user.email] = body.newPassword;

    return HttpResponse.json({ message: 'Password reset successfully' });
  }),

  // Product endpoints
  http.get('/api/products', ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    let filtered = mockProducts;
    if (category) {
      filtered = mockProducts.filter(p => p.category === category);
    }

    return HttpResponse.json(filtered);
  }),

  http.get('/api/products/:id', ({ params }: { params: { id: string } }) => {
    const { id } = params;
    const product = mockProducts.find(p => p.id === id);

    if (product) {
      return HttpResponse.json(product);
    }

    return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
  }),
];
