import React, { useState, useEffect } from 'react';
import api from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0.0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const salesResponse = await api.getSalesReport(today, today);
      const ordersResponse = await api.getOrders();

      if (salesResponse.success) {
        const summary = salesResponse.data.summary;
        setStats(prev => ({
          ...prev,
          todaySales: Number(summary.total_sales) || 0,
          totalOrders: Number(summary.total_orders) || 0
        }));
      }

      if (ordersResponse.success) {
        const orders = ordersResponse.data;
        const pending = orders.filter(order => order.status === 'Hold').length;
        const completed = orders.filter(order => order.status === 'Completed').length;

        setStats(prev => ({
          ...prev,
          pendingOrders: Number(pending) || 0,
          completedOrders: Number(completed) || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="material-icons icon-lg" style={{color: 'var(--color-success-500)', marginBottom: 'var(--spacing-md)'}}>attach_money</span>
          <h3>Today's Sales</h3>
          <p className="stat-value">{(Number(stats.todaySales) || 0).toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <span className="material-icons icon-lg" style={{color: 'var(--color-primary-500)', marginBottom: 'var(--spacing-md)'}}>receipt_long</span>
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>

        <div className="stat-card">
          <span className="material-icons icon-lg" style={{color: 'var(--color-warning-500)', marginBottom: 'var(--spacing-md)'}}>pending</span>
          <h3>Pending Orders</h3>
          <p className="stat-value">{stats.pendingOrders}</p>
        </div>

        <div className="stat-card">
          <span className="material-icons icon-lg" style={{color: 'var(--color-success-600)', marginBottom: 'var(--spacing-md)'}}>check_circle</span>
          <h3>Completed Orders</h3>
          <p className="stat-value">{stats.completedOrders}</p>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => window.location.hash = '/orders'} className="action-btn">
            <span className="material-icons icon-sm">add_shopping_cart</span>
            New Order
          </button>
          <button onClick={() => window.location.hash = '/menu'} className="action-btn">
            <span className="material-icons icon-sm">restaurant_menu</span>
            Manage Menu
          </button>
          <button onClick={() => window.location.hash = '/reports'} className="action-btn">
            <span className="material-icons icon-sm">analytics</span>
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;