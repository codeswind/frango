import { API_BASE_URL } from '../config';

// API_BASE_URL is now imported from config.js

const api = {
  // Auth
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Categories
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories/read.php`);
    return response.json();
  },

  createCategory: async (category) => {
    const response = await fetch(`${API_BASE_URL}/categories/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    return response.json();
  },

  // Menu
  getMenuItems: async (categoryId = '', search = '', page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/menu/read.php?${params}`);
    return response.json();
  },

  createMenuItem: async (item) => {
    const response = await fetch(`${API_BASE_URL}/menu/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    return response.json();
  },

  uploadMenuImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/menu/upload_image.php`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  updateMenuItem: async (item) => {
    const response = await fetch(`${API_BASE_URL}/menu/update.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    return response.json();
  },

  toggleMenuItemStatus: async (id, isActive) => {
    const response = await fetch(`${API_BASE_URL}/menu/toggle_status.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, is_active: isActive }),
    });
    return response.json();
  },

  softDeleteMenuItem: async (id, isDeleted) => {
    const response = await fetch(`${API_BASE_URL}/menu/soft_delete.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, is_deleted: isDeleted }),
    });
    return response.json();
  },

  // Customers
  findCustomer: async (mobile) => {
    const response = await fetch(`${API_BASE_URL}/customers/find.php?mobile=${mobile}`);
    return response.json();
  },

  createCustomer: async (customer) => {
    const response = await fetch(`${API_BASE_URL}/customers/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    return response.json();
  },

  // Orders
  createOrder: async (order) => {
    const response = await fetch(`${API_BASE_URL}/orders/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    return response.json();
  },

  addOrderItems: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/orders/add_items.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  placeOrder: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/orders/place.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  getOrders: async (status = '') => {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/orders/read.php${params}`);
    return response.json();
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/orders/update_status.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId, status }),
    });
    return response.json();
  },

  getOrderDetails: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/details.php?order_id=${orderId}`);
    return response.json();
  },

  printKOT: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/print_kot.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    return response.json();
  },

  printInvoice: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/print_invoice.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    return response.json();
  },

  // Direct printing (backend printing without browser dialog)
  directPrintInvoice: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/direct_print_invoice.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    return response.json();
  },

  directPrintKOT: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/direct_print_kot.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    return response.json();
  },

  // Tables
  getTables: async () => {
    const response = await fetch(`${API_BASE_URL}/tables/read.php`);
    return response.json();
  },

  createTable: async (table) => {
    const response = await fetch(`${API_BASE_URL}/tables/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(table),
    });
    return response.json();
  },

  updateTable: async (table) => {
    const response = await fetch(`${API_BASE_URL}/tables/update.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(table),
    });
    return response.json();
  },

  toggleTableStatus: async (id, isActive) => {
    const response = await fetch(`${API_BASE_URL}/tables/toggle_status.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, is_active: isActive }),
    });
    return response.json();
  },

  softDeleteTable: async (id, isDeleted) => {
    const response = await fetch(`${API_BASE_URL}/tables/soft_delete.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, is_deleted: isDeleted }),
    });
    return response.json();
  },

  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/read.php`);
    return response.json();
  },

  // Expenses
  getExpenses: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses/read.php`);
    return response.json();
  },

  createExpense: async (expense) => {
    const response = await fetch(`${API_BASE_URL}/expenses/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    return response.json();
  },

  updateExpense: async (expense) => {
    const response = await fetch(`${API_BASE_URL}/expenses/update.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    return response.json();
  },

  // Reports
  getSalesReport: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await fetch(`${API_BASE_URL}/reports/sales.php?${params}`);
    return response.json();
  },
};

export default api;