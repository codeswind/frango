import React, { useState, useCallback, useEffect } from 'react';
import api from '../api';
import './Reports.css';
import {
  exportSalesPDF,
  exportOrdersPDF,
  exportExpensesPDF,
  exportProfitPDF,
  exportMenuPDF,
  exportCustomersPDF,
  exportGenericPDF
} from '../utils/pdfExport';

// Constants
const MAX_PRICE_THRESHOLD = 999999;
const ACTIVITY_DAYS_THRESHOLD = 30;
const DEFAULT_ITEMS_PER_ORDER = 1;

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: 'trending_up', color: '#4CAF50' },
    { id: 'orders', name: 'Orders Report', icon: 'receipt_long', color: '#2196F3' },
    { id: 'expenses', name: 'Expenses Report', icon: 'money_off', color: '#f44336' },
    { id: 'profit', name: 'Profit Report', icon: 'account_balance_wallet', color: '#9C27B0' },
    { id: 'menu', name: 'Menu Performance', icon: 'restaurant_menu', color: '#FF9800' },
    { id: 'customers', name: 'Customer Analytics', icon: 'people', color: '#00BCD4' },
    { id: 'payments', name: 'Payment Methods', icon: 'payment', color: '#795548' },
    { id: 'tables', name: 'Table Analytics', icon: 'table_restaurant', color: '#607D8B' },
    { id: 'categories', name: 'Category Report', icon: 'category', color: '#FF5722' },
    { id: 'staff', name: 'Staff Report', icon: 'badge', color: '#8BC34A' }
  ];

  const datePresets = [
    { id: 'today', name: 'Today' },
    { id: 'yesterday', name: 'Yesterday' },
    { id: 'this_week', name: 'This Week' },
    { id: 'last_week', name: 'Last Week' },
    { id: 'this_month', name: 'This Month' },
    { id: 'last_month', name: 'Last Month' },
    { id: 'this_year', name: 'This Year' },
    { id: 'custom', name: 'Custom Range' }
  ];

  const getDateRange = (period) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    switch (period) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(date - 1);
        return {
          start: yesterday.toISOString().split('T')[0],
          end: yesterday.toISOString().split('T')[0]
        };
      }
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(date - today.getDay());
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      }
      case 'last_week': {
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(date - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(date - today.getDay() - 1);
        return {
          start: lastWeekStart.toISOString().split('T')[0],
          end: lastWeekEnd.toISOString().split('T')[0]
        };
      }
      case 'this_month':
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'last_month': {
        const lastMonth = new Date(year, month - 1, 1);
        const lastMonthEnd = new Date(year, month, 0);
        return {
          start: lastMonth.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0]
        };
      }
      case 'this_year':
        return {
          start: new Date(year, 0, 1).toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      default:
        return { start: startDate, end: endDate };
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const range = getDateRange(period);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const handleApiError = (error, reportType) => {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      reportType
    };
  };

  const filterOrdersByDateRange = useCallback((orders, includeCancelled = false) => {
    return orders.filter(order => {
      // Exclude cancelled orders from revenue calculations by default
      if (!includeCancelled && order.status === 'Cancelled') {
        return false;
      }

      // Filter by date range
      if (!startDate && !endDate) return true;
      const orderDate = new Date(order.created_at || order.date);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
      return orderDate >= start && orderDate <= end;
    });
  }, [startDate, endDate]);

  const fetchReportData = useCallback(async () => {
    if (!activeReport) return;

    setLoading(true);
    try {
      let response;
      switch (activeReport) {
        case 'sales': {
          try {
            // Get comprehensive data for advanced sales analytics
            const ordersResponse = await api.getOrders();

            if (ordersResponse.success) {
              const orders = ordersResponse.data || [];

              // Filter orders by date range - exclude cancelled from revenue calculations
              const filteredOrders = filterOrdersByDateRange(orders, false);

              // Get all orders including cancelled for statistics
              const allFilteredOrders = filterOrdersByDateRange(orders, true);

              // Basic metrics (excluding cancelled orders)
              const totalSales = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
              const totalOrders = filteredOrders.length;
              const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

              // Order type analysis
              const orderTypes = {
                'Dine In': filteredOrders.filter(o => o.order_type === 'Dine In'),
                'Takeaway': filteredOrders.filter(o => o.order_type === 'Takeaway'),
                'Delivery': filteredOrders.filter(o => o.order_type === 'Delivery')
              };

              const byType = Object.keys(orderTypes).map(type => ({
                order_type: type,
                count: orderTypes[type].length,
                total: orderTypes[type].reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
                percentage: totalSales > 0 ? (orderTypes[type].reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) / totalSales) * 100 : 0,
                avg_order_value: orderTypes[type].length > 0 ?
                  orderTypes[type].reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) / orderTypes[type].length : 0
              }));

              // Payment method analysis
              const paymentMethods = {};
              filteredOrders.forEach(order => {
                const method = order.payment_method || 'Unknown';
                if (!paymentMethods[method]) {
                  paymentMethods[method] = { count: 0, total: 0 };
                }
                paymentMethods[method].count += 1;
                paymentMethods[method].total += parseFloat(order.total_amount || 0);
              });

              const byPaymentMethod = Object.keys(paymentMethods).map(method => ({
                payment_method: method,
                count: paymentMethods[method].count,
                total: paymentMethods[method].total,
                percentage: totalSales > 0 ? (paymentMethods[method].total / totalSales) * 100 : 0
              }));

              // Time-based analysis (hourly, daily)
              const hourlyStats = {};
              const dailyStats = {};
              const monthlyStats = {};

              filteredOrders.forEach(order => {
                const orderDate = new Date(order.created_at || order.date);
                const hour = orderDate.getHours();
                const dayName = orderDate.toLocaleDateString('en', { weekday: 'long' });
                const monthName = orderDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
                const amount = parseFloat(order.total_amount || 0);

                // Hourly stats
                if (!hourlyStats[hour]) hourlyStats[hour] = { count: 0, total: 0 };
                hourlyStats[hour].count += 1;
                hourlyStats[hour].total += amount;

                // Daily stats
                if (!dailyStats[dayName]) dailyStats[dayName] = { count: 0, total: 0 };
                dailyStats[dayName].count += 1;
                dailyStats[dayName].total += amount;

                // Monthly stats
                if (!monthlyStats[monthName]) monthlyStats[monthName] = { count: 0, total: 0 };
                monthlyStats[monthName].count += 1;
                monthlyStats[monthName].total += amount;
              });

              // Find peak hours and days
              const peakHour = Object.keys(hourlyStats).reduce((peak, hour) =>
                hourlyStats[hour].total > (hourlyStats[peak]?.total || 0) ? hour : peak, '0'
              );

              const peakDay = Object.keys(dailyStats).reduce((peak, day) =>
                dailyStats[day].total > (dailyStats[peak]?.total || 0) ? day : peak, 'Monday'
              );

              // Customer analysis
              const customerStats = {};
              filteredOrders.forEach(order => {
                const customerId = order.customer_mobile || order.customer_name || 'Walk-in';
                if (!customerStats[customerId]) {
                  customerStats[customerId] = {
                    orders: 0,
                    total: 0,
                    name: order.customer_name || 'Unknown'
                  };
                }
                customerStats[customerId].orders += 1;
                customerStats[customerId].total += parseFloat(order.total_amount || 0);
              });

              const topCustomers = Object.keys(customerStats)
                .map(id => ({
                  id,
                  name: customerStats[id].name,
                  orders: customerStats[id].orders,
                  total: customerStats[id].total
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

              // Sales trends (include cancelled for statistics)
              const completedOrders = allFilteredOrders.filter(o => o.status === 'Completed').length;
              const cancelledOrders = allFilteredOrders.filter(o => o.status === 'Cancelled').length;
              const holdOrders = allFilteredOrders.filter(o => o.status === 'Hold').length;
              const totalAllOrders = allFilteredOrders.length;

              const completionRate = totalAllOrders > 0 ? (completedOrders / totalAllOrders) * 100 : 0;
              const cancellationRate = totalAllOrders > 0 ? (cancelledOrders / totalAllOrders) * 100 : 0;

              // Advanced metrics
              const highestSingleOrder = filteredOrders.reduce((max, order) =>
                parseFloat(order.total_amount || 0) > parseFloat(max?.total_amount || 0) ? order : max, null
              );

              const averageItemsPerOrder = totalOrders > 0 ?
                filteredOrders.reduce((sum, order) => sum + parseInt(order.items_count || DEFAULT_ITEMS_PER_ORDER), 0) / totalOrders : 0;

              response = {
                success: true,
                data: {
                  summary: {
                    total_sales: totalSales,
                    total_orders: totalOrders,
                    average_order_value: avgOrderValue,
                    completed_orders: completedOrders,
                    cancelled_orders: cancelledOrders,
                    hold_orders: holdOrders,
                    completion_rate: completionRate,
                    cancellation_rate: cancellationRate,
                    date_range: `${startDate || 'All time'} to ${endDate || 'Present'}`
                  },
                  by_type: byType,
                  by_payment_method: byPaymentMethod,
                  time_analysis: {
                    peak_hour: peakHour,
                    peak_day: peakDay,
                    hourly_stats: Object.keys(hourlyStats).map(hour => ({
                      hour: parseInt(hour),
                      count: hourlyStats[hour].count,
                      total: hourlyStats[hour].total,
                      avg: hourlyStats[hour].count > 0 ? hourlyStats[hour].total / hourlyStats[hour].count : 0
                    })).sort((a, b) => a.hour - b.hour),
                    daily_stats: Object.keys(dailyStats).map(day => ({
                      day,
                      count: dailyStats[day].count,
                      total: dailyStats[day].total,
                      avg: dailyStats[day].count > 0 ? dailyStats[day].total / dailyStats[day].count : 0
                    }))
                  },
                  top_customers: topCustomers,
                  performance_metrics: {
                    highest_single_order: highestSingleOrder,
                    highest_order_amount: highestSingleOrder ? parseFloat(highestSingleOrder.total_amount || 0) : 0,
                    average_items_per_order: averageItemsPerOrder,
                    total_customers: Object.keys(customerStats).length,
                    returning_customers: Object.keys(customerStats).filter(id => customerStats[id].orders > 1).length
                  }
                }
              };

              // Try to get official sales report data and merge if available
              try {
                const officialResponse = await api.getSalesReport(startDate, endDate);
                if (officialResponse.success && officialResponse.data) {
                  // Merge official data with our calculated data, but prioritize our calculated totals
                  // if they're different (our data includes all order statuses)
                  const mergedData = {
                    ...response.data,
                    ...officialResponse.data
                  };

                  // Keep our calculated summary if it has more orders (indicates all statuses included)
                  if (response.data.summary && officialResponse.data.summary) {
                    if (response.data.summary.total_orders >= officialResponse.data.summary.total_orders) {
                      mergedData.summary = response.data.summary;
                    }
                  }

                  response.data = mergedData;
                }
              } catch {
                // Continue with our calculated data
              }
            } else {
              response = { success: false, error: 'No orders data available for sales report' };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'sales');
          }
          break;
        }
        case 'orders':
          try {
            response = await api.getOrders();
            if (response.success) {
              const allOrders = response.data || [];

              // Filter orders - exclude cancelled from revenue calculations
              const orders = filterOrdersByDateRange(allOrders, false);

              // Get all orders including cancelled for statistics
              const allFilteredOrders = filterOrdersByDateRange(allOrders, true);

              // Calculate order statistics (including cancelled for counts)
              const totalOrders = allFilteredOrders.length;
              const completedOrders = allFilteredOrders.filter(o => o.status === 'Completed').length;
              const holdOrders = allFilteredOrders.filter(o => o.status === 'Hold').length;
              const cancelledOrders = allFilteredOrders.filter(o => o.status === 'Cancelled').length;
              const pendingOrders = allFilteredOrders.filter(o => o.status === 'Pending').length;

              // Calculate order type breakdown (exclude cancelled)
              const dineInOrders = orders.filter(o => o.order_type === 'Dine In').length;
              const takeawayOrders = orders.filter(o => o.order_type === 'Takeaway').length;
              const deliveryOrders = orders.filter(o => o.order_type === 'Delivery').length;

              // Calculate average order value (excluding cancelled orders)
              const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
              const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

              // Calculate completion rate
              const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

              // Calculate payment method breakdown
              const cashOrders = orders.filter(o => o.payment_method === 'Cash').length;
              const cardOrders = orders.filter(o => o.payment_method === 'Card').length;
              const bankTransferOrders = orders.filter(o => o.payment_method === 'Bank Transfer').length;
              const uberEatsOrders = orders.filter(o => o.payment_method === 'Uber Eats').length;
              const pickMeOrders = orders.filter(o => o.payment_method === 'PickMe Food').length;

              response.data = {
                total_orders: totalOrders,
                completed_orders: completedOrders,
                hold_orders: holdOrders,
                cancelled_orders: cancelledOrders,
                pending_orders: pendingOrders,
                dine_in_orders: dineInOrders,
                takeaway_orders: takeawayOrders,
                delivery_orders: deliveryOrders,
                avg_order_value: avgOrderValue,
                total_sales: totalSales,
                completion_rate: completionRate,
                cash_orders: cashOrders,
                card_orders: cardOrders,
                bank_transfer_orders: bankTransferOrders,
                uber_eats_orders: uberEatsOrders,
                pickme_orders: pickMeOrders
              };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'orders');
          }
          break;
        case 'expenses':
          try {
            response = await api.getExpenses();
            if (response.success) {
              const allExpenses = response.data || [];

              // Filter expenses by date range if specified
              const expenses = allExpenses.filter(expense => {
                if (!startDate && !endDate) return true;
                const expenseDate = new Date(expense.date || expense.created_at);
                const start = startDate ? new Date(startDate) : new Date('1970-01-01');
                const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
                return expenseDate >= start && expenseDate <= end;
              });

              const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
              response.data = {
                total_expenses: total,
                total_items: expenses.length,
                average_expense: expenses.length > 0 ? total / expenses.length : 0,
                expenses: expenses // Include the actual expenses data
              };
            } else {
              response = { success: false, error: response.message || 'Failed to fetch expenses' };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'expenses');
          }
          break;
        case 'customers': {
          try {
            // Get customer analytics from orders data
            const ordersResponse = await api.getOrders();

            if (ordersResponse.success) {
              const allOrders = ordersResponse.data || [];

              // Filter orders by date range if specified (same logic as sales report)
              const orders = filterOrdersByDateRange(allOrders);

              // Extract unique customers from orders
              const customerMap = new Map();

              orders.forEach(order => {
                const customerId = order.customer_mobile || order.customer_name || 'anonymous';
                if (customerId && customerId !== 'anonymous') {
                  if (!customerMap.has(customerId)) {
                    customerMap.set(customerId, {
                      id: customerId,
                      name: order.customer_name || 'Unknown',
                      mobile: order.customer_mobile || 'N/A',
                      orderCount: 0,
                      totalSpent: 0,
                      avgOrderValue: 0,
                      lastOrderDate: null,
                      firstOrderDate: null,
                      preferredOrderType: null,
                      preferredPaymentMethod: null
                    });
                  }

                  const customer = customerMap.get(customerId);
                  customer.orderCount += 1;
                  customer.totalSpent += parseFloat(order.total_amount || 0);

                  // Track order dates
                  const orderDate = new Date(order.created_at || order.date);
                  if (!customer.firstOrderDate || orderDate < customer.firstOrderDate) {
                    customer.firstOrderDate = orderDate;
                  }
                  if (!customer.lastOrderDate || orderDate > customer.lastOrderDate) {
                    customer.lastOrderDate = orderDate;
                  }

                  // Update preferred order type and payment method (most recent)
                  customer.preferredOrderType = order.order_type;
                  customer.preferredPaymentMethod = order.payment_method;
                }
              });

              // Calculate averages
              customerMap.forEach(customer => {
                customer.avgOrderValue = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
              });

              const customers = Array.from(customerMap.values());
              const totalCustomers = customers.length;
              const repeatCustomers = customers.filter(c => c.orderCount > 1).length;
              const newCustomers = totalCustomers - repeatCustomers;

              // Calculate analytics
              const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
              const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
              const avgOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;

              // Find top customer
              const topCustomer = customers.reduce((top, customer) =>
                customer.totalSpent > (top?.totalSpent || 0) ? customer : top, null
              );

              // Calculate customer segments
              const highValueCustomers = customers.filter(c => c.totalSpent > avgCustomerValue).length;
              const oneTimeCustomers = customers.filter(c => c.orderCount === 1).length;
              const loyalCustomers = customers.filter(c => c.orderCount >= 5).length;

              // Order type preferences
              const dineInCustomers = customers.filter(c => c.preferredOrderType === 'Dine In').length;
              const takeawayCustomers = customers.filter(c => c.preferredOrderType === 'Takeaway').length;
              const deliveryCustomers = customers.filter(c => c.preferredOrderType === 'Delivery').length;

              // Payment method preferences
              const cashCustomers = customers.filter(c => c.preferredPaymentMethod === 'Cash').length;
              const cardCustomers = customers.filter(c => c.preferredPaymentMethod === 'Card').length;

              response = {
                success: true,
                data: {
                  total_customers: totalCustomers,
                  new_customers: newCustomers,
                  repeat_customers: repeatCustomers,
                  loyal_customers: loyalCustomers,
                  one_time_customers: oneTimeCustomers,
                  high_value_customers: highValueCustomers,
                  avg_customer_value: avgCustomerValue,
                  avg_orders_per_customer: avgOrdersPerCustomer,
                  top_customer: topCustomer,
                  total_revenue: totalRevenue,
                  dine_in_customers: dineInCustomers,
                  takeaway_customers: takeawayCustomers,
                  delivery_customers: deliveryCustomers,
                  cash_customers: cashCustomers,
                  card_customers: cardCustomers,
                  customer_retention_rate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0
                }
              };
            } else {
              response = { success: false };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'customers');
          }
          break;
        }
        case 'tables': {
          try {
            // Get tables and orders data for comprehensive analytics
            const [tablesResponse, ordersResponse] = await Promise.all([
              api.getTables(),
              api.getOrders()
            ]);

            if (tablesResponse.success) {
              const tables = tablesResponse.data || [];
              const allOrders = ordersResponse.success ? ordersResponse.data || [] : [];
              const orders = filterOrdersByDateRange(allOrders);

              // Filter dine-in orders (only these use tables)
              const dineInOrders = orders.filter(order =>
                order.order_type === 'Dine In' && order.table_number
              );

              // Calculate table usage statistics
              const tableStats = {};
              const totalTables = tables.length;
              const activeTables = tables.filter(table =>
                table.is_active === 1 || table.is_active === '1'
              ).length;

              // Initialize stats for each table
              tables.forEach(table => {
                tableStats[table.table_number] = {
                  id: table.id,
                  name: table.table_number,
                  capacity: table.capacity || 4,
                  orders: 0,
                  revenue: 0,
                  avgOrderValue: 0,
                  isActive: table.is_active === 1 || table.is_active === '1'
                };
              });

              // Process dine-in orders to calculate table usage
              dineInOrders.forEach(order => {
                const tableNumber = order.table_number;
                if (tableStats[tableNumber]) {
                  tableStats[tableNumber].orders += 1;
                  tableStats[tableNumber].revenue += parseFloat(order.total_amount || 0);
                }
              });

              // Calculate averages and find most popular table
              let mostPopularTable = null;
              let maxOrders = 0;
              let totalRevenue = 0;
              let totalOrders = 0;

              Object.values(tableStats).forEach(table => {
                table.avgOrderValue = table.orders > 0 ? table.revenue / table.orders : 0;
                totalRevenue += table.revenue;
                totalOrders += table.orders;

                if (table.orders > maxOrders) {
                  maxOrders = table.orders;
                  mostPopularTable = table.name;
                }
              });

              // Calculate utilization metrics
              const tablesWithOrders = Object.values(tableStats).filter(t => t.orders > 0).length;
              const utilizationRate = activeTables > 0 ? (tablesWithOrders / activeTables) * 100 : 0;
              const avgOrdersPerTable = activeTables > 0 ? totalOrders / activeTables : 0;
              const avgRevenuePerTable = activeTables > 0 ? totalRevenue / activeTables : 0;

              // Find highest and lowest revenue tables
              const tablesArray = Object.values(tableStats).filter(t => t.orders > 0);
              const highestRevenueTable = tablesArray.reduce((max, table) =>
                table.revenue > (max?.revenue || 0) ? table : max, null
              );
              const lowestRevenueTable = tablesArray.reduce((min, table) =>
                table.revenue < (min?.revenue || Infinity) ? table : min, null
              );

              // Calculate table efficiency (revenue per capacity)
              const tableEfficiency = tablesArray.map(table => ({
                ...table,
                efficiency: table.revenue / table.capacity
              })).sort((a, b) => b.efficiency - a.efficiency);

              const mostEfficientTable = tableEfficiency[0];

              response = {
                success: true,
                data: {
                  total_tables: totalTables,
                  active_tables: activeTables,
                  inactive_tables: totalTables - activeTables,
                  tables_with_orders: tablesWithOrders,
                  utilization_rate: utilizationRate,
                  most_popular_table: mostPopularTable || 'N/A',
                  most_popular_orders: maxOrders,
                  highest_revenue_table: highestRevenueTable?.name || 'N/A',
                  highest_revenue_amount: highestRevenueTable?.revenue || 0,
                  lowest_revenue_table: lowestRevenueTable?.name || 'N/A',
                  lowest_revenue_amount: lowestRevenueTable?.revenue || 0,
                  most_efficient_table: mostEfficientTable?.name || 'N/A',
                  efficiency_score: mostEfficientTable?.efficiency || 0,
                  avg_orders_per_table: avgOrdersPerTable,
                  avg_revenue_per_table: avgRevenuePerTable,
                  total_dine_in_orders: dineInOrders.length,
                  total_dine_in_revenue: totalRevenue,
                  table_details: Object.values(tableStats).sort((a, b) => b.revenue - a.revenue)
                }
              };
            } else {
              response = { success: false };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'tables');
          }
          break;
        }
        case 'staff': {
          try {
            // Get users and orders data for comprehensive staff analytics
            const [usersResponse, ordersResponse] = await Promise.all([
              api.getUsers(),
              api.getOrders()
            ]);

            if (usersResponse.success) {
              const users = usersResponse.data || [];
              const allOrders = ordersResponse.success ? ordersResponse.data || [] : [];
              const orders = filterOrdersByDateRange(allOrders);

              // Analyze user roles
              const roleStats = {
                'Super Admin': { count: 0, users: [] },
                'Admin': { count: 0, users: [] },
                'Cashier': { count: 0, users: [] },
                'Other': { count: 0, users: [] }
              };

              // Categorize users by role
              users.forEach(user => {
                const role = user.role || 'Other';
                if (roleStats[role]) {
                  roleStats[role].count += 1;
                  roleStats[role].users.push(user);
                } else {
                  roleStats['Other'].count += 1;
                  roleStats['Other'].users.push(user);
                }
              });

              // Calculate activity metrics (simplified - based on recent activity)
              const currentDate = new Date();
              const thirtyDaysAgo = new Date(currentDate.getTime() - ACTIVITY_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);

              // Calculate staff performance metrics
              const activeUsers = users.filter(user => {
                const lastActive = user.last_login ? new Date(user.last_login) : new Date(user.created_at || 0);
                return lastActive >= thirtyDaysAgo;
              }).length;

              const inactiveUsers = users.length - activeUsers;

              // Find most recently active user
              const mostRecentUser = users.reduce((mostRecent, user) => {
                const userLastActive = user.last_login ? new Date(user.last_login) : new Date(user.created_at || 0);
                const currentMostRecentDate = mostRecent ? new Date(mostRecent.last_login || mostRecent.created_at || 0) : new Date(0);
                return userLastActive > currentMostRecentDate ? user : mostRecent;
              }, null);

              // Calculate role distribution percentages
              const totalUsers = users.length;
              const superAdminPercentage = totalUsers > 0 ? (roleStats['Super Admin'].count / totalUsers) * 100 : 0;
              const adminPercentage = totalUsers > 0 ? (roleStats['Admin'].count / totalUsers) * 100 : 0;
              const cashierPercentage = totalUsers > 0 ? (roleStats['Cashier'].count / totalUsers) * 100 : 0;

              // Analyze order creation patterns (if orders have creator info)
              let ordersByStaff = {};
              orders.forEach(order => {
                const createdBy = order.created_by || order.staff_id || 'Unknown';
                if (!ordersByStaff[createdBy]) {
                  ordersByStaff[createdBy] = { count: 0, revenue: 0 };
                }
                ordersByStaff[createdBy].count += 1;
                ordersByStaff[createdBy].revenue += parseFloat(order.total_amount || 0);
              });

              // Find most productive staff member
              const mostProductiveStaffId = Object.keys(ordersByStaff).reduce((topStaff, staffId) => {
                return ordersByStaff[staffId].count > (ordersByStaff[topStaff]?.count || 0) ? staffId : topStaff;
              }, null);

              const mostProductiveStaff = mostProductiveStaffId ?
                users.find(u => u.id == mostProductiveStaffId) || { name: `Staff #${mostProductiveStaffId}` } : null;

              response = {
                success: true,
                data: {
                  total_users: totalUsers,
                  super_admin_count: roleStats['Super Admin'].count,
                  admin_count: roleStats['Admin'].count,
                  cashier_count: roleStats['Cashier'].count,
                  other_count: roleStats['Other'].count,
                  active_users: activeUsers,
                  inactive_users: inactiveUsers,
                  activity_rate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
                  super_admin_percentage: superAdminPercentage,
                  admin_percentage: adminPercentage,
                  cashier_percentage: cashierPercentage,
                  most_recent_user: mostRecentUser,
                  most_productive_staff: mostProductiveStaff,
                  most_productive_orders: mostProductiveStaffId ? ordersByStaff[mostProductiveStaffId]?.count || 0 : 0,
                  most_productive_revenue: mostProductiveStaffId ? ordersByStaff[mostProductiveStaffId]?.revenue || 0 : 0,
                  total_orders_processed: orders.length,
                  avg_orders_per_staff: totalUsers > 0 ? orders.length / totalUsers : 0,
                  role_details: Object.keys(roleStats).filter(role => roleStats[role].count > 0).map(role => ({
                    role: role,
                    count: roleStats[role].count,
                    percentage: totalUsers > 0 ? (roleStats[role].count / totalUsers) * 100 : 0,
                    users: roleStats[role].users
                  }))
                }
              };
            } else {
              response = { success: false };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'staff');
          }
          break;
        }
        case 'profit': {
          try {
            // Calculate profit from sales and expenses
            const [salesResponse, expensesResponse] = await Promise.all([
              api.getOrders(),
              api.getExpenses()
            ]);

            let totalSales = 0;
            let totalExpenses = 0;

            if (salesResponse.success) {
              const allOrders = salesResponse.data || [];
              const orders = filterOrdersByDateRange(allOrders);
              totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            }

            if (expensesResponse.success) {
              const allExpenses = expensesResponse.data || [];

              // Filter expenses by date range if specified
              const expenses = allExpenses.filter(expense => {
                if (!startDate && !endDate) return true;
                const expenseDate = new Date(expense.date || expense.created_at);
                const start = startDate ? new Date(startDate) : new Date('1970-01-01');
                const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
                return expenseDate >= start && expenseDate <= end;
              });

              totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
            }

            const grossProfit = totalSales;
            const netProfit = totalSales - totalExpenses;
            const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

            response = {
              success: true,
              data: {
                gross_profit: grossProfit,
                net_profit: netProfit,
                profit_margin: profitMargin,
                total_sales: totalSales,
                total_expenses: totalExpenses
              }
            };
          } catch (apiError) {
            response = handleApiError(apiError, 'profit');
          }
          break;
        }
        case 'menu': {
          try {
            // Get menu items and categories for menu performance analysis
            const [menuResponse, categoriesResponse] = await Promise.all([
              api.getMenuItems(),
              api.getCategories()
            ]);

            let totalItems = 0;
            let activeItems = 0;
            let deletedItems = 0;
            let categoryBreakdown = [];

            if (menuResponse.success) {
              const menuItems = menuResponse.data || [];
              totalItems = menuItems.length;
              activeItems = menuItems.filter(item => item.is_active === 1 || item.is_active === '1').length;
              deletedItems = menuItems.filter(item => item.is_deleted === 1 || item.is_deleted === '1').length;

              // Calculate average price
              const totalPrice = menuItems
                .filter(item => item.is_active === 1 || item.is_active === '1')
                .reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
              const avgPrice = activeItems > 0 ? totalPrice / activeItems : 0;

              // Get category breakdown if categories are available
              if (categoriesResponse.success) {
                const categories = categoriesResponse.data || [];
                categoryBreakdown = categories.map(category => {
                  const categoryItems = menuItems.filter(item =>
                    item.category_id === category.id &&
                    (item.is_active === 1 || item.is_active === '1')
                  );
                  return {
                    name: category.name,
                    count: categoryItems.length,
                    avgPrice: categoryItems.length > 0
                      ? categoryItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) / categoryItems.length
                      : 0
                  };
                });
              }

              response = {
                success: true,
                data: {
                  total_items: totalItems,
                  active_items: activeItems,
                  deleted_items: deletedItems,
                  inactive_items: totalItems - activeItems - deletedItems,
                  avg_price: avgPrice,
                  category_breakdown: categoryBreakdown,
                  most_expensive: menuItems
                    .filter(item => item.is_active === 1 || item.is_active === '1')
                    .reduce((max, item) => parseFloat(item.price || 0) > parseFloat(max.price || 0) ? item : max, { price: 0, name: 'N/A' }),
                  least_expensive: menuItems
                    .filter(item => item.is_active === 1 || item.is_active === '1')
                    .reduce((min, item) => parseFloat(item.price || 0) < parseFloat(min.price || MAX_PRICE_THRESHOLD) ? item : min, { price: MAX_PRICE_THRESHOLD, name: 'N/A' })
                }
              };
            } else {
              response = { success: false };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'menu');
          }
          break;
        }
        case 'payments': {
          try {
            // Get payment method analytics from orders data
            const ordersResponse = await api.getOrders();

            if (ordersResponse.success) {
              const allOrders = ordersResponse.data || [];
              const orders = filterOrdersByDateRange(allOrders);

              // Calculate payment method totals
              const paymentStats = {
                cash: { count: 0, total: 0 },
                card: { count: 0, total: 0 },
                bank_transfer: { count: 0, total: 0 },
                uber_eats: { count: 0, total: 0 },
                pickme_food: { count: 0, total: 0 },
                other: { count: 0, total: 0 }
              };

              let totalTransactions = 0;
              let totalRevenue = 0;

              orders.forEach(order => {
                const amount = parseFloat(order.total_amount || 0);
                const paymentMethod = order.payment_method?.toLowerCase() || 'other';

                totalTransactions += 1;
                totalRevenue += amount;

                switch (paymentMethod.toLowerCase()) {
                  case 'cash':
                    paymentStats.cash.count += 1;
                    paymentStats.cash.total += amount;
                    break;
                  case 'card':
                    paymentStats.card.count += 1;
                    paymentStats.card.total += amount;
                    break;
                  case 'bank transfer':
                    paymentStats.bank_transfer.count += 1;
                    paymentStats.bank_transfer.total += amount;
                    break;
                  case 'uber eats':
                    paymentStats.uber_eats.count += 1;
                    paymentStats.uber_eats.total += amount;
                    break;
                  case 'pickme food':
                    paymentStats.pickme_food.count += 1;
                    paymentStats.pickme_food.total += amount;
                    break;
                  default:
                    paymentStats.other.count += 1;
                    paymentStats.other.total += amount;
                    break;
                }
              });

              // Calculate percentages and averages
              const mostUsedMethod = Object.keys(paymentStats).reduce((max, method) =>
                paymentStats[method].count > paymentStats[max].count ? method : max
              );

              const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

              // Calculate digital vs cash ratio
              const digitalPayments = paymentStats.card.total + paymentStats.bank_transfer.total +
                                    paymentStats.uber_eats.total + paymentStats.pickme_food.total;
              const digitalRatio = totalRevenue > 0 ? (digitalPayments / totalRevenue) * 100 : 0;

              response = {
                success: true,
                data: {
                  total_transactions: totalTransactions,
                  total_revenue: totalRevenue,
                  avg_transaction_value: avgTransactionValue,
                  cash_payments: paymentStats.cash.total,
                  cash_count: paymentStats.cash.count,
                  cash_percentage: totalRevenue > 0 ? (paymentStats.cash.total / totalRevenue) * 100 : 0,
                  card_payments: paymentStats.card.total,
                  card_count: paymentStats.card.count,
                  card_percentage: totalRevenue > 0 ? (paymentStats.card.total / totalRevenue) * 100 : 0,
                  bank_transfer_payments: paymentStats.bank_transfer.total,
                  bank_transfer_count: paymentStats.bank_transfer.count,
                  bank_transfer_percentage: totalRevenue > 0 ? (paymentStats.bank_transfer.total / totalRevenue) * 100 : 0,
                  uber_eats_payments: paymentStats.uber_eats.total,
                  uber_eats_count: paymentStats.uber_eats.count,
                  uber_eats_percentage: totalRevenue > 0 ? (paymentStats.uber_eats.total / totalRevenue) * 100 : 0,
                  pickme_food_payments: paymentStats.pickme_food.total,
                  pickme_food_count: paymentStats.pickme_food.count,
                  pickme_food_percentage: totalRevenue > 0 ? (paymentStats.pickme_food.total / totalRevenue) * 100 : 0,
                  other_payments: paymentStats.other.total,
                  other_count: paymentStats.other.count,
                  digital_payments: digitalPayments,
                  digital_ratio: digitalRatio,
                  most_used_method: mostUsedMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              };
            } else {
              response = { success: false };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'payments');
          }
          break;
        }
        case 'categories': {
          try {
            // Get categories and menu items data for comprehensive analytics
            const [categoriesResponse, menuResponse, ordersResponse] = await Promise.all([
              api.getCategories(),
              api.getMenuItems(),
              api.getOrders()
            ]);

            if (categoriesResponse.success) {
              const categories = categoriesResponse.data || [];
              const menuItems = menuResponse.success ? menuResponse.data || [] : [];
              const allOrders = ordersResponse.success ? ordersResponse.data || [] : [];
              const orders = filterOrdersByDateRange(allOrders);

              // Calculate category statistics
              const categoryStats = {};
              let totalCategories = categories.length;
              let totalMenuItems = 0;
              let totalRevenue = 0;

              // Initialize stats for each category
              categories.forEach(category => {
                categoryStats[category.id] = {
                  id: category.id,
                  name: category.name,
                  description: category.description || '',
                  items: [],
                  totalItems: 0,
                  activeItems: 0,
                  inactiveItems: 0,
                  avgPrice: 0,
                  totalPrice: 0,
                  orders: 0,
                  revenue: 0
                };
              });

              // Process menu items by category
              menuItems.forEach(item => {
                totalMenuItems++;
                const categoryId = item.category_id;
                if (categoryStats[categoryId]) {
                  categoryStats[categoryId].items.push(item);
                  categoryStats[categoryId].totalItems++;

                  if (item.is_active === 1 || item.is_active === '1') {
                    categoryStats[categoryId].activeItems++;
                    categoryStats[categoryId].totalPrice += parseFloat(item.price || 0);
                  } else {
                    categoryStats[categoryId].inactiveItems++;
                  }
                }
              });

              // Calculate average prices
              Object.values(categoryStats).forEach(category => {
                category.avgPrice = category.activeItems > 0 ? category.totalPrice / category.activeItems : 0;
              });

              // Process orders to calculate category revenue (simplified approach)
              // Note: This is a simplified calculation as we don't have order items breakdown
              // We'll estimate based on order amounts and popular items
              orders.forEach(order => {
                const orderAmount = parseFloat(order.total_amount || 0);
                totalRevenue += orderAmount;

                // Distribute revenue proportionally across categories based on active items
                const totalActiveItems = Object.values(categoryStats).reduce((sum, cat) => sum + cat.activeItems, 0);

                Object.values(categoryStats).forEach(category => {
                  if (totalActiveItems > 0) {
                    const proportion = category.activeItems / totalActiveItems;
                    category.revenue += orderAmount * proportion;
                    category.orders += proportion;
                  }
                });
              });

              // Find best performing category
              const categoriesArray = Object.values(categoryStats);
              const bestCategory = categoriesArray.reduce((best, category) =>
                category.revenue > (best?.revenue || 0) ? category : best, null
              );

              const worstCategory = categoriesArray.reduce((worst, category) =>
                category.revenue < (worst?.revenue || Infinity) && category.revenue > 0 ? category : worst, null
              );

              // Calculate averages and metrics
              const avgItemsPerCategory = totalCategories > 0 ? totalMenuItems / totalCategories : 0;
              const avgRevenuePerCategory = totalCategories > 0 ? totalRevenue / totalCategories : 0;
              const avgPriceOverall = totalMenuItems > 0 ?
                categoriesArray.reduce((sum, cat) => sum + cat.totalPrice, 0) /
                categoriesArray.reduce((sum, cat) => sum + cat.activeItems, 0) : 0;

              // Sort categories by performance
              const sortedCategories = categoriesArray.sort((a, b) => b.revenue - a.revenue);

              response = {
                success: true,
                data: {
                  total_categories: totalCategories,
                  total_menu_items: totalMenuItems,
                  avg_items_per_category: avgItemsPerCategory,
                  avg_revenue_per_category: avgRevenuePerCategory,
                  avg_price_overall: avgPriceOverall,
                  best_category: bestCategory?.name || 'N/A',
                  best_category_revenue: bestCategory?.revenue || 0,
                  best_category_items: bestCategory?.activeItems || 0,
                  worst_category: worstCategory?.name || 'N/A',
                  worst_category_revenue: worstCategory?.revenue || 0,
                  most_items_category: categoriesArray.reduce((max, cat) =>
                    cat.totalItems > (max?.totalItems || 0) ? cat : max, null
                  ),
                  highest_avg_price_category: categoriesArray.reduce((max, cat) =>
                    cat.avgPrice > (max?.avgPrice || 0) ? cat : max, null
                  ),
                  total_active_items: categoriesArray.reduce((sum, cat) => sum + cat.activeItems, 0),
                  total_inactive_items: categoriesArray.reduce((sum, cat) => sum + cat.inactiveItems, 0),
                  category_details: sortedCategories
                }
              };
            } else {
              response = { success: false };
            }
          } catch (apiError) {
            response = handleApiError(apiError, 'categories');
          }
          break;
        }
        default:
          try {
            response = await api.getSalesReport(startDate, endDate);
          } catch (apiError) {
            response = handleApiError(apiError, 'default');
          }
      }

      if (response && response.success) {
        setReportData(response.data);
      } else {
        setReportData(null);
      }
    } catch {
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeReport, startDate, endDate, filterOrdersByDateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // PDF Export Handler
  const handleExportPDF = () => {
    if (!reportData) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    const dateRange = { start: startDate || 'All Time', end: endDate || 'Present' };

    try {
      switch (activeReport) {
        case 'sales':
          exportSalesPDF(reportData, dateRange);
          break;
        case 'orders':
          exportOrdersPDF(reportData, dateRange);
          break;
        case 'expenses':
          exportExpensesPDF(reportData, dateRange);
          break;
        case 'profit':
          exportProfitPDF(reportData, dateRange);
          break;
        case 'menu':
          exportMenuPDF(reportData, dateRange);
          break;
        case 'customers':
          exportCustomersPDF(reportData, dateRange);
          break;
        case 'payments':
          exportGenericPDF('Payment Methods Report', reportData, dateRange);
          break;
        case 'tables':
          exportGenericPDF('Table Analytics Report', reportData, dateRange);
          break;
        case 'categories':
          exportGenericPDF('Category Performance Report', reportData, dateRange);
          break;
        case 'staff':
          exportGenericPDF('Staff Performance Report', reportData, dateRange);
          break;
        default:
          exportGenericPDF('Report', reportData, dateRange);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0aec0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <span className="material-icons" style={{ fontSize: 'inherit', animation: 'spin 1s linear infinite' }}>refresh</span>
          </div>
          <p>Loading {reportTypes.find(r => r.id === activeReport)?.name}...</p>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0aec0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#718096' }}>
            <span className="material-icons" style={{ fontSize: 'inherit' }}>info</span>
          </div>
          <p>No data available for the selected period</p>
        </div>
      );
    }

    // Render different content based on active report type
    switch (activeReport) {
      case 'sales':
        return renderSalesReport();
      case 'orders':
        return renderOrdersReport();
      case 'expenses':
        return renderExpensesReport();
      case 'profit':
        return renderProfitReport();
      case 'menu':
        return renderMenuReport();
      case 'customers':
        return renderCustomersReport();
      case 'payments':
        return renderPaymentsReport();
      case 'tables':
        return renderTablesReport();
      case 'categories':
        return renderCategoriesReport();
      case 'staff':
        return renderStaffReport();
      default:
        return renderSalesReport();
    }
  };

  const renderSalesReport = () => (
    <div>
      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Sales</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.summary ? parseFloat(reportData.summary.total_sales || 0).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Orders</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.summary ? reportData.summary.total_orders || 0 : 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Average Order</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.summary ? parseFloat(reportData.summary.average_order_value || 0).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Completion Rate</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.summary ? parseFloat(reportData.summary.completion_rate || 0).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {reportData.performance_metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Highest Order</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              {reportData.performance_metrics?.highest_order_amount ? parseFloat(reportData.performance_metrics.highest_order_amount).toFixed(2) : '0.00'}
            </p>
          </div>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Customers</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              {reportData.performance_metrics?.total_customers || 0}
            </p>
          </div>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Returning Customers</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
              {reportData.performance_metrics?.returning_customers || 0}
            </p>
          </div>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Items/Order</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF5722' }}>
              {reportData.performance_metrics?.average_items_per_order ? parseFloat(reportData.performance_metrics.average_items_per_order).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>
      )}

      {/* Order Type Analysis */}
      {reportData.by_type && reportData.by_type.length > 0 && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Sales by Order Type</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #4a5568' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', color: '#a0aec0' }}>Order Type</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Total Sales</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Percentage</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {reportData.by_type.map(type => (
                <tr key={type.order_type} style={{ borderBottom: '1px solid #4a5568' }}>
                  <td style={{ padding: '12px 0', color: '#e2e8f0' }}>{type.order_type}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: '#e2e8f0' }}>{type.count}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 'bold', color: '#4CAF50' }}>
                    {parseFloat(type.total).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: '#FF9800' }}>
                    {parseFloat(type.percentage || 0).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: '#2196F3' }}>
                    {parseFloat(type.avg_order_value || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Method Analysis */}
      {reportData.by_payment_method && reportData.by_payment_method.length > 0 && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Payment Method Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #4a5568' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', color: '#a0aec0' }}>Payment Method</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Transactions</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Total Amount</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.by_payment_method.map(method => (
                <tr key={method.payment_method} style={{ borderBottom: '1px solid #4a5568' }}>
                  <td style={{ padding: '12px 0', color: '#e2e8f0' }}>{method.payment_method}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: '#e2e8f0' }}>{method.count}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 'bold', color: '#4CAF50' }}>
                    {parseFloat(method.total).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: '#FF9800' }}>
                    {parseFloat(method.percentage || 0).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Time Analysis and Top Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Peak Times */}
        {reportData.time_analysis && (
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Peak Hours & Days</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Peak Hour:</p>
                <p style={{ color: '#4CAF50', margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                  {reportData.time_analysis.peak_hour}:00 - {parseInt(reportData.time_analysis.peak_hour) + 1}:00
                </p>
              </div>
              <div>
                <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Peak Day:</p>
                <p style={{ color: '#2196F3', margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                  {reportData.time_analysis.peak_day}
                </p>
              </div>
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#a0aec0', margin: '0 0 8px 0', fontSize: '14px' }}>Top Performing Hours:</p>
                {reportData.time_analysis.hourly_stats
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 3)
                  .map((hour, index) => (
                    <p key={hour.hour} style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '12px' }}>
                      {index + 1}. {hour.hour}:00 - {hour.total.toFixed(2)} ({hour.count} orders)
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Customers */}
        {reportData.top_customers && reportData.top_customers.length > 0 && (
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Top Customers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.top_customers.slice(0, 5).map((customer, index) => (
                <div key={customer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < 4 ? '1px solid #4a5568' : 'none' }}>
                  <div>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', fontWeight: 'bold' }}>
                      {index + 1}. {customer.name}
                    </p>
                    <p style={{ margin: 0, color: '#a0aec0', fontSize: '12px' }}>
                      {customer.orders} orders
                    </p>
                  </div>
                  <p style={{ margin: 0, color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
                    {parseFloat(customer.total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily Performance */}
      {reportData.time_analysis && reportData.time_analysis.daily_stats && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Daily Performance Analysis</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #4a5568' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', color: '#a0aec0' }}>Day</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Total Sales</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#a0aec0' }}>Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {reportData.time_analysis.daily_stats
                .sort((a, b) => b.total - a.total)
                .map(day => (
                  <tr key={day.day} style={{ borderBottom: '1px solid #4a5568' }}>
                    <td style={{ padding: '12px 0', color: '#e2e8f0' }}>{day.day}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0', color: '#e2e8f0' }}>{day.count}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 'bold', color: '#4CAF50' }}>
                      {parseFloat(day.total).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 0', color: '#2196F3' }}>
                      {parseFloat(day.avg).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Status Analysis */}
      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Order Status Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#a0aec0', margin: '0 0 5px 0', fontSize: '14px' }}>Completed</p>
            <p style={{ color: '#4CAF50', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              {(reportData.summary && reportData.summary.completed_orders) || 0}
            </p>
            <p style={{ color: '#4CAF50', margin: 0, fontSize: '12px' }}>
              ({reportData.summary && reportData.summary.completion_rate ? parseFloat(reportData.summary.completion_rate).toFixed(1) : '0.0'}%)
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#a0aec0', margin: '0 0 5px 0', fontSize: '14px' }}>Cancelled</p>
            <p style={{ color: '#f44336', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              {(reportData.summary && reportData.summary.cancelled_orders) || 0}
            </p>
            <p style={{ color: '#f44336', margin: 0, fontSize: '12px' }}>
              ({reportData.summary && reportData.summary.cancellation_rate ? parseFloat(reportData.summary.cancellation_rate).toFixed(1) : '0.0'}%)
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#a0aec0', margin: '0 0 5px 0', fontSize: '14px' }}>On Hold</p>
            <p style={{ color: '#FF9800', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              {(reportData.summary && reportData.summary.hold_orders) || 0}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#a0aec0', margin: '0 0 5px 0', fontSize: '14px' }}>Total Orders</p>
            <p style={{ color: '#2196F3', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              {(reportData.summary && reportData.summary.total_orders) || 0}
            </p>
          </div>
        </div>

        {/* Fallback message if no data */}
        {!reportData.summary && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#a0aec0' }}>
            <p>Order status data will appear when sales report is loaded.</p>
          </div>
        )}
      </div>
    </div>
  );


  const renderProfitReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Sales</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.total_sales ? parseFloat(reportData.total_sales).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Expenses</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
            {reportData.total_expenses ? parseFloat(reportData.total_expenses).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Net Profit</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: reportData.net_profit >= 0 ? '#4CAF50' : '#f44336' }}>
            {reportData.net_profit ? parseFloat(reportData.net_profit).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Profit Margin</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: reportData.profit_margin >= 0 ? '#4CAF50' : '#f44336' }}>
            {reportData.profit_margin ? parseFloat(reportData.profit_margin).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Profit Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Revenue Breakdown:</p>
            <p style={{ color: '#e2e8f0', margin: '4px 0' }}>• Total Sales: {reportData.total_sales ? parseFloat(reportData.total_sales).toFixed(2) : '0.00'}</p>
            <p style={{ color: '#e2e8f0', margin: '4px 0' }}>• Operating Expenses: {reportData.total_expenses ? parseFloat(reportData.total_expenses).toFixed(2) : '0.00'}</p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Performance Indicators:</p>
            <p style={{ color: reportData.net_profit >= 0 ? '#4CAF50' : '#f44336', margin: '4px 0' }}>
              • {reportData.net_profit >= 0 ? 'Profitable' : 'Operating at Loss'}
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0' }}>
              • Expense Ratio: {reportData.total_sales > 0 ? ((reportData.total_expenses / reportData.total_sales) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMenuReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Items</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.total_items || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Active Items</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.active_items || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Inactive Items</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.inactive_items || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Average Price</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.avg_price ? parseFloat(reportData.avg_price).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Price Range</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Most Expensive:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_expensive?.name || 'N/A'} - {reportData.most_expensive?.price ? parseFloat(reportData.most_expensive.price).toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Least Expensive:</p>
              <p style={{ color: '#2196F3', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.least_expensive?.name || 'N/A'} - {reportData.least_expensive?.price && reportData.least_expensive.price < MAX_PRICE_THRESHOLD ? parseFloat(reportData.least_expensive.price).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Menu Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Available:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.active_items || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Unavailable:</span>
              <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{reportData.inactive_items || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Deleted:</span>
              <span style={{ fontWeight: 'bold', color: '#f44336' }}>{reportData.deleted_items || 0}</span>
            </div>
            <div style={{ borderTop: '1px solid #4a5568', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                <span>Availability Rate:</span>
                <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {reportData.total_items > 0 ? ((reportData.active_items / reportData.total_items) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportData.category_breakdown && reportData.category_breakdown.length > 0 && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Category Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {reportData.category_breakdown.map((category, index) => (
              <div key={index} style={{ backgroundColor: '#2d3748', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '16px' }}>{category.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Items:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '14px' }}>{category.count}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Avg Price:</span>
                  <span style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '14px' }}>
                    {category.avgPrice ? parseFloat(category.avgPrice).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );


  const renderOrdersReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Orders</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.total_orders || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Completed</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.completed_orders || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Hold</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.hold_orders || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Cancelled</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
            {reportData.cancelled_orders || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Pending</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.pending_orders || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Order Value</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.avg_order_value ? parseFloat(reportData.avg_order_value).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Order Types</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Dine In:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.dine_in_orders || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Takeaway:</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{reportData.takeaway_orders || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Delivery:</span>
              <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{reportData.delivery_orders || 0}</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Payment Methods</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Cash:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.cash_orders || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Card:</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{reportData.card_orders || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Bank Transfer:</span>
              <span style={{ fontWeight: 'bold', color: '#9C27B0' }}>{reportData.bank_transfer_orders || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Uber Eats:</span>
              <span style={{ fontWeight: 'bold', color: '#FF5722' }}>{reportData.uber_eats_orders || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>PickMe Food:</span>
              <span style={{ fontWeight: 'bold', color: '#607D8B' }}>{reportData.pickme_orders || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Performance Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Order Completion:</p>
            <p style={{ color: '#4CAF50', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.completion_rate ? parseFloat(reportData.completion_rate).toFixed(1) : '0.0'}% completion rate
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.completed_orders || 0} out of {reportData.total_orders || 0} orders completed
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Revenue Analysis:</p>
            <p style={{ color: '#4CAF50', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.total_sales ? parseFloat(reportData.total_sales).toFixed(2) : '0.00'} total sales
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              Average {reportData.avg_order_value ? parseFloat(reportData.avg_order_value).toFixed(2) : '0.00'} per order
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Order Status:</p>
            <p style={{ color: reportData.hold_orders > 0 ? '#FF9800' : '#4CAF50', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.hold_orders || 0} orders on hold
            </p>
            <p style={{ color: reportData.cancelled_orders > 0 ? '#f44336' : '#a0aec0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.cancelled_orders || 0} cancelled orders
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpensesReport = () => {
    if (!reportData) {
      return (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', textAlign: 'center' }}>
          <p style={{ color: '#a0aec0' }}>Loading expense data...</p>
        </div>
      );
    }

    if (reportData.error) {
      return (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #f44336', textAlign: 'center' }}>
          <p style={{ color: '#f44336' }}>Error loading expense data: {reportData.error}</p>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Expenses</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              Rs. {reportData.total_expenses ? parseFloat(reportData.total_expenses).toFixed(2) : '0.00'}
            </p>
          </div>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Expense Items</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              {reportData.total_items || 0}
            </p>
          </div>
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Average Expense</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              Rs. {reportData.average_expense ? parseFloat(reportData.average_expense).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {reportData.total_items === 0 ? (
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>No Expenses Found</h3>
            <p style={{ color: '#a0aec0' }}>
              {startDate && endDate
                ? `No expenses recorded for the selected date range (${startDate} to ${endDate}).`
                : 'No expenses have been recorded yet.'
              }
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Expense Summary</h3>
            <p style={{ color: '#a0aec0' }}>
              Showing {reportData.total_items} expense item{reportData.total_items !== 1 ? 's' : ''}
              {startDate && endDate ? ` from ${startDate} to ${endDate}` : ''}.
            </p>
            {reportData.expenses && reportData.expenses.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Recent Expenses:</h4>
                {reportData.expenses.slice(0, 5).map((expense, index) => (
                  <div key={index} style={{
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#2d3748',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 'bold' }}>
                        {expense.description || expense.category || 'Expense'}
                      </p>
                      <p style={{ margin: 0, color: '#a0aec0', fontSize: '12px' }}>
                        {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <p style={{ margin: 0, color: '#f44336', fontWeight: 'bold' }}>
                      Rs. {parseFloat(expense.amount || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCustomersReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Customers</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#00BCD4' }}>
            {reportData.total_customers || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Repeat Customers</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.repeat_customers || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Loyal Customers</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
            {reportData.loyal_customers || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Customer Value</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.avg_customer_value ? parseFloat(reportData.avg_customer_value).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Retention Rate</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.customer_retention_rate ? parseFloat(reportData.customer_retention_rate).toFixed(1) : '0.0'}%
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Orders per Customer</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#607D8B' }}>
            {reportData.avg_orders_per_customer ? parseFloat(reportData.avg_orders_per_customer).toFixed(1) : '0.0'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Customer Segments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>High Value:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.high_value_customers || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Loyal (5+ orders):</span>
              <span style={{ fontWeight: 'bold', color: '#9C27B0' }}>{reportData.loyal_customers || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Repeat (2+ orders):</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{reportData.repeat_customers || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>One-time:</span>
              <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{reportData.one_time_customers || 0}</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Order Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Dine In:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.dine_in_customers || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Takeaway:</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{reportData.takeaway_customers || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Delivery:</span>
              <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{reportData.delivery_customers || 0}</span>
            </div>
            <div style={{ borderTop: '1px solid #4a5568', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                <span>Cash Preferred:</span>
                <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.cash_customers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', marginTop: '4px' }}>
                <span>Card Preferred:</span>
                <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{reportData.card_customers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportData.top_customer && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Top Customer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Name:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.top_customer.name}
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Total Spent:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {parseFloat(reportData.top_customer.totalSpent || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Orders:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.top_customer.orderCount} orders
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Customer Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Revenue Analysis:</p>
            <p style={{ color: '#4CAF50', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.total_revenue ? parseFloat(reportData.total_revenue).toFixed(2) : '0.00'} total revenue
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              Average {reportData.avg_customer_value ? parseFloat(reportData.avg_customer_value).toFixed(2) : '0.00'} per customer
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Loyalty Metrics:</p>
            <p style={{ color: '#9C27B0', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.customer_retention_rate ? parseFloat(reportData.customer_retention_rate).toFixed(1) : '0.0'}% retention rate
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.loyal_customers || 0} loyal customers (5+ orders)
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Order Behavior:</p>
            <p style={{ color: '#2196F3', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.avg_orders_per_customer ? parseFloat(reportData.avg_orders_per_customer).toFixed(1) : '0.0'} orders per customer
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.one_time_customers || 0} first-time customers
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentsReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Transactions</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#795548' }}>
            {reportData.total_transactions || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.total_revenue ? parseFloat(reportData.total_revenue).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Transaction</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.avg_transaction_value ? parseFloat(reportData.avg_transaction_value).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Digital Ratio</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.digital_ratio ? parseFloat(reportData.digital_ratio).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Payment Method Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Cash</span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>{reportData.cash_count || 0} transactions</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  {reportData.cash_payments ? parseFloat(reportData.cash_payments).toFixed(2) : '0.00'}
                </span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                  {reportData.cash_percentage ? parseFloat(reportData.cash_percentage).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Card</span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>{reportData.card_count || 0} transactions</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
                  {reportData.card_payments ? parseFloat(reportData.card_payments).toFixed(2) : '0.00'}
                </span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                  {reportData.card_percentage ? parseFloat(reportData.card_percentage).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Bank Transfer</span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>{reportData.bank_transfer_count || 0} transactions</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                  {reportData.bank_transfer_payments ? parseFloat(reportData.bank_transfer_payments).toFixed(2) : '0.00'}
                </span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                  {reportData.bank_transfer_percentage ? parseFloat(reportData.bank_transfer_percentage).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Online Platforms</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Uber Eats</span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>{reportData.uber_eats_count || 0} orders</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#FF5722', fontWeight: 'bold' }}>
                  {reportData.uber_eats_payments ? parseFloat(reportData.uber_eats_payments).toFixed(2) : '0.00'}
                </span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                  {reportData.uber_eats_percentage ? parseFloat(reportData.uber_eats_percentage).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>PickMe Food</span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>{reportData.pickme_food_count || 0} orders</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#607D8B', fontWeight: 'bold' }}>
                  {reportData.pickme_food_payments ? parseFloat(reportData.pickme_food_payments).toFixed(2) : '0.00'}
                </span>
                <br />
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>
                  {reportData.pickme_food_percentage ? parseFloat(reportData.pickme_food_percentage).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            {reportData.other_count > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div>
                  <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Other</span>
                  <br />
                  <span style={{ color: '#a0aec0', fontSize: '12px' }}>{reportData.other_count} transactions</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#FFC107', fontWeight: 'bold' }}>
                    {reportData.other_payments ? parseFloat(reportData.other_payments).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Payment Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Most Popular Method:</p>
            <p style={{ color: '#4CAF50', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.most_used_method || 'N/A'}
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              Primary payment preference among customers
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Digital vs Cash:</p>
            <p style={{ color: '#2196F3', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.digital_ratio ? parseFloat(reportData.digital_ratio).toFixed(1) : '0.0'}% digital
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.digital_payments ? parseFloat(reportData.digital_payments).toFixed(2) : '0.00'} in digital payments
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Average Transaction:</p>
            <p style={{ color: '#FF9800', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.avg_transaction_value ? parseFloat(reportData.avg_transaction_value).toFixed(2) : '0.00'}
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              Average payment amount per transaction
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTablesReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Tables</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#607D8B' }}>
            {reportData.total_tables || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Active Tables</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.active_tables || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Utilization Rate</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.utilization_rate ? parseFloat(reportData.utilization_rate).toFixed(1) : '0.0'}%
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Revenue/Table</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.avg_revenue_per_table ? parseFloat(reportData.avg_revenue_per_table).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Tables in Use</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
            {reportData.tables_with_orders || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Orders/Table</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FFC107' }}>
            {reportData.avg_orders_per_table ? parseFloat(reportData.avg_orders_per_table).toFixed(1) : '0.0'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Top Performing Tables</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Most Popular:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_popular_table} ({reportData.most_popular_orders} orders)
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Highest Revenue:</p>
              <p style={{ color: '#2196F3', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.highest_revenue_table} ({reportData.highest_revenue_amount ? parseFloat(reportData.highest_revenue_amount).toFixed(2) : '0.00'})
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Most Efficient:</p>
              <p style={{ color: '#9C27B0', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_efficient_table} ({reportData.efficiency_score ? parseFloat(reportData.efficiency_score).toFixed(2) : '0.00'}/seat)
              </p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Table Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Active Tables:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.active_tables || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Inactive Tables:</span>
              <span style={{ fontWeight: 'bold', color: '#f44336' }}>{reportData.inactive_tables || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Tables with Orders:</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{reportData.tables_with_orders || 0}</span>
            </div>
            <div style={{ borderTop: '1px solid #4a5568', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                <span>Utilization:</span>
                <span style={{ fontWeight: 'bold', color: '#FF9800' }}>
                  {reportData.utilization_rate ? parseFloat(reportData.utilization_rate).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportData.table_details && reportData.table_details.length > 0 && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Individual Table Performance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {reportData.table_details.slice(0, 8).map((table, index) => (
              <div key={index} style={{
                backgroundColor: table.orders > 0 ? '#2d3748' : '#1a202c',
                padding: '15px',
                borderRadius: '6px',
                border: `1px solid ${table.orders > 0 ? '#4a5568' : '#2d3748'}`
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '16px' }}>
                  Table {table.name}
                  {!table.isActive && <span style={{ color: '#f44336', fontSize: '12px' }}> (Inactive)</span>}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Orders:</span>
                  <span style={{ color: table.orders > 0 ? '#4CAF50' : '#a0aec0', fontWeight: 'bold', fontSize: '14px' }}>
                    {table.orders}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Revenue:</span>
                  <span style={{ color: table.revenue > 0 ? '#2196F3' : '#a0aec0', fontWeight: 'bold', fontSize: '14px' }}>
                    {parseFloat(table.revenue || 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Avg Order:</span>
                  <span style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '14px' }}>
                    {parseFloat(table.avgOrderValue || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Dining Area Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Dine-in Performance:</p>
            <p style={{ color: '#4CAF50', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.total_dine_in_orders || 0} dine-in orders
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.total_dine_in_revenue ? parseFloat(reportData.total_dine_in_revenue).toFixed(2) : '0.00'} total revenue
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Table Efficiency:</p>
            <p style={{ color: '#FF9800', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.utilization_rate ? parseFloat(reportData.utilization_rate).toFixed(1) : '0.0'}% utilized
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.tables_with_orders || 0} of {reportData.active_tables || 0} tables generating revenue
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Revenue Distribution:</p>
            <p style={{ color: '#2196F3', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.avg_revenue_per_table ? parseFloat(reportData.avg_revenue_per_table).toFixed(2) : '0.00'} per table
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.avg_orders_per_table ? parseFloat(reportData.avg_orders_per_table).toFixed(1) : '0.0'} orders per table average
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Categories</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF5722' }}>
            {reportData.total_categories || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Menu Items</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.total_menu_items || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Active Items</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.total_active_items || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Items/Category</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.avg_items_per_category ? parseFloat(reportData.avg_items_per_category).toFixed(1) : '0.0'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Price Overall</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
            {reportData.avg_price_overall ? parseFloat(reportData.avg_price_overall).toFixed(2) : '0.00'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Revenue/Category</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#00BCD4' }}>
            ${reportData.avg_revenue_per_category ? parseFloat(reportData.avg_revenue_per_category).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Top Performing Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Best Revenue:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.best_category} (${reportData.best_category_revenue ? parseFloat(reportData.best_category_revenue).toFixed(2) : '0.00'})
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Most Items:</p>
              <p style={{ color: '#2196F3', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_items_category?.name || 'N/A'} ({reportData.most_items_category?.totalItems || 0} items)
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Highest Avg Price:</p>
              <p style={{ color: '#9C27B0', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.highest_avg_price_category?.name || 'N/A'} (${reportData.highest_avg_price_category?.avgPrice ? parseFloat(reportData.highest_avg_price_category.avgPrice).toFixed(2) : '0.00'})
              </p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Menu Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Total Categories:</span>
              <span style={{ fontWeight: 'bold', color: '#FF5722' }}>{reportData.total_categories || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Active Items:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.total_active_items || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Inactive Items:</span>
              <span style={{ fontWeight: 'bold', color: '#f44336' }}>{reportData.total_inactive_items || 0}</span>
            </div>
            <div style={{ borderTop: '1px solid #4a5568', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                <span>Availability Rate:</span>
                <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {reportData.total_menu_items > 0 ? ((reportData.total_active_items / reportData.total_menu_items) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportData.category_details && reportData.category_details.length > 0 && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Category Performance Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {reportData.category_details.map((category, index) => (
              <div key={index} style={{
                backgroundColor: '#2d3748',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '16px' }}>{category.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Items:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '14px' }}>
                    {category.totalItems} ({category.activeItems} active)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Avg Price:</span>
                  <span style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '14px' }}>
                    ${parseFloat(category.avgPrice || 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Est. Revenue:</span>
                  <span style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '14px' }}>
                    ${parseFloat(category.revenue || 0).toFixed(2)}
                  </span>
                </div>
                {category.description && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #4a5568' }}>
                    <p style={{ color: '#a0aec0', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
                      {category.description.length > 60 ? category.description.substring(0, 60) + '...' : category.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Category Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Menu Distribution:</p>
            <p style={{ color: '#FF5722', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.total_categories || 0} categories
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.avg_items_per_category ? parseFloat(reportData.avg_items_per_category).toFixed(1) : '0.0'} items per category average
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Price Analysis:</p>
            <p style={{ color: '#9C27B0', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              ${reportData.avg_price_overall ? parseFloat(reportData.avg_price_overall).toFixed(2) : '0.00'} average price
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              Across {reportData.total_active_items || 0} active menu items
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Revenue Performance:</p>
            <p style={{ color: '#00BCD4', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.best_category} leading
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              ${reportData.avg_revenue_per_category ? parseFloat(reportData.avg_revenue_per_category).toFixed(2) : '0.00'} average per category
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaffReport = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Staff</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#8BC34A' }}>
            {reportData.total_users || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Active Staff</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {reportData.active_users || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Activity Rate</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {reportData.activity_rate ? parseFloat(reportData.activity_rate).toFixed(1) : '0.0'}%
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Avg Orders/Staff</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
            {reportData.avg_orders_per_staff ? parseFloat(reportData.avg_orders_per_staff).toFixed(1) : '0.0'}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Super Admins</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
            {reportData.super_admin_count || 0}
          </p>
        </div>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '14px' }}>Total Orders Handled</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
            {reportData.total_orders_processed || 0}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Role Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Super Admins:</span>
              <span style={{ fontWeight: 'bold', color: '#f44336' }}>
                {reportData.super_admin_count || 0} ({reportData.super_admin_percentage ? parseFloat(reportData.super_admin_percentage).toFixed(1) : '0.0'}%)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Admins:</span>
              <span style={{ fontWeight: 'bold', color: '#FF5722' }}>
                {reportData.admin_count || 0} ({reportData.admin_percentage ? parseFloat(reportData.admin_percentage).toFixed(1) : '0.0'}%)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Cashiers:</span>
              <span style={{ fontWeight: 'bold', color: '#2196F3' }}>
                {reportData.cashier_count || 0} ({reportData.cashier_percentage ? parseFloat(reportData.cashier_percentage).toFixed(1) : '0.0'}%)
              </span>
            </div>
            {reportData.other_count > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                <span>Other Roles:</span>
                <span style={{ fontWeight: 'bold', color: '#607D8B' }}>{reportData.other_count}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Staff Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Active (30 days):</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{reportData.active_users || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
              <span>Inactive:</span>
              <span style={{ fontWeight: 'bold', color: '#f44336' }}>{reportData.inactive_users || 0}</span>
            </div>
            <div style={{ borderTop: '1px solid #4a5568', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                <span>Activity Rate:</span>
                <span style={{ fontWeight: 'bold', color: '#FF9800' }}>
                  {reportData.activity_rate ? parseFloat(reportData.activity_rate).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportData.most_productive_staff && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Top Performer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Staff Member:</p>
              <p style={{ color: '#4CAF50', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_productive_staff.name || reportData.most_productive_staff.username || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Orders Processed:</p>
              <p style={{ color: '#2196F3', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_productive_orders} orders
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Revenue Generated:</p>
              <p style={{ color: '#FF9800', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                ${reportData.most_productive_revenue ? parseFloat(reportData.most_productive_revenue).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      )}

      {reportData.most_recent_user && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Recent Activity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Most Recent User:</p>
              <p style={{ color: '#00BCD4', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_recent_user.name || reportData.most_recent_user.username || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Role:</p>
              <p style={{ color: '#9C27B0', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_recent_user.role || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#a0aec0', margin: '0 0 4px 0', fontSize: '14px' }}>Last Active:</p>
              <p style={{ color: '#FFC107', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {reportData.most_recent_user.last_login ?
                  new Date(reportData.most_recent_user.last_login).toLocaleDateString() :
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {reportData.role_details && reportData.role_details.length > 0 && (
        <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Role Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {reportData.role_details.map((roleInfo, index) => (
              <div key={index} style={{
                backgroundColor: '#2d3748',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '16px' }}>{roleInfo.role}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Count:</span>
                  <span style={{
                    color: roleInfo.role === 'Super Admin' ? '#f44336' :
                           roleInfo.role === 'Admin' ? '#FF5722' :
                           roleInfo.role === 'Cashier' ? '#2196F3' : '#607D8B',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {roleInfo.count}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a0aec0', fontSize: '14px' }}>Percentage:</span>
                  <span style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '14px' }}>
                    {parseFloat(roleInfo.percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1a202c', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e2e8f0' }}>Staff Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Team Composition:</p>
            <p style={{ color: '#8BC34A', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.total_users || 0} total staff members
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.active_users || 0} active in last 30 days
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Productivity:</p>
            <p style={{ color: '#2196F3', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.avg_orders_per_staff ? parseFloat(reportData.avg_orders_per_staff).toFixed(1) : '0.0'} orders per staff
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              {reportData.total_orders_processed || 0} total orders processed
            </p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', marginBottom: '8px' }}>Team Health:</p>
            <p style={{ color: '#FF9800', margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {reportData.activity_rate ? parseFloat(reportData.activity_rate).toFixed(1) : '0.0'}% activity rate
            </p>
            <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: '14px' }}>
              Based on recent login activity
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>Advanced Reports</h1>

        {/* Date Range Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {datePresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePeriodChange(preset.id)}
                style={{
                  padding: '8px 16px',
                  border: selectedPeriod === preset.id ? '2px solid #2196F3' : '1px solid #4a5568',
                  borderRadius: '6px',
                  backgroundColor: selectedPeriod === preset.id ? '#2c5282' : '#1a202c',
                  color: selectedPeriod === preset.id ? '#e2e8f0' : '#a0aec0',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {preset.name}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedPeriod('all');
                setStartDate('');
                setEndDate('');
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #e53e3e',
                borderRadius: '6px',
                backgroundColor: '#e53e3e',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c53030'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e53e3e'}
              title="Reset date filters"
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
              Reset
            </button>
          </div>

          {selectedPeriod === 'custom' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0' }}
              />
              <span style={{ color: '#a0aec0' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0' }}
              />
            </div>
          )}
        </div>

        {/* Report Type Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          {reportTypes.map(report => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              style={{
                padding: '15px',
                border: activeReport === report.id ? `2px solid ${report.color}` : '1px solid #4a5568',
                borderRadius: '8px',
                backgroundColor: activeReport === report.id ? `${report.color}30` : '#1a202c',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-icons" style={{ color: report.color, fontSize: '24px' }}>
                {report.icon}
              </span>
              <span style={{
                color: activeReport === report.id ? report.color : '#e2e8f0',
                fontWeight: activeReport === report.id ? 'bold' : 'normal'
              }}>
                {report.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #4a5568'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-icons" style={{
              color: reportTypes.find(r => r.id === activeReport)?.color || '#a0aec0',
              fontSize: '28px'
            }}>
              {reportTypes.find(r => r.id === activeReport)?.icon}
            </span>
            <h2 style={{ margin: 0, color: '#e2e8f0' }}>
              {reportTypes.find(r => r.id === activeReport)?.name}
            </h2>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={!reportData || loading}
            style={{
              padding: '10px 20px',
              backgroundColor: reportData && !loading ? '#4CAF50' : '#4a5568',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: reportData && !loading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: reportData && !loading ? 1 : 0.6
            }}
            onMouseOver={(e) => {
              if (reportData && !loading) {
                e.currentTarget.style.backgroundColor = '#45a049';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (reportData && !loading) {
                e.currentTarget.style.backgroundColor = '#4CAF50';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>picture_as_pdf</span>
            Export PDF
          </button>
        </div>

        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;