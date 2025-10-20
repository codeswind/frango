import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, hasAccess } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', role: 'Cashier', icon: 'dashboard' },
    { name: 'Orders', path: '/orders', role: 'Cashier', icon: 'receipt_long' },
    { name: 'Menu Management', path: '/menu', role: 'Admin', icon: 'restaurant_menu' },
    { name: 'Tables', path: '/tables', role: 'Admin', icon: 'table_restaurant' },
    { name: 'Expenses', path: '/expenses', role: 'Admin', icon: 'account_balance_wallet' },
    { name: 'Order History', path: '/order-history', role: 'Admin', icon: 'history' },
    { name: 'Reports', path: '/reports', role: 'Admin', icon: 'analytics' },
    { name: 'Customer Management', path: '/customers', role: 'Admin', icon: 'people' },
    { name: 'User Management', path: '/users', role: 'Super Admin', icon: 'manage_accounts' },
    { name: 'Settings', path: '/settings', role: 'Admin', icon: 'settings' },
  ];

  const handleNavigation = (path) => {
    window.location.hash = path;
    setShowMobileMenu(false);
  };

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="header">
        <div className="header-left">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="material-icons">{sidebarCollapsed ? 'menu_open' : 'menu'}</span>
          </button>
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span className="material-icons">menu</span>
          </button>
          <h1>Restaurant POS</h1>
        </div>
        <div className="header-center">
          <div className="clock-display">
            <span className="material-icons icon-sm">schedule</span>
            <span className="time-text">{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.username} ({user?.role})</span>
          <button onClick={logout} className="logout-btn">
            <span className="material-icons icon-sm">logout</span>
            Logout
          </button>
        </div>
      </header>

      <nav className={`sidebar ${showMobileMenu ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <ul>
          {navigationItems.map(item => (
            hasAccess(item.role) && (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className="nav-button"
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <span className="material-icons icon-sm">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </button>
              </li>
            )
          ))}
        </ul>
      </nav>

      {showMobileMenu && <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)}></div>}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;