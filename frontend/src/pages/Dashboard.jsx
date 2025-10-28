import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import api from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0.0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's sales report and today's orders in parallel
      const [salesResponse, ordersResponse] = await Promise.all([
        api.getSalesReport(today, today),
        api.getOrders('', today, today)
      ]);

      if (salesResponse.success) {
        const summary = salesResponse.data.summary;
        setStats(prev => ({
          ...prev,
          todaySales: Number(summary.total_sales) || 0,
          totalOrders: Number(summary.total_orders) || 0
        }));
      } else {
        toast.error('Failed to fetch sales data');
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
      } else {
        toast.error('Failed to fetch orders data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="action-btn"
          disabled={loading}
          style={{ minWidth: '120px' }}
        >
          <span className="material-icons icon-sm">refresh</span>
          Refresh
        </button>
      </div>

      {loading ? (
        <Spinner overlay={false} size="large" />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Dashboard;