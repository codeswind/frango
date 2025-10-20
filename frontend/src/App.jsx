import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import Tables from './pages/Tables';
import Expenses from './pages/Expenses';
import OrderHistory from './pages/OrderHistory';
import Reports from './pages/Reports';
import CustomerManagement from './pages/CustomerManagement';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import './styles/theme.css';
import './App.css';

const AppContent = () => {
  const { user, loading, hasAccess } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setCurrentPage(hash.replace('/', ''));
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return hasAccess('Cashier') ? <Orders /> : <div>Access Denied</div>;
      case 'menu':
        return hasAccess('Admin') ? <MenuManagement /> : <div>Access Denied</div>;
      case 'tables':
        return hasAccess('Admin') ? <Tables /> : <div>Access Denied</div>;
      case 'expenses':
        return hasAccess('Admin') ? <Expenses /> : <div>Access Denied</div>;
      case 'order-history':
        return hasAccess('Admin') ? <OrderHistory /> : <div>Access Denied</div>;
      case 'reports':
        return hasAccess('Admin') ? <Reports /> : <div>Access Denied</div>;
      case 'customers':
        return hasAccess('Admin') ? <CustomerManagement /> : <div>Access Denied</div>;
      case 'users':
        return hasAccess('Super Admin') ? <UserManagement /> : <div>Access Denied</div>;
      case 'settings':
        return hasAccess('Admin') ? <Settings /> : <div>Access Denied</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <OrderProvider>
      <Layout>
        {renderPage()}
      </Layout>
    </OrderProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
