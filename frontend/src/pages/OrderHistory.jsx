import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import api from '../api';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [totalFilter, setTotalFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [activeTab, setActiveTab] = useState('All Orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filterOrders = useCallback(() => {
    let filtered = orders;

    // Filter by tab (order type)
    if (activeTab !== 'All Orders') {
      filtered = filtered.filter(order => order.order_type === activeTab);
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by date range
    if (fromDate || toDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        let matchesFromDate = true;
        let matchesToDate = true;

        if (fromDate) {
          matchesFromDate = orderDate >= fromDate;
        }

        if (toDate) {
          matchesToDate = orderDate <= toDate;
        }

        return matchesFromDate && matchesToDate;
      });
    }

    // Filter by order ID
    if (orderIdFilter) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(orderIdFilter)
      );
    }

    // Filter by total amount
    if (totalFilter) {
      filtered = filtered.filter(order =>
        order.total_amount.toString().includes(totalFilter)
      );
    }

    // Filter by payment method
    if (paymentMethodFilter) {
      filtered = filtered.filter(order =>
        (order.payment_method || 'Cash').toLowerCase().includes(paymentMethodFilter.toLowerCase())
      );
    }

    // Filter by customer (name or mobile)
    if (customerFilter) {
      filtered = filtered.filter(order => {
        const customerName = order.customer_name || '';
        const customerMobile = order.customer_mobile || '';
        const searchTerm = customerFilter.toLowerCase();
        return customerName.toLowerCase().includes(searchTerm) ||
               customerMobile.includes(searchTerm);
      });
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, fromDate, toDate, orderIdFilter, totalFilter, paymentMethodFilter, customerFilter, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, fromDate, toDate, orderIdFilter, totalFilter, paymentMethodFilter, customerFilter, activeTab, filterOrders]);

  const fetchOrders = async () => {
    try {
      const response = await api.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const getStatusBadge = (status) => {
    const className = `status-badge ${status.toLowerCase()}`;
    return <span className={className}>{status}</span>;
  };

  const getPaginatedOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredOrders.length / itemsPerPage);
  };



  const handleViewOrder = async (orderId) => {
    try {
      const response = await api.getOrderDetails(orderId);
      if (response.success) {
        // Combine order data with items array
        const orderWithItems = {
          ...response.data.order,
          items: response.data.items
        };
        setSelectedOrder(orderWithItems);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Error loading order details');
    }
  };

  const handlePrintInvoice = async (orderId) => {
    try {
      const invoiceResponse = await api.printInvoice(orderId);
      if (invoiceResponse.success) {
        // Create a hidden iframe for silent printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(invoiceResponse.data.invoice_html);
        iframeDoc.close();

        // Wait for content to load, then print
        iframe.onload = function() {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            // Remove iframe after printing
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          } catch (e) {
            console.error('Print error:', e);
            document.body.removeChild(iframe);
          }
        };
      } else {
        alert('Failed to generate invoice: ' + invoiceResponse.message);
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error generating invoice');
    }
  };

  const tabs = ['All Orders', 'Dine In', 'Take Away', 'Delivery', 'Uber Eats', 'Pickme Food'];

  return (
    <div className="order-history-page">
      <h1>Order History</h1>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="filters" style={{display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px'}}>
        <div style={{display: 'flex', gap: '15px', alignItems: 'end'}}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={{marginBottom: '5px', fontWeight: 'bold', color: '#e2e8f0'}}>Order ID</label>
            <input
              type="text"
              placeholder="Search by Order ID"
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              style={{width: '100%', padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
            />
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={{marginBottom: '5px', fontWeight: 'bold', color: '#e2e8f0'}}>Customer</label>
            <input
              type="text"
              placeholder="Search by Customer Name or Mobile"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{width: '100%', padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
            />
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={{marginBottom: '5px', fontWeight: 'bold', color: '#e2e8f0'}}>Total Amount</label>
            <input
              type="text"
              placeholder="Search by Total"
              value={totalFilter}
              onChange={(e) => setTotalFilter(e.target.value)}
              style={{width: '100%', padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
            />
          </div>
        </div>
        <div style={{display: 'flex', gap: '15px', alignItems: 'end'}}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={{marginBottom: '5px', fontWeight: 'bold', color: '#e2e8f0'}}>Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              style={{width: '100%', padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
            >
              <option value="" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>All Payment Methods</option>
              <option value="Cash" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Cash</option>
              <option value="Card" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Card</option>
              <option value="Bank Transfer" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Bank Transfer</option>
              <option value="Uber Eats" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Uber Eats</option>
              <option value="PickMe Food" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>PickMe Food</option>
            </select>
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={{marginBottom: '5px', fontWeight: 'bold', color: '#e2e8f0'}}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{width: '100%', padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
            >
              <option value="" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>All Statuses</option>
              <option value="Hold" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Hold</option>
              <option value="Completed" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Completed</option>
              <option value="Cancelled" style={{backgroundColor: '#1a202c', color: '#e2e8f0'}}>Cancelled</option>
            </select>
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <label style={{marginBottom: '5px', fontWeight: 'bold', color: '#e2e8f0'}}>Date Range</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{flex: 1, padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
              />
              <span style={{color: 'white', fontSize: '14px'}}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{flex: 1, padding: '8px', border: '1px solid #4a5568', borderRadius: '4px', backgroundColor: '#1a202c', color: '#e2e8f0', fontSize: '14px'}}
              />
            </div>
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '15px'}}>
          <button
            onClick={() => {
              setOrderIdFilter('');
              setCustomerFilter('');
              setTotalFilter('');
              setPaymentMethodFilter('');
              setStatusFilter('');
              setFromDate('');
              setToDate('');
            }}
            className="clear-all-btn"
            title="Reset all search filters"
            style={{
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span className="material-icons" style={{fontSize: '18px'}}>refresh</span>
          </button>
        </div>
      </div>

      <div className="orders-table">
        <table style={{border: 'none', borderCollapse: 'collapse'}}>
          <thead>
            <tr>
              <th style={{border: 'none', padding: '12px 8px'}}>#</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Order ID</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Type</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Customer</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Total</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Payment Method</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Status</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Date</th>
              <th style={{border: 'none', padding: '12px 8px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedOrders().map((order, index) => (
              <tr key={order.id}>
                <td style={{border: 'none', padding: '12px 8px'}}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td style={{border: 'none', padding: '12px 8px'}}>#{order.id}</td>
                <td style={{border: 'none', padding: '12px 8px'}}>{order.order_type}</td>
                <td style={{border: 'none', padding: '12px 8px'}}>
                  {order.customer_name && order.customer_mobile ?
                    `${order.customer_name} (${order.customer_mobile})` :
                    (order.customer_name || 'N/A')}
                </td>
                <td style={{border: 'none', padding: '12px 8px'}}>{order.total_amount}</td>
                <td style={{border: 'none', padding: '12px 8px'}}>
                  <span className="payment-method">
                    {order.payment_method || 'Cash'}
                  </span>
                </td>
                <td style={{border: 'none', padding: '12px 8px'}}>{getStatusBadge(order.status)}</td>
                <td style={{border: 'none', padding: '12px 8px'}}>{new Date(order.created_at).toLocaleString()}</td>
                <td style={{border: 'none', padding: '12px 8px'}}>
                  <button
                    className="btn btn-action btn-success"
                    title="View Details"
                    onClick={() => handleViewOrder(order.id)}
                    style={{marginRight: '5px'}}
                  >
                    <span className="material-icons">visibility</span>
                  </button>
                  <button
                    className="btn btn-action"
                    title="Print Invoice"
                    onClick={() => handlePrintInvoice(order.id)}
                    style={{backgroundColor: '#000000', color: '#ffffff'}}
                  >
                    <span className="material-icons">print</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <div className="pagination-left">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} items
          </div>
          <div className="items-per-page-selector">
            <label>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="items-per-page-filter"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
              <option value={9999}>All</option>
            </select>
          </div>
        </div>
        {getTotalPages() > 1 && itemsPerPage < 9999 && (
          <div className="pagination-buttons">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              ≪
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              ‹
            </button>
            <span className="page-info">
              Page {currentPage} of {getTotalPages()}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
              className="btn btn-sm btn-secondary"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(getTotalPages())}
              disabled={currentPage === getTotalPages()}
              className="btn btn-sm btn-secondary"
            >
              ≫
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        title="Order Details"
        className="order-details-modal-content"
      >
        {selectedOrder && (
          <div className="order-details-modal">
            <div className="order-info">
              <h3>Order Information</h3>
              <div className="order-details-grid">
                <div className="order-detail-item">
                  <label>Order ID</label>
                  <div className="value">#{selectedOrder.id}</div>
                </div>
                <div className="order-detail-item">
                  <label>Order Type</label>
                  <div className="value">{selectedOrder.order_type}</div>
                </div>
                <div className="order-detail-item">
                  <label>Customer</label>
                  <div className="value">
                    {selectedOrder.customer_name && selectedOrder.customer_mobile ?
                      `${selectedOrder.customer_name} (${selectedOrder.customer_mobile})` :
                      (selectedOrder.customer_name || 'N/A')}
                  </div>
                </div>
                <div className="order-detail-item">
                  <label>Status</label>
                  <div className="value">{selectedOrder.status}</div>
                </div>
                <div className="order-detail-item">
                  <label>Payment Method</label>
                  <div className="value">{selectedOrder.payment_method || 'Not Paid'}</div>
                </div>
                {selectedOrder.table_name && (
                  <div className="order-detail-item">
                    <label>Table</label>
                    <div className="value">{selectedOrder.table_name}</div>
                  </div>
                )}
                <div className="order-detail-item">
                  <label>Order Date</label>
                  <div className="value">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
                {selectedOrder.external_order_id && (
                  <div className="order-detail-item">
                    <label>External Order ID</label>
                    <div className="value">{selectedOrder.external_order_id}</div>
                  </div>
                )}
              </div>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="order-items">
                <h3>Order Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.item_name || item.name}</td>
                        <td className="quantity-cell">{item.quantity}</td>
                        <td className="price-cell">Rs. {parseFloat(item.price_per_item).toFixed(2)}</td>
                        <td className="price-cell">Rs. {(parseFloat(item.price_per_item) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="order-total">
                  <div className="total-label">Total Amount</div>
                  <div className="total-amount">Rs. {parseFloat(selectedOrder.total_amount).toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistory;